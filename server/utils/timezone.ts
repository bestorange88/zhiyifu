const BUSINESS_TIMEZONE = "Asia/Shanghai";

export function getBusinessDate(): string {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: BUSINESS_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return formatter.format(now);
}

export function getBusinessYesterday(): string {
  const now = new Date();
  now.setDate(now.getDate() - 1);
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: BUSINESS_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return formatter.format(now);
}

export function getBusinessTimestamp(): Date {
  return new Date();
}

export { BUSINESS_TIMEZONE };
