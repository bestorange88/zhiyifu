import { db } from "../db";
import { agentApplications } from "@shared/schema";
import { eq, desc } from "drizzle-orm";

export async function applyAgent(userId: number, realName: string, wechat?: string, reason?: string) {
  const [existing] = await db.select()
    .from(agentApplications)
    .where(eq(agentApplications.userId, userId))
    .orderBy(desc(agentApplications.createdAt))
    .limit(1);
  
  if (existing && existing.status === "pending") {
    throw new Error("您已有待审核的申请");
  }
  
  if (existing && existing.status === "approved") {
    throw new Error("您已是代理，无需重复申请");
  }
  
  const [app] = await db.insert(agentApplications).values({
    userId,
    realName,
    wechat,
    reason,
  }).returning();
  
  return app;
}

export async function getAgentStatus(userId: number) {
  const [app] = await db.select()
    .from(agentApplications)
    .where(eq(agentApplications.userId, userId))
    .orderBy(desc(agentApplications.createdAt))
    .limit(1);
  
  if (!app) {
    return { hasApplied: false, status: null };
  }
  
  return {
    hasApplied: true,
    status: app.status,
    appliedAt: app.createdAt,
    reviewNote: app.reviewNote,
  };
}
