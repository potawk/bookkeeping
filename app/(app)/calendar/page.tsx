import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import { CalendarMonthView } from "@/components/journals/calendar-month-view";
import {
  getMonthRange,
  isValidMonth,
  toMonth,
  todayInTokyo,
} from "@/lib/dates";
import { getJournalCountsByDate } from "@/lib/journals/queries";
import { getProfitAndLoss } from "@/lib/reports/queries";

export const metadata: Metadata = {
  title: "カレンダー",
};

/** カレンダー画面（/calendar?month=2026-10）。ログイン後のホーム。month がなければ今月を表示する */
export default function CalendarPage({ searchParams }: PageProps<"/calendar">) {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-semibold leading-tight text-gray-900">
        カレンダー
      </h1>
      {/* 表示する年月（searchParams）と仕訳はリクエストごとに読むため、Suspense の内側で取得する */}
      <Suspense fallback={<CalendarSkeleton />}>
        <CalendarContent searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function CalendarContent({
  searchParams,
}: {
  searchParams: PageProps<"/calendar">["searchParams"];
}) {
  const { month: monthParam } = await searchParams;
  // 「今日」はリクエストごとに変わるため、事前レンダリングせずリクエスト時に計算する
  await connection();
  const today = todayInTokyo();
  const month = isValidMonth(monthParam) ? monthParam : toMonth(today);
  const { start, end } = getMonthRange(month);
  // 当月の集計は損益計算書と同じ処理で求め、レポートの金額と必ず一致させる
  const [journalCounts, summary] = await Promise.all([
    getJournalCountsByDate(month),
    getProfitAndLoss(start, end),
  ]);

  return (
    <CalendarMonthView
      month={month}
      today={today}
      journalCounts={journalCounts}
      summary={{
        revenueTotal: summary.revenueTotal,
        expenseTotal: summary.expenseTotal,
        netIncome: summary.netIncome,
      }}
    />
  );
}

/** カレンダーを読み込んでいる間の表示 */
function CalendarSkeleton() {
  return (
    <div
      role="status"
      aria-label="カレンダーを読み込み中"
      className="space-y-6"
    >
      <div className="h-11 w-full animate-pulse rounded-lg bg-gray-100 motion-reduce:animate-none" />
      <div className="h-96 w-full animate-pulse rounded-2xl bg-gray-100 motion-reduce:animate-none" />
      <div className="h-32 w-full animate-pulse rounded-2xl bg-gray-100 motion-reduce:animate-none" />
    </div>
  );
}
