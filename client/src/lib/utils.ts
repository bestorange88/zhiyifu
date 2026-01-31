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
 * 统一时间格式化工具
 * 注意：服务器时区已设置为Asia/Shanghai，数据库存储的时间已经是北京时间
 * 因此前端不需要再进行时区转换，直接格式化显示即可
 */

const BEIJING_LOCALE = "zh-CN";

/**
 * 格式化日期时间 - 完整格式 (yyyy/MM/dd HH:mm:ss)
 */
export function formatDateTime(date: string | Date | null | undefined): string {
  if (!date) return "";
  const d = new Date(date);
  if (isNaN(d.getTime())) return "";
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const seconds = String(d.getSeconds()).padStart(2, '0');
  return `${year}/${month}/${day} ${hours}:${minutes}:${seconds}`;
}

/**
 * 格式化日期时间 - 简短格式 (MM-dd HH:mm)
 */
export function formatDateTimeShort(date: string | Date | null | undefined): string {
  if (!date) return "";
  const d = new Date(date);
  if (isNaN(d.getTime())) return "";
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${month}-${day} ${hours}:${minutes}`;
}

/**
 * 格式化日期 - 仅日期 (yyyy/MM/dd)
 */
export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return "";
  const d = new Date(date);
  if (isNaN(d.getTime())) return "";
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}/${month}/${day}`;
}

/**
 * 格式化日期 - 简短日期 (MM月dd日)
 */
export function formatDateChinese(date: string | Date | null | undefined): string {
  if (!date) return "";
  const d = new Date(date);
  if (isNaN(d.getTime())) return "";
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${month}月${day}日`;
}

/**
 * 格式化时间 - 仅时间 (HH:mm)
 */
export function formatTime(date: string | Date | null | undefined): string {
  if (!date) return "";
  const d = new Date(date);
  if (isNaN(d.getTime())) return "";
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

/**
 * 格式化时间 - 带秒 (HH:mm:ss)
 */
export function formatTimeFull(date: string | Date | null | undefined): string {
  if (!date) return "";
  const d = new Date(date);
  if (isNaN(d.getTime())) return "";
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const seconds = String(d.getSeconds()).padStart(2, '0');
  return `${hours}:${minutes}:${seconds}`;
}
