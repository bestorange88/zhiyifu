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
 * 
 * 重要说明：
 * 服务器时区设置为Asia/Shanghai，数据库存储的时间已经是北京时间。
 * 但数据库返回的时间戳字符串没有时区信息（如"2026-02-01 06:02:00"），
 * JavaScript的Date构造函数会将其解释为UTC时间，导致显示时多加8小时。
 * 
 * 解决方案：使用toLocaleString并指定timeZone为UTC来获取原始时间值，
 * 因为数据库存储的就是北京时间，我们直接显示这个值即可。
 */

/**
 * 解析数据库时间戳 - 数据库存储的是北京时间，直接提取时间组件
 * 对于字符串格式的时间戳，直接解析字符串避免时区转换问题
 */
function parseDatabaseTime(date: string | Date): { year: number; month: number; day: number; hours: number; minutes: number; seconds: number } | null {
  if (date instanceof Date) {
    // 如果是Date对象，使用UTC方法获取值（因为Date对象已经被解析为UTC）
    // 但我们需要的是原始的北京时间值
    // 对于new Date()创建的当前时间，使用本地时间
    if (isNaN(date.getTime())) return null;
    return {
      year: date.getFullYear(),
      month: date.getMonth() + 1,
      day: date.getDate(),
      hours: date.getHours(),
      minutes: date.getMinutes(),
      seconds: date.getSeconds()
    };
  }
  
  // 对于字符串，直接解析避免时区问题
  // 格式: "2026-02-01 06:02:00.123456" 或 "2026-02-01T06:02:00.123456Z"
  const str = String(date);
  
  // 尝试匹配常见的时间戳格式
  const match = str.match(/(\d{4})-(\d{2})-(\d{2})[T\s](\d{2}):(\d{2}):(\d{2})/);
  if (match) {
    return {
      year: parseInt(match[1], 10),
      month: parseInt(match[2], 10),
      day: parseInt(match[3], 10),
      hours: parseInt(match[4], 10),
      minutes: parseInt(match[5], 10),
      seconds: parseInt(match[6], 10)
    };
  }
  
  // 如果无法解析字符串，回退到Date对象
  const d = new Date(str);
  if (isNaN(d.getTime())) return null;
  return {
    year: d.getFullYear(),
    month: d.getMonth() + 1,
    day: d.getDate(),
    hours: d.getHours(),
    minutes: d.getMinutes(),
    seconds: d.getSeconds()
  };
}

/**
 * 格式化日期时间 - 完整格式 (yyyy/MM/dd HH:mm:ss)
 */
export function formatDateTime(date: string | Date | null | undefined): string {
  if (!date) return "";
  const t = parseDatabaseTime(date);
  if (!t) return "";
  return `${t.year}/${String(t.month).padStart(2, '0')}/${String(t.day).padStart(2, '0')} ${String(t.hours).padStart(2, '0')}:${String(t.minutes).padStart(2, '0')}:${String(t.seconds).padStart(2, '0')}`;
}

/**
 * 格式化日期时间 - 简短格式 (MM-dd HH:mm)
 */
export function formatDateTimeShort(date: string | Date | null | undefined): string {
  if (!date) return "";
  const t = parseDatabaseTime(date);
  if (!t) return "";
  return `${String(t.month).padStart(2, '0')}-${String(t.day).padStart(2, '0')} ${String(t.hours).padStart(2, '0')}:${String(t.minutes).padStart(2, '0')}`;
}

/**
 * 格式化日期 - 仅日期 (yyyy/MM/dd)
 */
export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return "";
  const t = parseDatabaseTime(date);
  if (!t) return "";
  return `${t.year}/${String(t.month).padStart(2, '0')}/${String(t.day).padStart(2, '0')}`;
}

/**
 * 格式化日期 - 简短日期 (MM月dd日)
 */
export function formatDateChinese(date: string | Date | null | undefined): string {
  if (!date) return "";
  const t = parseDatabaseTime(date);
  if (!t) return "";
  return `${String(t.month).padStart(2, '0')}月${String(t.day).padStart(2, '0')}日`;
}

/**
 * 格式化时间 - 仅时间 (HH:mm)
 */
export function formatTime(date: string | Date | null | undefined): string {
  if (!date) return "";
  const t = parseDatabaseTime(date);
  if (!t) return "";
  return `${String(t.hours).padStart(2, '0')}:${String(t.minutes).padStart(2, '0')}`;
}

/**
 * 格式化时间 - 带秒 (HH:mm:ss)
 */
export function formatTimeFull(date: string | Date | null | undefined): string {
  if (!date) return "";
  const t = parseDatabaseTime(date);
  if (!t) return "";
  return `${String(t.hours).padStart(2, '0')}:${String(t.minutes).padStart(2, '0')}:${String(t.seconds).padStart(2, '0')}`;
}
