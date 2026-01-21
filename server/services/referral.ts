import { db } from "../db";
import { users, userRanks, rankRules, referralRewards, orders, commissionRecords, commissionLogs, vipCommissionRates, identityVerifications, deposits } from "@shared/schema";
import { eq, sql, desc, and } from "drizzle-orm";
import { addCashFrozen, addCashAvailable, deductCashAvailable, getWallet } from "./wallet";
import { addSpins } from "./spin";

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
  // 旧的佣金记录（仅抽奖相关）
  const oldRecords = await db.select()
    .from(commissionRecords)
    .where(eq(commissionRecords.userId, userId))
    .orderBy(desc(commissionRecords.createdAt))
    .limit(limit);

  // 新的佣金记录（仅抽奖相关，排除VIP升级佣金）
  const newLogs = await db.select()
    .from(commissionLogs)
    .where(and(
      eq(commissionLogs.toUserId, userId),
      eq(commissionLogs.bizType, "lottery_reward")
    ))
    .orderBy(desc(commissionLogs.createdAt))
    .limit(limit);

  const normalizedOld = oldRecords.map(r => ({
    id: r.id,
    userId: r.userId,
    fromUserId: r.fromUserId,
    orderId: r.orderId,
    spinId: r.spinId,
    sourceType: r.sourceType,
    level: r.level,
    rate: r.rate,
    amount: r.amount,
    status: r.status,
    createdAt: r.createdAt,
  }));

  const normalizedNew = newLogs.map(l => ({
    id: l.id + 1000000,
    userId: l.toUserId,
    fromUserId: l.fromUserId,
    orderId: null,
    spinId: null,
    sourceType: l.bizType,
    level: l.relationLevel,
    rate: l.rate,
    amount: (l.amountCents / 100).toFixed(2),
    status: l.status,
    createdAt: l.createdAt,
  }));

  const combined = [...normalizedOld, ...normalizedNew]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, limit);

  return combined;
}

export async function buyRank(userId: number, rank: number) {
  const rules = await getRankRules();
  const rule = rules.find(r => r.rank === rank);
  
  if (!rule) throw new Error("VIP等级不存在");

  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user) throw new Error("用户不存在");

  const currentLevel = user.vipLevel || 0;
  const isVipActive = user.vipExpireAt && new Date(user.vipExpireAt) > new Date();

  if (currentLevel >= rank && isVipActive) {
    throw new Error("您已开通该等级或更高等级VIP，无需重复购买");
  }

  if (rank > currentLevel + 1) {
    const requiredLevel = rank - 1;
    const requiredRule = rules.find(r => r.rank === requiredLevel);
    const requiredName = requiredRule?.name || `VIP${requiredLevel}`;
    throw new Error(`请先开通${requiredName}，才能升级到${rule.name}`);
  }

  const wallet = await getWallet(userId);
  const availableBalance = parseFloat(wallet.balanceCashAvailable || "0");
  const openingFee = parseFloat(rule.openingFee || "0");
  
  if (availableBalance < openingFee) {
    throw new Error(`余额不足，需要¥${rule.openingFee}，当前可用余额¥${availableBalance.toFixed(2)}`);
  }

  const pendingOrders = await db.select().from(orders)
    .where(and(
      eq(orders.userId, userId),
      eq(orders.status, "pending"),
      sql`${orders.type} LIKE 'rank%'`
    ));
  
  for (const pendingOrder of pendingOrders) {
    if (parseFloat(pendingOrder.amount) === openingFee) {
      return {
        orderId: pendingOrder.id,
        amount: rule.openingFee,
        rankName: rule.name,
      };
    }
  }

  if (pendingOrders.length > 0) {
    throw new Error("您有未完成的VIP订单，请先完成或联系客服处理");
  }

  const [order] = await db.insert(orders).values({
    userId,
    type: `rank_${rank}`,
    amount: rule.openingFee || "0",
    status: "pending",
  }).returning();

  return {
    orderId: order.id,
    amount: rule.openingFee,
    rankName: rule.name,
  };
}

