import { db } from "../db";
import { sellerOnboarding, users } from "../../shared/schema";
import { eq } from "drizzle-orm";

export async function getOnboardingProgress(userId: number) {
  const result = await db.query.sellerOnboarding.findFirst({
    where: eq(sellerOnboarding.userId, userId),
  });
  return result;
}

export async function updateOnboardingStep(userId: number, step: number, data: Partial<typeof sellerOnboarding.$inferSelect>) {
  // Check if record exists
  const existing = await getOnboardingProgress(userId);

  if (existing) {
    const updateData: any = { ...data, updatedAt: new Date() };
    
    // Logic: If step > existing.currentStep, update currentStep. 
    // If updating data for a previous step, keep currentStep as is (max).
    if (step > existing.currentStep) {
        updateData.currentStep = step;
    }

    const [updated] = await db
      .update(sellerOnboarding)
      .set(updateData)
      .where(eq(sellerOnboarding.userId, userId))
      .returning();
    return updated;
  } else {
    const [created] = await db
      .insert(sellerOnboarding)
      .values({
        userId,
        currentStep: step,
        ...data,
      } as any)
      .returning();
    return created;
  }
}

export async function completeVipPayment(userId: number) {
  // In a real app, this would verify payment.
  // Here we just mark it as paid.
  
  // Also update user's VIP level in users table
  await db.update(users).set({ vipLevel: 1 }).where(eq(users.id, userId));

  return await updateOnboardingStep(userId, 2, { vipStatus: "paid" });
}
