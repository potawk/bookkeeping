import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import { MonthCalendar } from "@/components/journals/month-calendar";
import { ButtonLink } from "@/components/ui/button-link";
import {
  addMonths,
  getMonthRange,
  isValidMonth,
  toMonth,
  todayInTokyo,
} from "@/lib/dates";
import { formatMonth, formatYen } from "@/lib/format";
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
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-2">
        <ButtonLink
          href={`/calendar?month=${addMonths(month, -1)}`}
          variant="secondary"
          size="sm"
          aria-label={`前月（${formatMonth(addMonths(month, -1))}）`}
        >
          ← 前月
        </ButtonLink>
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-semibold leading-snug text-gray-900">
            {formatMonth(month)}
          </h2>
          {/* 今月に戻る */}
          <ButtonLink href="/calendar" variant="secondary" size="sm">
            今日
          </ButtonLink>
        </div>
        <ButtonLink
          href={`/calendar?month=${addMonths(month, 1)}`}
          variant="secondary"
          size="sm"
          aria-label={`翌月（${formatMonth(addMonths(month, 1))}）`}
        >
          翌月 →
        </ButtonLink>
      </div>

      <MonthCalendar
        month={month}
        today={today}
        journalCounts={journalCounts}
      />
      <p className="text-sm leading-relaxed text-gray-600">
        日付を選ぶと、その日の仕訳一覧を表示します。数字のバッジはその日の仕訳件数です。
      </p>

      <section
        aria-labelledby="monthly-summary-heading"
        className="rounded-2xl border border-gray-300 bg-white p-6 shadow-md"
      >
        <h2
          id="monthly-summary-heading"
          className="text-xl font-semibold leading-snug text-gray-900"
        >
          {formatMonth(month)}の集計
        </h2>
        <dl className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <SummaryItem label="収益合計" amount={summary.revenueTotal} />
          <SummaryItem label="費用合計" amount={summary.expenseTotal} />
          <SummaryItem
            label={
              summary.netIncome < 0 ? "当期純損益（純損失）" : "当期純損益"
            }
            amount={summary.netIncome}
            emphasized
          />
        </dl>
      </section>
    </div>
  );
}

/** 当月の集計の1項目 */
function SummaryItem({
  label,
  amount,
  emphasized = false,
}: {
  label: string;
  amount: number;
  emphasized?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border p-4 ${
        emphasized ? "border-blue-700" : "border-gray-300"
      }`}
    >
      <dt className="text-sm font-semibold text-gray-700">{label}</dt>
      <dd
        className={`mt-1 text-2xl font-bold ${
          amount < 0 ? "text-red-600" : "text-gray-900"
        }`}
      >
        {formatYen(amount)}
      </dd>
    </div>
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
