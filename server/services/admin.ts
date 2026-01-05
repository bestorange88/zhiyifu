import { db } from "../db";
import { 
  admins, users, wallets, withdraws, orders, agentApplications, userRanks,
  systemSettings, featureFlags, deposits, adminActions, commissionRecords,
  serviceChatSessions, serviceChatMessages, wheelPrizes, wheelSpins, vipPlans, ledger
} from "@shared/schema";
import { eq, desc, sql, count, and, gt, gte, sum } from "drizzle-orm";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.SESSION_SECRET || "admin-secret-key-2024";
const ADMIN_TOKEN_EXPIRY = "7d";

export async function initDefaultAdmin() {
  const [existing] = await db.select().from(admins).where(eq(admins.username, "admin")).limit(1);
  
  if (!existing) {
    const passwordHash = await bcrypt.hash("Aa112211", 10);
    await db.insert(admins).values({
      username: "admin",
      passwordHash,
      role: "superadmin",
    });
    console.log("Default admin created: admin/Aa112211");
  }
}

export async function adminLogin(username: string, password: string) {
  const [admin] = await db.select().from(admins).where(eq(admins.username, username)).limit(1);
  
  if (!admin) {
    throw new Error("账号不存在");
  }
  
  if (admin.status !== "active") {
    throw new Error("账号已被禁用");
  }
  
  const valid = await bcrypt.compare(password, admin.passwordHash);
  if (!valid) {
    throw new Error("密码错误");
  }
  
  await db.update(admins)
    .set({ lastLoginAt: new Date() })
    .where(eq(admins.id, admin.id));
  
  const token = jwt.sign(
    { adminId: admin.id, role: admin.role },
    JWT_SECRET,
    { expiresIn: ADMIN_TOKEN_EXPIRY }
  );
  
  return {
    token,
    admin: {
      id: admin.id,
      username: admin.username,
      role: admin.role,
    },
  };
}

export function verifyAdminToken(token: string) {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { adminId: number; role: string };
    return decoded;
  } catch {
    throw new Error("无效的管理员令牌");
  }
}

export async function getDashboardStats() {
  const [userCount] = await db.select({ count: count() }).from(users);
  const [vipCount] = await db.select({ count: count() }).from(users).where(gt(users.vipLevel, 0));
  const [vip1Count] = await db.select({ count: count() }).from(users).where(eq(users.vipLevel, 1));
  const [vip2Count] = await db.select({ count: count() }).from(users).where(eq(users.vipLevel, 2));
  const [vip3Count] = await db.select({ count: count() }).from(users).where(eq(users.vipLevel, 3));
  const [withdrawPending] = await db.select({ count: count() }).from(withdraws).where(eq(withdraws.status, "applied"));
  const [agentPending] = await db.select({ count: count() }).from(agentApplications).where(eq(agentApplications.status, "pending"));
  const [orderCount] = await db.select({ count: count() }).from(orders);
  
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  
  const [todayUsersCount] = await db.select({ count: count() }).from(users).where(gte(users.createdAt, todayStart));
  const [todayOrdersCount] = await db.select({ count: count() }).from(orders).where(gte(orders.createdAt, todayStart));
  const [todayWithdrawsCount] = await db.select({ count: count() }).from(withdraws).where(gte(withdraws.createdAt, todayStart));
  
  const totalRevenueResult = await db.select({ total: sum(orders.amount) }).from(orders).where(eq(orders.status, "completed"));
  const todayRevenueResult = await db.select({ total: sum(orders.amount) }).from(orders).where(and(eq(orders.status, "completed"), gte(orders.createdAt, todayStart)));
  
  const recentUsers = await db.select().from(users).orderBy(desc(users.createdAt)).limit(5);
  const recentWithdraws = await db.select().from(withdraws).orderBy(desc(withdraws.createdAt)).limit(5);
  
  return {
    totalUsers: userCount?.count || 0,
    vipUsers: vipCount?.count || 0,
    vip1Count: vip1Count?.count || 0,
    vip2Count: vip2Count?.count || 0,
    vip3Count: vip3Count?.count || 0,
    pendingWithdraws: withdrawPending?.count || 0,
    pendingAgentApps: agentPending?.count || 0,
    totalOrders: orderCount?.count || 0,
    totalRevenue: totalRevenueResult[0]?.total || 0,
    todayUsers: todayUsersCount?.count || 0,
    todayOrders: todayOrdersCount?.count || 0,
    todayRevenue: todayRevenueResult[0]?.total || 0,
    todayWithdraws: todayWithdrawsCount?.count || 0,
    recentUsers,
    recentWithdraws,
  };
}

