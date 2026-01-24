import { db } from "../db";
import { 
  vipLevels, vipRequirements, vipCommissionRates, lotteryCommissionRates,
  userVipStatus, vipUpgradeTxs, commissionLogs,
  users, orders, wallets, vipPlans 
} from "@shared/schema";
import { eq, sql, and, desc, like, gte, inArray } from "drizzle-orm";
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
      winMultiplier: parseFloat(level.incomeMultiplier as any).toFixed(2),
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
      benefitsList: level.benefits ? JSON.parse(level.benefits) : [],
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
  const directRequired = nextLevel?.requirement?.directRequired ?? 0;
  const team3GenRequired = nextLevel?.requirement?.team3Required ?? 0;
  
  // Check downline VIP structure requirements
  const downlineReqs: Record<string, number> = nextLevel?.requirement?.downlineLevelRequirements 
    ? JSON.parse(nextLevel.requirement.downlineLevelRequirements) 
    : {};
  
  const downlineProgress: Record<string, { current: number, required: number, met: boolean }> = {};
  let downlineMet = true;

  if (Object.keys(downlineReqs).length > 0) {
    for (const [levelKey, requiredCount] of Object.entries(downlineReqs)) {
      const targetLevel = parseInt(levelKey.replace('V', ''));
      if (!isNaN(targetLevel)) {
        const currentCount = await countDownlineVipLevelWithin3Gen(userId, targetLevel);
        downlineProgress[levelKey] = {
          current: currentCount,
          required: requiredCount,
          met: currentCount >= requiredCount
        };
        if (currentCount < requiredCount) downlineMet = false;
      }
    }
  }

  if (nextLevel) {
    const directCount = await getDirectReferralCount(userId);
    const team3Count = await get3GenTeamCount(userId);

    qualificationProgress = {
      directCount,
      directRequired,
      directMet: directCount >= directRequired,
      team3Count,
      team3Required: team3GenRequired,
      team3Met: team3Count >= team3GenRequired,
      downlineProgress,
      downlineMet,
      isQualified: directCount >= directRequired && team3Count >= team3GenRequired && downlineMet,
    };
  }

  const [pendingRequest] = await db.select().from(vipUpgradeTxs)
    .where(and(
      eq(vipUpgradeTxs.userId, userId),
      eq(vipUpgradeTxs.status, "pending_review")
    ))
    .limit(1);

  return {
    vipLevel: status.vipLevel,
    vipName: currentLevel?.name || "普通用户",
    qualified: status.qualified,
    upgradedAt: status.upgradedAt,
    directCount: status.directCount,
    team3GenCount: status.team3Count,
    frozenCommission: 0,
    currentLevelDetails: currentLevel,
    nextLevelDetails: nextLevel,
    qualificationProgress,
    canUpgrade: !!nextLevel,
    pendingRequest: pendingRequest ? {
      id: pendingRequest.id,
      toLevel: pendingRequest.toLevel,
      createdAt: pendingRequest.createdAt
    } : null,
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

  // 检查升级条件：直推人数和三代内人数
  const [requirement] = await db.select().from(vipRequirements).where(eq(vipRequirements.level, targetLevel)).limit(1);
  if (requirement) {
    const directCount = await getDirectReferralCount(userId);
    const team3Count = await get3GenTeamCount(userId);
    
    if (directCount < requirement.directRequired) {
      throw new Error(`升级V${targetLevel}需要直推${requirement.directRequired}人，当前直推${directCount}人`);
    }
    if (team3Count < requirement.team3Required) {
      throw new Error(`升级V${targetLevel}需要三代内${requirement.team3Required}人，当前三代内${team3Count}人`);
    }

    // Check downline VIP structure
    if (requirement.downlineLevelRequirements) {
      const downlineReqs: Record<string, number> = JSON.parse(requirement.downlineLevelRequirements);
      for (const [levelKey, requiredCount] of Object.entries(downlineReqs)) {
        const targetLvl = parseInt(levelKey.replace('V', ''));
        if (!isNaN(targetLvl)) {
          const currentCount = await countDownlineVipLevelWithin3Gen(userId, targetLvl);
          if (currentCount < requiredCount) {
             throw new Error(`升级V${targetLevel}需要团队内有${requiredCount}个${levelKey}会员，当前只有${currentCount}个`);
          }
        }
      }
    }
  }

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
  await deductCashAvailable(userId, amountYuan, "vip_upgrade_pay", orderId, `申请升级${targetLevel.name}支付`);

  await db.update(vipUpgradeTxs)
    .set({ status: "pending_review", paidAt: new Date() })
    .where(eq(vipUpgradeTxs.id, orderId));

  return {
    success: true,
    vipLevel: order.fromLevel, // Keep current level
    vipName: targetLevel.name,
    message: "支付成功，请等待管理员审核",
    status: "pending_review"
  };
}