export async function confirmRankPurchase(userId: number, orderId: number) {
  const [order] = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
  
  if (!order || order.userId !== userId) throw new Error("订单不存在");
  if (order.status !== "pending") throw new Error("订单状态异常");
  const orderType = (order.type || "").toLowerCase();
  const isRankOrder = orderType.includes("rank");
  if (!isRankOrder) {
    throw new Error("订单类型异常");
  }
  
  const rules = await getRankRules();
  
  let rule = rules.find(r => parseFloat(r.openingFee || "0") === parseFloat(order.amount));
  if (!rule) {
    const rankMatch = order.type.match(/rank_(\d+)/);
    if (rankMatch) {
      rule = rules.find(r => r.rank === parseInt(rankMatch[1]));
    }
  }
  
  if (!rule) throw new Error("VIP等级不存在");

  const amount = parseFloat(order.amount);
  await deductCashAvailable(userId, amount, "rank_purchase", orderId, `开通${rule.name}`);

  await db.update(orders)
    .set({ status: "paid" })
    .where(eq(orders.id, orderId));

  const expireAt = new Date();
  expireAt.setDate(expireAt.getDate() + 30);

  await db.update(users)
    .set({ 
      vipLevel: rule.rank,
      vipExpireAt: expireAt,
    })
    .where(eq(users.id, userId));

  const [existingRank] = await db.select().from(userRanks).where(eq(userRanks.userId, userId)).limit(1);
  if (!existingRank) {
    await db.insert(userRanks).values({
      userId,
      currentRank: rule.rank,
      directCount: 0,
      team3genCount: 0,
      reachedAt: new Date(),
    });
  } else if (existingRank.currentRank < rule.rank) {
    await db.update(userRanks)
      .set({
        currentRank: rule.rank,
        reachedAt: new Date(),
      })
      .where(eq(userRanks.userId, userId));
  }

  if (rule.dailySpins && rule.dailySpins > 0) {
    await addSpins(userId, rule.dailySpins);
  }

  if (rule.cashBonus && parseFloat(rule.cashBonus) > 0) {
    await addCashFrozen(userId, parseFloat(rule.cashBonus), "rank_bonus", orderId, `${rule.name}开通奖励`);
  }

  await distributeReferralCommission(userId, amount);

  return {
    success: true,
    vipLevel: rule.rank,
    expireAt,
    dailySpins: rule.dailySpins || 0,
    cashBonus: rule.cashBonus || "0",
  };
}

export async function getRankStatus(userId: number) {
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user) throw new Error("用户不存在");

  const rules = await getRankRules();
  const currentRule = rules.find(r => r.rank === user.vipLevel);

  return {
    level: user.vipLevel,
    name: currentRule?.name || "普通用户",
    expireAt: user.vipExpireAt,
    dailySpins: currentRule?.dailySpins || 0,
    withdrawMinAmount: currentRule?.withdrawMinAmount || "100",
    withdrawSpeed: currentRule?.withdrawSpeed || "T+3",
    winMultiplier: currentRule?.winMultiplier || "1.0",
  };
}

// 获取下级用户详情（包括实名认证状态和充值记录）
export async function getDownlineUserDetail(uplineUserId: number, downlineUserId: number) {
  // 验证下级用户确实是上级的直推
  const [downlineUser] = await db.select().from(users).where(eq(users.id, downlineUserId)).limit(1);
  
  if (!downlineUser) {
    throw new Error("用户不存在");
  }
  
  if (downlineUser.inviterId !== uplineUserId) {
    throw new Error("该用户不是您的直推下级");
  }
  
  // 获取实名认证状态
  const [identity] = await db.select({
    status: identityVerifications.status,
    realName: identityVerifications.realName,
    reviewedAt: identityVerifications.reviewedAt,
  }).from(identityVerifications).where(eq(identityVerifications.userId, downlineUserId)).limit(1);
  
  // 获取充值记录
  const depositRecords = await db.select({
    id: deposits.id,
    amount: deposits.amount,
    status: deposits.status,
    method: deposits.method,
    createdAt: deposits.createdAt,
  }).from(deposits).where(eq(deposits.userId, downlineUserId)).orderBy(desc(deposits.createdAt)).limit(20);
  
  // 计算充值总额（已完成的）
  const completedDeposits = depositRecords.filter(d => d.status === "completed");
  const totalDeposit = completedDeposits.reduce((sum, d) => sum + parseFloat(d.amount), 0);
  
  return {
    id: downlineUser.id,
    phone: downlineUser.phone?.replace(/(\d{3})\d{4}(\d{4})/, "$1****$2"),
    vipLevel: downlineUser.vipLevel,
    createdAt: downlineUser.createdAt,
    identityStatus: identity?.status || "none",
    identityName: identity?.status === "approved" ? identity.realName?.replace(/^(.).*$/, "$1**") : null,
    depositCount: depositRecords.length,
    totalDeposit: totalDeposit.toFixed(2),
    deposits: depositRecords.map(d => ({
      id: d.id,
      amount: d.amount,
      status: d.status,
      method: d.method,
      createdAt: d.createdAt,
    })),
  };
}

// 获取所有直推下级的详细信息列表
export async function getDirectReferralsWithDetails(userId: number) {
  const directReferrals = await db.select({
    id: users.id,
    phone: users.phone,
    createdAt: users.createdAt,
    vipLevel: users.vipLevel,
  })
    .from(users)
    .where(eq(users.inviterId, userId))
    .orderBy(desc(users.createdAt));
  
  const result = await Promise.all(
    directReferrals.map(async (ref) => {
      // 获取实名认证状态
      const [identity] = await db.select({
        status: identityVerifications.status,
      }).from(identityVerifications).where(eq(identityVerifications.userId, ref.id)).limit(1);
      
      // 获取充值总额
      const depositSum = await db.select({
        total: sql<string>`COALESCE(SUM(CASE WHEN status = 'completed' THEN amount ELSE 0 END), 0)`,
      }).from(deposits).where(eq(deposits.userId, ref.id));
      
      return {
        id: ref.id,
        phone: ref.phone?.replace(/(\d{3})\d{4}(\d{4})/, "$1****$2"),
        createdAt: ref.createdAt,
        vipLevel: ref.vipLevel,
        identityStatus: identity?.status || "none",
        totalDeposit: parseFloat(depositSum[0]?.total || "0").toFixed(2),
      };
    })
  );
  
  return result;
}
