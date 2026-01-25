import { db } from "../db";
import { identityVerifications, users } from "@shared/schema";
import { eq, desc } from "drizzle-orm";

export async function submitIdentityVerification(
  userId: number,
  realName: string,
  idNumber: string,
  idFrontImage: string,
  idBackImage: string
) {
  // Check if user already has a pending or approved verification
  const [existing] = await db
    .select()
    .from(identityVerifications)
    .where(eq(identityVerifications.userId, userId))
    .orderBy(desc(identityVerifications.createdAt))
    .limit(1);

  if (existing) {
    if (existing.status === "approved") {
      throw new Error("您已完成实名认证");
    }
    if (existing.status === "pending") {
      throw new Error("您有待审核的实名认证申请，请耐心等待");
    }
  }

  // Create new verification request
  const [verification] = await db
    .insert(identityVerifications)
    .values({
      userId,
      realName,
      idNumber,
      idFrontImage,
      idBackImage,
      status: "pending",
    })
    .returning();

  return verification;
}

export async function getIdentityVerificationStatus(userId: number) {
  const [verification] = await db
    .select()
    .from(identityVerifications)
    .where(eq(identityVerifications.userId, userId))
    .orderBy(desc(identityVerifications.createdAt))
    .limit(1);

  if (!verification) {
    return { status: "none", message: "未提交实名认证" };
  }

  return {
    status: verification.status,
    realName: verification.realName,
    idNumber: verification.idNumber.replace(/^(.{4}).*(.{4})$/, "$1**********$2"),
    reviewNote: verification.reviewNote,
    createdAt: verification.createdAt,
    reviewedAt: verification.reviewedAt,
  };
}

export async function getAllIdentityVerifications() {
  const verifications = await db
    .select({
      id: identityVerifications.id,
      userId: identityVerifications.userId,
      realName: identityVerifications.realName,
      idNumber: identityVerifications.idNumber,
      idFrontImage: identityVerifications.idFrontImage,
      idBackImage: identityVerifications.idBackImage,
      status: identityVerifications.status,
      reviewNote: identityVerifications.reviewNote,
      reviewedAt: identityVerifications.reviewedAt,
      createdAt: identityVerifications.createdAt,
      userPhone: users.phone,
    })
    .from(identityVerifications)
    .leftJoin(users, eq(identityVerifications.userId, users.id))
    .orderBy(desc(identityVerifications.createdAt));

  return verifications;
}

export async function reviewIdentityVerification(
  verificationId: number,
  adminId: number,
  approved: boolean,
  reviewNote?: string
) {
  const [existing] = await db
    .select()
    .from(identityVerifications)
    .where(eq(identityVerifications.id, verificationId))
    .limit(1);

  if (!existing) {
    throw new Error("实名认证申请不存在");
  }

  const targetStatus = approved ? "approved" : "rejected";
  if (existing.status === targetStatus) {
    return existing;
  }

  if (existing.status !== "pending") {
    throw new Error("该申请已处理");
  }

  const [updated] = await db
    .update(identityVerifications)
    .set({
      status: approved ? "approved" : "rejected",
      reviewNote: reviewNote || (approved ? "审核通过" : "审核未通过"),
      reviewedBy: adminId,
      reviewedAt: new Date(),
    })
    .where(eq(identityVerifications.id, verificationId))
    .returning();

  return updated;
}

export async function batchReviewIdentityVerifications(
  verificationIds: number[],
  adminId: number,
  approved: boolean,
  reviewNote?: string
) {
  if (!verificationIds.length) return [];

  const results = [];
  for (const id of verificationIds) {
    try {
      const result = await reviewIdentityVerification(id, adminId, approved, reviewNote);
      results.push({ id, status: "success", data: result });
    } catch (error: any) {
      results.push({ id, status: "error", error: error.message });
    }
  }
  return results;
}
