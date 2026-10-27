import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import { ReportFilterForm } from "@/components/reports/report-filter-form";
import {
  AccountAmountRows,
  AmountRow,
  ReportSection,
} from "@/components/reports/report-section";
import { ReportSkeleton } from "@/components/reports/report-skeleton";
import { ReportTabs } from "@/components/reports/report-tabs";
import { TextLink } from "@/components/ui/text-link";
import { isValidDate, todayInTokyo } from "@/lib/dates";
import { formatDate, formatYen } from "@/lib/format";
import { getBaseDatePresets } from "@/lib/reports/periods";
import { getBalanceSheet } from "@/lib/reports/queries";

export const metadata: Metadata = {
  title: "貸借対照表",
};

/** 貸借対照表画面（/reports/bs?date=2026-10-31）。基準日の指定がなければ今日を表示する */
export default function BalanceSheetPage({
  searchParams,
}: PageProps<"/reports/bs">) {
  return (
    <div className="space-y-6">
      <ReportTabs current="/reports/bs" />
      <h1 className="text-3xl font-semibold leading-tight text-gray-900">
        貸借対照表
      </h1>
      {/* 基準日（searchParams）と仕訳はリクエストごとに読むため、Suspense の内側で取得する */}
      <Suspense fallback={<ReportSkeleton label="貸借対照表を読み込み中" />}>
        <BalanceSheetContent searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function BalanceSheetContent({
  searchParams,
}: {
  searchParams: PageProps<"/reports/bs">["searchParams"];
}) {
  const params = await searchParams;
  // 「今日」などのプリセットはリクエストごとに変わるため、リクエスト時に計算する
  await connection();
  const today = todayInTokyo();
  const date = isValidDate(params.date) ? params.date : today;

  return (
    <div className="space-y-6">
      <ReportFilterForm
        action="/reports/bs"
        fields={[{ name: "date", label: "基準日", value: date }]}
        presets={getBaseDatePresets(today).map((preset) => ({
          label: preset.label,
          href: `/reports/bs?date=${preset.date}`,
          active: preset.date === date,
        }))}
      />
      <BalanceSheetReport date={date} />
    </div>
  );
}

async function BalanceSheetReport({ date }: { date: string }) {
  const report = await getBalanceSheet(date);

  if (report.beforeOpeningDate && report.openingDate) {
    return (
      <p className="rounded-2xl border border-gray-300 bg-white p-6 text-base leading-relaxed text-gray-700">
        基準日が期首日（{formatDate(report.openingDate)}
        ）より前のため、貸借対照表を作成できません。期首日以降の日付を指定してください。
      </p>
    );
  }

  const liabilityAndEquityTotal = report.liabilityTotal + report.equityTotal;
  const balanced = report.assetTotal === liabilityAndEquityTotal;

  return (
    <section
      aria-labelledby="bs-date-heading"
      className="space-y-6 rounded-2xl border border-gray-300 bg-white p-6 shadow-md"
    >
      <h2
        id="bs-date-heading"
        className="text-xl font-semibold leading-snug text-gray-900"
      >
        {formatDate(date)} 時点
      </h2>

      {report.openingDate === null && (
        <p className="rounded-lg border border-amber-600 bg-white px-4 py-3 text-sm leading-relaxed text-gray-700">
          期首残高が未登録のため、仕訳だけで集計しています。
          <TextLink href="/opening-balances" className="ml-1">
            期首残高を入力する
          </TextLink>
        </p>
      )}

      {/* PC では左に資産、右に負債・純資産を並べる（貸借対照表の一般的な形） */}
      <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
        <ReportSection
          title="資産"
          totalLabel="資産合計"
          total={report.assetTotal}
        >
          <AccountAmountRows
            items={report.assets}
            emptyMessage="資産の残高はありません。"
          />
        </ReportSection>

        <div className="space-y-8">
          <ReportSection
            title="負債"
            totalLabel="負債合計"
            total={report.liabilityTotal}
          >
            <AccountAmountRows
              items={report.liabilities}
              emptyMessage="負債の残高はありません。"
            />
          </ReportSection>
          <ReportSection
            title="純資産"
            totalLabel="純資産合計"
            total={report.equityTotal}
          >
            <AmountRow
              label="元入金"
              note="期首の資産－負債"
              amount={report.openingCapital}
            />
            {report.equities.length > 0 && (
              <AccountAmountRows items={report.equities} emptyMessage="" />
            )}
            <AmountRow
              label="利益剰余金"
              note="期首日からの収益－費用"
              amount={report.retainedEarnings}
            />
          </ReportSection>
          <p className="flex items-center justify-between gap-4 border-t-2 border-gray-900 pt-2 text-base font-bold text-gray-900">
            <span>負債・純資産合計</span>
            <span>{formatYen(liabilityAndEquityTotal)}</span>
          </p>
        </div>
      </div>

      <p
        className={`rounded-lg border bg-white px-4 py-3 text-sm font-semibold leading-relaxed ${
          balanced
            ? "border-green-600 text-green-700"
            : "border-red-600 text-red-600"
        }`}
      >
        {balanced
          ? "✓ 資産合計と負債・純資産合計が一致しています。"
          : "資産合計と負債・純資産合計が一致していません。"}
      </p>
      <p className="text-xs leading-normal text-gray-600">
        資産・負債の残高は、期首残高に期首日から基準日までの仕訳を加えて計算しています。補助科目を使った科目は、科目名を押すと補助科目別の内訳を表示します。
      </p>
    </section>
  );
}
