import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { db } from "../db";
import { users, wallets, spinBalance, userRanks, chatGroups, groupMembers } from "@shared/schema";
import { eq } from "drizzle-orm";
import { updateUserRankStats } from "./referral";
import { verifyCode } from "./sms";
import { checkRegisterRisk, recordUserDevice, checkCycleReferrals } from "./riskControl";

function getJwtSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error("SESSION_SECRET environment variable is required");
  }
  return secret;
}

function generateInviteCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

const UNIVERSAL_INVITE_CODE = "911522";

export async function registerUser(phone: string, password: string, inviterCode: string, deviceFingerprint?: string, ip?: string) {
  const riskCheck = await checkRegisterRisk(deviceFingerprint, ip);
  if (!riskCheck.allowed) {
    throw new Error(riskCheck.reason || "注册风控限制");
  }

  const existingUser = await db.select().from(users).where(eq(users.phone, phone)).limit(1);
  if (existingUser.length > 0) {
    throw new Error("该手机号已注册");
  }

  let inviterId: number | null = null;
  
  if (inviterCode === UNIVERSAL_INVITE_CODE) {
    inviterId = null;
  } else {
    const inviter = await db.select().from(users).where(eq(users.inviteCode, inviterCode)).limit(1);
    if (inviter.length === 0) {
      throw new Error("邀请码无效");
    }
    if (inviter[0].status !== "active") {
      throw new Error("邀请人账号状态异常");
    }
    inviterId = inviter[0].id;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const newInviteCode = generateInviteCode();

  const [newUser] = await db.insert(users).values({
    phone,
    passwordHash,
    inviteCode: newInviteCode,
    inviterId,
    vipLevel: 0,
    status: "active",
  }).returning();

  await db.insert(wallets).values({
    userId: newUser.id,
    balanceCashAvailable: "0",
    balanceCashFrozen: "0",
    balancePoints: 0,
  });

  await db.insert(spinBalance).values({
    userId: newUser.id,
    availableSpins: 1,
  });

  await db.insert(userRanks).values({
    userId: newUser.id,
    currentRank: 0,
    directCount: 0,
    team3genCount: 0,
  });

  if (inviterId) {
    await updateInviterStats(inviterId);
    
    const [level1] = await db.select({ inviterId: users.inviterId }).from(users).where(eq(users.id, inviterId)).limit(1);
    if (level1?.inviterId) {
      await updateInviterStats(level1.inviterId);
      
      const [level2] = await db.select({ inviterId: users.inviterId }).from(users).where(eq(users.id, level1.inviterId)).limit(1);
      if (level2?.inviterId) {
        await updateInviterStats(level2.inviterId);
      }
    }
  }

  await recordUserDevice(newUser.id, deviceFingerprint, ip);

  await joinSystemGroups(newUser.id);

  const token = jwt.sign({ userId: newUser.id }, getJwtSecret(), { expiresIn: "30d" });

  return {
    user: {
      id: newUser.id,
      phone: newUser.phone,
      inviteCode: newUser.inviteCode,
      vipLevel: newUser.vipLevel,
    },
    token,
  };
}

export async function loginUser(phone: string, password: string, deviceFingerprint?: string, ip?: string) {
  const [user] = await db.select().from(users).where(eq(users.phone, phone)).limit(1);
  if (!user) {
    throw new Error("用户不存在");
  }

  if (user.status !== "active") {
    throw new Error("账号已被禁用");
  }

  const isValid = await bcrypt.compare(password, user.passwordHash);
  if (!isValid) {
    throw new Error("密码错误");
  }

  await recordUserDevice(user.id, deviceFingerprint, ip);

  const token = jwt.sign({ userId: user.id }, getJwtSecret(), { expiresIn: "30d" });

  return {
    user: {
      id: user.id,
      phone: user.phone,
      inviteCode: user.inviteCode,
      vipLevel: user.vipLevel,
    },
    token,
  };
}

export async function getUserById(userId: number) {
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user) return null;
  
  return {
    id: user.id,
    phone: user.phone,
    inviteCode: user.inviteCode,
    vipLevel: user.vipLevel,
    status: user.status,
    createdAt: user.createdAt,
  };
}

export function verifyToken(token: string): { userId: number } | null {
  try {
    return jwt.verify(token, getJwtSecret()) as { userId: number };
  } catch {
    return null;
  }
}

async function updateInviterStats(inviterId: number) {
  await updateUserRankStats(inviterId);
}

async function joinSystemGroups(userId: number) {
  const systemGroups = await db.select().from(chatGroups).where(eq(chatGroups.isSystem, true));
  for (const group of systemGroups) {
    const existingMember = await db.select().from(groupMembers)
      .where(eq(groupMembers.groupId, group.id))
      .where(eq(groupMembers.userId, userId))
      .limit(1);
    if (existingMember.length === 0) {
      await db.insert(groupMembers).values({
        groupId: group.id,
        userId: userId,
        role: "member",
      });
    }
  }
}

export async function registerWithSms(phone: string, code: string, password: string, inviterCode?: string, deviceFingerprint?: string, ip?: string) {
  const riskCheck = await checkRegisterRisk(deviceFingerprint, ip);
  if (!riskCheck.allowed) {
    throw new Error(riskCheck.reason || "注册风控限制");
  }

  const verification = await verifyCode(phone, code);
  if (!verification.valid) {
    throw new Error(verification.message);
  }

  const existingUser = await db.select().from(users).where(eq(users.phone, phone)).limit(1);
  if (existingUser.length > 0) {
    throw new Error("该手机号已注册");
  }

  let inviterId: number | null = null;
  
  if (inviterCode && inviterCode !== UNIVERSAL_INVITE_CODE) {
    const inviter = await db.select().from(users).where(eq(users.inviteCode, inviterCode)).limit(1);
    if (inviter.length === 0) {
      throw new Error("邀请码无效");
    }
    if (inviter[0].status !== "active") {
      throw new Error("邀请人账号状态异常");
    }
    inviterId = inviter[0].id;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const newInviteCode = generateInviteCode();

  const [newUser] = await db.insert(users).values({
    phone,
    passwordHash,
    inviteCode: newInviteCode,
    inviterId,
    vipLevel: 0,
    status: "active",
  }).returning();

  await db.insert(wallets).values({
    userId: newUser.id,
    balanceCashAvailable: "0",
    balanceCashFrozen: "0",
    balancePoints: 0,
  });

  await db.insert(spinBalance).values({
    userId: newUser.id,
    availableSpins: 1,
  });

  await db.insert(userRanks).values({
    userId: newUser.id,
    currentRank: 0,
    directCount: 0,
    team3genCount: 0,
  });

  if (inviterId) {
    await updateInviterStats(inviterId);
    
    const [level1] = await db.select({ inviterId: users.inviterId }).from(users).where(eq(users.id, inviterId)).limit(1);
    if (level1?.inviterId) {
      await updateInviterStats(level1.inviterId);
      
      const [level2] = await db.select({ inviterId: users.inviterId }).from(users).where(eq(users.id, level1.inviterId)).limit(1);
      if (level2?.inviterId) {
        await updateInviterStats(level2.inviterId);
      }
    }
  }

  await recordUserDevice(newUser.id, deviceFingerprint, ip);

  await joinSystemGroups(newUser.id);

  const token = jwt.sign({ userId: newUser.id }, getJwtSecret(), { expiresIn: "30d" });

  return {
    user: {
      id: newUser.id,
      phone: newUser.phone,
      inviteCode: newUser.inviteCode,
      vipLevel: newUser.vipLevel,
    },
    token,
  };
}
