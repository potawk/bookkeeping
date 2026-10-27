import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense, type ReactNode } from "react";
import { ButtonLink } from "@/components/ui/button-link";
import { ConfirmDeleteDialog } from "@/components/ui/confirm-delete-dialog";
import { TextLink } from "@/components/ui/text-link";
import { formatDateTime, formatDateWithWeekday, formatYen } from "@/lib/format";
import { deleteJournal } from "@/lib/journals/actions";
import {
  formatLineAccount,
  getJournalAmount,
  getSideLines,
} from "@/lib/journals/display";
import {
  getJournal,
  type EntrySide,
  type Journal,
} from "@/lib/journals/queries";

export const metadata: Metadata = {
  title: "仕訳の詳細",
};

/** 仕訳詳細画面（/journals/[id]）。編集・削除もここから行う */
export default function JournalDetailPage({
  params,
}: PageProps<"/journals/[id]">) {
  return (
    <Suspense fallback={<DetailSkeleton />}>
      <JournalDetailContent params={params} />
    </Suspense>
  );
}

async function JournalDetailContent({
  params,
}: {
  params: PageProps<"/journals/[id]">["params"];
}) {
  const { id } = await params;
  const journal = await getJournal(id);
  if (!journal) notFound();

  const date = formatDateWithWeekday(journal.entryDate);

  return (
    <div className="space-y-8">
      {/* inline-block: 親の space-y の余白（下マージン）を効かせる */}
      <TextLink
        href={`/calendar/${journal.entryDate}`}
        className="inline-block"
      >
        ← {date}の仕訳一覧へ戻る
      </TextLink>

      <section className="space-y-6 rounded-2xl border border-gray-300 bg-white p-6 shadow-md">
        <h1 className="text-3xl font-semibold leading-tight text-gray-900">
          仕訳の詳細
        </h1>
        <dl className="divide-y divide-gray-200">
          <DetailRow label="日付">{date}</DetailRow>
          <DetailRow label="借方">
            <SideLines journal={journal} side="debit" />
          </DetailRow>
          <DetailRow label="貸方">
            <SideLines journal={journal} side="credit" />
          </DetailRow>
          <DetailRow label="金額">
            <span className="text-xl font-bold">
              {formatYen(getJournalAmount(journal))}
            </span>
          </DetailRow>
          <DetailRow label="摘要">
            {journal.description ?? (
              <span className="text-gray-600">（なし）</span>
            )}
          </DetailRow>
          <DetailRow label="作成日時">
            {formatDateTime(journal.createdAt)}
          </DetailRow>
          <DetailRow label="更新日時">
            {formatDateTime(journal.updatedAt)}
          </DetailRow>
        </dl>
        <div className="flex flex-wrap gap-3">
          <ButtonLink
            href={`/journals/${journal.id}/edit`}
            variant="secondary"
            size="sm"
          >
            編集
          </ButtonLink>
          <ConfirmDeleteDialog
            action={deleteJournal.bind(null, journal.id)}
            triggerLabel="削除"
            title="仕訳の削除"
            description={`${date}の仕訳（${formatYen(getJournalAmount(journal))}）を削除します。この操作は取り消せません。`}
          />
        </div>
      </section>
    </div>
  );
}

/** 借方または貸方の科目（複合仕訳に備えて、明細が複数あれば行ごとに金額も表示する） */
function SideLines({ journal, side }: { journal: Journal; side: EntrySide }) {
  const lines = getSideLines(journal, side);
  if (lines.length === 1) return formatLineAccount(lines[0]);
  return (
    <ul className="space-y-1">
      {lines.map((line, index) => (
        <li key={index} className="flex justify-between gap-4">
          <span>{formatLineAccount(line)}</span>
          <span>{formatYen(line.amount)}</span>
        </li>
      ))}
    </ul>
  );
}

/** 仕訳情報の1行 */
function DetailRow({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="grid grid-cols-1 gap-1 py-3 sm:grid-cols-3 sm:gap-4">
      <dt className="text-sm font-semibold text-gray-700">{label}</dt>
      <dd className="break-all text-base text-gray-900 sm:col-span-2">
        {children}
      </dd>
    </div>
  );
}

/** 詳細を読み込んでいる間の表示 */
function DetailSkeleton() {
  return (
    <div role="status" aria-label="仕訳を読み込み中" className="space-y-6">
      <div className="h-6 w-56 animate-pulse rounded bg-gray-100 motion-reduce:animate-none" />
      <div className="h-96 w-full animate-pulse rounded-2xl bg-gray-100 motion-reduce:animate-none" />
    </div>
  );
}
