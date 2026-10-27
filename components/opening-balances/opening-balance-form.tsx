"use client";

import { startTransition, useActionState, useState } from "react";
import { buttonClassName } from "@/components/ui/button-styles";
import { FormAlert } from "@/components/ui/form-alert";
import { FormField } from "@/components/ui/form-field";
import { SubmitButton } from "@/components/ui/submit-button";
import { TextLink } from "@/components/ui/text-link";
import { fieldClassName } from "@/components/ui/field-styles";
import { formatYen, parseAmount } from "@/lib/format";
import { initialFormState } from "@/lib/form-state";
import { saveOpeningBalances } from "@/lib/opening-balances/actions";
import type {
  BalanceAccountOption,
  OpeningBalanceRow,
} from "@/lib/opening-balances/queries";
import type { OpeningBalanceInputRow } from "@/lib/opening-balances/validation";

type Section = BalanceAccountOption["category"];

/** 画面上で編集中の1行（section は資産・負債のどちらの欄の行か） */
type EditingRow = OpeningBalanceInputRow & { section: Section };

const SECTION_LABELS: Record<Section, string> = {
  asset: "資産",
  liability: "負債",
};

/**
 * 新しい行を作る（key は行の識別用で、保存時には使わない）。
 * 描画中に乱数を使わないよう、初期表示の行は key を固定し、行の追加ボタンでは乱数で作る。
 */
function newRow(section: Section, key = crypto.randomUUID()): EditingRow {
  return {
    key,
    section,
    accountId: "",
    subAccountId: "",
    amount: "",
  };
}

/** 欄ごとの金額の合計（数字として読めない行は 0 として扱う） */
function sumSection(rows: EditingRow[], section: Section): number {
  return rows
    .filter((row) => row.section === section)
    .reduce((total, row) => total + (parseAmount(row.amount) ?? 0), 0);
}

type OpeningBalanceFormProps = {
  openingDate: string | null;
  accounts: BalanceAccountOption[];
  rows: OpeningBalanceRow[];
};

/**
 * 期首残高の入力フォーム。資産・負債の行を自由に追加・削除でき、
 * 合計と純資産（元入金）＝資産合計－負債合計をその場で計算して表示する。
 */
export function OpeningBalanceForm({
  openingDate: savedOpeningDate,
  accounts,
  rows: savedRows,
}: OpeningBalanceFormProps) {
  const accountById = new Map(accounts.map((account) => [account.id, account]));

  const [openingDate, setOpeningDate] = useState(savedOpeningDate ?? "");
  const [rows, setRows] = useState<EditingRow[]>(() => {
    const initial: EditingRow[] = savedRows.map((row) => ({
      key: row.id,
      section: accountById.get(row.accountId)?.category ?? "asset",
      accountId: row.accountId,
      subAccountId: row.subAccountId ?? "",
      amount: row.amount.toLocaleString("ja-JP"),
    }));
    // 未登録の欄には空の行を1行用意しておく
    for (const section of ["asset", "liability"] as const) {
      if (!initial.some((row) => row.section === section)) {
        initial.push(newRow(section, `initial-${section}`));
      }
    }
    return initial;
  });

  const [state, formAction, pending] = useActionState(
    saveOpeningBalances,
    initialFormState,
  );

  const updateRow = (key: string, changes: Partial<EditingRow>) =>
    setRows((current) =>
      current.map((row) => (row.key === key ? { ...row, ...changes } : row)),
    );

  const assetTotal = sumSection(rows, "asset");
  const liabilityTotal = sumSection(rows, "liability");
  const capital = assetTotal - liabilityTotal;

  // 勘定科目が選ばれていない空の行は保存しない
  const rowsToSave = rows
    .filter((row) => row.accountId || row.amount)
    .map(({ key, accountId, subAccountId, amount }) => ({
      key,
      accountId,
      subAccountId,
      amount,
    }));

  return (
    // noValidate: ブラウザ標準のエラー表示ではなく、サーバー側の検証結果を日本語で表示する
    // <form action> で送信すると、成功後に React がフォームを初期状態に戻し、
    // state で管理しているセレクトの表示がずれるため、onSubmit から Server Action を呼ぶ
    <form
      onSubmit={(event) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        startTransition(() => formAction(formData));
      }}
      noValidate
      className="space-y-8"
    >
      <input type="hidden" name="rows" value={JSON.stringify(rowsToSave)} />
      <FormAlert message={state.message} />
      {state.ok && (
        <FormAlert
          variant="success"
          message={
            <>
              期首残高を保存しました。
              <TextLink href="/calendar" className="ml-2">
                カレンダーで仕訳の入力を始める
              </TextLink>
            </>
          }
        />
      )}

      <div className="max-w-xs">
        <FormField
          name="openingDate"
          label="期首日（利用開始日）"
          type="date"
          required
          value={openingDate}
          onChange={(event) => setOpeningDate(event.target.value)}
          hint="この日の時点の資産・負債の残高を入力します"
          error={state.fieldErrors.openingDate}
        />
      </div>

      {(["asset", "liability"] as const).map((section) => (
        <BalanceSection
          key={section}
          section={section}
          rows={rows.filter((row) => row.section === section)}
          accounts={accounts.filter((account) => account.category === section)}
          errors={state.fieldErrors}
          total={section === "asset" ? assetTotal : liabilityTotal}
          onChangeRow={updateRow}
          onAddRow={() => setRows((current) => [...current, newRow(section)])}
          onRemoveRow={(key) =>
            setRows((current) => current.filter((row) => row.key !== key))
          }
        />
      ))}

      <section
        aria-labelledby="opening-summary-heading"
        className="rounded-2xl border border-gray-300 bg-white p-6 shadow-md"
      >
        <h2
          id="opening-summary-heading"
          className="text-xl font-semibold leading-snug text-gray-900"
        >
          合計
        </h2>
        <dl className="mt-4 divide-y divide-gray-200">
          <SummaryRow label="資産合計" amount={assetTotal} />
          <SummaryRow label="負債合計" amount={liabilityTotal} />
          <SummaryRow label="純資産（元入金）" amount={capital} emphasized />
        </dl>
        <p className="mt-2 text-xs leading-normal text-gray-600">
          純資産（元入金）＝資産合計－負債合計。保存すると自動で計上されます。
        </p>
      </section>

      <div className="flex justify-end">
        <SubmitButton pending={pending} pendingLabel="保存中…">
          保存
        </SubmitButton>
      </div>
    </form>
  );
}

