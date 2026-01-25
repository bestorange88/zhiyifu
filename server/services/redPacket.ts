import { db } from "../db";
import { groupRedPackets, redPacketClaims, groupMembers, wallets, ledger, users } from "@shared/schema";
import { eq, and, desc, sql } from "drizzle-orm";

// 拼手气红包随机金额算法（二倍均值法）
function generateRandomAmount(remainingAmount: number, remainingCount: number): number {
  if (remainingCount === 1) {
    return Math.round(remainingAmount * 100) / 100;
  }
  
  // 二倍均值法：随机金额范围 [0.01, 剩余金额/剩余人数*2]
  const maxAmount = (remainingAmount / remainingCount) * 2;
  const minAmount = 0.01;
  
  // 生成随机金额
  let amount = Math.random() * (maxAmount - minAmount) + minAmount;
  amount = Math.round(amount * 100) / 100;
  
  // 确保剩余金额足够分给剩余人数（每人至少0.01元）
  const minRemaining = (remainingCount - 1) * 0.01;
  if (remainingAmount - amount < minRemaining) {
    amount = remainingAmount - minRemaining;
    amount = Math.round(amount * 100) / 100;
  }
  
  return Math.max(0.01, amount);
}

// 创建红包
export async function createRedPacket(
  groupId: number,
  totalAmount: number,
  totalCount: number,
  greeting: string = "恭喜发财，大吉大利",
  adminId: number
) {
  if (totalAmount < 0.01 * totalCount) {
    throw new Error(`红包金额至少需要 ${(0.01 * totalCount).toFixed(2)} 元`);
  }
  
  // 设置24小时后过期
  const expireAt = new Date();
  expireAt.setHours(expireAt.getHours() + 24);
  
  const [redPacket] = await db.insert(groupRedPackets).values({
    groupId,
    totalAmount: String(totalAmount),
    totalCount,
    remainingAmount: String(totalAmount),
    remainingCount: totalCount,
    greeting,
    status: "active",
    createdBy: adminId,
    expireAt,
  }).returning();
  
  return redPacket;
}

// 批量创建红包
export async function createMultipleRedPackets(
  groupId: number,
  totalAmount: number,
  totalCount: number,
  packetCount: number,
  greeting: string = "恭喜发财，大吉大利",
  adminId: number
) {
  const packets = [];
  for (let i = 0; i < packetCount; i++) {
    const packet = await createRedPacket(groupId, totalAmount, totalCount, greeting, adminId);
    packets.push(packet);
  }
  return packets;
}

// 领取红包
export async function claimRedPacket(redPacketId: number, userId: number) {
  // 检查红包是否存在
  const [redPacket] = await db.select().from(groupRedPackets).where(eq(groupRedPackets.id, redPacketId));
  if (!redPacket) {
    throw new Error("红包不存在");
  }
  
  // 检查红包状态
  if (redPacket.status !== "active") {
    throw new Error("红包已被抢完或已过期");
  }
  
  // 检查是否过期
  if (redPacket.expireAt && new Date() > new Date(redPacket.expireAt)) {
    await db.update(groupRedPackets)
      .set({ status: "expired" })
      .where(eq(groupRedPackets.id, redPacketId));
    throw new Error("红包已过期");
  }
  
  // 检查用户是否是群成员
  const [membership] = await db.select().from(groupMembers)
    .where(and(eq(groupMembers.groupId, redPacket.groupId), eq(groupMembers.userId, userId)));
  if (!membership) {
    throw new Error("您不是该群组成员，无法领取红包");
  }
  
  // 检查是否已领取
  const [existingClaim] = await db.select().from(redPacketClaims)
    .where(and(eq(redPacketClaims.redPacketId, redPacketId), eq(redPacketClaims.userId, userId)));
  if (existingClaim) {
    throw new Error("您已经领取过这个红包了");
  }
  
  // 检查是否还有剩余
  if (redPacket.remainingCount <= 0) {
    await db.update(groupRedPackets)
      .set({ status: "finished" })
      .where(eq(groupRedPackets.id, redPacketId));
    throw new Error("红包已被抢完");
  }
  
  // 计算随机金额
  const remainingAmount = parseFloat(redPacket.remainingAmount as string);
  const remainingCount = redPacket.remainingCount;
  const claimAmount = generateRandomAmount(remainingAmount, remainingCount);
  
  // 创建领取记录
  const [claim] = await db.insert(redPacketClaims).values({
    redPacketId,
    userId,
    amount: String(claimAmount),
    isLuckiest: false,
  }).returning();
  
  // 更新红包剩余金额和份数
  const newRemainingAmount = Math.round((remainingAmount - claimAmount) * 100) / 100;
  const newRemainingCount = remainingCount - 1;
  const newStatus = newRemainingCount === 0 ? "finished" : "active";
  
  await db.update(groupRedPackets)
    .set({
      remainingAmount: String(newRemainingAmount),
      remainingCount: newRemainingCount,
      status: newStatus,
    })
    .where(eq(groupRedPackets.id, redPacketId));
  
  // 如果红包已抢完，计算手气最佳
  if (newRemainingCount === 0) {
    await updateLuckiestClaim(redPacketId);
  }
  
  // 给用户钱包加钱
  await db.update(wallets)
    .set({
      balanceCashAvailable: sql`${wallets.balanceCashAvailable} + ${claimAmount}`,
      updatedAt: new Date(),
    })
    .where(eq(wallets.userId, userId));
  
  // 记录账本
  await db.insert(ledger).values({
    userId,
    type: "red_packet",
    currency: "cash",
    amount: String(claimAmount),
    refId: redPacketId,
    description: "群红包领取",
  });
  
  return {
    ...claim,
    amount: claimAmount,
  };
}

