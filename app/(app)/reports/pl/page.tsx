import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import { ReportFilterForm } from "@/components/reports/report-filter-form";
import {
  AccountAmountRows,
  ReportSection,
} from "@/components/reports/report-section";
import { ReportSkeleton } from "@/components/reports/report-skeleton";
import { ReportTabs } from "@/components/reports/report-tabs";
import { FormAlert } from "@/components/ui/form-alert";
import { isValidDate, todayInTokyo } from "@/lib/dates";
import { formatDate, formatYen } from "@/lib/format";
import { getPeriodPresets } from "@/lib/reports/periods";
import { getProfitAndLoss } from "@/lib/reports/queries";

export const metadata: Metadata = {
  title: "損益計算書",
};

/** 損益計算書画面（/reports/pl?start=2026-10-01&end=2026-10-31）。期間の指定がなければ今月を表示する */
export default function ProfitAndLossPage({
  searchParams,
}: PageProps<"/reports/pl">) {
  return (
    <div className="space-y-6">
      <ReportTabs current="/reports/pl" />
      <h1 className="text-3xl font-semibold leading-tight text-gray-900">
        損益計算書
      </h1>
      {/* 期間（searchParams）と仕訳はリクエストごとに読むため、Suspense の内側で取得する */}
      <Suspense fallback={<ReportSkeleton label="損益計算書を読み込み中" />}>
        <ProfitAndLossContent searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function ProfitAndLossContent({
  searchParams,
}: {
  searchParams: PageProps<"/reports/pl">["searchParams"];
}) {
  const params = await searchParams;
  // 「今月」などのプリセットはリクエストごとに変わるため、リクエスト時に計算する
  await connection();
  const presets = getPeriodPresets(todayInTokyo());
  const thisMonth = presets[0].period;

  const start = isValidDate(params.start) ? params.start : thisMonth.start;
  const end = isValidDate(params.end) ? params.end : thisMonth.end;

  return (
    <div className="space-y-6">
      <ReportFilterForm
        action="/reports/pl"
        fields={[
          { name: "start", label: "開始日", value: start },
          { name: "end", label: "終了日", value: end },
        ]}
        presets={presets.map(({ label, period }) => ({
          label,
          href: `/reports/pl?start=${period.start}&end=${period.end}`,
          active: period.start === start && period.end === end,
        }))}
      />
      {start > end ? (
        <FormAlert message="開始日は終了日以前の日付を指定してください。" />
      ) : (
        <ProfitAndLossReport start={start} end={end} />
      )}
    </div>
  );
}

async function ProfitAndLossReport({
  start,
  end,
}: {
  start: string;
  end: string;
}) {
  const report = await getProfitAndLoss(start, end);
  const isLoss = report.netIncome < 0;

  return (
    <section
      aria-labelledby="pl-period-heading"
      className="space-y-8 rounded-2xl border border-gray-300 bg-white p-6 shadow-md"
    >
      <h2
        id="pl-period-heading"
        className="text-xl font-semibold leading-snug text-gray-900"
      >
        {formatDate(start)} 〜 {formatDate(end)}
      </h2>
      <ReportSection
        title="収益"
        totalLabel="収益合計"
        total={report.revenueTotal}
      >
        <AccountAmountRows
          items={report.revenues}
          emptyMessage="この期間の収益はありません。"
        />
      </ReportSection>
      <ReportSection
        title="費用"
        totalLabel="費用合計"
        total={report.expenseTotal}
      >
        <AccountAmountRows
          items={report.expenses}
          emptyMessage="この期間の費用はありません。"
        />
      </ReportSection>
      <div className="flex items-center justify-between gap-4 rounded-xl border-2 border-blue-700 p-4">
        <span className="text-lg font-semibold text-gray-900">
          {/* カレンダーの当月集計と同じ表記にする */}
          {isLoss ? "当期純損益（純損失）" : "当期純損益"}
        </span>
        <span
          className={`text-2xl font-bold ${isLoss ? "text-red-600" : "text-gray-900"}`}
        >
          {formatYen(report.netIncome)}
        </span>
      </div>
      <p className="text-xs leading-normal text-gray-600">
        当期純損益＝収益合計－費用合計。補助科目を使った科目は、科目名を押すと補助科目別の内訳を表示します。
      </p>
    </section>
  );
}
