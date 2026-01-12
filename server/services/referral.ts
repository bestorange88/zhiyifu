import { db } from "../db";
import { users, userRanks, rankRules, referralRewards, orders, commissionRecords } from "@shared/schema";
import { eq, sql, desc } from "drizzle-orm";
import { addCashFrozen, addCashAvailable } from "./wallet";

const DEFAULT_RANK_RULES = [
  { 
    rank: 1, name: "V1", openingFee: "198", directRequired: 3, team3genRequired: 0, 
    directCommissionRate: "0.10", indirectCommissionRate: "0", cashBonus: "0",
    dailySpins: 2, withdrawMinAmount: "100", withdrawSpeed: "T+1", winMultiplier: "1.2",
    hasVipService: true, hasUnlimitedAI: false, hasPromoBonus: false, hasPriorityWelfare: false
  },
  { 
    rank: 2, name: "V2", openingFee: "298", directRequired: 10, team3genRequired: 60, 
    directCommissionRate: "0.10", indirectCommissionRate: "0.05", cashBonus: "588",
    dailySpins: 3, withdrawMinAmount: "50", withdrawSpeed: "T+0", winMultiplier: "1.3",
    hasVipService: true, hasUnlimitedAI: true, hasPromoBonus: false, hasPriorityWelfare: false
  },
  { 
    rank: 3, name: "V3", openingFee: "298", directRequired: 30, team3genRequired: 200, 
    directCommissionRate: "0.10", indirectCommissionRate: "0.05", cashBonus: "1288",
    dailySpins: 4, withdrawMinAmount: "40", withdrawSpeed: "T+0", winMultiplier: "1.4",
    hasVipService: true, hasUnlimitedAI: true, hasPromoBonus: true, hasPriorityWelfare: true
  },
  { 
    rank: 4, name: "V4", openingFee: "498", directRequired: 50, team3genRequired: 300, 
    directCommissionRate: "0.10", indirectCommissionRate: "0.05", cashBonus: "2888",
    dailySpins: 5, withdrawMinAmount: "30", withdrawSpeed: "T+0", winMultiplier: "1.5",
    hasVipService: true, hasUnlimitedAI: true, hasPromoBonus: true, hasPriorityWelfare: true
  },
  { 
    rank: 5, name: "V5", openingFee: "598", directRequired: 200, team3genRequired: 2000, 
    directCommissionRate: "0.10", indirectCommissionRate: "0.05", cashBonus: "8888",
    dailySpins: 5, withdrawMinAmount: "30", withdrawSpeed: "T+0", winMultiplier: "1.6",
    hasVipService: true, hasUnlimitedAI: true, hasPromoBonus: true, hasPriorityWelfare: true
  },
];

export async function getRankRules() {
  let rules = await db.select().from(rankRules).orderBy(rankRules.rank);
  
  if (rules.length === 0) {
    for (const rule of DEFAULT_RANK_RULES) {
      await db.insert(rankRules).values(rule);
    }
    rules = await db.select().from(rankRules).orderBy(rankRules.rank);
  }
  
  return rules;
}

export async function updateRankRule(rank: number, updates: {
  name?: string;
  openingFee?: string;
  directRequired?: number;
  team3genRequired?: number;
  directCommissionRate?: string;
  indirectCommissionRate?: string;
  cashBonus?: string;
  dailySpins?: number;
  withdrawMinAmount?: string;
  withdrawSpeed?: string;
  winMultiplier?: string;
  hasVipService?: boolean;
  hasUnlimitedAI?: boolean;
  hasPromoBonus?: boolean;
  hasPriorityWelfare?: boolean;
}) {
  const [existing] = await db.select().from(rankRules).where(eq(rankRules.rank, rank)).limit(1);
  
  if (!existing) {
    throw new Error("等级规则不存在");
  }

  const [updated] = await db.update(rankRules)
    .set(updates)
    .where(eq(rankRules.rank, rank))
    .returning();
  
  return updated;
}

export async function getAllRankRulesAdmin() {
  await getRankRules();
  return db.select().from(rankRules).orderBy(rankRules.rank);
}

export async function getReferralSummary(userId: number) {
  const [userRank] = await db.select().from(userRanks).where(eq(userRanks.userId, userId)).limit(1);
  
  if (!userRank) {
    return {
      directCount: 0,
      team3genCount: 0,
      currentRank: 0,
      currentRankName: "普通用户",
      nextRank: null,
    };
  }

  const rules = await getRankRules();
  const currentRule = rules.find(r => r.rank === userRank.currentRank);
  
  let nextRank = null;
  for (const rule of rules) {
    if (rule.rank > userRank.currentRank) {
      nextRank = {
        rank: rule.rank,
        name: rule.name,
        directNeeded: Math.max(0, rule.directRequired! - userRank.directCount),
        team3genNeeded: Math.max(0, rule.team3genRequired! - userRank.team3genCount),
        cashBonus: rule.cashBonus,
      };
      break;
    }
  }

  return {
    directCount: userRank.directCount,
    team3genCount: userRank.team3genCount,
    currentRank: userRank.currentRank,
    currentRankName: currentRule?.name || "普通用户",
    nextRank,
  };
}

export async function getDirectReferrals(userId: number) {
  return db.select({
    id: users.id,
    phone: users.phone,
    createdAt: users.createdAt,
    vipLevel: users.vipLevel,
  })
    .from(users)
    .where(eq(users.inviterId, userId))
    .orderBy(desc(users.createdAt));
}