// 更新手气最佳
async function updateLuckiestClaim(redPacketId: number) {
  const claims = await db.select().from(redPacketClaims)
    .where(eq(redPacketClaims.redPacketId, redPacketId))
    .orderBy(desc(redPacketClaims.amount));
  
  if (claims.length > 0) {
    await db.update(redPacketClaims)
      .set({ isLuckiest: true })
      .where(eq(redPacketClaims.id, claims[0].id));
  }
}

// 获取群组红包列表
export async function getGroupRedPackets(groupId: number, limit: number = 100) {
  const packets = await db.select().from(groupRedPackets)
    .where(eq(groupRedPackets.groupId, groupId))
    .orderBy(desc(groupRedPackets.createdAt))
    .limit(limit);
  
  return packets;
}

// 获取红包详情（包含领取记录）
export async function getRedPacketDetail(redPacketId: number) {
  const [redPacket] = await db.select().from(groupRedPackets)
    .where(eq(groupRedPackets.id, redPacketId));
  
  if (!redPacket) {
    return null;
  }
  
  const claims = await db
    .select({
      id: redPacketClaims.id,
      userId: redPacketClaims.userId,
      amount: redPacketClaims.amount,
      isLuckiest: redPacketClaims.isLuckiest,
      claimedAt: redPacketClaims.claimedAt,
      phone: users.phone,
    })
    .from(redPacketClaims)
    .leftJoin(users, eq(redPacketClaims.userId, users.id))
    .where(eq(redPacketClaims.redPacketId, redPacketId))
    .orderBy(desc(redPacketClaims.amount));
  
  return {
    ...redPacket,
    claims,
  };
}

// 检查用户是否已领取红包
export async function hasUserClaimedRedPacket(redPacketId: number, userId: number): Promise<boolean> {
  const [claim] = await db.select().from(redPacketClaims)
    .where(and(eq(redPacketClaims.redPacketId, redPacketId), eq(redPacketClaims.userId, userId)));
  return !!claim;
}

// 获取用户在某个红包的领取记录
export async function getUserRedPacketClaim(redPacketId: number, userId: number) {
  const [claim] = await db.select().from(redPacketClaims)
    .where(and(eq(redPacketClaims.redPacketId, redPacketId), eq(redPacketClaims.userId, userId)));
  return claim;
}

// 管理员获取所有红包列表
export async function getAllRedPackets(page: number = 1, limit: number = 20) {
  const offset = (page - 1) * limit;
  
  const packets = await db.select().from(groupRedPackets)
    .orderBy(desc(groupRedPackets.createdAt))
    .limit(limit)
    .offset(offset);
  
  const [{ count }] = await db.select({ count: sql<number>`count(*)` }).from(groupRedPackets);
  
  return {
    packets,
    total: Number(count),
    page,
    limit,
  };
}
