"use client";

import { useRouter } from "next/navigation";
import { startTransition, useOptimistic } from "react";
import { MonthCalendar } from "@/components/journals/month-calendar";
import { ButtonLink } from "@/components/ui/button-link";
import { addMonths, toMonth } from "@/lib/dates";
import { formatMonth, formatYen } from "@/lib/format";

/** 当月の集計（損益計算書と同じ処理で求めた合計額） */
export type MonthlySummary = {
  revenueTotal: number;
  expenseTotal: number;
  netIncome: number;
};

type CalendarMonthViewProps = {
  /** サーバーで集計した年月（YYYY-MM） */
  month: string;
  /** 日本時間の今日（YYYY-MM-DD） */
  today: string;
  /** month の日付ごとの仕訳件数 */
  journalCounts: Record<string, number>;
  /** month の集計 */
  summary: MonthlySummary;
};

/**
 * カレンダー画面の本体（月の切り替え・月間カレンダー・当月の集計）。
 *
 * 月を切り替えるときは、サーバーの応答を待たずに新しい月のカレンダー（日付のマス）を
 * すぐに表示する（useOptimistic）。仕訳件数と集計はサーバーから届くまで読み込み中の表示にする。
 */
export function CalendarMonthView({
  month,
  today,
  journalCounts,
  summary,
}: CalendarMonthViewProps) {
  const router = useRouter();
  // 画面遷移（router.push）が終わるまでの間だけ、切り替え先の年月を表示する
  const [displayMonth, setDisplayMonth] = useOptimistic(month);
  const isLoading = displayMonth !== month;

  const previousMonth = addMonths(displayMonth, -1);
  const nextMonth = addMonths(displayMonth, 1);

  /** Link の画面遷移を止め、表示する年月を先に切り替えてから遷移する */
  function changeMonth(
    event: { preventDefault: () => void },
    targetMonth: string,
    href: string,
  ) {
    event.preventDefault();
    startTransition(() => {
      setDisplayMonth(targetMonth);
      router.push(href);
    });
  }

  const previousHref = `/calendar?month=${previousMonth}`;
  const nextHref = `/calendar?month=${nextMonth}`;

  return (
    <div className="space-y-6" aria-busy={isLoading}>
      <div className="flex items-center justify-between gap-2">
        <ButtonLink
          href={previousHref}
          onNavigate={(event) =>
            changeMonth(event, previousMonth, previousHref)
          }
          variant="secondary"
          size="sm"
          aria-label={`前月（${formatMonth(previousMonth)}）`}
        >
          ← 前月
        </ButtonLink>
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-semibold leading-snug text-gray-900">
            {formatMonth(displayMonth)}
          </h2>
          {/* 今月に戻る */}
          <ButtonLink
            href="/calendar"
            onNavigate={(event) =>
              changeMonth(event, toMonth(today), "/calendar")
            }
            variant="secondary"
            size="sm"
          >
            今日
          </ButtonLink>
        </div>
        <ButtonLink
          href={nextHref}
          onNavigate={(event) => changeMonth(event, nextMonth, nextHref)}
          variant="secondary"
          size="sm"
          aria-label={`翌月（${formatMonth(nextMonth)}）`}
        >
          翌月 →
        </ButtonLink>
      </div>

      <MonthCalendar
        month={displayMonth}
        today={today}
        journalCounts={isLoading ? undefined : journalCounts}
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
          {formatMonth(displayMonth)}の集計
        </h2>
        <dl className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <SummaryItem
            label="収益合計"
            amount={isLoading ? null : summary.revenueTotal}
          />
          <SummaryItem
            label="費用合計"
            amount={isLoading ? null : summary.expenseTotal}
          />
          <SummaryItem
            label={
              !isLoading && summary.netIncome < 0
                ? "当期純損益（純損失）"
                : "当期純損益"
            }
            amount={isLoading ? null : summary.netIncome}
            emphasized
          />
        </dl>
      </section>
    </div>
  );
}

/** 当月の集計の1項目（amount が null の間は読み込み中の表示） */
function SummaryItem({
  label,
  amount,
  emphasized = false,
}: {
  label: string;
  amount: number | null;
  emphasized?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border p-4 ${
        emphasized ? "border-blue-700" : "border-gray-300"
      }`}
    >
      <dt className="text-sm font-semibold text-gray-700">{label}</dt>
      {amount === null ? (
        <dd className="mt-1">
          <span className="sr-only">読み込み中</span>
          <span className="block h-8 w-32 animate-pulse rounded-lg bg-gray-100 motion-reduce:animate-none" />
        </dd>
      ) : (
        <dd
          className={`mt-1 text-2xl font-bold ${
            amount < 0 ? "text-red-600" : "text-gray-900"
          }`}
        >
          {formatYen(amount)}
        </dd>
      )}
    </div>
  );
}