export async function getVipUpgradeRequests(status?: string) {
    let query = db.select({
        id: vipUpgradeTxs.id,
        userId: vipUpgradeTxs.userId,
        phone: users.phone,
        fromLevel: vipUpgradeTxs.fromLevel,
        toLevel: vipUpgradeTxs.toLevel,
        payAmountCents: vipUpgradeTxs.payAmountCents,
        status: vipUpgradeTxs.status,
        createdAt: vipUpgradeTxs.createdAt,
        paidAt: vipUpgradeTxs.paidAt
    })
    .from(vipUpgradeTxs)
    .leftJoin(users, eq(vipUpgradeTxs.userId, users.id));

    if (status) {
        query.where(eq(vipUpgradeTxs.status, status));
    }
    
    return await query.orderBy(desc(vipUpgradeTxs.createdAt));
}

export async function approveVipUpgradeRequest(requestId: number, adminId?: number) {
    const [order] = await db.select().from(vipUpgradeTxs).where(eq(vipUpgradeTxs.id, requestId)).limit(1);
    if (!order) throw new Error("订单不存在");
    if (order.status !== "pending_review") throw new Error("订单状态不是待审核");

    const userId = order.userId;
    const [targetLevel] = await db.select().from(vipLevels).where(eq(vipLevels.level, order.toLevel)).limit(1);
    if (!targetLevel) throw new Error("VIP等级不存在");

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

    // Distribute upgrade reward if any
    if (targetLevel.upgradeRewardCents > 0) {
        const rewardYuan = targetLevel.upgradeRewardCents / 100;
        await addCashAvailable(userId, rewardYuan, "vip_upgrade_reward", requestId, `升级${targetLevel.name}奖励`);
    }

    await distributeVipUpgradeCommission(userId, order.payAmountCents, requestId);

    await db.update(vipUpgradeTxs)
        .set({ status: "completed" })
        .where(eq(vipUpgradeTxs.id, requestId));

    return { success: true };
}

export async function rejectVipUpgradeRequest(requestId: number, adminId?: number) {
    const [order] = await db.select().from(vipUpgradeTxs).where(eq(vipUpgradeTxs.id, requestId)).limit(1);
    if (!order) throw new Error("订单不存在");
    if (order.status !== "pending_review") throw new Error("订单状态不是待审核");

    const amountYuan = order.payAmountCents / 100;
    await addCashAvailable(order.userId, amountYuan, "vip_upgrade_refund", requestId, `VIP升级申请被拒绝退款`);

    await db.update(vipUpgradeTxs)
        .set({ status: "refunded" })
        .where(eq(vipUpgradeTxs.id, requestId));

    return { success: true };
}

