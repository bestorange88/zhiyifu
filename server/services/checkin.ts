import { db } from "../db";
import { checkins, spinBalance } from "@shared/schema";
import { eq, sql, and, desc } from "drizzle-orm";
import { addPoints, addCashFrozen } from "./wallet";

const STREAK_REWARDS: Record<number, number> = {
  3: 1,
  7: 2,
  15: 5,
};
const MONTH_CASH_REWARD = 58;
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

  return {
    checkedToday,
    currentStreak: totalStreak,
    cycleDay,
    nextReward,
    monthProgress: totalStreak,
    monthCashReward: MONTH_CASH_REWARD,
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
  
  if (lastCheckin) {
    const lastDate = lastCheckin.checkDate;
    
    if (lastDate === yesterday) {
      totalStreak = lastCheckin.streakCount + 1;
      cycleDay = ((lastCheckin.streakCount - 1) % STREAK_CYCLE) + 2;
      if (cycleDay > STREAK_CYCLE) {
        cycleDay = 1;
      }
    } else {
      totalStreak = Math.max(1, lastCheckin.streakCount - BREAK_PENALTY);
      cycleDay = ((totalStreak - 1) % STREAK_CYCLE) + 1;
    }
  }

  let rewardSpins = 1;
  
  if (STREAK_REWARDS[cycleDay]) {
    rewardSpins += STREAK_REWARDS[cycleDay];
  }

  const [checkin] = await db.insert(checkins).values({
    userId,
    checkDate: today,
    streakCount: totalStreak,
    rewardSpinTimes: rewardSpins,
  }).returning();

  await db.update(spinBalance)
    .set({ 
      availableSpins: sql`${spinBalance.availableSpins} + ${rewardSpins}`,
      updatedAt: new Date(),
    })
    .where(eq(spinBalance.userId, userId));

  await addPoints(userId, 10, "checkin_bonus", checkin.id, "每日签到奖励");

  let monthReward = null;
  if (totalStreak >= 30 && totalStreak % 30 === 0) {
    await addCashFrozen(userId, MONTH_CASH_REWARD, "checkin_bonus", checkin.id, "连续30天签到奖励");
    monthReward = MONTH_CASH_REWARD;
  }

  return {
    success: true,
    streakCount: totalStreak,
    cycleDay,
    rewardSpins,
    bonusPoints: 10,
    monthReward,
  };
}

export async function getCheckinHistory(userId: number, limit = 30) {
  return db.select()
    .from(checkins)
    .where(eq(checkins.userId, userId))
    .orderBy(desc(checkins.createdAt))
    .limit(limit);
}