export async function getUserList(page = 1, limit = 20) {
  const offset = (page - 1) * limit;
  
  const usersList = await db.select({
    id: users.id,
    phone: users.phone,
    inviteCode: users.inviteCode,
    inviterId: users.inviterId,
    vipLevel: users.vipLevel,
    vipExpireAt: users.vipExpireAt,
    status: users.status,
    createdAt: users.createdAt,
  }).from(users).orderBy(desc(users.createdAt)).limit(limit).offset(offset);
  
  const [total] = await db.select({ count: count() }).from(users);
  
  const usersWithWallet = await Promise.all(
    usersList.map(async (user) => {
      const [wallet] = await db.select().from(wallets).where(eq(wallets.userId, user.id)).limit(1);
      const [rank] = await db.select().from(userRanks).where(eq(userRanks.userId, user.id)).limit(1);
      return {
        ...user,
        wallet: wallet || null,
        rank: rank || null,
      };
    })
  );
  
  return {
    users: usersWithWallet,
    total: total?.count || 0,
    page,
    limit,
  };
}

export async function getUserDetail(userId: number) {
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user) {
    throw new Error("用户不存在");
  }
  
  const [wallet] = await db.select().from(wallets).where(eq(wallets.userId, userId)).limit(1);
  const [rank] = await db.select().from(userRanks).where(eq(userRanks.userId, userId)).limit(1);
  
  let invitedBy = null;
  if (user.inviterId) {
    const [inviter] = await db.select({ phone: users.phone }).from(users).where(eq(users.id, user.inviterId)).limit(1);
    invitedBy = inviter?.phone || null;
  }
  
  const [referralCount] = await db.select({ count: count() }).from(users).where(eq(users.inviterId, userId));
  
  return {
    id: user.id,
    phone: user.phone,
    inviteCode: user.inviteCode,
    vipLevel: user.vipLevel,
    vipExpireAt: user.vipExpireAt,
    status: user.status,
    createdAt: user.createdAt,
    wallet: wallet || null,
    rank: rank || null,
    invitedBy,
    referralCount: referralCount?.count || 0,
  };
}

export async function getWithdrawList(status?: string, page = 1, limit = 20) {
  const offset = (page - 1) * limit;
  
  let query = db.select().from(withdraws);
  let countQuery = db.select({ count: count() }).from(withdraws);
  
  if (status) {
    query = query.where(eq(withdraws.status, status)) as any;
    countQuery = countQuery.where(eq(withdraws.status, status)) as any;
  }
  
  const list = await query.orderBy(desc(withdraws.createdAt)).limit(limit).offset(offset);
  const [total] = await countQuery;
  
  const listWithUser = await Promise.all(
    list.map(async (w) => {
      const [user] = await db.select({ phone: users.phone }).from(users).where(eq(users.id, w.userId)).limit(1);
      return { ...w, userPhone: user?.phone || "未知" };
    })
  );
  
  return {
    withdraws: listWithUser,
    total: total?.count || 0,
    page,
    limit,
  };
}

export async function getAgentApplicationList(status?: string, page = 1, limit = 20) {
  const offset = (page - 1) * limit;
  
  let query = db.select().from(agentApplications);
  if (status) {
    query = query.where(eq(agentApplications.status, status)) as any;
  }
  
  const list = await query.orderBy(desc(agentApplications.createdAt)).limit(limit).offset(offset);
  
  const listWithUser = await Promise.all(
    list.map(async (app) => {
      const [user] = await db.select({ phone: users.phone, inviteCode: users.inviteCode }).from(users).where(eq(users.id, app.userId)).limit(1);
      return { ...app, userPhone: user?.phone || "未知", userInviteCode: user?.inviteCode || "" };
    })
  );
  
  return {
    applications: listWithUser,
    page,
    limit,
  };
}

export async function reviewAgentApplication(appId: number, approved: boolean, reviewNote?: string) {
  const [app] = await db.select().from(agentApplications).where(eq(agentApplications.id, appId)).limit(1);
  
  if (!app) throw new Error("申请不存在");
  if (app.status !== "pending") throw new Error("申请已处理");
  
  await db.update(agentApplications)
    .set({
      status: approved ? "approved" : "rejected",
      reviewNote,
      reviewedAt: new Date(),
    })
    .where(eq(agentApplications.id, appId));
  
  return { success: true };
}

export async function updateUserStatus(userId: number, status: string) {
  await db.update(users)
    .set({ status })
    .where(eq(users.id, userId));
  return { success: true };
}

