import { db } from "../db";
import { userDevices, users } from "@shared/schema";
import { eq, and, sql, gte } from "drizzle-orm";

const SAME_DEVICE_REGISTER_LIMIT = 3;
const SAME_IP_REGISTER_24H_LIMIT = 5;

export async function checkRegisterRisk(deviceFingerprint?: string, ip?: string): Promise<{
  allowed: boolean;
  reason?: string;
}> {
  if (deviceFingerprint) {
    const deviceCount = await db.select({ count: sql<number>`count(*)::int` })
      .from(userDevices)
      .where(eq(userDevices.deviceFingerprint, deviceFingerprint));
    
    if ((deviceCount[0]?.count || 0) >= SAME_DEVICE_REGISTER_LIMIT) {
      return {
        allowed: false,
        reason: `同设备注册数量已达上限(${SAME_DEVICE_REGISTER_LIMIT})`,
      };
    }
  }

  if (ip) {
    const yesterday = new Date();
    yesterday.setHours(yesterday.getHours() - 24);
    
    const ipCount = await db.select({ count: sql<number>`count(*)::int` })
      .from(userDevices)
      .where(and(
        eq(userDevices.lastIp, ip),
        gte(userDevices.lastLoginAt, yesterday)
      ));
    
    if ((ipCount[0]?.count || 0) >= SAME_IP_REGISTER_24H_LIMIT) {
      return {
        allowed: false,
        reason: `同IP 24小时内注册数量已达上限(${SAME_IP_REGISTER_24H_LIMIT})`,
      };
    }
  }

  return { allowed: true };
}

export async function recordUserDevice(
  userId: number, 
  deviceFingerprint?: string, 
  ip?: string
) {
  const [existing] = await db.select()
    .from(userDevices)
    .where(eq(userDevices.userId, userId))
    .limit(1);

  if (existing) {
    await db.update(userDevices)
      .set({
        deviceFingerprint: deviceFingerprint || existing.deviceFingerprint,
        lastIp: ip || existing.lastIp,
        lastLoginAt: new Date(),
      })
      .where(eq(userDevices.userId, userId));
  } else {
    await db.insert(userDevices).values({
      userId,
      deviceFingerprint,
      lastIp: ip,
      lastLoginAt: new Date(),
    });
  }
}

export async function checkCycleReferrals(userId: number, inviterId: number): Promise<boolean> {
  if (userId === inviterId) return true;
  
  let currentId = inviterId;
  const visited = new Set<number>();
  
  while (currentId) {
    if (visited.has(currentId)) break;
    visited.add(currentId);
    
    if (currentId === userId) return true;
    
    const [user] = await db.select({ inviterId: users.inviterId })
      .from(users)
      .where(eq(users.id, currentId))
      .limit(1);
    
    if (!user?.inviterId) break;
    currentId = user.inviterId;
  }
  
  return false;
}

export async function isValidReferral(referredUserId: number): Promise<boolean> {
  const [user] = await db.select().from(users).where(eq(users.id, referredUserId)).limit(1);
  if (!user) return false;
  
  if (user.status !== "active") return false;
  
  return true;
}
