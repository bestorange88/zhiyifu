import { db } from "../db";
import { 
  vipLevels, vipRequirements, vipCommissionRates, lotteryCommissionRates,
  userVipStatus, vipUpgradeTxs, commissionLogs,
  users, orders, wallets, vipPlans 
} from "@shared/schema";
import { eq, sql, and, desc, like, gte } from "drizzle-orm";
import { deductCashAvailable, addCashAvailable, addCashFrozen, getWallet } from "./wallet";
import { addSpins } from "./spin";

export async function getVipLevels() {
  return db.select().from(vipLevels).orderBy(vipLevels.level);
}

export async function getVipLevelWithDetails(level: number) {
  const [vipLevel] = await db.select().from(vipLevels).where(eq(vipLevels.level, level)).limit(1);
  if (!vipLevel) return null;

  const [requirement] = await db.select().from(vipRequirements).where(eq(vipRequirements.level, level)).limit(1);
  const [commRate] = await db.select().from(vipCommissionRates).where(eq(vipCommissionRates.level, level)).limit(1);

  return {
    ...vipLevel,
    requirement,
    commissionRate: commRate,
  };
}

export async function getAllVipLevelsWithDetails() {
  const levels = await db.select().from(vipLevels).orderBy(vipLevels.level);
  const requirements = await db.select().from(vipRequirements);
  const commRates = await db.select().from(vipCommissionRates);
  const lotteryRates = await db.select().from(lotteryCommissionRates);

  return levels.map(level => {
    const req = requirements.find(r => r.level === level.level);
    const commRate = commRates.find(r => r.level === level.level);
    const lotteryRate = lotteryRates.find(r => r.level === level.level);
    
    return {
      ...level,
      priceYuan: (level.priceCents / 100).toFixed(2),
      upgradeRewardYuan: (level.upgradeRewardCents / 100).toFixed(2),
      withdrawThresholdYuan: (level.withdrawThresholdCents / 100).toFixed(2),
      withdrawMinYuan: level.withdrawThresholdCents / 100,
      withdrawSpeed: level.settleType === "T0" ? "T+0" : "T+1",
      winMultiplier: parseFloat(level.incomeMultiplier as any).toFixed(1),
      directRequired: req?.directRequired ?? 0,
      team3GenRequired: req?.team3Required ?? 0,
      requirement: req,
      commissionRate: commRate,
      lotteryCommissionRate: lotteryRate,
      upgradeCommission: {
        directRate: commRate?.directRate ?? 0,
        indirectRate: commRate?.indirectRate ?? 0,
      },
      lotteryCommission: {
        directRate: lotteryRate?.directRate ?? 0,
        indirectRate: lotteryRate?.indirectRate ?? 0,
      },
    };
  });
}

export async function getUserVipStatus(userId: number) {
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user) throw new Error("用户不存在");

  let [status] = await db.select().from(userVipStatus).where(eq(userVipStatus.userId, userId)).limit(1);
  
  if (!status) {
    await db.insert(userVipStatus).values({
      userId,
      vipLevel: user.vipLevel || 0,
      qualified: false,
      directCount: 0,
      team3Count: 0,
    });
    [status] = await db.select().from(userVipStatus).where(eq(userVipStatus.userId, userId)).limit(1);
  }

  const levels = await getAllVipLevelsWithDetails();
  const currentLevel = levels.find(l => l.level === status.vipLevel);
  const nextLevel = levels.find(l => l.level === status.vipLevel + 1);

  let qualificationProgress = null;
  const directRequired = currentLevel?.requirement?.directRequired ?? 0;
  const team3GenRequired = currentLevel?.requirement?.team3Required ?? 0;
  
  if (currentLevel?.requirement) {
    qualificationProgress = {
      directCount: status.directCount,
      directRequired: directRequired,
      team3Count: status.team3Count,
      team3Required: team3GenRequired,
      isQualified: status.qualified,
    };
  }

  const requirements = {
    directRequired: directRequired,
    team3GenRequired: team3GenRequired,
    directMet: status.directCount >= directRequired,
    team3GenMet: status.team3Count >= team3GenRequired,
  };

  return {
    vipLevel: status.vipLevel,
    vipName: currentLevel?.name || "普通用户",
    qualified: status.qualified,
    upgradedAt: status.upgradedAt,
    directCount: status.directCount,
    team3GenCount: status.team3Count,
    frozenCommission: 0,
    requirements,
    currentLevelDetails: currentLevel,
    nextLevelDetails: nextLevel,
    qualificationProgress,
    canUpgrade: !!nextLevel,
  };
}

