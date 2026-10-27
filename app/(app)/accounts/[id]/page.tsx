import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { SubAccountList } from "@/components/accounts/sub-account-list";
import { ButtonLink } from "@/components/ui/button-link";
import { ConfirmDeleteDialog } from "@/components/ui/confirm-delete-dialog";
import { TextLink } from "@/components/ui/text-link";
import { deleteAccount } from "@/lib/accounts/actions";
import { getCategoryLabel } from "@/lib/accounts/categories";
import { getAccountDetail } from "@/lib/accounts/queries";

export const metadata: Metadata = {
  title: "勘定科目の詳細",
};

/** 勘定科目詳細画面（/accounts/[id]）。補助科目の追加・編集・削除もここで行う */
export default function AccountDetailPage({
  params,
}: PageProps<"/accounts/[id]">) {
  return (
    <Suspense fallback={<DetailSkeleton />}>
      <AccountDetailContent params={params} />
    </Suspense>
  );
}

async function AccountDetailContent({
  params,
}: {
  params: PageProps<"/accounts/[id]">["params"];
}) {
  const { id } = await params;
  const account = await getAccountDetail(id);
  if (!account) notFound();

  return (
    <div className="space-y-8">
      {/* inline-block: 親の space-y の余白（下マージン）を効かせる */}
      <TextLink
        href={`/accounts?category=${account.category}`}
        className="inline-block"
      >
        ← {getCategoryLabel(account.category)}の勘定科目一覧へ戻る
      </TextLink>

      <section className="space-y-6 rounded-2xl border border-gray-300 bg-white p-6 shadow-md">
        <div className="space-y-2">
          <span className="inline-block rounded-md border border-blue-700 px-2 py-1 text-sm font-medium text-blue-700">
            {getCategoryLabel(account.category)}
          </span>
          <h1 className="break-all text-3xl font-semibold leading-tight text-gray-900">
            {account.name}
          </h1>
        </div>
        {account.inUse && (
          <p className="text-sm leading-relaxed text-gray-600">
            この勘定科目は仕訳または期首残高で使用中のため、削除と区分の変更はできません。
          </p>
        )}
        <div className="flex flex-wrap gap-3">
          <ButtonLink
            href={`/accounts/${account.id}/edit`}
            variant="secondary"
            size="sm"
          >
            編集
          </ButtonLink>
          {!account.inUse && (
            <ConfirmDeleteDialog
              action={deleteAccount.bind(null, account.id)}
              triggerLabel="削除"
              title="勘定科目の削除"
              description={`勘定科目「${account.name}」を削除します。登録されている補助科目もすべて削除されます。この操作は取り消せません。`}
            />
          )}
        </div>
      </section>

      <section aria-labelledby="sub-accounts-heading" className="space-y-4">
        <h2
          id="sub-accounts-heading"
          className="text-2xl font-semibold leading-snug text-gray-900"
        >
          補助科目
        </h2>
        <SubAccountList
          accountId={account.id}
          subAccounts={account.subAccounts}
        />
      </section>
    </div>
  );
}

/** 詳細を読み込んでいる間の表示 */
function DetailSkeleton() {
  return (
    <div role="status" aria-label="勘定科目を読み込み中" className="space-y-6">
      <div className="h-40 w-full animate-pulse rounded-2xl bg-gray-100 motion-reduce:animate-none" />
      <div className="h-32 w-full animate-pulse rounded-2xl bg-gray-100 motion-reduce:animate-none" />
    </div>
  );
}
