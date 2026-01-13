import { db } from "../db";
import { wallets, ledger } from "@shared/schema";
import { eq, sql } from "drizzle-orm";

export type LedgerType = 
  | "checkin_bonus" 
  | "spin_win" 
  | "spin_commission"
  | "vip_purchase" 
  | "rank_purchase"
  | "rank_bonus"
  | "withdraw_apply" 
  | "withdraw_success" 
  | "withdraw_reject"
  | "referral_reward" 
  | "admin_adjust";

export type Currency = "cash_available" | "cash_frozen" | "points";

export async function getWallet(userId: number) {
  const [wallet] = await db.select().from(wallets).where(eq(wallets.userId, userId));
  if (!wallet) {
    const [newWallet] = await db.insert(wallets).values({
      userId,
      balanceCashAvailable: "0",
      balanceCashFrozen: "0",
      balancePoints: 0,
    }).returning();
    return newWallet;
  }
  return wallet;
}

export async function addCashAvailable(userId: number, amount: number, type: LedgerType, refId?: number, description?: string) {
  await db.update(wallets)
    .set({ 
      balanceCashAvailable: sql`${wallets.balanceCashAvailable} + ${amount}`,
      updatedAt: new Date(),
    })
    .where(eq(wallets.userId, userId));

  await db.insert(ledger).values({
    userId,
    type,
    currency: "cash_available",
    amount: amount.toString(),
    refId,
    description,
  });
}

export async function addCashFrozen(userId: number, amount: number, type: LedgerType, refId?: number, description?: string) {
  await db.update(wallets)
    .set({ 
      balanceCashFrozen: sql`${wallets.balanceCashFrozen} + ${amount}`,
      updatedAt: new Date(),
    })
    .where(eq(wallets.userId, userId));

  await db.insert(ledger).values({
    userId,
    type,
    currency: "cash_frozen",
    amount: amount.toString(),
    refId,
    description,
  });
}

export async function addPoints(userId: number, amount: number, type: LedgerType, refId?: number, description?: string) {
  await db.update(wallets)
    .set({ 
      balancePoints: sql`${wallets.balancePoints} + ${amount}`,
      updatedAt: new Date(),
    })
    .where(eq(wallets.userId, userId));

  await db.insert(ledger).values({
    userId,
    type,
    currency: "points",
    amount: amount.toString(),
    refId,
    description,
  });
}

export async function deductCashAvailable(userId: number, amount: number, type: LedgerType, refId?: number, description?: string) {
  const wallet = await getWallet(userId);
  if (parseFloat(wallet.balanceCashAvailable) < amount) {
    throw new Error("余额不足");
  }

  await db.update(wallets)
    .set({ 
      balanceCashAvailable: sql`${wallets.balanceCashAvailable} - ${amount}`,
      updatedAt: new Date(),
    })
    .where(eq(wallets.userId, userId));

  await db.insert(ledger).values({
    userId,
    type,
    currency: "cash_available",
    amount: (-amount).toString(),
    refId,
    description,
  });
}

export async function unfreezeCash(userId: number, amount: number, description?: string) {
  await db.update(wallets)
    .set({ 
      balanceCashFrozen: sql`${wallets.balanceCashFrozen} - ${amount}`,
      balanceCashAvailable: sql`${wallets.balanceCashAvailable} + ${amount}`,
      updatedAt: new Date(),
    })
    .where(eq(wallets.userId, userId));

  await db.insert(ledger).values({
    userId,
    type: "admin_adjust",
    currency: "cash_frozen",
    amount: (-amount).toString(),
    description: description || "解冻转可用",
  });
  
  await db.insert(ledger).values({
    userId,
    type: "admin_adjust",
    currency: "cash_available",
    amount: amount.toString(),
    description: description || "解冻转可用",
  });
}

export async function getLedgerHistory(userId: number, limit = 50, offset = 0) {
  return db.select()
    .from(ledger)
    .where(eq(ledger.userId, userId))
    .orderBy(sql`${ledger.createdAt} DESC`)
    .limit(limit)
    .offset(offset);
}