export async function getReferralRewards(userId: number, limit = 50) {
  return db.select()
    .from(referralRewards)
    .where(eq(referralRewards.userId, userId))
    .orderBy(desc(referralRewards.createdAt))
    .limit(limit);
}

async function get3GenTeamCount(userId: number): Promise<number> {
  let total = 0;
  
  const level1 = await db.select({ id: users.id }).from(users).where(eq(users.inviterId, userId));
  total += level1.length;
  
  for (const l1 of level1) {
    const level2 = await db.select({ id: users.id }).from(users).where(eq(users.inviterId, l1.id));
    total += level2.length;
    
    for (const l2 of level2) {
      const level3 = await db.select({ id: users.id }).from(users).where(eq(users.inviterId, l2.id));
      total += level3.length;
    }
  }
  
  return total;
}

export async function updateUserRankStats(userId: number) {
  const directReferrals = await getDirectReferrals(userId);
  const team3genCount = await get3GenTeamCount(userId);
  
  const [existingRank] = await db.select().from(userRanks).where(eq(userRanks.userId, userId)).limit(1);
  
  if (!existingRank) {
    await db.insert(userRanks).values({
      userId,
      currentRank: 0,
      directCount: directReferrals.length,
      team3genCount,
    });
  } else {
    await db.update(userRanks)
      .set({
        directCount: directReferrals.length,
        team3genCount,
      })
      .where(eq(userRanks.userId, userId));
  }

  await checkAndUpgradeRank(userId);
}

async function checkAndUpgradeRank(userId: number) {
  const [userRank] = await db.select().from(userRanks).where(eq(userRanks.userId, userId)).limit(1);
  if (!userRank) return;

  const rules = await getRankRules();
  
  for (const rule of rules.reverse()) {
    if (
      userRank.directCount >= rule.directRequired! &&
      userRank.team3genCount >= rule.team3genRequired! &&
      rule.rank > userRank.currentRank
    ) {
      await db.update(userRanks)
        .set({
          currentRank: rule.rank,
          reachedAt: new Date(),
        })
        .where(eq(userRanks.userId, userId));

      if (rule.cashBonus && parseFloat(rule.cashBonus) > 0) {
        await addCashFrozen(userId, parseFloat(rule.cashBonus), "referral_reward", undefined, `达成${rule.name}等级奖励`);
      }
      
      break;
    }
  }
}

export async function distributeReferralCommission(fromUserId: number, consumeAmount: number) {
  const [fromUser] = await db.select().from(users).where(eq(users.id, fromUserId)).limit(1);
  if (!fromUser?.inviterId) return;

  const rules = await getRankRules();
  const defaultRule = rules[0];
  if (!defaultRule) return;

  const directCommission = consumeAmount * parseFloat(defaultRule.directCommissionRate || "0.10");
  
  if (directCommission > 0) {
    await db.insert(referralRewards).values({
      userId: fromUser.inviterId,
      fromUserId,
      level: 1,
      amount: directCommission.toString(),
      status: "completed",
    });
    
    await addCashFrozen(fromUser.inviterId, directCommission, "referral_reward", undefined, "直推佣金");
  }

  const [inviter] = await db.select().from(users).where(eq(users.id, fromUser.inviterId)).limit(1);
  if (inviter?.inviterId) {
    const indirectCommission = consumeAmount * parseFloat(defaultRule.indirectCommissionRate || "0.05");
    
    if (indirectCommission > 0) {
      await db.insert(referralRewards).values({
        userId: inviter.inviterId,
        fromUserId,
        level: 2,
        amount: indirectCommission.toString(),
        status: "completed",
      });
      
      await addCashFrozen(inviter.inviterId, indirectCommission, "referral_reward", undefined, "间推佣金");
    }
  }
}

export async function distributeSpinCommission(fromUserId: number, spinId: number, prizeAmount: number) {
  const [fromUser] = await db.select().from(users).where(eq(users.id, fromUserId)).limit(1);
  if (!fromUser?.inviterId) return { directCommission: 0, indirectCommission: 0 };

  const directRate = 0.10;
  const indirectRate = 0.05;
  
  let directCommission = 0;
  let indirectCommission = 0;

  directCommission = prizeAmount * directRate;
  
  if (directCommission > 0) {
    await db.insert(commissionRecords).values({
      userId: fromUser.inviterId,
      fromUserId,
      spinId,
      sourceType: "spin",
      level: 1,
      rate: directRate.toString(),
      amount: directCommission.toFixed(2),
      status: "credited",
    });
    
    await addCashAvailable(fromUser.inviterId, directCommission, "spin_commission", spinId, "转盘中奖-直推佣金");
  }

  const [inviter] = await db.select().from(users).where(eq(users.id, fromUser.inviterId)).limit(1);
  if (inviter?.inviterId) {
    indirectCommission = prizeAmount * indirectRate;
    
    if (indirectCommission > 0) {
      await db.insert(commissionRecords).values({
        userId: inviter.inviterId,
        fromUserId,
        spinId,
        sourceType: "spin",
        level: 2,
        rate: indirectRate.toString(),
        amount: indirectCommission.toFixed(2),
        status: "credited",
      });
      
      await addCashAvailable(inviter.inviterId, indirectCommission, "spin_commission", spinId, "转盘中奖-间推佣金");
    }
  }

  return { directCommission, indirectCommission };
}

export async function getCommissionRecords(userId: number, limit = 50) {
  return db.select()
    .from(commissionRecords)
    .where(eq(commissionRecords.userId, userId))
    .orderBy(desc(commissionRecords.createdAt))
    .limit(limit);
}
