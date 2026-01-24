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