export async function distributeVipUpgradeCommission(fromUserId: number, payAmountCents: number, txId: number) {
  const [fromUser] = await db.select().from(users).where(eq(users.id, fromUserId)).limit(1);
  if (!fromUser?.inviterId) return;

  const uplineChain = await getUplineChain(fromUserId, 3);

  for (let i = 0; i < uplineChain.length; i++) {
    const uplineUserId = uplineChain[i];
    const relationLevel = i + 1;

    const [uplineStatus] = await db.select().from(userVipStatus).where(eq(userVipStatus.userId, uplineUserId)).limit(1);
    const uplineVipLevel = uplineStatus?.vipLevel || 0;

    // 获取佣金比例
    let rate = 0;
    if (uplineVipLevel >= 1) {
      const [commRate] = await db.select().from(vipCommissionRates).where(eq(vipCommissionRates.level, uplineVipLevel)).limit(1);
      if (commRate) {
        rate = relationLevel === 1 
          ? parseFloat(commRate.directRate) 
          : parseFloat(commRate.indirectRate);
      }
    } else {
      // 非VIP用户无佣金（根据需求：V1间推为0%，这里非VIP更应该是0%）
      // User prompt says "V1: 10% direct, 0% indirect".
      // Assuming non-VIP gets 0% generally, or maybe 10% direct if platform allows.
      // Let's assume non-VIP gets 0% to be safe, or 10% direct only. 
      // Safe bet: Non-VIP gets nothing or basic 10% direct. 
      // User says "V1 10% direct", implying V0 might be 0.
      // But let's stick to V1 parameters.
      rate = relationLevel === 1 ? 0.0 : 0;
    }

    if (rate <= 0) continue;

    const commissionCents = Math.floor(payAmountCents * rate);
    if (commissionCents <= 0) continue;

    await db.insert(commissionLogs).values({
      toUserId: uplineUserId,
      fromUserId,
      bizType: "vip_upgrade",
      relationLevel,
      baseCents: payAmountCents,
      rate: rate.toString(),
      amountCents: commissionCents,
      refId: `upgrade_${txId}`,
      status: "credited", // VIP commission is now T+0 settled (credited) immediately as per requirement "T+0"
    });

    const commissionYuan = commissionCents / 100;
    await addCashAvailable(uplineUserId, commissionYuan, "vip_commission", txId, `下级升级VIP分佣`);
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

// Helper: Count users in 3-gen team who have VIP level >= targetLevel
async function countDownlineVipLevelWithin3Gen(userId: number, targetLevel: number): Promise<number> {
  let count = 0;
  
  // Level 1
  const level1 = await db.select({ id: users.id }).from(users).where(eq(users.inviterId, userId));
  const level1Ids = level1.map(u => u.id);
  
  if (level1Ids.length === 0) return 0;

  // Level 2
  const level2 = await db.select({ id: users.id }).from(users).where(inArray(users.inviterId, level1Ids));
  const level2Ids = level2.map(u => u.id);

  // Level 3
  let level3Ids: number[] = [];
  if (level2Ids.length > 0) {
    const level3 = await db.select({ id: users.id }).from(users).where(inArray(users.inviterId, level2Ids));
    level3Ids = level3.map(u => u.id);
  }

  const allIds = [...level1Ids, ...level2Ids, ...level3Ids];
  if (allIds.length === 0) return 0;

  // Count those with vipLevel >= targetLevel
  // Note: users table has vipLevel, but userVipStatus is more accurate.
  // We can query userVipStatus for these IDs.
  const qualified = await db.select({ count: sql<number>`count(*)::int` })
    .from(userVipStatus)
    .where(and(
      inArray(userVipStatus.userId, allIds),
      gte(userVipStatus.vipLevel, targetLevel)
    ));
  
  return qualified[0]?.count || 0;
}

export async function recalcQualification(userId: number) {
  // Deprecated/Simplified: Logic moved to getUserVipStatus for real-time check
  return { qualified: true, changed: false };
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
  console.log("[VIP] Initializing VIP levels with NEW parameters...");

  const defaultLevels = [
    { 
      level: 1, 
      name: "V1", 
      priceCents: 19800, 
      upgradeRewardCents: 0, 
      dailyLottery: 2, 
      incomeMultiplier: "1.10", 
      withdrawThresholdCents: 10000, 
      settleType: "T1",
      benefits: JSON.stringify(["基础推广收益", "每日2次抽奖", "1.1倍收益加速"])
    },
    { 
      level: 2, 
      name: "V2", 
      priceCents: 29800, 
      upgradeRewardCents: 58800, 
      dailyLottery: 3, 
      incomeMultiplier: "1.20", 
      withdrawThresholdCents: 5000, 
      settleType: "T0",
      benefits: JSON.stringify(["VIP专属客服", "无限AI使用权限", "推广收益加成", "活动优先参与", "提现极速到账(T+0)"])
    },
    { 
      level: 3, 
      name: "V3", 
      priceCents: 39800, 
      upgradeRewardCents: 128800, 
      dailyLottery: 4, 
      incomeMultiplier: "1.30", 
      withdrawThresholdCents: 4000, 
      settleType: "T0",
      benefits: JSON.stringify(["VIP专属客服", "无限AI使用权限", "推广收益加成", "活动优先参与", "提现极速到账(T+0)"])
    },
    { 
      level: 4, 
      name: "V4", 
      priceCents: 49800, 
      upgradeRewardCents: 288800, 
      dailyLottery: 5, 
      incomeMultiplier: "1.40", 
      withdrawThresholdCents: 3000, 
      settleType: "T0",
      benefits: JSON.stringify(["VIP专属客服", "无限AI使用权限", "推广收益加成", "活动优先参与", "提现极速到账(T+0)"])
    },
    { 
      level: 5, 
      name: "V5", 
      priceCents: 59800, 
      upgradeRewardCents: 888800, 
      dailyLottery: 6, 
      incomeMultiplier: "1.50", 
      withdrawThresholdCents: 3000, 
      settleType: "T0",
      benefits: JSON.stringify(["VIP专属客服", "无限AI使用权限", "推广收益加成", "活动优先参与", "提现极速到账(T+0)"])
    },
  ];

  const defaultRequirements = [
    { level: 1, directRequired: 3, team3Required: 10, downlineLevelRequirements: null },
    { level: 2, directRequired: 10, team3Required: 50, downlineLevelRequirements: JSON.stringify({ "V1": 10 }) },
    { level: 3, directRequired: 30, team3Required: 200, downlineLevelRequirements: JSON.stringify({ "V1": 10, "V2": 10 }) },
    { level: 4, directRequired: 60, team3Required: 400, downlineLevelRequirements: JSON.stringify({ "V1": 10, "V2": 10, "V3": 10 }) },
    { level: 5, directRequired: 100, team3Required: 1000, downlineLevelRequirements: JSON.stringify({ "V1": 10, "V2": 10, "V3": 10, "V4": 10 }) },
  ];

  const defaultCommRates = [
    { level: 1, directRate: "0.10", indirectRate: "0.00" },
    { level: 2, directRate: "0.10", indirectRate: "0.05" },
    { level: 3, directRate: "0.11", indirectRate: "0.06" },
    { level: 4, directRate: "0.12", indirectRate: "0.07" },
    { level: 5, directRate: "0.14", indirectRate: "0.08" },
  ];

  const defaultLotteryRates = [
    { level: 1, directRate: "0.10", indirectRate: "0.05" },
    { level: 2, directRate: "0.10", indirectRate: "0.05" },
    { level: 3, directRate: "0.11", indirectRate: "0.06" },
    { level: 4, directRate: "0.12", indirectRate: "0.07" },
    { level: 5, directRate: "0.14", indirectRate: "0.08" },
  ];

  for (const lvl of defaultLevels) {
    // Upsert logic
    await db.insert(vipLevels).values(lvl)
      .onConflictDoUpdate({ target: vipLevels.level, set: lvl });
  }

  for (const req of defaultRequirements) {
    await db.insert(vipRequirements).values(req)
      .onConflictDoUpdate({ target: vipRequirements.level, set: req });
  }

  for (const rate of defaultCommRates) {
    await db.insert(vipCommissionRates).values(rate)
      .onConflictDoUpdate({ target: vipCommissionRates.level, set: rate });
  }

  for (const rate of defaultLotteryRates) {
    await db.insert(lotteryCommissionRates).values(rate)
      .onConflictDoUpdate({ target: lotteryCommissionRates.level, set: rate });
  }

  console.log("[VIP] VIP levels initialized/updated successfully");
}
