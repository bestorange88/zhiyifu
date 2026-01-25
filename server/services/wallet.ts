import { db } from "../db";
import { wallets, ledger } from "@shared/schema";
import { eq, sql, desc, and } from "drizzle-orm";

export type LedgerType = 
  | "checkin_bonus" 
  | "spin_win" 
  | "spin_commission"
  | "vip_purchase" 
  | "vip_upgrade"
  | "vip_commission"
  | "rank_purchase"
  | "rank_bonus"
  | "upgrade_reward"
  | "commission_unfreeze"
  | "lottery_commission"
  | "signin_cash"
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
  // Ensure wallet exists
  await getWallet(userId);

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
  // Ensure wallet exists
  await getWallet(userId);

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
  // Ensure wallet exists
  await getWallet(userId);

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
  // Ensure wallet exists
  await getWallet(userId);

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

export async function getLedgerHistory(userId: number, limit = 50, offset = 0, currency?: string) {
  let query = db.select()
    .from(ledger)
    .where(eq(ledger.userId, userId));

  if (currency) {
    query.where(eq(ledger.currency, currency));
  }

  return query
    .orderBy(sql`${ledger.createdAt} DESC`)
    .limit(limit)
    .offset(offset);
}

export async function getLedgerWithBalance(userId: number, limit = 50, offset = 0, currency?: string) {
  // 1. Get current wallet
  const [wallet] = await db.select().from(wallets).where(eq(wallets.userId, userId)).limit(1);
  if (!wallet) return [];

  // Current running balances
  let runningCash = parseFloat(wallet.balanceCashAvailable);
  let runningFrozen = parseFloat(wallet.balanceCashFrozen);
  let runningPoints = wallet.balancePoints || 0;

  // 2. If offset > 0, we need to subtract newer transactions to find starting balance for this page
  if (offset > 0) {
    let newerQuery = db.select({
      currency: ledger.currency,
      amount: ledger.amount
    })
    .from(ledger)
    .where(eq(ledger.userId, userId))
    .orderBy(desc(ledger.createdAt), desc(ledger.id))
    .limit(offset);

    if (currency) {
      newerQuery = newerQuery.where(eq(ledger.currency, currency)) as any;
    }

    const newerRecords = await newerQuery;

    // Adjust running balances by reversing newer transactions
    for (const record of newerRecords) {
       const amount = parseFloat(record.amount);
       if (record.currency === "cash_available" || record.currency === "cny") {
         runningCash -= amount;
       } else if (record.currency === "cash_frozen") {
         runningFrozen -= amount;
       } else if (record.currency === "points") {
         runningPoints -= amount;
       }
    }
  }

  // 3. Fetch current page records
  let query = db.select()
    .from(ledger)
    .where(eq(ledger.userId, userId))
    .orderBy(desc(ledger.createdAt), desc(ledger.id))
    .limit(limit)
    .offset(offset);

  if (currency) {
    query = query.where(eq(ledger.currency, currency)) as any;
  }

  const records = await query;

  // 4. Calculate balance for each record
  const result = records.map(record => {
    const amount = parseFloat(record.amount);
    let balanceAfter = 0;
    let balanceBefore = 0;

    if (record.currency === "cash_available" || record.currency === "cny") {
      balanceAfter = runningCash;
      balanceBefore = runningCash - amount;
      runningCash = balanceBefore; // Update for next iteration (older record)
    } else if (record.currency === "cash_frozen") {
      balanceAfter = runningFrozen;
      balanceBefore = runningFrozen - amount;
      runningFrozen = balanceBefore;
    } else if (record.currency === "points") {
      balanceAfter = runningPoints;
      balanceBefore = runningPoints - amount;
      runningPoints = balanceBefore;
    }

    return {
      ...record,
      balanceAfter: balanceAfter.toFixed(2),
      balanceBefore: balanceBefore.toFixed(2),
    };
  });

  return result;
}
