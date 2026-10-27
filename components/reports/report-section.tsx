import type { ReactNode } from "react";
import { formatYen } from "@/lib/format";
import type { AccountAmount } from "@/lib/reports/aggregate";

/** 金額の文字色（マイナスは赤。符号も表示するので色だけに頼らない） */
function amountClass(amount: number): string {
  return amount < 0 ? "text-red-600" : "text-gray-900";
}

type ReportSectionProps = {
  title: string;
  totalLabel: string;
  total: number;
  children: ReactNode;
};

/** 決算書の区分（収益・費用・資産など）。科目の行と合計の行を表示する */
export function ReportSection({
  title,
  totalLabel,
  total,
  children,
}: ReportSectionProps) {
  return (
    <section className="space-y-2">
      <h3 className="border-b-2 border-gray-900 pb-1 text-lg font-semibold leading-normal text-gray-900">
        {title}
      </h3>
      <ul className="divide-y divide-gray-200">{children}</ul>
      <p className="flex items-center justify-between gap-4 border-t-2 border-gray-300 pt-2 text-base font-bold">
        <span className="text-gray-900">{totalLabel}</span>
        <span className={amountClass(total)}>{formatYen(total)}</span>
      </p>
    </section>
  );
}

/** 金額の1行（元入金・利益剰余金など、勘定科目以外の行にも使う） */
export function AmountRow({
  label,
  amount,
  note,
}: {
  label: string;
  amount: number;
  note?: string;
}) {
  return (
    <li className="flex items-center justify-between gap-4 py-2">
      <span className="text-base text-gray-900">
        {label}
        {note && <span className="ml-2 text-xs text-gray-600">{note}</span>}
      </span>
      <span className={`shrink-0 text-base ${amountClass(amount)}`}>
        {formatYen(amount)}
      </span>
    </li>
  );
}

/**
 * 勘定科目ごとの金額の行。補助科目別の内訳がある科目は <details> で開閉できるようにする
 * （キーボード・スクリーンリーダーでも操作できる標準の要素を使う）。
 */
export function AccountAmountRows({
  items,
  emptyMessage,
}: {
  items: AccountAmount[];
  emptyMessage: string;
}) {
  if (items.length === 0) {
    return <li className="py-2 text-sm text-gray-600">{emptyMessage}</li>;
  }

  return items.map((item) =>
    item.subAccounts.length === 0 ? (
      <AmountRow key={item.id} label={item.name} amount={item.amount} />
    ) : (
      <li key={item.id}>
        <details className="group">
          <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-4 rounded py-2 hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500 [&::-webkit-details-marker]:hidden">
            <span className="text-base text-gray-900">
              {item.name}
              <span className="ml-2 text-xs font-semibold text-blue-700">
                <span className="group-open:hidden">▶ 内訳を表示</span>
                <span className="hidden group-open:inline">▼ 内訳を閉じる</span>
              </span>
            </span>
            <span className={`shrink-0 text-base ${amountClass(item.amount)}`}>
              {formatYen(item.amount)}
            </span>
          </summary>
          <ul className="mb-2 ml-4 border-l-2 border-gray-200 pl-4">
            {item.subAccounts.map((sub) => (
              <li
                key={sub.id ?? "none"}
                className="flex items-center justify-between gap-4 py-1 text-sm"
              >
                <span className="text-gray-700">{sub.name}</span>
                <span className={amountClass(sub.amount)}>
                  {formatYen(sub.amount)}
                </span>
              </li>
            ))}
          </ul>
        </details>
      </li>
    ),
  );
}
