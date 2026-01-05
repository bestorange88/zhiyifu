import { db } from "../db";
import { admins, users, wallets, withdraws, orders, agentApplications, userRanks } from "@shared/schema";
import { eq, desc, sql, count } from "drizzle-orm";
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
  const [withdrawPending] = await db.select({ count: count() }).from(withdraws).where(eq(withdraws.status, "applied"));
  const [agentPending] = await db.select({ count: count() }).from(agentApplications).where(eq(agentApplications.status, "pending"));
  const [orderCount] = await db.select({ count: count() }).from(orders);
  
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  
  const recentUsers = await db.select().from(users).orderBy(desc(users.createdAt)).limit(5);
  const recentWithdraws = await db.select().from(withdraws).orderBy(desc(withdraws.createdAt)).limit(5);
  
  return {
    totalUsers: userCount?.count || 0,
    pendingWithdraws: withdrawPending?.count || 0,
    pendingAgentApps: agentPending?.count || 0,
    totalOrders: orderCount?.count || 0,
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
