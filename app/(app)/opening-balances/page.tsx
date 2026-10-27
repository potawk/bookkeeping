import type { Metadata } from "next";
import { Suspense } from "react";
import { OpeningBalanceForm } from "@/components/opening-balances/opening-balance-form";
import { getCurrentUser } from "@/lib/auth/user";
import { getOpeningBalanceFormData } from "@/lib/opening-balances/queries";

export const metadata: Metadata = {
  title: "期首残高入力",
};

/** 期首残高入力画面（/opening-balances）。新規登録直後の移動先 */
export default function OpeningBalancesPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-semibold leading-tight text-gray-900">
        期首残高入力
      </h1>
      {/* ログインユーザーの期首残高はリクエストごとに読むため、Suspense の内側で取得する */}
      <Suspense fallback={<FormSkeleton />}>
        <OpeningBalanceContent />
      </Suspense>
    </div>
  );
}

async function OpeningBalanceContent() {
  const user = await getCurrentUser();
  const data = await getOpeningBalanceFormData(user.id);

  return (
    <div className="space-y-6">
      {data.openingDate === null && (
        // 新規登録直後（期首残高が未登録）の案内
        <section
          aria-labelledby="opening-guide-heading"
          className="space-y-2 rounded-2xl border border-blue-700 bg-white p-6"
        >
          <h2
            id="opening-guide-heading"
            className="text-lg font-semibold leading-normal text-blue-800"
          >
            はじめに、今の資産と負債を入力しましょう
          </h2>
          <p className="text-base leading-relaxed text-gray-700">
            利用を始める日（期首日）の時点で持っている現金・預金などの資産と、カードの未払金・ローンなどの負債を入力してください。資産合計と負債合計の差額は、純資産（元入金）として自動で計上されます。
          </p>
          <p className="text-sm leading-relaxed text-gray-600">
            補助科目（例：普通預金 →
            ○○銀行）ごとに入力したい場合は、先に「勘定科目」の画面で補助科目を追加してください。
          </p>
        </section>
      )}
      <OpeningBalanceForm
        openingDate={data.openingDate}
        accounts={data.accounts}
        rows={data.rows}
      />
    </div>
  );
}

/** フォームを読み込んでいる間の表示 */
function FormSkeleton() {
  return (
    <div role="status" aria-label="期首残高を読み込み中" className="space-y-6">
      <div className="h-12 w-64 animate-pulse rounded-lg bg-gray-100 motion-reduce:animate-none" />
      <div className="h-48 w-full animate-pulse rounded-2xl bg-gray-100 motion-reduce:animate-none" />
      <div className="h-48 w-full animate-pulse rounded-2xl bg-gray-100 motion-reduce:animate-none" />
    </div>
  );
}
