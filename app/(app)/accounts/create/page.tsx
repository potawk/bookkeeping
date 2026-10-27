import type { Metadata } from "next";
import { Suspense } from "react";
import { AccountForm } from "@/components/accounts/account-form";
import { createAccount } from "@/lib/accounts/actions";
import { isAccountCategory } from "@/lib/accounts/categories";

export const metadata: Metadata = {
  title: "勘定科目の作成",
};

/** 勘定科目作成画面（/accounts/create?category=asset など） */
export default function CreateAccountPage({
  searchParams,
}: PageProps<"/accounts/create">) {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-semibold leading-tight text-gray-900">
        勘定科目の作成
      </h1>
      <div className="rounded-2xl border border-gray-300 bg-white p-6 shadow-md">
        {/* 一覧で選んでいた区分（searchParams）を初期値にするため、Suspense の内側で読む */}
        <Suspense>
          <CreateAccountForm searchParams={searchParams} />
        </Suspense>
      </div>
    </div>
  );
}

async function CreateAccountForm({
  searchParams,
}: {
  searchParams: PageProps<"/accounts/create">["searchParams"];
}) {
  const { category: rawCategory } = await searchParams;
  const category = isAccountCategory(rawCategory) ? rawCategory : "asset";

  return (
    <AccountForm
      action={createAccount}
      defaultValues={{ name: "", category }}
      submitLabel="作成"
      pendingLabel="作成中…"
      cancelHref={`/accounts?category=${category}`}
    />
  );
}