type BalanceSectionProps = {
  section: Section;
  rows: EditingRow[];
  accounts: BalanceAccountOption[];
  errors: Record<string, string>;
  total: number;
  onChangeRow: (key: string, changes: Partial<EditingRow>) => void;
  onAddRow: () => void;
  onRemoveRow: (key: string) => void;
};

/** 資産または負債の入力欄（行の一覧・行の追加・小計） */
function BalanceSection({
  section,
  rows,
  accounts,
  errors,
  total,
  onChangeRow,
  onAddRow,
  onRemoveRow,
}: BalanceSectionProps) {
  const label = SECTION_LABELS[section];
  const headingId = `opening-${section}-heading`;

  return (
    <section
      aria-labelledby={headingId}
      className="space-y-4 rounded-2xl border border-gray-300 bg-white p-6 shadow-md"
    >
      <div className="flex items-center justify-between gap-4">
        <h2
          id={headingId}
          className="text-xl font-semibold leading-snug text-gray-900"
        >
          {label}
        </h2>
        <p className="text-base font-semibold text-gray-900">
          小計 {formatYen(total)}
        </p>
      </div>

      {rows.length === 0 ? (
        <p className="text-base leading-relaxed text-gray-700">
          {label}の行はありません。
        </p>
      ) : (
        <ul className="space-y-4">
          {rows.map((row, index) => {
            const account = accounts.find((item) => item.id === row.accountId);
            const error = errors[`row-${row.key}`];
            const rowLabel = `${label} ${index + 1}行目`;
            return (
              <li
                key={row.key}
                className="space-y-2 rounded-xl border border-gray-200 p-4"
              >
                <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_1fr_10rem_auto] md:items-center">
                  <select
                    aria-label={`${rowLabel}の勘定科目`}
                    value={row.accountId}
                    onChange={(event) =>
                      // 勘定科目を変えたら、補助科目の選択は解除する
                      onChangeRow(row.key, {
                        accountId: event.target.value,
                        subAccountId: "",
                      })
                    }
                    className={fieldClassName(Boolean(error && !row.accountId))}
                  >
                    <option value="">勘定科目を選択</option>
                    {accounts.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name}
                      </option>
                    ))}
                  </select>
                  <select
                    aria-label={`${rowLabel}の補助科目`}
                    value={row.subAccountId}
                    disabled={!account || account.subAccounts.length === 0}
                    onChange={(event) =>
                      onChangeRow(row.key, { subAccountId: event.target.value })
                    }
                    className={fieldClassName(false)}
                  >
                    <option value="">
                      {account && account.subAccounts.length > 0
                        ? "補助科目なし"
                        : "補助科目なし（未登録）"}
                    </option>
                    {account?.subAccounts.map((sub) => (
                      <option key={sub.id} value={sub.id}>
                        {sub.name}
                      </option>
                    ))}
                  </select>
                  <div className="relative">
                    <input
                      type="text"
                      inputMode="numeric"
                      aria-label={`${rowLabel}の金額（円）`}
                      placeholder="0"
                      value={row.amount}
                      onChange={(event) =>
                        onChangeRow(row.key, { amount: event.target.value })
                      }
                      className={`${fieldClassName(Boolean(error && row.accountId))} pr-10 text-right`}
                    />
                    <span
                      aria-hidden="true"
                      className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-sm text-gray-600"
                    >
                      円
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => onRemoveRow(row.key)}
                    aria-label={`${rowLabel}を削除`}
                    className={buttonClassName("secondary", "sm")}
                  >
                    削除
                  </button>
                </div>
                {error && (
                  <p className="text-sm leading-relaxed text-red-600">
                    {error}
                  </p>
                )}
              </li>
            );
          })}
        </ul>
      )}

      <button
        type="button"
        onClick={onAddRow}
        className={buttonClassName("secondary", "sm")}
      >
        ＋ {label}の行を追加
      </button>
    </section>
  );
}

/** 合計欄の1行 */
function SummaryRow({
  label,
  amount,
  emphasized = false,
}: {
  label: string;
  amount: number;
  emphasized?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <dt
        className={
          emphasized
            ? "text-base font-semibold text-gray-900"
            : "text-sm font-semibold text-gray-700"
        }
      >
        {label}
      </dt>
      <dd
        className={`text-right ${
          emphasized ? "text-xl font-bold" : "text-base font-semibold"
        } ${amount < 0 ? "text-red-600" : "text-gray-900"}`}
      >
        {formatYen(amount)}
      </dd>
    </div>
  );
}