export async function getOrderList(status?: string, page = 1, limit = 20) {
  const offset = (page - 1) * limit;
  
  let query = db.select().from(orders);
  let countQuery = db.select({ count: count() }).from(orders);
  
  if (status) {
    query = query.where(eq(orders.status, status)) as any;
    countQuery = countQuery.where(eq(orders.status, status)) as any;
  }
  
  const list = await query.orderBy(desc(orders.createdAt)).limit(limit).offset(offset);
  const [total] = await countQuery;
  
  const listWithUser = await Promise.all(
    list.map(async (o) => {
      const [user] = await db.select({ phone: users.phone }).from(users).where(eq(users.id, o.userId)).limit(1);
      return { ...o, userPhone: user?.phone || "未知" };
    })
  );
  
  return {
    orders: listWithUser,
    total: total?.count || 0,
    page,
    limit,
  };
}

export async function getSystemStats() {
  const [userCount] = await db.select({ count: count() }).from(users);
  const [orderCount] = await db.select({ count: count() }).from(orders);
  const [withdrawPending] = await db.select({ count: count() }).from(withdraws).where(eq(withdraws.status, "applied"));
  const [agentPending] = await db.select({ count: count() }).from(agentApplications).where(eq(agentApplications.status, "pending"));
  
  const [vip1Count] = await db.select({ count: count() }).from(users).where(eq(users.vipLevel, 1));
  const [vip2Count] = await db.select({ count: count() }).from(users).where(eq(users.vipLevel, 2));
  const [vip3Count] = await db.select({ count: count() }).from(users).where(eq(users.vipLevel, 3));
  
  const completedOrders = await db.select({ amount: orders.amount }).from(orders).where(eq(orders.status, "completed"));
  const totalRevenue = completedOrders.reduce((sum, o) => sum + parseFloat(o.amount), 0);
  
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  
  const [todayUsers] = await db.select({ count: count() }).from(users).where(sql`${users.createdAt} >= ${todayStart}`);
  const [todayOrders] = await db.select({ count: count() }).from(orders).where(sql`${orders.createdAt} >= ${todayStart}`);
  const [todayWithdraws] = await db.select({ count: count() }).from(withdraws).where(sql`${withdraws.createdAt} >= ${todayStart}`);
  
  const todayCompletedOrders = await db.select({ amount: orders.amount }).from(orders)
    .where(sql`${orders.createdAt} >= ${todayStart} AND ${orders.status} = 'completed'`);
  const todayRevenue = todayCompletedOrders.reduce((sum, o) => sum + parseFloat(o.amount), 0);
  
  return {
    totalUsers: userCount?.count || 0,
    vipUsers: (vip1Count?.count || 0) + (vip2Count?.count || 0) + (vip3Count?.count || 0),
    totalOrders: orderCount?.count || 0,
    totalRevenue: totalRevenue.toFixed(2),
    pendingWithdraws: withdrawPending?.count || 0,
    pendingAgents: agentPending?.count || 0,
    vip1Count: vip1Count?.count || 0,
    vip2Count: vip2Count?.count || 0,
    vip3Count: vip3Count?.count || 0,
    todayUsers: todayUsers?.count || 0,
    todayOrders: todayOrders?.count || 0,
    todayRevenue: todayRevenue.toFixed(2),
    todayWithdraws: todayWithdraws?.count || 0,
  };
}

// ============ SYSTEM SETTINGS ============
export async function getSystemSettings() {
  const settings = await db.select().from(systemSettings);
  return settings;
}

export async function setSystemSetting(key: string, value: string) {
  const [existing] = await db.select().from(systemSettings).where(eq(systemSettings.key, key)).limit(1);
  
  if (existing) {
    await db.update(systemSettings)
      .set({ value, updatedAt: new Date() })
      .where(eq(systemSettings.key, key));
  } else {
    await db.insert(systemSettings).values({ key, value });
  }
  
  return { success: true, key, value };
}

// ============ DEPOSITS ============
export async function getDepositList(page = 1, limit = 50) {
  const offset = (page - 1) * limit;
  const list = await db.select().from(deposits).orderBy(desc(deposits.createdAt)).limit(limit).offset(offset);
  const [total] = await db.select({ count: count() }).from(deposits);
  
  const listWithUser = await Promise.all(
    list.map(async (d) => {
      const [user] = await db.select({ phone: users.phone }).from(users).where(eq(users.id, d.userId)).limit(1);
      return { ...d, userPhone: user?.phone || "未知" };
    })
  );
  
  return { deposits: listWithUser, total: total?.count || 0, page, limit };
}

