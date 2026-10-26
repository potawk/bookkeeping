import type { Metadata } from "next";
import { Suspense } from "react";
import { getCurrentUser } from "@/lib/auth/user";
import { formatDate } from "@/lib/format";

export const metadata: Metadata = {
  title: "マイページ",
};

/**
 * マイページ（/mypage）。現時点ではユーザー情報の表示のみ。
 * ユーザー情報の編集・期首残高入力へのリンクなどはフェーズ 7 で実装する。
 */
export default function MyPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-semibold leading-tight text-gray-900">
        マイページ
      </h1>
      {/* ユーザー情報はリクエストごとに Cookie から読むため、Suspense の内側で取得する */}
      <Suspense fallback={<UserInfoSkeleton />}>
        <UserInfo />
      </Suspense>
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
          <div
            key={row.label}
            className="grid grid-cols-1 gap-1 py-3 sm:grid-cols-3 sm:gap-4"
          >
            <dt className="text-sm font-semibold text-gray-700">{row.label}</dt>
            <dd className="break-all text-base text-gray-900 sm:col-span-2">
              {row.value}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

/** ユーザー情報を読み込んでいる間の表示 */
function UserInfoSkeleton() {
  return (
    <div
      role="status"
      aria-label="ユーザー情報を読み込み中"
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
