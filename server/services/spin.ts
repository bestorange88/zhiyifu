import { db } from "../db";
import { spinBalance, wheelSpins, wheelPrizes } from "@shared/schema";
import { eq, sql, desc } from "drizzle-orm";
import { addCashFrozen, addPoints } from "./wallet";

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
  const [balance] = await db.select()
    .from(spinBalance)
    .where(eq(spinBalance.userId, userId));
  
  if (!balance) {
    const [newBalance] = await db.insert(spinBalance).values({
      userId,
      availableSpins: 0,
    }).returning();
    return newBalance;
  }
  
  return balance;
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

  const balance = await getSpinBalance(userId);
  if (balance.availableSpins <= 0) {
    throw new Error("抽奖次数不足");
  }

  await db.update(spinBalance)
    .set({ 
      availableSpins: sql`${spinBalance.availableSpins} - 1`,
      updatedAt: new Date(),
    })
    .where(eq(spinBalance.userId, userId));

  const prizes = await getWheelConfig();
  const selectedPrize = selectPrizeByProbability(prizes);

  const [spin] = await db.insert(wheelSpins).values({
    userId,
    requestId,
    prizeId: selectedPrize.id,
    prizeName: selectedPrize.name,
    status: "success",
  }).returning();

  if (selectedPrize.type === "cash" && selectedPrize.amount) {
    await addCashFrozen(userId, parseFloat(selectedPrize.amount), "spin_win", spin.id, `转盘中奖: ${selectedPrize.name}`);
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

export async function addSpins(userId: number, amount: number) {
  await db.update(spinBalance)
    .set({ 
      availableSpins: sql`${spinBalance.availableSpins} + ${amount}`,
      updatedAt: new Date(),
    })
    .where(eq(spinBalance.userId, userId));
}