export async function reviewDeposit(depositId: number, approved: boolean) {
  const [deposit] = await db.select().from(deposits).where(eq(deposits.id, depositId)).limit(1);
  
  if (!deposit) throw new Error("充值记录不存在");
  if (deposit.status !== "pending") throw new Error("充值已处理");
  
  await db.update(deposits)
    .set({
      status: approved ? "approved" : "rejected",
      reviewedAt: new Date(),
    })
    .where(eq(deposits.id, depositId));
  
  if (approved) {
    const [wallet] = await db.select().from(wallets).where(eq(wallets.userId, deposit.userId)).limit(1);
    if (wallet) {
      await db.update(wallets)
        .set({ balanceCashAvailable: (parseFloat(wallet.balanceCashAvailable) + parseFloat(deposit.amount)).toFixed(2) })
        .where(eq(wallets.userId, deposit.userId));
      
      await db.insert(ledger).values({
        userId: deposit.userId,
        type: "income",
        amount: deposit.amount,
        currency: "cny",
        description: "充值到账",
      });
    }
  }
  
  return { success: true };
}

// ============ LOTTERY ============
export async function getLotteryPrizes() {
  const prizes = await db.select().from(wheelPrizes).orderBy(wheelPrizes.displayOrder);
  return prizes;
}

export async function updateLotteryPrize(prizeId: number, data: any) {
  const updateData: any = {};
  if (data.name !== undefined) updateData.name = data.name;
  if (data.type !== undefined) updateData.type = data.type;
  if (data.amount !== undefined) updateData.amount = data.amount;
  if (data.probability !== undefined) updateData.probability = data.probability;
  if (data.stock !== undefined) updateData.stock = data.stock;
  if (data.displayOrder !== undefined) updateData.displayOrder = data.displayOrder;
  if (data.isActive !== undefined) updateData.isActive = data.isActive;
  
  await db.update(wheelPrizes)
    .set(updateData)
    .where(eq(wheelPrizes.id, prizeId));
  
  return { success: true };
}

export async function getLotterySpins() {
  const spins = await db.select().from(wheelSpins).orderBy(desc(wheelSpins.createdAt)).limit(100);
  
  const spinsWithUser = await Promise.all(
    spins.map(async (s) => {
      const [user] = await db.select({ phone: users.phone }).from(users).where(eq(users.id, s.userId)).limit(1);
      return { ...s, userPhone: user?.phone || "未知" };
    })
  );
  
  return spinsWithUser;
}

// ============ DISTRIBUTION ============
export async function getDistributionUsers(page = 1, limit = 50) {
  const offset = (page - 1) * limit;
  const usersWithRank = await db.select({
    id: users.id,
    phone: users.phone,
    inviteCode: users.inviteCode,
    createdAt: users.createdAt,
  }).from(users).orderBy(desc(users.createdAt)).limit(limit).offset(offset);
  
  const [total] = await db.select({ count: count() }).from(users);
  
  const result = await Promise.all(
    usersWithRank.map(async (u) => {
      const [rank] = await db.select().from(userRanks).where(eq(userRanks.userId, u.id)).limit(1);
      const [referralCount] = await db.select({ count: count() }).from(users).where(eq(users.inviterId, u.id));
      return {
        ...u,
        rankLevel: rank?.currentRank || 0,
        directCount: referralCount?.count || 0,
      };
    })
  );
  
  return { users: result, total: total?.count || 0, page, limit };
}

export async function getReferralRecords() {
  const records = await db.select({
    id: users.id,
    phone: users.phone,
    inviterId: users.inviterId,
    createdAt: users.createdAt,
  }).from(users).where(sql`${users.inviterId} IS NOT NULL`).orderBy(desc(users.createdAt)).limit(100);
  
  const result = await Promise.all(
    records.map(async (r) => {
      const [inviter] = await db.select({ phone: users.phone }).from(users).where(eq(users.id, r.inviterId!)).limit(1);
      return {
        ...r,
        inviterPhone: inviter?.phone || "未知",
      };
    })
  );
  
  return result;
}

