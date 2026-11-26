/** Returns September 1 of the current year, or the previous year before September. */
export function getArchiveStartDate(now: Date = new Date()): Date {
  const year = now.getUTCMonth() >= 8 ? now.getUTCFullYear() : now.getUTCFullYear() - 1;
  return new Date(Date.UTC(year, 8, 1));
}

export function formatArabicEditionDate(value: Date | string | number): string {
  return new Intl.DateTimeFormat("ar-MA", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Africa/Casablanca",
  }).format(new Date(value));
}
