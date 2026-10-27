import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { AccountForm } from "@/components/accounts/account-form";
import { updateAccount } from "@/lib/accounts/actions";
import { getAccountDetail } from "@/lib/accounts/queries";

export const metadata: Metadata = {
  title: "勘定科目の編集",
};

/** 勘定科目編集画面（/accounts/[id]/edit） */
export default function EditAccountPage({
  params,
}: PageProps<"/accounts/[id]/edit">) {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-semibold leading-tight text-gray-900">
        勘定科目の編集
      </h1>
      <div className="rounded-2xl border border-gray-300 bg-white p-6 shadow-md">
        <Suspense>
          <EditAccountForm params={params} />
        </Suspense>
      </div>
    </div>
  );
}

async function EditAccountForm({
  params,
}: {
  params: PageProps<"/accounts/[id]/edit">["params"];
}) {
  const { id } = await params;
  const account = await getAccountDetail(id);
  if (!account) notFound();

  return (
    <AccountForm
      action={updateAccount.bind(null, account.id)}
      defaultValues={{ name: account.name, category: account.category }}
      categoryLocked={account.inUse}
      submitLabel="保存"
      pendingLabel="保存中…"
      cancelHref={`/accounts/${account.id}`}
    />
  );
}
