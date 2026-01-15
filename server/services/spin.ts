import { db } from "../db";
import { wheelSpins, wheelPrizes, lotteryTimesLedger, lotteryDraws, lotteryCommissionRates, userVipStatus, commissionLogs, users, vipLevels } from "@shared/schema";
import { eq, desc, and } from "drizzle-orm";
import { addCashAvailable, addPoints } from "./wallet";
import { getBusinessDate } from "../utils/timezone";

interface Prize {
  id: number;
  name: string;
  type: string;
  amount: string | null;
  probability: string;
}

const DEFAULT_PRIZES: Omit<Prize, 'id'>[] = [
  { name: "38元", type: "cash", amount: "38", probability: "0.01" },
  { name: "18元", type: "cash", amount: "18", probability: "0.01" },
  { name: "8元", type: "cash", amount: "8", probability: "0.03" },
  { name: "2元", type: "cash", amount: "2", probability: "0.33" },
  { name: "1元", type: "cash", amount: "1", probability: "0.22" },
  { name: "AI积分500", type: "points", amount: "500", probability: "0.30" },
  { name: "祝你下次好运", type: "none", amount: "0", probability: "0.10" },
];

export async function getSpinBalance(userId: number) {
  await initializeDailyLotteryTimes(userId);
  
  const times = await getLotteryTimesBreakdown(userId);
  
  return {
    userId,
    availableSpins: times.available,
    updatedAt: new Date(),
  };
}

async function initializeDailyLotteryTimes(userId: number) {
  const today = getBusinessDate();

  const [existingBase] = await db.select()
    .from(lotteryTimesLedger)
    .where(and(
      eq(lotteryTimesLedger.userId, userId),
      eq(lotteryTimesLedger.bizDate, today),
      eq(lotteryTimesLedger.reason, "base")
    ))
    .limit(1);

  if (!existingBase) {
    await db.insert(lotteryTimesLedger).values({
      userId,
      bizDate: today,
      delta: 1,
      reason: "base",
      refId: `base_${today}`,
    });
  }

  const [vipStatus] = await db.select().from(userVipStatus).where(eq(userVipStatus.userId, userId)).limit(1);
  if (vipStatus && vipStatus.vipLevel > 0) {
    const [existingVip] = await db.select()
      .from(lotteryTimesLedger)
      .where(and(
        eq(lotteryTimesLedger.userId, userId),
        eq(lotteryTimesLedger.bizDate, today),
        eq(lotteryTimesLedger.reason, "vip_daily")
      ))
      .limit(1);

    if (!existingVip) {
      const [level] = await db.select().from(vipLevels).where(eq(vipLevels.level, vipStatus.vipLevel)).limit(1);
      if (level && level.dailyLottery > 0) {
        await db.insert(lotteryTimesLedger).values({
          userId,
          bizDate: today,
          delta: level.dailyLottery,
          reason: "vip_daily",
          refId: `vip_${today}_${level.level}`,
        });
      }
    }
  }
}

export async function getWheelConfig() {
  let prizes = await db.select().from(wheelPrizes).orderBy(wheelPrizes.displayOrder);
  
  if (prizes.length === 0) {
    for (let i = 0; i < DEFAULT_PRIZES.length; i++) {
      await db.insert(wheelPrizes).values({
        ...DEFAULT_PRIZES[i],
        displayOrder: i,
        isActive: true,
      });
    }
    prizes = await db.select().from(wheelPrizes).orderBy(wheelPrizes.displayOrder);
  }
  
  return prizes;
}

export async function performSpin(userId: number, requestId: string) {
  const [existingSpin] = await db.select()
    .from(wheelSpins)
    .where(eq(wheelSpins.requestId, requestId))
    .limit(1);

  if (existingSpin) {
    return {
      success: true,
      prize: existingSpin.prizeName,
      prizeId: existingSpin.prizeId,
      alreadyProcessed: true,
    };
  }

  await initializeDailyLotteryTimes(userId);
  const times = await getLotteryTimesBreakdown(userId);
  if (times.available <= 0) {
    throw new Error("抽奖次数不足");
  }

  const today = getBusinessDate();
  await db.insert(lotteryTimesLedger).values({
    userId,
    bizDate: today,
    delta: -1,
    reason: "draw_consume",
    refId: requestId,
  });

  const prizes = await getWheelConfig();
  const selectedPrize = selectPrizeByProbability(prizes);

  const [spin] = await db.insert(wheelSpins).values({
    userId,
    requestId,
    prizeId: selectedPrize.id,
    prizeName: selectedPrize.name,
    status: "success",
  }).returning();

  const rewardCents = selectedPrize.type === "cash" && selectedPrize.amount 
    ? Math.floor(parseFloat(selectedPrize.amount) * 100) 
    : 0;

  await db.insert(lotteryDraws).values({
    userId,
    bizDate: today,
    prizeCode: selectedPrize.name,
    rewardCents,
  });

  if (selectedPrize.type === "cash" && selectedPrize.amount) {
    const fullAmount = parseFloat(selectedPrize.amount);
    const userShare = fullAmount * 0.85;
    
    await addCashAvailable(userId, userShare, "spin_win", spin.id, `转盘中奖: ${selectedPrize.name} (实得85%)`);
    
    await distributeLotteryCommission(userId, spin.id, fullAmount);
  } else if (selectedPrize.type === "points" && selectedPrize.amount) {
    await addPoints(userId, parseInt(selectedPrize.amount), "spin_win", spin.id, `转盘中奖: ${selectedPrize.name}`);
  }

  return {
    success: true,
    prize: selectedPrize.name,
    prizeId: selectedPrize.id,
    prizeType: selectedPrize.type,
    amount: selectedPrize.amount,
    alreadyProcessed: false,
  };
}

