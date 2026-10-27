import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import { FormSkeleton } from "@/components/journals/form-skeleton";
import { JournalForm } from "@/components/journals/journal-form";
import { isValidDate, todayInTokyo } from "@/lib/dates";
import { createJournal } from "@/lib/journals/actions";
import { listAccountsWithSubAccounts } from "@/lib/accounts/queries";

export const metadata: Metadata = {
  title: "仕訳の作成",
};

/** 仕訳作成画面（/journals/create?date=2026-10-27）。日付は日別仕訳一覧で選んだ日を初期値にする */
export default function CreateJournalPage({
  searchParams,
}: PageProps<"/journals/create">) {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-semibold leading-tight text-gray-900">
        仕訳の作成
      </h1>
      {/* 選んだ日付（searchParams）と勘定科目はリクエストごとに読むため、Suspense の内側で取得する */}
      <Suspense fallback={<FormSkeleton label="仕訳フォームを読み込み中" />}>
        <CreateJournalForm searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function CreateJournalForm({
  searchParams,
}: {
  searchParams: PageProps<"/journals/create">["searchParams"];
}) {
  const { date } = await searchParams;
  // 日付の指定がなければ今日にする（リクエスト時に計算する）
  await connection();
  const entryDate = isValidDate(date) ? date : todayInTokyo();
  const accounts = await listAccountsWithSubAccounts();

  return (
    <JournalForm
      action={createJournal}
      accounts={accounts}
      defaultValues={{
        entryDate,
        debitAccountId: "",
        debitSubAccountId: "",
        debitAmount: "",
        creditAccountId: "",
        creditSubAccountId: "",
        creditAmount: "",
        description: "",
      }}
      submitLabel="保存"
      pendingLabel="保存中…"
      cancelHref={`/calendar/${entryDate}`}
    />
  );
}
