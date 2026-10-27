import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { CategoryTabs } from "@/components/accounts/category-tabs";
import { ButtonLink } from "@/components/ui/button-link";
import {
  getCategoryLabel,
  isAccountCategory,
  type AccountCategory,
} from "@/lib/accounts/categories";
import { listAccounts } from "@/lib/accounts/queries";

export const metadata: Metadata = {
  title: "勘定科目",
};

/** 勘定科目一覧画面（/accounts?category=asset など） */
export default function AccountsPage({ searchParams }: PageProps<"/accounts">) {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-semibold leading-tight text-gray-900">
        勘定科目
      </h1>
      {/* 区分（searchParams）と勘定科目はリクエストごとに読むため、Suspense の内側で取得する */}
      <Suspense fallback={<ListSkeleton />}>
        <AccountsContent searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function AccountsContent({
  searchParams,
}: {
  searchParams: PageProps<"/accounts">["searchParams"];
}) {
  const { category: rawCategory } = await searchParams;
  // 区分の指定がない・不正な場合は「資産」を表示する
  const category: AccountCategory = isAccountCategory(rawCategory)
    ? rawCategory
    : "asset";
  const accounts = await listAccounts(category);

  return (
    <div className="space-y-6">
      <CategoryTabs current={category} />
      <div className="flex justify-end">
        <ButtonLink href={`/accounts/create?category=${category}`}>
          勘定科目を作成
        </ButtonLink>
      </div>
      {accounts.length === 0 ? (
        <p className="text-base leading-relaxed text-gray-700">
          {getCategoryLabel(category)}の勘定科目はまだありません。
        </p>
      ) : (
        <ul className="divide-y divide-gray-200 overflow-hidden rounded-2xl border border-gray-300 bg-white shadow-md">
          {accounts.map((account) => (
            <li key={account.id}>
              <Link
                href={`/accounts/${account.id}`}
                className="flex min-h-14 items-center justify-between gap-4 px-5 py-3 transition-colors duration-150 ease-in-out hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500"
              >
                <span className="text-base font-semibold text-gray-900">
                  {account.name}
                </span>
                <span className="shrink-0 rounded-md border border-gray-300 px-2 py-1 text-sm font-medium text-gray-700">
                  補助科目 {account.subAccountCount}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** 一覧を読み込んでいる間の表示 */
function ListSkeleton() {
  return (
    <div role="status" aria-label="勘定科目を読み込み中" className="space-y-4">
      <div className="h-11 w-full animate-pulse rounded-lg bg-gray-100 motion-reduce:animate-none" />
      {[0, 1, 2, 3].map((i) => (
        <div
          key={i}
          className="h-14 w-full animate-pulse rounded-lg bg-gray-100 motion-reduce:animate-none"
        />
      ))}
    </div>
  );
}
