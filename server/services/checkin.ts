import { db } from "../db";
import { checkins, signInLogs, lotteryTimesLedger, userVipStatus, vipLevels } from "@shared/schema";
import { eq, sql, and, desc } from "drizzle-orm";
import { addPoints, addCashAvailable } from "./wallet";

const STREAK_REWARDS: Record<number, number> = {
  3: 1,
  7: 2,
  15: 5,
};
const MONTH_CASH_REWARD_CENTS = 5800;
const BREAK_PENALTY = 3;
const STREAK_CYCLE = 15;

function getTodayDate(): string {
  return new Date().toISOString().split("T")[0];
}

function getYesterdayDate(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().split("T")[0];
}

export async function getCheckinStatus(userId: number) {
  const today = getTodayDate();
  
  const [todayCheckin] = await db.select()
    .from(checkins)
    .where(and(eq(checkins.userId, userId), eq(checkins.checkDate, today)))
    .limit(1);

  const [lastCheckin] = await db.select()
    .from(checkins)
    .where(eq(checkins.userId, userId))
    .orderBy(desc(checkins.createdAt))
    .limit(1);

  const checkedToday = !!todayCheckin;
  const totalStreak = todayCheckin?.streakCount || lastCheckin?.streakCount || 0;
  const cycleDay = totalStreak > 0 ? ((totalStreak - 1) % STREAK_CYCLE) + 1 : 0;
  
  let nextReward = null;
  for (const [streak, reward] of Object.entries(STREAK_REWARDS)) {
    if (cycleDay < parseInt(streak)) {
      nextReward = { daysNeeded: parseInt(streak), extraSpins: reward };
      break;
    }
  }

  const [vipStatus] = await db.select().from(userVipStatus).where(eq(userVipStatus.userId, userId)).limit(1);
  const vipLevel = vipStatus?.vipLevel || 0;
  let vipDailySpins = 0;
  if (vipLevel > 0) {
    const [level] = await db.select().from(vipLevels).where(eq(vipLevels.level, vipLevel)).limit(1);
    vipDailySpins = level?.dailyLottery || 0;
  }

  return {
    checkedToday,
    currentStreak: totalStreak,
    cycleDay,
    nextReward,
    monthProgress: totalStreak,
    monthCashReward: MONTH_CASH_REWARD_CENTS / 100,
    vipLevel,
    vipDailySpins,
  };
}

export async function performCheckin(userId: number) {
  const today = getTodayDate();
  const yesterday = getYesterdayDate();

  const [existingCheckin] = await db.select()
    .from(checkins)
    .where(and(eq(checkins.userId, userId), eq(checkins.checkDate, today)))
    .limit(1);

  if (existingCheckin) {
    throw new Error("今日已签到");
  }

  const [lastCheckin] = await db.select()
    .from(checkins)
    .where(eq(checkins.userId, userId))
    .orderBy(desc(checkins.createdAt))
    .limit(1);

  let totalStreak = 1;
  let cycleDay = 1;
  let brokeStreak = false;
  
  if (lastCheckin) {
    const lastDate = lastCheckin.checkDate;
    
    if (lastDate === yesterday) {
      totalStreak = lastCheckin.streakCount + 1;
      cycleDay = ((lastCheckin.streakCount - 1) % STREAK_CYCLE) + 2;
      if (cycleDay > STREAK_CYCLE) {
        cycleDay = 1;
      }
    } else {
      brokeStreak = true;
      totalStreak = Math.max(1, lastCheckin.streakCount - BREAK_PENALTY);
      cycleDay = ((totalStreak - 1) % STREAK_CYCLE) + 1;
    }
  }

  let rewardSpins = 1;
  let bonusSpins = 0;
  let shouldResetCycle = false;
  
  if (STREAK_REWARDS[cycleDay]) {
    bonusSpins = STREAK_REWARDS[cycleDay];
    rewardSpins += bonusSpins;
  }

  if (cycleDay === STREAK_CYCLE) {
    shouldResetCycle = true;
  }

  const [checkin] = await db.insert(checkins).values({
    userId,
    checkDate: today,
    streakCount: shouldResetCycle ? 0 : totalStreak,
    rewardSpinTimes: rewardSpins,
  }).returning();

  await db.insert(signInLogs).values({
    userId,
    signDate: today,
    continuousDays: totalStreak,
  });

  await db.insert(lotteryTimesLedger).values({
    userId,
    bizDate: today,
    delta: 1,
    reason: "signin",
    refId: `signin_${checkin.id}`,
  });

  if (bonusSpins > 0) {
    await db.insert(lotteryTimesLedger).values({
      userId,
      bizDate: today,
      delta: bonusSpins,
      reason: "signin_bonus",
      refId: `signin_bonus_${checkin.id}_${cycleDay}`,
    });
  }

  await addPoints(userId, 10, "checkin_bonus", checkin.id, "每日签到奖励");

  let monthReward = null;
  if (totalStreak >= 30 && totalStreak % 30 === 0) {
    const monthRewardYuan = MONTH_CASH_REWARD_CENTS / 100;
    await addCashAvailable(userId, monthRewardYuan, "signin_cash", checkin.id, "连续30天签到奖励");
    monthReward = monthRewardYuan;
  }

  return {
    success: true,
    streakCount: shouldResetCycle ? 0 : totalStreak,
    cycleDay,
    rewardSpins,
    bonusSpins,
    bonusPoints: 10,
    monthReward,
    brokeStreak,
    cycleReset: shouldResetCycle,
  };
}

export async function getCheckinHistory(userId: number, limit = 30) {
  return db.select()
    .from(checkins)
    .where(eq(checkins.userId, userId))
    .orderBy(desc(checkins.createdAt))
    .limit(limit);
}

export async function getSignInCalendar(userId: number, year: number, month: number) {
  const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
  const endDate = `${year}-${String(month + 1).padStart(2, '0')}-01`;

  const signIns = await db.select()
    .from(signInLogs)
    .where(and(
      eq(signInLogs.userId, userId),
      sql`${signInLogs.signDate} >= ${startDate}`,
      sql`${signInLogs.signDate} < ${endDate}`
    ))
    .orderBy(signInLogs.signDate);

  return signIns.map(s => ({
    date: s.signDate,
    continuousDays: s.continuousDays,
  }));
}
