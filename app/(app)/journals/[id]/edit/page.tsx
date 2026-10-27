import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { FormSkeleton } from "@/components/journals/form-skeleton";
import { JournalForm } from "@/components/journals/journal-form";
import { TextLink } from "@/components/ui/text-link";
import { updateJournal } from "@/lib/journals/actions";
import { getSideLines } from "@/lib/journals/display";
import { listAccountsWithSubAccounts } from "@/lib/accounts/queries";
import { getJournal } from "@/lib/journals/queries";

export const metadata: Metadata = {
  title: "仕訳の編集",
};

/** 仕訳編集画面（/journals/[id]/edit）。仕訳作成と同じフォームを使う */
export default function EditJournalPage({
  params,
}: PageProps<"/journals/[id]/edit">) {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-semibold leading-tight text-gray-900">
        仕訳の編集
      </h1>
      <Suspense fallback={<FormSkeleton label="仕訳を読み込み中" />}>
        <EditJournalForm params={params} />
      </Suspense>
    </div>
  );
}

async function EditJournalForm({
  params,
}: {
  params: PageProps<"/journals/[id]/edit">["params"];
}) {
  const { id } = await params;
  const [journal, accounts] = await Promise.all([
    getJournal(id),
    listAccountsWithSubAccounts(),
  ]);
  if (!journal) notFound();

  const [debit, ...otherDebits] = getSideLines(journal, "debit");
  const [credit, ...otherCredits] = getSideLines(journal, "credit");

  // この画面は借方1行・貸方1行の仕訳だけを編集できる（複合仕訳の入力画面は対象外）
  if (!debit || !credit || otherDebits.length > 0 || otherCredits.length > 0) {
    return (
      <div className="space-y-4 rounded-2xl border border-gray-300 bg-white p-6 shadow-md">
        <p className="text-base leading-relaxed text-gray-700">
          借方・貸方が複数行ある仕訳（複合仕訳）は、この画面では編集できません。
        </p>
        <TextLink href={`/journals/${journal.id}`}>仕訳の詳細へ戻る</TextLink>
      </div>
    );
  }

  return (
    <JournalForm
      action={updateJournal.bind(null, journal.id)}
      accounts={accounts}
      defaultValues={{
        entryDate: journal.entryDate,
        debitAccountId: debit.accountId,
        debitSubAccountId: debit.subAccountId ?? "",
        debitAmount: debit.amount.toLocaleString("ja-JP"),
        creditAccountId: credit.accountId,
        creditSubAccountId: credit.subAccountId ?? "",
        creditAmount: credit.amount.toLocaleString("ja-JP"),
        description: journal.description ?? "",
      }}
      submitLabel="保存"
      pendingLabel="保存中…"
      cancelHref={`/journals/${journal.id}`}
    />
  );
}
