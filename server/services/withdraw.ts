import { db } from "../db";
import { withdraws, users, checkins, wheelSpins } from "@shared/schema";
import { eq, sql, desc, count, gte } from "drizzle-orm";
import { getWallet, deductCashAvailable, addCashAvailable } from "./wallet";
import { getVipStatus } from "./vip";

export async function getWithdrawRules(userId: number) {
  const vipStatus = await getVipStatus(userId);
  const wallet = await getWallet(userId);
  
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const checkinCount = await db.select({ count: count() })
    .from(checkins)
    .where(eq(checkins.userId, userId));

  const spinCount = await db.select({ count: count() })
    .from(wheelSpins)
    .where(eq(wheelSpins.userId, userId));

  const minAmount = parseFloat(vipStatus.withdrawMinAmount);
  const availableBalance = parseFloat(wallet.balanceCashAvailable);
  
  const conditions = {
    minCheckins: 7,
    currentCheckins: checkinCount[0]?.count || 0,
    minSpins: 10,
    currentSpins: spinCount[0]?.count || 0,
    minAmount,
    availableBalance,
    vipLevel: vipStatus.level,
    withdrawSpeed: vipStatus.withdrawSpeed,
  };

  const canWithdraw = 
    conditions.currentCheckins >= conditions.minCheckins &&
    conditions.currentSpins >= conditions.minSpins &&
    availableBalance >= minAmount;

  return {
    ...conditions,
    canWithdraw,
  };
}

export async function applyWithdraw(userId: number, amount: number, method: string, accountInfo: string) {
  const rules = await getWithdrawRules(userId);
  
  if (!rules.canWithdraw) {
    throw new Error("不满足提现条件");
  }
  
  if (amount < rules.minAmount) {
    throw new Error(`最低提现金额为${rules.minAmount}元`);
  }
  
  if (amount > rules.availableBalance) {
    throw new Error("余额不足");
  }

  await deductCashAvailable(userId, amount, "withdraw_apply", undefined, `提现申请: ${amount}元`);

  const conditionsSnapshot = JSON.stringify({
    checkins: rules.currentCheckins,
    spins: rules.currentSpins,
    vipLevel: rules.vipLevel,
  });

  const [withdraw] = await db.insert(withdraws).values({
    userId,
    amount: amount.toString(),
    status: "applied",
    method,
    accountInfo,
    conditionsSnapshot,
  }).returning();

  return {
    id: withdraw.id,
    amount,
    status: "applied",
    estimatedTime: rules.withdrawSpeed,
  };
}

export async function getWithdrawHistory(userId: number, limit = 50) {
  return db.select()
    .from(withdraws)
    .where(eq(withdraws.userId, userId))
    .orderBy(desc(withdraws.createdAt))
    .limit(limit);
}

export async function reviewWithdraw(withdrawId: number, approved: boolean, adminNote?: string) {
  const [withdraw] = await db.select().from(withdraws).where(eq(withdraws.id, withdrawId)).limit(1);
  
  if (!withdraw) throw new Error("提现记录不存在");
  if (withdraw.status !== "applied") throw new Error("提现状态异常");

  if (approved) {
    await db.update(withdraws)
      .set({ 
        status: "approved",
        reviewedAt: new Date(),
      })
      .where(eq(withdraws.id, withdrawId));
  } else {
    await addCashAvailable(withdraw.userId, parseFloat(withdraw.amount), "withdraw_reject", withdrawId, "提现被拒绝,退回余额");
    
    await db.update(withdraws)
      .set({ 
        status: "rejected",
        reviewedAt: new Date(),
      })
      .where(eq(withdraws.id, withdrawId));
  }

  return { success: true };
}

export async function markWithdrawPaid(withdrawId: number) {
  await db.update(withdraws)
    .set({ 
      status: "paid",
      paidAt: new Date(),
    })
    .where(eq(withdraws.id, withdrawId));

  return { success: true };
}
