import { db } from "../db";
import { verificationCodes, users } from "@shared/schema";
import { eq, and, gt, desc, sql } from "drizzle-orm";

const SMSBAO_USERNAME = "18515151970";
const SMSBAO_API_KEY = process.env.SMSBAO_API_KEY;
const CODE_EXPIRE_MINUTES = 5;
const RESEND_COOLDOWN_SECONDS = 50;

function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function sendVerificationCode(phone: string): Promise<{ success: boolean; message: string }> {
  // Use SQL NOW() to ensure consistent timezone with database
  const recentCode = await db.select()
    .from(verificationCodes)
    .where(and(
      eq(verificationCodes.phone, phone),
      gt(verificationCodes.createdAt, sql`NOW() - INTERVAL '${sql.raw(String(RESEND_COOLDOWN_SECONDS))} seconds'`)
    ))
    .orderBy(desc(verificationCodes.createdAt))
    .limit(1);

  if (recentCode.length > 0) {
    // Calculate seconds left based on database time
    const createdAtTime = new Date(recentCode[0].createdAt).getTime();
    const nowTime = Date.now();
    // Adjust for timezone offset (server is UTC+8)
    const timezoneOffset = 8 * 60 * 60 * 1000; // 8 hours in milliseconds
    const adjustedCreatedAt = createdAtTime - timezoneOffset;
    const secondsLeft = Math.ceil((adjustedCreatedAt + RESEND_COOLDOWN_SECONDS * 1000 - nowTime) / 1000);
    if (secondsLeft > 0) {
      return { success: false, message: `请${secondsLeft}秒后再试` };
    }
  }

  const code = generateCode();
  // Use SQL NOW() + INTERVAL for consistent timezone
  const expiresAt = sql`NOW() + INTERVAL '${sql.raw(String(CODE_EXPIRE_MINUTES))} minutes'`;

  await db.insert(verificationCodes).values({
    phone,
    code,
    expiresAt,
  });

  const content = encodeURIComponent(`【长沙智医服】亲爱的用户，您的验证码是${code}。有效期为${CODE_EXPIRE_MINUTES}分钟，请尽快验证`);
  const url = `https://api.smsbao.com/sms?u=${SMSBAO_USERNAME}&p=${SMSBAO_API_KEY}&m=${phone}&c=${content}`;

  try {
    const response = await fetch(url);
    const result = await response.text();
    
    if (result === "0") {
      return { success: true, message: "验证码已发送" };
    } else {
      console.error("SMS send failed:", result);
      return { success: false, message: "短信发送失败，请稍后重试" };
    }
  } catch (error) {
    console.error("SMS send error:", error);
    return { success: false, message: "短信发送失败，请稍后重试" };
  }
}

export async function verifyCode(phone: string, code: string): Promise<{ valid: boolean; message: string }> {
  // Use SQL NOW() to ensure consistent timezone with database
  const [record] = await db.select()
    .from(verificationCodes)
    .where(and(
      eq(verificationCodes.phone, phone),
      eq(verificationCodes.code, code),
      eq(verificationCodes.used, false),
      gt(verificationCodes.expiresAt, sql`NOW()`)
    ))
    .orderBy(desc(verificationCodes.createdAt))
    .limit(1);

  if (!record) {
    return { valid: false, message: "验证码无效或已过期" };
  }

  if (record.attempts >= 5) {
    return { valid: false, message: "验证码尝试次数过多，请重新获取" };
  }

  await db.update(verificationCodes)
    .set({ used: true })
    .where(eq(verificationCodes.id, record.id));

  return { valid: true, message: "验证成功" };
}

export async function incrementAttempts(phone: string, code: string): Promise<void> {
  const [record] = await db.select()
    .from(verificationCodes)
    .where(and(
      eq(verificationCodes.phone, phone),
      eq(verificationCodes.code, code)
    ))
    .limit(1);

  if (record) {
    await db.update(verificationCodes)
      .set({ attempts: record.attempts + 1 })
      .where(eq(verificationCodes.id, record.id));
  }
}
