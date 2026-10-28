const WEEKDAYS = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"] as const;
export type Weekday = (typeof WEEKDAYS)[number];
export { WEEKDAYS };

export interface LocalParts {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  weekday: number; // 0 = Sunday
}

export function localParts(ms: number, tz: string): LocalParts {
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    weekday: "long",
  });
  const p = Object.fromEntries(fmt.formatToParts(new Date(ms)).map((x) => [x.type, x.value]));
  return {
    year: Number(p.year),
    month: Number(p.month),
    day: Number(p.day),
    hour: Number(p.hour),
    minute: Number(p.minute),
    weekday: WEEKDAYS.indexOf(p.weekday.toLowerCase() as Weekday),
  };
}

const pad = (n: number) => String(n).padStart(2, "0");

export function localDate(ms: number, tz: string): string {
  const p = localParts(ms, tz);
  return `${p.year}-${pad(p.month)}-${pad(p.day)}`;
}

export function formatLocal(ms: number, tz: string): string {
  const p = localParts(ms, tz);
  return `${p.year}-${pad(p.month)}-${pad(p.day)} ${pad(p.hour)}:${pad(p.minute)} (${WEEKDAYS[p.weekday]})`;
}

const LOCAL_RE = /^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2}))?$/;

// "YYYY-MM-DDTHH:mm" in the household's time zone → epoch ms.
export function localToUtc(local: string, tz: string): number {
  const m = LOCAL_RE.exec(local.trim());
  if (!m) throw new Error(`expected YYYY-MM-DDTHH:mm, got "${local}"`);
  const [, y, mo, d, h = "00", mi = "00"] = m;
  const asUtc = Date.UTC(+y, +mo - 1, +d, +h, +mi);
  const offset = (ms: number) => {
    const p = localParts(ms, tz);
    return Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute) - ms;
  };
  let ms = asUtc - offset(asUtc);
  const second = asUtc - offset(ms);
  if (second !== ms) ms = second;
  return ms;
}

// Google Calendar "add event" link; times are interpreted in the household's zone.
export function calendarLink(args: {
  title: string;
  start: string;
  end?: string;
  allDay?: boolean;
  details?: string;
  location?: string;
  tz: string;
}): string {
  const compact = (s: string) => s.replace(/[-:]/g, "").replace(" ", "T");
  let dates: string;
  if (args.allDay) {
    const start = args.start.slice(0, 10);
    const endDay = new Date(Date.parse(`${(args.end ?? args.start).slice(0, 10)}T00:00:00Z`) + 86_400_000);
    dates = `${compact(start)}/${endDay.toISOString().slice(0, 10).replace(/-/g, "")}`;
  } else {
    const startMs = localToUtc(args.start, args.tz);
    const endMs = args.end ? localToUtc(args.end, args.tz) : startMs + 3_600_000;
    const fmt = (ms: number) => {
      const p = localParts(ms, args.tz);
      return `${p.year}${pad(p.month)}${pad(p.day)}T${pad(p.hour)}${pad(p.minute)}00`;
    };
    dates = `${fmt(startMs)}/${fmt(endMs)}`;
  }
  const q = new URLSearchParams({ action: "TEMPLATE", text: args.title, dates, ctz: args.tz });
  if (args.details) q.set("details", args.details);
  if (args.location) q.set("location", args.location);
  return `https://calendar.google.com/calendar/render?${q.toString()}`;
}
