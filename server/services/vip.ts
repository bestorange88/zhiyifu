import { db } from "../db";
import { vipPlans, users, orders } from "@shared/schema";
import { eq, sql } from "drizzle-orm";
import { deductCashAvailable, addCashAvailable } from "./wallet";
import { addSpins } from "./spin";

const DEFAULT_VIP_PLANS = [
  { level: 1, name: "VIP1", price: "98", dailyExtraSpins: 2, withdrawMinAmount: "50", withdrawSpeed: "T+1", winMultiplier: "1.2" },
  { level: 2, name: "VIP2", price: "298", dailyExtraSpins: 5, withdrawMinAmount: "30", withdrawSpeed: "T+0", winMultiplier: "1.5" },
  { level: 3, name: "VIP3", price: "598", dailyExtraSpins: 10, withdrawMinAmount: "20", withdrawSpeed: "T+0", winMultiplier: "2.0" },
];

export async function getVipPlans() {
  let plans = await db.select().from(vipPlans).orderBy(vipPlans.level);
  
  if (plans.length === 0) {
    for (const plan of DEFAULT_VIP_PLANS) {
      await db.insert(vipPlans).values(plan);
    }
    plans = await db.select().from(vipPlans).orderBy(vipPlans.level);
  }
  
  return plans;
}

export async function getVipStatus(userId: number) {
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user) throw new Error("用户不存在");

  const plans = await getVipPlans();
  const currentPlan = plans.find(p => p.level === user.vipLevel);

  return {
    level: user.vipLevel,
    name: currentPlan?.name || "普通用户",
    expireAt: user.vipExpireAt,
    dailyExtraSpins: currentPlan?.dailyExtraSpins || 0,
    withdrawMinAmount: currentPlan?.withdrawMinAmount || "100",
    withdrawSpeed: currentPlan?.withdrawSpeed || "T+3",
  };
}

export async function buyVip(userId: number, level: number) {
  const plans = await getVipPlans();
  const plan = plans.find(p => p.level === level);
  
  if (!plan) throw new Error("VIP套餐不存在");

  const [order] = await db.insert(orders).values({
    userId,
    type: "vip",
    amount: plan.price,
    status: "pending",
  }).returning();

  return {
    orderId: order.id,
    amount: plan.price,
    planName: plan.name,
  };
}

export async function confirmVipPurchase(userId: number, orderId: number) {
  const [order] = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
  
  if (!order || order.userId !== userId) throw new Error("订单不存在");
  if (order.status !== "pending") throw new Error("订单状态异常");

  const plans = await getVipPlans();
  const amount = parseFloat(order.amount);
  const plan = plans.find(p => parseFloat(p.price) === amount);
  
  if (!plan) throw new Error("套餐不存在");

  await db.update(orders)
    .set({ status: "paid" })
    .where(eq(orders.id, orderId));

  const expireAt = new Date();
  expireAt.setDate(expireAt.getDate() + 30);

  await db.update(users)
    .set({ 
      vipLevel: plan.level,
      vipExpireAt: expireAt,
    })
    .where(eq(users.id, userId));

  if (plan.dailyExtraSpins && plan.dailyExtraSpins > 0) {
    await addSpins(userId, plan.dailyExtraSpins);
  }

  return {
    success: true,
    vipLevel: plan.level,
    expireAt,
    dailyExtraSpins: plan.dailyExtraSpins || 0,
  };
}

export async function grantDailyVipSpins() {
  const plans = await getVipPlans();
  
  for (const plan of plans) {
    if (plan.dailyExtraSpins && plan.dailyExtraSpins > 0) {
      const vipUsers = await db.select()
        .from(users)
        .where(eq(users.vipLevel, plan.level));
      
      for (const user of vipUsers) {
        if (user.vipExpireAt && new Date(user.vipExpireAt) > new Date()) {
          await addSpins(user.id, plan.dailyExtraSpins);
        }
      }
    }
  }
}
