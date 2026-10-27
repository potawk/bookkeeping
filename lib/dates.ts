/**
 * 日付（YYYY-MM-DD）・年月（YYYY-MM）の文字列を扱う共通処理。
 * 仕訳の日付は時刻を持たない「暦の日付」なので、計算は UTC の 0 時として行い、
 * タイムゾーンによって日付がずれないようにする。「今日」だけは日本時間で判定する。
 */

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const MONTH_REGEX = /^\d{4}-\d{2}$/;

/** 曜日の表示名（0: 日曜 〜 6: 土曜） */
export const WEEKDAY_LABELS = [
  "日",
  "月",
  "火",
  "水",
  "木",
  "金",
  "土",
] as const;

/** 日本時間の今日を YYYY-MM-DD で返す（en-CA は YYYY-MM-DD 形式で出力される） */
const tokyoDateFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Tokyo",
});

export function todayInTokyo(): string {
  return tokyoDateFormatter.format(new Date());
}

/** YYYY-MM-DD を UTC の 0 時の Date にする */
function toUtcDate(date: string): Date {
  return new Date(`${date}T00:00:00Z`);
}

function toDateString(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** 実在する日付の YYYY-MM-DD なら true（2026-02-30 などは false） */
export function isValidDate(value: unknown): value is string {
  if (typeof value !== "string" || !DATE_REGEX.test(value)) return false;
  const date = toUtcDate(value);
  return !Number.isNaN(date.getTime()) && toDateString(date) === value;
}

/** YYYY-MM（月は 01〜12）なら true */
export function isValidMonth(value: unknown): value is string {
  return (
    typeof value === "string" &&
    MONTH_REGEX.test(value) &&
    isValidDate(`${value}-01`)
  );
}

/** 日付を days 日ずらす（マイナスで過去） */
export function addDays(date: string, days: number): string {
  const result = toUtcDate(date);
  result.setUTCDate(result.getUTCDate() + days);
  return toDateString(result);
}

/** 年月を months か月ずらす（マイナスで過去） */
export function addMonths(month: string, months: number): string {
  const [year, monthIndex] = month.split("-").map(Number);
  const result = new Date(Date.UTC(year, monthIndex - 1 + months, 1));
  return toDateString(result).slice(0, 7);
}

/** 日付が属する年月（YYYY-MM） */
export function toMonth(date: string): string {
  return date.slice(0, 7);
}

/** 曜日の番号（0: 日曜 〜 6: 土曜） */
export function getWeekdayIndex(date: string): number {
  return toUtcDate(date).getUTCDay();
}

/** 年月の初日と末日（YYYY-MM-DD） */
export function getMonthRange(month: string): { start: string; end: string } {
  const start = `${month}-01`;
  return { start, end: addDays(`${addMonths(month, 1)}-01`, -1) };
}

/**
 * 月間カレンダーのマス目を作る（日曜始まり・1週7日）。
 * 月の前後の空きマスは null にする。
 */
export function getCalendarWeeks(month: string): (string | null)[][] {
  const { start, end } = getMonthRange(month);
  const cells: (string | null)[] = Array.from(
    { length: getWeekdayIndex(start) },
    () => null,
  );
  for (let date = start; date <= end; date = addDays(date, 1)) {
    cells.push(date);
  }
  while (cells.length % 7 !== 0) cells.push(null);

  const weeks: (string | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) {
    weeks.push(cells.slice(i, i + 7));
  }
  return weeks;
}
