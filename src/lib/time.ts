export const TZ = "America/Montreal";

export type MontrealParts = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
  weekday: number;
  ymd: number;
  daySec: number;
};

function grab(
  parts: Intl.DateTimeFormatPart[],
  type: Intl.DateTimeFormatPartTypes,
): number {
  return Number(parts.find((p) => p.type === type)?.value);
}

export function montrealParts(at: Date): MontrealParts {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(at);
  const year = grab(parts, "year");
  const month = grab(parts, "month");
  const day = grab(parts, "day");
  const hour = grab(parts, "hour");
  const minute = grab(parts, "minute");
  const second = grab(parts, "second");
  return {
    year,
    month,
    day,
    hour,
    minute,
    second,
    weekday: new Date(Date.UTC(year, month - 1, day)).getUTCDay(),
    ymd: year * 10000 + month * 100 + day,
    daySec: hour * 3600 + minute * 60 + second,
  };
}

export function montrealWallDate(at: Date): Date {
  const p = montrealParts(at);
  return new Date(Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second));
}

export function realUtcFromWall(wall: Date, reference: Date): Date {
  const wallNow = montrealWallDate(reference);
  return new Date(reference.getTime() + (wall.getTime() - wallNow.getTime()));
}

export function shiftYmd(ymd: number, days: number): number {
  const year = Math.floor(ymd / 10000);
  const month = Math.floor((ymd % 10000) / 100);
  const day = ymd % 100;
  const dt = new Date(Date.UTC(year, month - 1, day + days));
  return (
    dt.getUTCFullYear() * 10000 + (dt.getUTCMonth() + 1) * 100 + dt.getUTCDate()
  );
}

export function weekdayOfYmd(ymd: number): number {
  const year = Math.floor(ymd / 10000);
  const month = Math.floor((ymd % 10000) / 100);
  const day = ymd % 100;
  return new Date(Date.UTC(year, month - 1, day)).getUTCDay();
}

export function parseGtfsTimeSec(value: string): number | null {
  const match = /^(\d{1,2}):([0-5]\d):([0-5]\d)$/.exec(value.trim());
  if (!match) return null;
  return Number(match[1]) * 3600 + Number(match[2]) * 60 + Number(match[3]);
}

export function gtfsDepartureUtc(
  serviceYmd: number,
  departureSec: number,
  reference: Date,
): Date {
  const extraDays = Math.floor(departureSec / 86_400);
  const sec = departureSec - extraDays * 86_400;
  const ymd = shiftYmd(serviceYmd, extraDays);
  const year = Math.floor(ymd / 10000);
  const month = Math.floor((ymd % 10000) / 100);
  const day = ymd % 100;
  const hour = Math.floor(sec / 3600);
  const minute = Math.floor((sec % 3600) / 60);
  const second = sec % 60;
  const wall = new Date(Date.UTC(year, month - 1, day, hour, minute, second));
  return realUtcFromWall(wall, reference);
}

export function minutesUntil(from: Date, to: Date): number {
  return Math.max(0, Math.round((to.getTime() - from.getTime()) / 60_000));
}
