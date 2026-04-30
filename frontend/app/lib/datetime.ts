import { formatInTimeZone, fromZonedTime } from "date-fns-tz";

export const APP_TIME_ZONE = "Asia/Bangkok";

export function formatDateKeyInAppTimeZone(dateValue: string | Date) {
  return formatInTimeZone(dateValue, APP_TIME_ZONE, "yyyy-MM-dd");
}

export function formatTimeInAppTimeZone(dateValue: string | Date) {
  return formatInTimeZone(dateValue, APP_TIME_ZONE, "HH:mm");
}

export function formatWithAppTimeZone(
  dateValue: string | Date,
  locale: string,
  options: Intl.DateTimeFormatOptions = {},
) {
  return new Intl.DateTimeFormat(locale, {
    ...options,
    timeZone: APP_TIME_ZONE,
  }).format(new Date(dateValue));
}

export function toUtcISOStringFromAppDateTime(date: string, time: string) {
  const utcDate = fromZonedTime(`${date}T${time}:00`, APP_TIME_ZONE);
  return utcDate.toISOString();
}

