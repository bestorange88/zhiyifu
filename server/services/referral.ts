import { db } from "../db";
import { users, userRanks, rankRules, referralRewards, orders, commissionRecords, commissionLogs, vipCommissionRates, identityVerifications, deposits, rankUpgradeRequests, wallets } from "@shared/schema";
import { eq, sql, desc, and, inArray } from "drizzle-orm";
import { addCashFrozen, addCashAvailable, deductCashAvailable, getWallet } from "./wallet";
import { addSpins } from "./spin";
import { distributeVipUpgradeCommission } from "./vip";

const DEFAULT_RANK_RULES = [
  { 
    rank: 1, name: "V1", openingFee: "198", directRequired: 3, team3genRequired: 0, 
    directCommissionRate: "0.10", indirectCommissionRate: "0", cashBonus: "0",
    dailySpins: 2, withdrawMinAmount: "100", withdrawSpeed: "T+1", winMultiplier: "1.2",
    hasVipService: true, hasUnlimitedAI: false, hasPromoBonus: false, hasPriorityWelfare: false
  },
  { 
    rank: 2, name: "V2", openingFee: "298", directRequired: 10, team3genRequired: 50, 
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
  
  // Sync commission rates to vipCommissionRates table for frontend display
  if (updates.directCommissionRate !== undefined || updates.indirectCommissionRate !== undefined) {
    const commissionUpdates: { directRate?: string; indirectRate?: string } = {};
    if (updates.directCommissionRate !== undefined) {
      commissionUpdates.directRate = updates.directCommissionRate;
    }
    if (updates.indirectCommissionRate !== undefined) {
      commissionUpdates.indirectRate = updates.indirectCommissionRate;
    }
    
    // Check if record exists in vipCommissionRates
    const [existingCommRate] = await db.select().from(vipCommissionRates).where(eq(vipCommissionRates.level, rank)).limit(1);
    
    if (existingCommRate) {
      await db.update(vipCommissionRates)
        .set(commissionUpdates)
        .where(eq(vipCommissionRates.level, rank));
    } else {
      // Insert new record if it doesn't exist
      await db.insert(vipCommissionRates).values({
        level: rank,
        directRate: updates.directCommissionRate || "0.10",
        indirectRate: updates.indirectCommissionRate || "0.05",
      });
    }
  }
  
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

export async function getTeamMembersWithDetails(userId: number) {
  // 1. Get direct referrals (Level 1)
  const directReferrals = await db.select({
    id: users.id,
    phone: users.phone,
    createdAt: users.createdAt,
    vipLevel: users.vipLevel,
    inviterId: users.inviterId,
  })
  .from(users)
  .where(eq(users.inviterId, userId))
  .orderBy(desc(users.createdAt));

  // 2. Get indirect referrals (Level 2)
  const directIds = directReferrals.map(u => u.id);
  let indirectReferrals: typeof directReferrals = [];
  
  if (directIds.length > 0) {
    indirectReferrals = await db.select({
      id: users.id,
      phone: users.phone,
      createdAt: users.createdAt,
      vipLevel: users.vipLevel,
      inviterId: users.inviterId,
    })
    .from(users)
    .where(inArray(users.inviterId, directIds))
    .orderBy(desc(users.createdAt));
  }

  // 3. Get Level 3 referrals (Level 3)
  const indirectIds = indirectReferrals.map(u => u.id);
  let level3Referrals: typeof directReferrals = [];
  
  if (indirectIds.length > 0) {
    level3Referrals = await db.select({
      id: users.id,
      phone: users.phone,
      createdAt: users.createdAt,
      vipLevel: users.vipLevel,
      inviterId: users.inviterId,
    })
    .from(users)
    .where(inArray(users.inviterId, indirectIds))
    .orderBy(desc(users.createdAt));
  }

  // 4. Get balances, real-name status, total deposit and total withdraw for all team members
  const allMembers = [...directReferrals, ...indirectReferrals, ...level3Referrals];
  const allMemberIds = allMembers.map(m => m.id);
  
  const memberDetailsMap = new Map();
  
  if (allMemberIds.length > 0) {
    // Get wallets
    const memberWallets = await db.select({
      userId: wallets.userId,
      available: wallets.balanceCashAvailable,
    })
    .from(wallets)
    .where(inArray(wallets.userId, allMemberIds));
    
    // Get real-name status
    const memberVerifications = await db.select({
      userId: identityVerifications.userId,
      status: identityVerifications.status,
      realName: identityVerifications.realName,
    })
    .from(identityVerifications)
    .where(inArray(identityVerifications.userId, allMemberIds));

    // Get total deposits
    const memberDeposits = await db.select({
      userId: deposits.userId,
      total: sql<string>`sum(${deposits.amount})`,
    })
    .from(deposits)
    .where(and(inArray(deposits.userId, allMemberIds), eq(deposits.status, 'approved')))
    .groupBy(deposits.userId);

    // Get total withdraws
    const memberWithdraws = await db.select({
      userId: withdraws.userId,
      total: sql<string>`sum(${withdraws.amount})`,
    })
    .from(withdraws)
    .where(and(inArray(withdraws.userId, allMemberIds), eq(withdraws.status, 'approved')))
    .groupBy(withdraws.userId);

    // Map details
    memberWallets.forEach(w => {
      const current = memberDetailsMap.get(w.userId) || {};
      memberDetailsMap.set(w.userId, { ...current, balance: w.available });
    });

    memberVerifications.forEach(v => {
      const current = memberDetailsMap.get(v.userId) || {};
      memberDetailsMap.set(v.userId, { ...current, isVerified: v.status === 'approved', realName: v.realName });
    });

    memberDeposits.forEach(d => {
      const current = memberDetailsMap.get(d.userId) || {};
      memberDetailsMap.set(d.userId, { ...current, totalDeposit: d.total });
    });

    memberWithdraws.forEach(w => {
      const current = memberDetailsMap.get(w.userId) || {};
      memberDetailsMap.set(w.userId, { ...current, totalWithdraw: w.total });
    });
  }

  // Helper to format member with details
  const formatMember = (member: typeof directReferrals[0], level: number) => {
    const details = memberDetailsMap.get(member.id) || {};
    return {
      ...member,
      level,
      balance: details.balance || "0",
      isVerified: !!details.isVerified,
      realName: details.realName,
      totalDeposit: details.totalDeposit || "0",
      totalWithdraw: details.totalWithdraw || "0",
      inviterId: member.inviterId
    };
  };

  return [
    ...directReferrals.map(m => formatMember(m, 1)),
    ...indirectReferrals.map(m => formatMember(m, 2)),
    ...level3Referrals.map(m => formatMember(m, 3)),
  ];
}

export async function getTeamStats(userId: number) {
  const members = await getTeamMembersWithDetails(userId);
  
  const totalDeposit = members.reduce((sum, m) => sum + parseFloat(m.totalDeposit), 0);
  const totalWithdraw = members.reduce((sum, m) => sum + parseFloat(m.totalWithdraw), 0);

  // Get total VIP commission (from commissionLogs) - Only credited
  const [vipCommission] = await db.select({
    total: sql<string>`sum(${commissionLogs.amountCents})`
  })
  .from(commissionLogs)
  .where(and(
    eq(commissionLogs.toUserId, userId),
    eq(commissionLogs.bizType, "vip_upgrade"),
    eq(commissionLogs.status, "credited")
  ));

  // Get other commission from new logs (lottery_reward etc) - Only credited
  const [newOtherCommission] = await db.select({
    total: sql<string>`sum(${commissionLogs.amountCents})`
  })
  .from(commissionLogs)
  .where(and(
    eq(commissionLogs.toUserId, userId),
    eq(commissionLogs.bizType, "lottery_reward"),
    eq(commissionLogs.status, "credited")
  ));

  // Get total other commission (from commissionRecords - old table)
  const [oldOtherCommission] = await db.select({
    total: sql<string>`sum(${commissionRecords.amount})`
  })
  .from(commissionRecords)
  .where(eq(commissionRecords.userId, userId));

  const vipTotal = (parseInt(vipCommission?.total || "0") / 100).toFixed(2);
  const newOtherTotal = parseInt(newOtherCommission?.total || "0") / 100;
  const oldOtherTotal = parseFloat(oldOtherCommission?.total || "0");
  const otherTotal = (newOtherTotal + oldOtherTotal).toFixed(2);

  return {
    memberCount: members.length,
    totalDeposit: totalDeposit.toFixed(2),
    totalWithdraw: totalWithdraw.toFixed(2),
    totalVipCommission: vipTotal,
    totalOtherCommission: otherTotal,
    members
  };
}

export async function getReferralRewards(userId: number, limit = 50) {
  // 从commissionLogs表获取VIP升级佣金记录
  const vipCommissions = await db.select()
    .from(commissionLogs)
    .where(and(
      eq(commissionLogs.toUserId, userId),
      eq(commissionLogs.bizType, "vip_upgrade")
    ))
    .orderBy(desc(commissionLogs.createdAt))
    .limit(limit);

  // 转换为前端期望的格式
  return vipCommissions.map(log => ({
    id: log.id,
    userId: log.toUserId,
    fromUserId: log.fromUserId,
    level: log.relationLevel,
    amount: (log.amountCents / 100).toFixed(2),
    status: log.status,
    createdAt: log.createdAt,
    description: "VIP升级奖励"
  }));
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
  
  // Find the highest rank the user qualifies for
  for (const rule of rules.reverse()) {
    if (
      userRank.directCount >= rule.directRequired! &&
      userRank.team3genCount >= rule.team3genRequired! &&
      rule.rank > userRank.currentRank
    ) {
      // Check if there is already a pending request for this rank
      const [existingRequest] = await db.select()
        .from(rankUpgradeRequests)
        .where(and(
          eq(rankUpgradeRequests.userId, userId),
          eq(rankUpgradeRequests.targetRank, rule.rank),
          eq(rankUpgradeRequests.status, "pending")
        ))
        .limit(1);

      if (!existingRequest) {
        // Create a new upgrade request
        await db.insert(rankUpgradeRequests).values({
          userId,
          targetRank: rule.rank,
          currentRank: userRank.currentRank,
          directCount: userRank.directCount,
          team3genCount: userRank.team3genCount,
          bonusAmount: rule.cashBonus || "0",
          status: "pending",
        });
      }
      
      // Stop after finding the highest eligible rank
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

export async function getDetailedCommissionHistory(userId: number, limit = 50) {
  // 1. Get VIP Commissions from commissionLogs
  const vipCommissions = await db.select({
    id: commissionLogs.id,
    amount: commissionLogs.amountCents,
    createdAt: commissionLogs.createdAt,
    relationLevel: commissionLogs.relationLevel,
    bizType: commissionLogs.bizType,
    fromUserPhone: users.phone,
    fromUserVipLevel: users.vipLevel,
    baseCents: commissionLogs.baseCents,
  })
  .from(commissionLogs)
  .leftJoin(users, eq(commissionLogs.fromUserId, users.id))
  .where(and(
    eq(commissionLogs.toUserId, userId),
    eq(commissionLogs.bizType, "vip_upgrade")
  ))
  .orderBy(desc(commissionLogs.createdAt))
  .limit(limit);

  // 2. Get Spin/Activity Commissions from commissionRecords
  const spinCommissions = await db.select({
    id: commissionRecords.id,
    amount: commissionRecords.amount, // This is decimal string
    createdAt: commissionRecords.createdAt,
    level: commissionRecords.level,
    sourceType: commissionRecords.sourceType,
    rate: commissionRecords.rate,
    fromUserPhone: users.phone,
    fromUserVipLevel: users.vipLevel,
  })
  .from(commissionRecords)
  .leftJoin(users, eq(commissionRecords.fromUserId, users.id))
  .where(eq(commissionRecords.userId, userId))
  .orderBy(desc(commissionRecords.createdAt))
  .limit(limit);

  // 3. Format and Merge
  const formattedVip = vipCommissions.map(c => {
    const amountYuan = (c.amount / 100).toFixed(2);
    const levelName = c.relationLevel === 1 ? "直推" : c.relationLevel === 2 ? "二级" : "三级";
    const userPhone = c.fromUserPhone ? c.fromUserPhone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2') : "未知用户";
    // baseCents corresponds to the upgrade fee. We can infer the target VIP level from it if we had the map, 
    // or we can just say "upgraded VIP".
    // Better: look at c.baseCents. 19800 -> VIP1, 29800 -> VIP2 etc.
    // Or we can just use "升级VIP" text.
    // The user example: "Lower-level member ... upgraded to VIP1, bonus 19.8 yuan."
    
    // Attempt to guess VIP level from base amount (not perfect but workable)
    let upgradedTo = "VIP";
    if (c.baseCents === 19800) upgradedTo = "VIP1";
    else if (c.baseCents === 29800) upgradedTo = "VIP2/VIP3";
    else if (c.baseCents === 49800) upgradedTo = "VIP4";
    else if (c.baseCents === 59800) upgradedTo = "VIP5";

    return {
      id: `vip_${c.id}`,
      type: "vip_commission",
      amount: amountYuan,
      createdAt: c.createdAt,
      title: "VIP推广佣金",
      description: `${levelName}下级会员${userPhone}升级${upgradedTo}，获得奖金${amountYuan}元。`,
      raw: c
    };
  });

  const formattedSpin = spinCommissions.map(c => {
    const amountYuan = parseFloat(c.amount).toFixed(2);
    const levelName = c.level === 1 ? "直推" : c.level === 2 ? "二级" : "三级";
    const userPhone = c.fromUserPhone ? c.fromUserPhone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2') : "未知用户";
    
    // Calculate prize amount from commission amount and rate
    // prize = commission / rate
    const rate = parseFloat(c.rate);
    const prizeAmount = rate > 0 ? (parseFloat(c.amount) / rate).toFixed(2) : "0.00";

    return {
      id: `spin_${c.id}`,
      type: "lottery_commission",
      amount: amountYuan,
      createdAt: c.createdAt,
      title: "活动推广佣金",
      description: `${levelName}下级会员${userPhone}转盘中奖${prizeAmount}元，获得返佣${amountYuan}元。`,
      raw: c
    };
  });

  // Merge and Sort
  const allHistory = [...formattedVip, ...formattedSpin].sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return allHistory.slice(0, limit);
}

// New functions for Rank Upgrade Requests

export async function getRankUpgradeRequests(status?: string) {
  let query = db.select({
    id: rankUpgradeRequests.id,
    userId: rankUpgradeRequests.userId,
    targetRank: rankUpgradeRequests.targetRank,
    currentRank: rankUpgradeRequests.currentRank,
    directCount: rankUpgradeRequests.directCount,
    team3genCount: rankUpgradeRequests.team3genCount,
    bonusAmount: rankUpgradeRequests.bonusAmount,
    status: rankUpgradeRequests.status,
    createdAt: rankUpgradeRequests.createdAt,
    userPhone: users.phone,
  })
  .from(rankUpgradeRequests)
  .leftJoin(users, eq(rankUpgradeRequests.userId, users.id))
  .orderBy(desc(rankUpgradeRequests.createdAt));

  if (status) {
    query = query.where(eq(rankUpgradeRequests.status, status)) as any;
  }

  return query;
}

export async function approveRankUpgradeRequest(requestId: number, adminId?: number, adminNote?: string) {
  const [request] = await db.select().from(rankUpgradeRequests).where(eq(rankUpgradeRequests.id, requestId)).limit(1);
  if (!request) throw new Error("申请不存在");
  if (request.status !== "pending") throw new Error("申请状态不正确");

  // Update request status
  await db.update(rankUpgradeRequests).set({
    status: "approved",
    reviewedBy: adminId ? adminId.toString() : "system",
    adminNote,
    reviewedAt: new Date(),
  }).where(eq(rankUpgradeRequests.id, requestId));

  // Update user rank
  await db.update(userRanks).set({
    currentRank: request.targetRank,
  }).where(eq(userRanks.userId, request.userId));
  
  // Update users table vipLevel
  await db.update(users).set({
    vipLevel: request.targetRank,
  }).where(eq(users.id, request.userId));

  // Distribute bonus if any
  const bonus = parseFloat(request.bonusAmount?.toString() || "0");
  if (bonus > 0) {
    await addCashAvailable(request.userId, bonus, "rank_bonus", request.id, `VIP${request.targetRank}晋级奖励`);
  }

  // Distribute upline commission based on rank opening fee
  const rules = await getRankRules();
  const targetRule = rules.find(r => r.rank === request.targetRank);
  
  if (targetRule && targetRule.openingFee) {
    const openingFeeCents = Math.floor(parseFloat(targetRule.openingFee) * 100);
    if (openingFeeCents > 0) {
      await distributeVipUpgradeCommission(request.userId, openingFeeCents, request.id);
    }
  }

  return { success: true };
}

export async function rejectRankUpgradeRequest(requestId: number, adminId?: number, adminNote?: string) {
  const [request] = await db.select().from(rankUpgradeRequests).where(eq(rankUpgradeRequests.id, requestId)).limit(1);
  if (!request) throw new Error("申请不存在");
  if (request.status !== "pending") throw new Error("申请状态不正确");

  await db.update(rankUpgradeRequests).set({
    status: "rejected",
    reviewedBy: adminId ? adminId.toString() : "system",
    adminNote,
    reviewedAt: new Date(),
  }).where(eq(rankUpgradeRequests.id, requestId));

  return { success: true };
}
