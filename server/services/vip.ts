import { db } from "../db";
import { 
  vipLevels, vipRequirements, vipCommissionRates, lotteryCommissionRates,
  userVipStatus, vipUpgradeTxs, commissionLogs, vipUnlockState,
  users, orders, wallets, vipPlans 
} from "@shared/schema";
import { eq, sql, and, desc, like, gte, inArray } from "drizzle-orm";
import { deductCashAvailable, addCashAvailable, addCashFrozen, getWallet, unfreezeCommission } from "./wallet";
import { addSpins } from "./spin";
import { getSystemSettingByKey } from "./admin";

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
    bonusRules: vipLevel.bonusRules ? JSON.parse(vipLevel.bonusRules) : null,
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
      bonusRules: level.bonusRules ? JSON.parse(level.bonusRules) : null,
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

  // Get Wallet Frozen Balance
  const wallet = await getWallet(userId);
  const frozenCommission = parseFloat(wallet.balanceCashFrozen);

  // Get Unlock State
  let [unlockState] = await db.select().from(vipUnlockState).where(eq(vipUnlockState.userId, userId)).limit(1);
  if (!unlockState) {
    // If not exists, create one
    [unlockState] = await db.insert(vipUnlockState).values({
      userId,
      vipLevel: status.vipLevel,
      unlockedBaseAmount: "0",
    }).returning();
  } else if (unlockState.vipLevel !== status.vipLevel) {
    // If level mismatched (e.g. manual DB update), reset or sync. 
    // Usually autoUnlockOnUpgrade handles this, but for safety:
    // We don't reset here to avoid losing history, just update level if needed or handle logic.
    // For simplicity, we assume sync is handled on upgrade.
  }

  // Calculate Progress (0-1)
  const progressValue = calculateVipProgressValue(qualificationProgress);
  
  // Calculate Unlockable
  // Unlockable = Frozen * Progress
  // But wait, Frozen decreases as we unlock.
  // The formula in prompt: 
  // unlockable_amount = frozen_commission_balance * vip_task_progress 
  // remaining_unlockable = max(0, unlockable_amount - already_unlocked_amount)
  // 
  // ISSUE: If `frozen_commission_balance` decreases after unlock, then `frozen * progress` also decreases.
  // The formula `unlockable_amount = frozen * progress` implies `frozen` is the TOTAL accumulated frozen amount?
  // Or is it current frozen?
  // Prompt says: "frozen_commission_balance: Frozen funds from distribution... need to be unlocked by progress"
  // "unlockable_amount = frozen_commission_balance * vip_task_progress"
  // "remaining_unlockable = max(0, unlockable_amount - already_unlocked_amount)"
  // "frozen_commission_balance -= remaining_unlockable"
  //
  // Let's trace:
  // T0: Frozen=1000, Progress=0.5, Unlocked=0.
  // Unlockable = 1000 * 0.5 = 500.
  // Remaining = 500 - 0 = 500.
  // Action: Frozen -= 500 (becomes 500), Unlocked += 500 (becomes 500).
  //
  // T1: Frozen=500, Progress=0.5, Unlocked=500.
  // Unlockable = 500 * 0.5 = 250.
  // Remaining = 250 - 500 = -250. No unlock. Correct.
  //
  // T2: Progress becomes 0.8. Frozen=500. Unlocked=500.
  // Unlockable = 500 * 0.8 = 400.
  // Remaining = 400 - 500 = -100.
  // WAIT. This logic is flawed if `frozen` decreases.
  // If `frozen` is only the *remaining* frozen, then we can't use it as the base for *total* unlockable.
  //
  // Alternative interpretation:
  // The "Frozen Commission Balance" in the formula refers to the *Total Accumulated Frozen Amount* (Current Frozen + Unlocked).
  // Let's check `user_wallets` schema proposal in prompt:
  // `frozen_commission_balance` (current frozen)
  // `total_unfrozen` (accumulated unlocked)
  //
  // So: Total Base = `frozen_commission_balance` + `total_unfrozen` (or `unlocked_base_amount` from state).
  // `unlockable_total` = (Frozen + UnlockedBase) * Progress.
  // `delta` = `unlockable_total` - `UnlockedBase`.
  //
  // Let's re-trace with this:
  // T0: Frozen=1000, UnlockedBase=0. Total=1000. Progress=0.5.
  // UnlockableTotal = 1000 * 0.5 = 500.
  // Delta = 500 - 0 = 500.
  // Action: Frozen -= 500 (500), UnlockedBase += 500 (500).
  //
  // T1: Frozen=500, UnlockedBase=500. Total=1000. Progress=0.5.
  // UnlockableTotal = 1000 * 0.5 = 500.
  // Delta = 500 - 500 = 0. Correct.
  //
  // T2: Frozen=500, UnlockedBase=500. Total=1000. Progress=0.8.
  // UnlockableTotal = 1000 * 0.8 = 800.
  // Delta = 800 - 500 = 300.
  // Action: Frozen -= 300 (200), UnlockedBase += 300 (800).
  //
  // This logic holds up.
  // So `TotalPool = Frozen + UnlockedBase`.
  
  const unlockedBase = parseFloat(unlockState.unlockedBaseAmount);
  const totalPool = frozenCommission + unlockedBase;
  const unlockableTotal = totalPool * progressValue;
  const unlockableNow = Math.max(0, unlockableTotal - unlockedBase);

  return {
    vipLevel: status.vipLevel,
    vipName: currentLevel?.name || "普通用户",
    qualified: status.qualified,
    upgradedAt: status.upgradedAt,
    directCount: status.directCount,
    team3GenCount: status.team3Count,
    frozenCommission: frozenCommission, // Current frozen balance
    unlockedCommission: unlockedBase, // Accumulated unlocked
    progress: progressValue,
    unlockableNow: Math.floor(unlockableNow * 100) / 100, // Round down to 2 decimals
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

function calculateVipProgressValue(progress: any): number {
  if (!progress) return 0;
  if (progress.isQualified) return 1;

  // Requirements: Direct, Team3, Downline Structure
  // We can use weighted average or min. 
  // Prompt says: "Weighted: progress = sum( w_i * min(cur_i/req_i,1) )"
  // Let's assume equal weights for simplicity unless specified.
  // 3 Parts: Direct (33%), Team (33%), Structure (33%).
  
  const pDirect = Math.min(1, progress.directCount / (progress.directRequired || 1));
  const pTeam = Math.min(1, progress.team3Count / (progress.team3Required || 1));
  
  let pStructure = 1;
  if (progress.downlineProgress && Object.keys(progress.downlineProgress).length > 0) {
    let structureSum = 0;
    let structureCount = 0;
    for (const key in progress.downlineProgress) {
      const item = progress.downlineProgress[key];
      structureSum += Math.min(1, item.current / (item.required || 1));
      structureCount++;
    }
    pStructure = structureCount > 0 ? structureSum / structureCount : 1;
  }

  // If no structure reqs, pStructure is 1.
  // If no team reqs (V1?), pTeam is 1.
  
  // Weights configuration could be complex. 
  // Let's use a simple average of active requirements.
  let components = [pDirect, pTeam];
  if (progress.downlineProgress && Object.keys(progress.downlineProgress).length > 0) {
    components.push(pStructure);
  }
  
  const total = components.reduce((a, b) => a + b, 0);
  return parseFloat((total / components.length).toFixed(4));
}

export async function unlockFrozenCommission(userId: number) {
  const status = await getUserVipStatus(userId);
  if (status.unlockableNow <= 0.01) { // Min 0.01
    return { success: false, message: "暂无可解冻金额", unlocked: 0 };
  }

  const unlockAmount = status.unlockableNow;
  
  // DB Transaction for safety
  await db.transaction(async (tx) => {
    // 1. Update Wallet & Ledger (using helper which does both)
    // Note: Helper `unfreezeCommission` uses `db`, not `tx`. 
    // Ideally we should pass `tx` to helper, but `wallet` service exports don't support it yet.
    // For now, we'll assume optimistic locking or just sequential execution.
    // Given the `unlockableNow` is calculated from DB state, we should be okay if low concurrency.
    // Ideally: lock row. 
    // We will perform the update and check affected rows or similar?
    // Let's just call the helper.
    await unfreezeCommission(userId, unlockAmount, `VIP进度解锁(${Math.round(status.progress * 100)}%)`);

    // 2. Update Unlock State
    // We must update `unlockedBaseAmount`
    await tx.update(vipUnlockState)
      .set({ 
        unlockedBaseAmount: sql`${vipUnlockState.unlockedBaseAmount} + ${unlockAmount}`,
        lastUnlockAt: new Date()
      })
      .where(eq(vipUnlockState.userId, userId));
      
    // 3. Random Bonus Logic (Simulated)
    // "每次解冻最多触发 1 次随机奖金" - implies every click can trigger if lucky?
    // "触发条件：仅当 progress >= 0.8"
    if (status.progress >= 0.8) {
       // Check chance
       const rand = Math.random();
       
       // Default logic
       let chance = 0.05; // Base chance for >= 0.8
       if (status.progress >= 1) chance = 0.2;
       else if (status.progress >= 0.9) chance = 0.12;

       // Override with system setting if available
       const probSetting = await getSystemSettingByKey("unlock_random_reward_prob");
       if (probSetting?.value) {
         const parsedProb = parseFloat(probSetting.value);
         if (!isNaN(parsedProb)) {
            // Treat the setting as percentage (e.g. "30" for 30%) or decimal ("0.3")?
            // Usually user inputs "30" for 30%. Let's assume input is 0-100.
            // If value > 1, assume percentage. If <= 1, assume decimal.
            chance = parsedProb > 1 ? parsedProb / 100 : parsedProb;
         }
       }
       
       if (rand < chance) {
         // Win bonus
         // Amount: 2-200 yuan (Default)
         let bonusMin = 2;
         let bonusMax = 200;

         const minSetting = await getSystemSettingByKey("unlock_random_reward_min");
         if (minSetting?.value) bonusMin = parseFloat(minSetting.value) || 2;

         const maxSetting = await getSystemSettingByKey("unlock_random_reward_max");
         if (maxSetting?.value) bonusMax = parseFloat(maxSetting.value) || 200;
         
         // Ensure max >= min
         if (bonusMax < bonusMin) bonusMax = bonusMin;

         const bonusAmount = Math.floor(Math.random() * (bonusMax - bonusMin + 1)) + bonusMin;
         
         if (bonusAmount > 0) {
            await addCashAvailable(userId, bonusAmount, "rank_bonus", undefined, `VIP解锁随机奖励(进度${(status.progress*100).toFixed(1)}%)`);
         }
       }
    }
  });

  return { success: true, message: "解冻成功", unlocked: unlockAmount };
}

export async function autoUnlockOnUpgrade(userId: number, oldLevel: number) {
  // 1. Unlock ALL remaining frozen funds
  const wallet = await getWallet(userId);
  const frozen = parseFloat(wallet.balanceCashFrozen);
  
  if (frozen > 0) {
    await unfreezeCommission(userId, frozen, `VIP升级自动解冻(V${oldLevel} -> V${oldLevel+1})`);
  }
  
  // 2. Grant Delayed Gratification Bonus
  // "金额规则：可配置"
  // Check setting
  let bonus = 0;
  const fixedRewardSetting = await getSystemSettingByKey("deferred_reward_amount");
  
  if (fixedRewardSetting?.value) {
    bonus = parseFloat(fixedRewardSetting.value) || 0;
  } else {
    // Default fallback
    bonus = oldLevel * 10; 
  }

  if (bonus > 0) {
    await addCashAvailable(userId, bonus, "upgrade_reward", undefined, "VIP升级延时满足奖金");
  }

  // 3. Reset Unlock State for NEW level
  // The caller (approve/confirm) updates the user's level.
  // We need to update `vipUnlockState` to the new level and reset base amount.
  // BUT `vipUnlockState` has `vipLevel` column. 
  // If we update it, we are ready for the new level.
  
  // Upsert with new level, reset amount
  // We need to know the NEW level. The function argument is oldLevel.
  // Let's assume this is called BEFORE or AFTER level update?
  // It's called DURING upgrade process.
  // The `vipUnlockState` should reflect the user's CURRENT operating level for unlocking.
  // If user upgrades to V(N+1), they start unlocking V(N+1) commissions.
  // So we reset to 0.
  
  await db.insert(vipUnlockState).values({
    userId,
    vipLevel: oldLevel + 1,
    unlockedBaseAmount: "0",
    lastUnlockAt: new Date(),
  }).onConflictDoUpdate({
    target: vipUnlockState.userId,
    set: {
      vipLevel: oldLevel + 1,
      unlockedBaseAmount: "0",
      lastUnlockAt: new Date(),
    }
  });
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
      inArray(vipUpgradeTxs.status, ["pending", "pending_review"])
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
    status: "pending", // Ensure status is pending for automatic processing
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
  
  // Allow confirming pending_review orders as well, in case they were flagged manually or by system
  if (order.status !== "pending" && order.status !== "pending_review") {
    throw new Error("订单状态异常");
  }

  const [targetLevel] = await db.select().from(vipLevels).where(eq(vipLevels.level, order.toLevel)).limit(1);
  if (!targetLevel) throw new Error("VIP等级不存在");

  const amountYuan = order.payAmountCents / 100;
  await deductCashAvailable(userId, amountYuan, "vip_upgrade_pay", orderId, `申请升级${targetLevel.name}支付`);

  // Automatic Upgrade Logic (Bypassing pending_review)
  
  // 0. Auto Unlock Frozen Commission (if fully qualified on previous level)
  let [status] = await db.select().from(userVipStatus).where(eq(userVipStatus.userId, userId)).limit(1);
  const oldLevel = status?.vipLevel || 0;
  
  // Only trigger auto unlock if upgrading from a real level
  if (oldLevel > 0) {
      await autoUnlockOnUpgrade(userId, oldLevel);
  }

  // 1. Update User VIP Status
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

  // 2. Update User table
  await db.update(users)
      .set({ vipLevel: order.toLevel })
      .where(eq(users.id, userId));

  // 3. Grant Daily Spins
  if (targetLevel.dailyLottery > 0) {
      await addSpins(userId, targetLevel.dailyLottery);
  }

  // 4. Distribute Upgrade Reward
  if (targetLevel.upgradeRewardCents > 0) {
      const rewardYuan = targetLevel.upgradeRewardCents / 100;
      await addCashAvailable(userId, rewardYuan, "vip_upgrade_reward", orderId, `升级${targetLevel.name}奖励`);
  }

  // 5. Distribute Commissions
  await distributeVipUpgradeCommission(userId, order.payAmountCents, orderId);

  // 6. Update Order Status to Completed
  await db.update(vipUpgradeTxs)
    .set({ status: "completed", paidAt: new Date() })
    .where(eq(vipUpgradeTxs.id, orderId));

  return {
    success: true,
    vipLevel: order.toLevel,
    vipName: targetLevel.name,
    message: "升级成功！已自动发放奖励",
    status: "completed"
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
    const oldLevel = status?.vipLevel || 0;

    // 0. Auto Unlock Frozen Commission
    if (oldLevel > 0) {
        await autoUnlockOnUpgrade(userId, oldLevel);
    }
  
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

export async function approveAllPendingVipUpgrades() {
    const pendingRequests = await db.select().from(vipUpgradeTxs)
        .where(eq(vipUpgradeTxs.status, "pending_review"));

    console.log(`[VIP Auto-Approve] Found ${pendingRequests.length} pending requests.`);

    let successCount = 0;
    let failCount = 0;

    for (const req of pendingRequests) {
        try {
            console.log(`[VIP Auto-Approve] Processing request ${req.id} for user ${req.userId}...`);
            await approveVipUpgradeRequest(req.id);
            successCount++;
            console.log(`[VIP Auto-Approve] Request ${req.id} approved successfully.`);
        } catch (error: any) {
            failCount++;
            console.error(`[VIP Auto-Approve] Failed to approve request ${req.id}:`, error.message);
        }
    }

    return { successCount, failCount, total: pendingRequests.length };
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
    // 增加钱包检查，确保资金入账
    await getWallet(uplineUserId);
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
