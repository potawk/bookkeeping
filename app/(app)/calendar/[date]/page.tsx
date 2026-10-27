import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ButtonLink } from "@/components/ui/button-link";
import { TextLink } from "@/components/ui/text-link";
import { addDays, isValidDate, toMonth } from "@/lib/dates";
import { formatDateWithWeekday, formatYen } from "@/lib/format";
import { formatSideAccounts, getJournalAmount } from "@/lib/journals/display";
import { listJournalsByDate, type Journal } from "@/lib/journals/queries";

export const metadata: Metadata = {
  title: "日別仕訳一覧",
};

/** 日別仕訳一覧画面（/calendar/2026-10-27 など）。カレンダーで選んだ日の仕訳を表示する */
export default function DailyJournalsPage({
  params,
}: PageProps<"/calendar/[date]">) {
  return (
    <Suspense fallback={<ListSkeleton />}>
      <DailyJournalsContent params={params} />
    </Suspense>
  );
}

async function DailyJournalsContent({
  params,
}: {
  params: PageProps<"/calendar/[date]">["params"];
}) {
  const { date } = await params;
  if (!isValidDate(date)) notFound();

  const journals = await listJournalsByDate(date);
  const previousDate = addDays(date, -1);
  const nextDate = addDays(date, 1);

  return (
    <div className="space-y-6">
      {/* inline-block: 親の space-y の余白（下マージン）を効かせる */}
      <TextLink
        href={`/calendar?month=${toMonth(date)}`}
        className="inline-block"
      >
        ← カレンダーへ戻る
      </TextLink>

      <div className="flex items-center justify-between gap-2">
        <ButtonLink
          href={`/calendar/${previousDate}`}
          variant="secondary"
          size="sm"
          aria-label={`前日（${formatDateWithWeekday(previousDate)}）`}
        >
          ← 前日
        </ButtonLink>
        <h1 className="text-center text-xl font-semibold leading-snug text-gray-900 sm:text-3xl sm:leading-tight">
          {formatDateWithWeekday(date)}
        </h1>
        <ButtonLink
          href={`/calendar/${nextDate}`}
          variant="secondary"
          size="sm"
          aria-label={`翌日（${formatDateWithWeekday(nextDate)}）`}
        >
          翌日 →
        </ButtonLink>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-2xl font-semibold leading-snug text-gray-900">
          仕訳一覧
          <span className="ml-2 text-base font-medium text-gray-700">
            {journals.length}件
          </span>
        </h2>
        <ButtonLink href={`/journals/create?date=${date}`}>
          ＋ 仕訳を追加
        </ButtonLink>
      </div>

      {journals.length === 0 ? (
        <p className="rounded-2xl border border-gray-300 bg-white p-6 text-base leading-relaxed text-gray-700">
          この日の仕訳はありません。「仕訳を追加」から登録してください。
        </p>
      ) : (
        <ul className="space-y-4">
          {journals.map((journal) => (
            <li key={journal.id}>
              <JournalCard journal={journal} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** 仕訳一覧の1件（押すと仕訳詳細へ移動する） */
function JournalCard({ journal }: { journal: Journal }) {
  return (
    <Link
      href={`/journals/${journal.id}`}
      className="block rounded-2xl border border-gray-300 bg-white p-5 shadow-md transition duration-150 ease-in-out hover:border-gray-400 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1"
    >
      <div className="flex items-start justify-between gap-4">
        <dl className="grid min-w-0 grid-cols-[auto_1fr] gap-x-3 gap-y-1">
          <dt className="text-sm font-semibold leading-6 text-gray-600">
            借方
          </dt>
          <dd className="break-all text-base font-semibold text-gray-900">
            {formatSideAccounts(journal, "debit")}
          </dd>
          <dt className="text-sm font-semibold leading-6 text-gray-600">
            貸方
          </dt>
          <dd className="break-all text-base font-semibold text-gray-900">
            {formatSideAccounts(journal, "credit")}
          </dd>
        </dl>
        <p className="shrink-0 text-lg font-bold text-gray-900">
          {formatYen(getJournalAmount(journal))}
        </p>
      </div>
      {journal.description && (
        <p className="mt-3 break-all text-sm leading-relaxed text-gray-700">
          {journal.description}
        </p>
      )}
    </Link>
  );
}

/** 一覧を読み込んでいる間の表示 */
function ListSkeleton() {
  return (
    <div role="status" aria-label="仕訳一覧を読み込み中" className="space-y-6">
      <div className="h-12 w-full animate-pulse rounded-lg bg-gray-100 motion-reduce:animate-none" />
      <div className="h-24 w-full animate-pulse rounded-2xl bg-gray-100 motion-reduce:animate-none" />
      <div className="h-24 w-full animate-pulse rounded-2xl bg-gray-100 motion-reduce:animate-none" />
    </div>
  );
}