export async function createVipUpgradeOrder(userId: number, targetLevel: number) {
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user) throw new Error("用户不存在");

  let [status] = await db.select().from(userVipStatus).where(eq(userVipStatus.userId, userId)).limit(1);
  const currentLevel = status?.vipLevel || user.vipLevel || 0;

  if (targetLevel !== currentLevel + 1) {
    throw new Error(`只能按顺序升级，当前为V${currentLevel}，只能升级到V${currentLevel + 1}`);
  }

  const [targetVipLevel] = await db.select().from(vipLevels).where(eq(vipLevels.level, targetLevel)).limit(1);
  if (!targetVipLevel) throw new Error("VIP等级不存在");

  const wallet = await getWallet(userId);
  const availableBalance = Math.floor(parseFloat(wallet.balanceCashAvailable) * 100);
  
  if (availableBalance < targetVipLevel.priceCents) {
    throw new Error(`余额不足，需要¥${(targetVipLevel.priceCents / 100).toFixed(2)}，当前可用余额¥${(availableBalance / 100).toFixed(2)}`);
  }

  const pendingOrders = await db.select().from(vipUpgradeTxs)
    .where(and(
      eq(vipUpgradeTxs.userId, userId),
      eq(vipUpgradeTxs.status, "pending")
    ));

  if (pendingOrders.length > 0) {
    const existingOrder = pendingOrders.find(o => o.toLevel === targetLevel);
    if (existingOrder) {
      return {
        orderId: existingOrder.id,
        amount: (existingOrder.payAmountCents / 100).toFixed(2),
        levelName: targetVipLevel.name,
        fromLevel: currentLevel,
        toLevel: targetLevel,
      };
    }
    throw new Error("您有未完成的VIP升级订单，请先完成或联系客服");
  }

  const [order] = await db.insert(vipUpgradeTxs).values({
    userId,
    fromLevel: currentLevel,
    toLevel: targetLevel,
    payAmountCents: targetVipLevel.priceCents,
    status: "pending",
  }).returning();

  return {
    orderId: order.id,
    amount: (targetVipLevel.priceCents / 100).toFixed(2),
    levelName: targetVipLevel.name,
    fromLevel: currentLevel,
    toLevel: targetLevel,
  };
}

export async function confirmVipUpgrade(userId: number, orderId: number) {
  const [order] = await db.select().from(vipUpgradeTxs).where(eq(vipUpgradeTxs.id, orderId)).limit(1);
  
  if (!order || order.userId !== userId) throw new Error("订单不存在");
  if (order.status !== "pending") throw new Error("订单状态异常");

  const [targetLevel] = await db.select().from(vipLevels).where(eq(vipLevels.level, order.toLevel)).limit(1);
  if (!targetLevel) throw new Error("VIP等级不存在");

  const amountYuan = order.payAmountCents / 100;
  await deductCashAvailable(userId, amountYuan, "vip_upgrade", orderId, `升级到${targetLevel.name}`);

  await db.update(vipUpgradeTxs)
    .set({ status: "paid", paidAt: new Date() })
    .where(eq(vipUpgradeTxs.id, orderId));

  let [status] = await db.select().from(userVipStatus).where(eq(userVipStatus.userId, userId)).limit(1);
  
  if (!status) {
    await db.insert(userVipStatus).values({
      userId,
      vipLevel: order.toLevel,
      upgradedAt: new Date(),
      qualified: false,
      directCount: 0,
      team3Count: 0,
    });
  } else {
    await db.update(userVipStatus)
      .set({ 
        vipLevel: order.toLevel,
        upgradedAt: new Date(),
      })
      .where(eq(userVipStatus.userId, userId));
  }

  await db.update(users)
    .set({ vipLevel: order.toLevel })
    .where(eq(users.id, userId));

  if (targetLevel.dailyLottery > 0) {
    await addSpins(userId, targetLevel.dailyLottery);
  }

  await distributeVipUpgradeCommission(userId, order.payAmountCents, orderId);

  return {
    success: true,
    vipLevel: order.toLevel,
    vipName: targetLevel.name,
    dailyLottery: targetLevel.dailyLottery,
    upgradeRewardCents: targetLevel.upgradeRewardCents,
    qualified: false,
    message: targetLevel.upgradeRewardCents > 0 
      ? `升级成功！达标后可领取¥${(targetLevel.upgradeRewardCents / 100).toFixed(2)}奖励` 
      : "升级成功！",
  };
}