// ============ COMMISSIONS ============
export async function getCommissionRecords(page = 1, limit = 50) {
  const offset = (page - 1) * limit;
  const records = await db.select().from(commissionRecords).orderBy(desc(commissionRecords.createdAt)).limit(limit).offset(offset);
  const [total] = await db.select({ count: count() }).from(commissionRecords);
  
  const result = await Promise.all(
    records.map(async (r) => {
      const [user] = await db.select({ phone: users.phone }).from(users).where(eq(users.id, r.userId)).limit(1);
      const [source] = r.fromUserId 
        ? await db.select({ phone: users.phone }).from(users).where(eq(users.id, r.fromUserId)).limit(1)
        : [null];
      return {
        ...r,
        userPhone: user?.phone || "未知",
        sourcePhone: source?.phone || "-",
      };
    })
  );
  
  return { commissions: result, total: total?.count || 0, page, limit };
}

// ============ VIP PLANS ============
export async function getVipPlans() {
  const plans = await db.select().from(vipPlans).orderBy(vipPlans.level);
  return plans;
}

export async function updateVipPlan(planId: number, data: any) {
  const updateData: any = {};
  if (data.name !== undefined) updateData.name = data.name;
  if (data.price !== undefined) updateData.price = data.price;
  if (data.dailyExtraSpins !== undefined) updateData.dailyExtraSpins = data.dailyExtraSpins;
  if (data.withdrawMinAmount !== undefined) updateData.withdrawMinAmount = data.withdrawMinAmount;
  if (data.withdrawSpeed !== undefined) updateData.withdrawSpeed = data.withdrawSpeed;
  if (data.winMultiplier !== undefined) updateData.winMultiplier = data.winMultiplier;
  
  await db.update(vipPlans)
    .set(updateData)
    .where(eq(vipPlans.id, planId));
  
  return { success: true };
}

// ============ FEATURE FLAGS ============
export async function getFeatureFlags() {
  const flags = await db.select().from(featureFlags);
  return flags;
}

export async function setFeatureFlag(key: string, enabled: boolean) {
  const [existing] = await db.select().from(featureFlags).where(eq(featureFlags.key, key)).limit(1);
  
  if (existing) {
    await db.update(featureFlags)
      .set({ enabled })
      .where(eq(featureFlags.key, key));
  } else {
    await db.insert(featureFlags).values({ key, name: key, enabled });
  }
  
  return { success: true, key, enabled };
}

// ============ CUSTOMER SERVICE ============
export async function getServiceSessions() {
  const sessions = await db.select().from(serviceChatSessions).orderBy(desc(serviceChatSessions.createdAt));
  
  const result = await Promise.all(
    sessions.map(async (s) => {
      const [user] = await db.select({ phone: users.phone }).from(users).where(eq(users.id, s.userId)).limit(1);
      const [msgCount] = await db.select({ count: count() }).from(serviceChatMessages).where(eq(serviceChatMessages.sessionId, s.id));
      return {
        ...s,
        userPhone: user?.phone || "未知",
        messageCount: msgCount?.count || 0,
      };
    })
  );
  
  return result;
}

export async function getServiceMessages(sessionId: number) {
  const messages = await db.select().from(serviceChatMessages)
    .where(eq(serviceChatMessages.sessionId, sessionId))
    .orderBy(serviceChatMessages.createdAt);
  return messages;
}

export async function sendServiceMessage(sessionId: number, adminId: number, content: string) {
  const [message] = await db.insert(serviceChatMessages)
    .values({
      sessionId,
      senderType: "admin",
      senderId: adminId,
      content,
    })
    .returning();
  
    
  return message;
}

// ============ USER BALANCE ADJUSTMENT ============
export async function adjustUserBalance(
  adminId: number,
  userId: number,
  amount: number,
  currency: string,
  reason: string
) {
  const [wallet] = await db.select().from(wallets).where(eq(wallets.userId, userId)).limit(1);
  
  if (!wallet) throw new Error("用户钱包不存在");
  
  const field = currency === "cny" ? "balanceCashAvailable" : "balancePoints";
  const currentValue = currency === "cny" ? parseFloat(wallet.balanceCashAvailable) : wallet.balancePoints;
  const newValue = currentValue + amount;
  
  if (newValue < 0) throw new Error("余额不能为负数");
  
  await db.update(wallets)
    .set({ [field]: currency === "cny" ? newValue.toFixed(2) : newValue })
    .where(eq(wallets.userId, userId));
  
  await db.insert(ledger).values({
    userId,
    type: amount > 0 ? "income" : "expense",
    amount: Math.abs(amount).toString(),
    currency,
    description: `管理员调整: ${reason}`,
  });
  
  await db.insert(adminActions).values({
    adminId,
    userId,
    action: "balance_adjustment",
    amount: amount.toString(),
    currency,
    reason,
  });
  
  return { success: true, newBalance: newValue };
}
