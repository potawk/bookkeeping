import { addDays, addMonths, getMonthRange, toMonth } from "@/lib/dates";

/** 損益計算書の期間（開始日・終了日、YYYY-MM-DD） */
export type Period = { start: string; end: string };

/** 損益計算書の期間のプリセット（今月・先月・今年・昨年） */
export function getPeriodPresets(
  today: string,
): { label: string; period: Period }[] {
  const thisMonth = toMonth(today);
  const year = Number(today.slice(0, 4));
  return [
    { label: "今月", period: getMonthRange(thisMonth) },
    { label: "先月", period: getMonthRange(addMonths(thisMonth, -1)) },
    { label: "今年", period: { start: `${year}-01-01`, end: `${year}-12-31` } },
    {
      label: "昨年",
      period: { start: `${year - 1}-01-01`, end: `${year - 1}-12-31` },
    },
  ];
}

/** 貸借対照表の基準日のプリセット（今日・先月末・昨年末） */
export function getBaseDatePresets(
  today: string,
): { label: string; date: string }[] {
  return [
    { label: "今日", date: today },
    { label: "先月末", date: addDays(`${toMonth(today)}-01`, -1) },
    { label: "昨年末", date: `${Number(today.slice(0, 4)) - 1}-12-31` },
  ];
}