async function distributeVipUpgradeCommission(fromUserId: number, payAmountCents: number, txId: number) {
  const [fromUser] = await db.select().from(users).where(eq(users.id, fromUserId)).limit(1);
  if (!fromUser?.inviterId) return;

  const uplineChain = await getUplineChain(fromUserId, 3);

  for (let i = 0; i < uplineChain.length; i++) {
    const uplineUserId = uplineChain[i];
    const relationLevel = i + 1;

    const [uplineStatus] = await db.select().from(userVipStatus).where(eq(userVipStatus.userId, uplineUserId)).limit(1);
    const uplineVipLevel = uplineStatus?.vipLevel || 0;

    if (uplineVipLevel < 1) continue;

    const [commRate] = await db.select().from(vipCommissionRates).where(eq(vipCommissionRates.level, uplineVipLevel)).limit(1);
    if (!commRate) continue;

    const rate = relationLevel === 1 
      ? parseFloat(commRate.directRate) 
      : parseFloat(commRate.indirectRate);

    if (rate <= 0) continue;

    const commissionCents = Math.floor(payAmountCents * rate);
    if (commissionCents <= 0) continue;

    const isQualified = uplineStatus?.qualified || false;

    await db.insert(commissionLogs).values({
      toUserId: uplineUserId,
      fromUserId,
      bizType: "vip_upgrade",
      relationLevel,
      baseCents: payAmountCents,
      rate: rate.toString(),
      amountCents: commissionCents,
      refId: `upgrade_${txId}`,
      status: isQualified ? "credited" : "frozen",
    });

    if (isQualified) {
      const commissionYuan = commissionCents / 100;
      await addCashAvailable(uplineUserId, commissionYuan, "vip_commission", txId, `下级升级VIP分佣`);
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

export async function recalcQualification(userId: number) {
  const [status] = await db.select().from(userVipStatus).where(eq(userVipStatus.userId, userId)).limit(1);
  if (!status || status.vipLevel < 1) return { qualified: false, changed: false };

  const [requirement] = await db.select().from(vipRequirements).where(eq(vipRequirements.level, status.vipLevel)).limit(1);
  if (!requirement) return { qualified: false, changed: false };

  const directCount = await getDirectReferralCount(userId);
  const team3Count = await get3GenTeamCount(userId);

  const isQualified = directCount >= requirement.directRequired && team3Count >= requirement.team3Required;
  const wasQualified = status.qualified;

  const updateData: Record<string, any> = {
    directCount,
    team3Count,
    qualified: isQualified,
    lastQualCheckAt: new Date(),
  };

  if (isQualified && !wasQualified) {
    updateData.qualifiedAt = new Date();
  }

  await db.update(userVipStatus)
    .set(updateData)
    .where(eq(userVipStatus.userId, userId));

  if (isQualified && !wasQualified) {
    await unlockFrozenCommissions(userId);

    const [vipLevel] = await db.select().from(vipLevels).where(eq(vipLevels.level, status.vipLevel)).limit(1);
    if (vipLevel && vipLevel.upgradeRewardCents > 0) {
      const rewardYuan = vipLevel.upgradeRewardCents / 100;
      await addCashAvailable(userId, rewardYuan, "upgrade_reward", undefined, `${vipLevel.name}达标升级奖励`);
    }
  }

  return { qualified: isQualified, changed: isQualified !== wasQualified };
}

async function unlockFrozenCommissions(userId: number) {
  const [status] = await db.select().from(userVipStatus).where(eq(userVipStatus.userId, userId)).limit(1);
  if (!status || !status.qualifiedAt) return;

  const qualifiedAt = status.qualifiedAt;

  const frozenCommissions = await db.select().from(commissionLogs)
    .where(and(
      eq(commissionLogs.toUserId, userId),
      eq(commissionLogs.status, "frozen"),
      gte(commissionLogs.createdAt, qualifiedAt)
    ));

  for (const comm of frozenCommissions) {
    await db.update(commissionLogs)
      .set({ status: "credited" })
      .where(eq(commissionLogs.id, comm.id));

    const amountYuan = comm.amountCents / 100;
    const description = comm.bizType === "vip_upgrade" ? "下级升级VIP分佣(达标解冻)" : "下级抽奖分佣(达标解冻)";
    await addCashAvailable(userId, amountYuan, "commission_unfreeze", comm.id, description);
  }
}

async function getDirectReferralCount(userId: number): Promise<number> {
  const result = await db.select({ count: sql<number>`count(*)::int` })
    .from(users)
    .where(eq(users.inviterId, userId));
  return result[0]?.count || 0;
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

export async function getVipPlans() {
  let plans = await db.select().from(vipPlans).orderBy(vipPlans.level);
  return plans;
}

export async function getVipStatus(userId: number) {
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user) throw new Error("用户不存在");

  const status = await getUserVipStatus(userId);
  return {
    level: status.vipLevel,
    name: status.vipName,
    expireAt: null,
    dailyExtraSpins: status.currentLevelDetails?.dailyLottery || 0,
    withdrawMinAmount: status.currentLevelDetails?.withdrawThresholdYuan || "100",
    withdrawSpeed: status.currentLevelDetails?.settleType || "T+1",
    qualified: status.qualified,
    qualificationProgress: status.qualificationProgress,
  };
}

export async function buyVip(userId: number, level: number) {
  return createVipUpgradeOrder(userId, level);
}

export async function confirmVipPurchase(userId: number, orderId: number) {
  return confirmVipUpgrade(userId, orderId);
}

export async function grantDailyVipSpins() {
  const levels = await getVipLevels();
  
  for (const level of levels) {
    if (level.dailyLottery > 0) {
      const vipUsers = await db.select()
        .from(userVipStatus)
        .where(eq(userVipStatus.vipLevel, level.level));
      
      for (const status of vipUsers) {
        await addSpins(status.userId, level.dailyLottery);
      }
    }
  }
}

// 初始化VIP等级数据（应用启动时调用）
export async function initializeVipLevels() {
  const existingLevels = await db.select().from(vipLevels);
  
  if (existingLevels.length >= 5) {
    console.log("[VIP] VIP levels already initialized");
    return;
  }

  console.log("[VIP] Initializing VIP levels...");

  const defaultLevels = [
    { level: 1, name: "V1", priceCents: 19800, upgradeRewardCents: 0, dailyLottery: 2, incomeMultiplier: "1.20", withdrawThresholdCents: 10000, settleType: "T1" },
    { level: 2, name: "V2", priceCents: 29800, upgradeRewardCents: 0, dailyLottery: 3, incomeMultiplier: "1.30", withdrawThresholdCents: 5000, settleType: "T0" },
    { level: 3, name: "V3", priceCents: 29800, upgradeRewardCents: 0, dailyLottery: 4, incomeMultiplier: "1.40", withdrawThresholdCents: 4000, settleType: "T0" },
    { level: 4, name: "V4", priceCents: 49800, upgradeRewardCents: 0, dailyLottery: 5, incomeMultiplier: "1.50", withdrawThresholdCents: 3000, settleType: "T0" },
    { level: 5, name: "V5", priceCents: 59800, upgradeRewardCents: 0, dailyLottery: 5, incomeMultiplier: "1.60", withdrawThresholdCents: 3000, settleType: "T0" },
  ];

  const defaultRequirements = [
    { level: 1, directRequired: 3, team3Required: 0 },
    { level: 2, directRequired: 10, team3Required: 60 },
    { level: 3, directRequired: 30, team3Required: 200 },
    { level: 4, directRequired: 50, team3Required: 300 },
    { level: 5, directRequired: 200, team3Required: 2000 },
  ];

  const defaultCommRates = [
    { level: 1, directRate: "0.10", indirectRate: "0.00" },
    { level: 2, directRate: "0.10", indirectRate: "0.05" },
    { level: 3, directRate: "0.10", indirectRate: "0.05" },
    { level: 4, directRate: "0.10", indirectRate: "0.05" },
    { level: 5, directRate: "0.10", indirectRate: "0.05" },
  ];

  const defaultLotteryRates = [
    { level: 1, directRate: "0.10", indirectRate: "0.05" },
    { level: 2, directRate: "0.10", indirectRate: "0.05" },
    { level: 3, directRate: "0.10", indirectRate: "0.05" },
    { level: 4, directRate: "0.10", indirectRate: "0.05" },
    { level: 5, directRate: "0.10", indirectRate: "0.05" },
  ];

  for (const lvl of defaultLevels) {
    const [existing] = await db.select().from(vipLevels).where(eq(vipLevels.level, lvl.level)).limit(1);
    if (!existing) {
      await db.insert(vipLevels).values(lvl);
    } else {
      await db.update(vipLevels).set(lvl).where(eq(vipLevels.level, lvl.level));
    }
  }

  for (const req of defaultRequirements) {
    const [existing] = await db.select().from(vipRequirements).where(eq(vipRequirements.level, req.level)).limit(1);
    if (!existing) {
      await db.insert(vipRequirements).values(req);
    } else {
      await db.update(vipRequirements).set(req).where(eq(vipRequirements.level, req.level));
    }
  }

  for (const rate of defaultCommRates) {
    const [existing] = await db.select().from(vipCommissionRates).where(eq(vipCommissionRates.level, rate.level)).limit(1);
    if (!existing) {
      await db.insert(vipCommissionRates).values(rate);
    } else {
      await db.update(vipCommissionRates).set(rate).where(eq(vipCommissionRates.level, rate.level));
    }
  }

  for (const rate of defaultLotteryRates) {
    const [existing] = await db.select().from(lotteryCommissionRates).where(eq(lotteryCommissionRates.level, rate.level)).limit(1);
    if (!existing) {
      await db.insert(lotteryCommissionRates).values(rate);
    } else {
      await db.update(lotteryCommissionRates).set(rate).where(eq(lotteryCommissionRates.level, rate.level));
    }
  }

  console.log("[VIP] VIP levels initialized successfully");
}
