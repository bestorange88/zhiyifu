import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function maskPhoneNumber(phone: string | null | undefined): string {
  if (!phone) return "";
  // Check if it's a valid 11-digit phone number
  if (/^1[3-9]\d{9}$/.test(phone)) {
    return phone.replace(/(\d{2})\d+(\d{2})/, '$1***$2');
  }
  // If not a standard mobile number, return as is or handle differently
  // For safety, if it looks like a phone number (long string of digits), maybe mask it too?
  // But strictly following the "11 digit" rule is safer for now.
  return phone;
}

/**
 * 统一时间格式化工具 - 全局使用北京时间 (UTC+8)
 * 所有时间显示都应该使用这些函数，确保时间一致性
 */

// 北京时区配置
const BEIJING_TIMEZONE = "Asia/Shanghai";
const BEIJING_LOCALE = "zh-CN";

/**
 * 格式化日期时间 - 完整格式 (yyyy-MM-dd HH:mm:ss)
 */
export function formatDateTime(date: string | Date | null | undefined): string {
  if (!date) return "";
  const d = new Date(date);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleString(BEIJING_LOCALE, { 
    timeZone: BEIJING_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false
  });
}

/**
 * 格式化日期时间 - 简短格式 (MM-dd HH:mm)
 */
export function formatDateTimeShort(date: string | Date | null | undefined): string {
  if (!date) return "";
  const d = new Date(date);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleString(BEIJING_LOCALE, { 
    timeZone: BEIJING_TIMEZONE,
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  });
}

/**
 * 格式化日期 - 仅日期 (yyyy-MM-dd)
 */
export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return "";
  const d = new Date(date);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleDateString(BEIJING_LOCALE, { 
    timeZone: BEIJING_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  });
}

/**
 * 格式化日期 - 简短日期 (MM月dd日)
 */
export function formatDateChinese(date: string | Date | null | undefined): string {
  if (!date) return "";
  const d = new Date(date);
  if (isNaN(d.getTime())) return "";
  const month = d.toLocaleString(BEIJING_LOCALE, { timeZone: BEIJING_TIMEZONE, month: "2-digit" });
  const day = d.toLocaleString(BEIJING_LOCALE, { timeZone: BEIJING_TIMEZONE, day: "2-digit" });
  return `${month}月${day}日`;
}

/**
 * 格式化时间 - 仅时间 (HH:mm)
 */
export function formatTime(date: string | Date | null | undefined): string {
  if (!date) return "";
  const d = new Date(date);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleTimeString(BEIJING_LOCALE, { 
    timeZone: BEIJING_TIMEZONE,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  });
}

/**
 * 格式化时间 - 带秒 (HH:mm:ss)
 */
export function formatTimeFull(date: string | Date | null | undefined): string {
  if (!date) return "";
  const d = new Date(date);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleTimeString(BEIJING_LOCALE, { 
    timeZone: BEIJING_TIMEZONE,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false
  });
}