async function distributeLotteryCommission(fromUserId: number, spinId: number, winAmount: number) {
  const uplineChain = await getUplineChain(fromUserId, 3);
  const winAmountCents = Math.floor(winAmount * 100);

  for (let i = 0; i < uplineChain.length; i++) {
    const uplineUserId = uplineChain[i];
    const relationLevel = i + 1;

    const [uplineStatus] = await db.select().from(userVipStatus).where(eq(userVipStatus.userId, uplineUserId)).limit(1);
    const uplineVipLevel = uplineStatus?.vipLevel || 0;

    if (uplineVipLevel < 1) continue;

    const [commRate] = await db.select().from(lotteryCommissionRates).where(eq(lotteryCommissionRates.level, uplineVipLevel)).limit(1);
    if (!commRate) continue;

    const rate = relationLevel === 1 
      ? parseFloat(commRate.directRate) 
      : parseFloat(commRate.indirectRate);

    if (rate <= 0) continue;

    const commissionCents = Math.floor(winAmountCents * rate);
    if (commissionCents <= 0) continue;

    const isQualified = uplineStatus?.qualified || false;

    await db.insert(commissionLogs).values({
      toUserId: uplineUserId,
      fromUserId,
      bizType: "lottery_reward",
      relationLevel,
      baseCents: winAmountCents,
      rate: rate.toString(),
      amountCents: commissionCents,
      refId: `lottery_${spinId}`,
      status: isQualified ? "credited" : "frozen",
    });

    if (isQualified) {
      const commissionYuan = commissionCents / 100;
      await addCashAvailable(uplineUserId, commissionYuan, "lottery_commission", spinId, `下级抽奖中奖分佣`);
    }
  }
}

async function getUplineChain(userId: number, maxLevels: number): Promise<number[]> {
  const chain: number[] = [];
  let currentUserId = userId;

  for (let i = 0; i < maxLevels; i++) {
    const [user] = await db.select({ inviterId: users.inviterId }).from(users).where(eq(users.id, currentUserId)).limit(1);
    if (!user?.inviterId) break;
    chain.push(user.inviterId);
    currentUserId = user.inviterId;
  }

  return chain;
}

function selectPrizeByProbability(prizes: Prize[]): Prize {
  const random = Math.random();
  let cumulative = 0;
  
  for (const prize of prizes) {
    cumulative += parseFloat(prize.probability);
    if (random <= cumulative) {
      return prize;
    }
  }
  
  return prizes[prizes.length - 1];
}

export async function getSpinHistory(userId: number, limit = 50) {
  return db.select()
    .from(wheelSpins)
    .where(eq(wheelSpins.userId, userId))
    .orderBy(desc(wheelSpins.createdAt))
    .limit(limit);
}

export async function addSpins(userId: number, amount: number, reason: string = "bonus", refId?: string) {
  const today = getBusinessDate();
  await db.insert(lotteryTimesLedger).values({
    userId,
    bizDate: today,
    delta: amount,
    reason,
    refId: refId || `${reason}_${Date.now()}`,
  });
}

export async function getLotteryTimesBreakdown(userId: number) {
  const today = getBusinessDate();
  
  const entries = await db.select()
    .from(lotteryTimesLedger)
    .where(and(
      eq(lotteryTimesLedger.userId, userId),
      eq(lotteryTimesLedger.bizDate, today)
    ))
    .orderBy(lotteryTimesLedger.createdAt);

  const breakdown: Record<string, number> = {};
  let total = 0;

  for (const entry of entries) {
    breakdown[entry.reason] = (breakdown[entry.reason] || 0) + entry.delta;
    total += entry.delta;
  }

  return {
    available: Math.max(0, total),
    breakdown,
    date: today,
  };
}

export async function getLotteryDrawHistory(userId: number, limit = 30) {
  return db.select()
    .from(lotteryDraws)
    .where(eq(lotteryDraws.userId, userId))
    .orderBy(desc(lotteryDraws.createdAt))
    .limit(limit);
}
