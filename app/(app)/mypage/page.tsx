import type { Metadata } from "next";
import { Suspense } from "react";
import { LogoutButton } from "@/components/auth/logout-button";
import { ProfileForm } from "@/components/mypage/profile-form";
import { ButtonLink } from "@/components/ui/button-link";
import { getCurrentUser } from "@/lib/auth/user";
import { formatDate, formatYen } from "@/lib/format";
import { getOpeningBalanceSummary } from "@/lib/opening-balances/queries";

export const metadata: Metadata = {
  title: "マイページ",
};

/**
 * マイページ（/mypage）。ユーザー情報の表示・編集、期首残高の概要と期首残高入力画面へのリンク、ログアウトボタンを置く。
 */
export default function MyPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-semibold leading-tight text-gray-900">
        マイページ
      </h1>
      {/* ユーザー情報・期首残高はリクエストごとに Cookie から読むため、Suspense の内側で取得する */}
      <Suspense fallback={<SectionSkeleton label="ユーザー情報を読み込み中" />}>
        <UserInfo />
      </Suspense>
      <Suspense
        fallback={
          <SectionSkeleton label="ユーザー情報の編集フォームを読み込み中" />
        }
      >
        <ProfileEdit />
      </Suspense>
      <Suspense fallback={<SectionSkeleton label="期首残高を読み込み中" />}>
        <OpeningBalanceInfo />
      </Suspense>
      <section
        aria-labelledby="logout-heading"
        className="flex flex-col gap-4 rounded-2xl border border-gray-300 bg-white p-6 shadow-md sm:flex-row sm:items-center sm:justify-between"
      >
        <div className="space-y-1">
          <h2
            id="logout-heading"
            className="text-xl font-semibold leading-snug text-gray-900"
          >
            ログアウト
          </h2>
          <p className="text-sm leading-relaxed text-gray-600">
            ログアウトすると、ログイン画面に戻ります。
          </p>
        </div>
        <LogoutButton />
      </section>
    </div>
  );
}

/** ユーザー情報の編集フォーム（現在のユーザー名・メールアドレスを初期値にする） */
async function ProfileEdit() {
  const user = await getCurrentUser();

  return (
    <section
      aria-labelledby="profile-edit-heading"
      className="rounded-2xl border border-gray-300 bg-white p-6 shadow-md"
    >
      <h2
        id="profile-edit-heading"
        className="mb-4 text-xl font-semibold leading-snug text-gray-900"
      >
        ユーザー情報の編集
      </h2>
      <ProfileForm
        defaultValues={{ userName: user.userName, email: user.email }}
      />
    </section>
  );
}

/** 期首残高の概要（期首日・資産合計・負債合計・純資産）と、期首残高入力画面へのリンク */
async function OpeningBalanceInfo() {
  const user = await getCurrentUser();
  const summary = await getOpeningBalanceSummary(user.id);

  return (
    <section
      aria-labelledby="opening-balance-heading"
      className="rounded-2xl border border-gray-300 bg-white p-6 shadow-md"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2
          id="opening-balance-heading"
          className="text-xl font-semibold leading-snug text-gray-900"
        >
          期首残高
        </h2>
        <ButtonLink href="/opening-balances" variant="secondary" size="sm">
          {summary.openingDate ? "期首残高を編集" : "期首残高を入力"}
        </ButtonLink>
      </div>
      {summary.openingDate ? (
        <dl className="mt-4 divide-y divide-gray-200">
          <InfoRow label="期首日" value={formatDate(summary.openingDate)} />
          <InfoRow label="資産合計" value={formatYen(summary.assetTotal)} />
          <InfoRow label="負債合計" value={formatYen(summary.liabilityTotal)} />
          <InfoRow
            label="純資産（元入金）"
            value={formatYen(summary.capital)}
          />
        </dl>
      ) : (
        <p className="mt-4 text-base leading-relaxed text-gray-700">
          期首残高はまだ登録されていません。利用を始める日の資産と負債を入力してください。
        </p>
      )}
    </section>
  );
}

/** ユーザー情報・期首残高の1行 */
function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-1 gap-1 py-3 sm:grid-cols-3 sm:gap-4">
      <dt className="text-sm font-semibold text-gray-700">{label}</dt>
      <dd className="break-all text-base text-gray-900 sm:col-span-2">
        {value}
      </dd>
    </div>
  );
}

async function UserInfo() {
  const user = await getCurrentUser();

  const rows = [
    { label: "ユーザー名", value: user.userName },
    { label: "メールアドレス", value: user.email },
    { label: "登録日", value: formatDate(user.createdAt) },
  ];

  return (
    <section
      aria-labelledby="user-info-heading"
      className="rounded-2xl border border-gray-300 bg-white p-6 shadow-md"
    >
      <h2
        id="user-info-heading"
        className="text-xl font-semibold leading-snug text-gray-900"
      >
        ユーザー情報
      </h2>
      <dl className="mt-4 divide-y divide-gray-200">
        {rows.map((row) => (
          <InfoRow key={row.label} label={row.label} value={row.value} />
        ))}
      </dl>
    </section>
  );
}

/** 各欄を読み込んでいる間の表示 */
function SectionSkeleton({ label }: { label: string }) {
  return (
    <div
      role="status"
      aria-label={label}
      className="rounded-2xl border border-gray-300 bg-white p-6 shadow-md"
    >
      <div className="h-6 w-32 animate-pulse rounded bg-gray-100 motion-reduce:animate-none" />
      <div className="mt-6 space-y-4">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="h-5 w-full animate-pulse rounded bg-gray-100 motion-reduce:animate-none"
          />
        ))}
      </div>
    </div>
  );
}
