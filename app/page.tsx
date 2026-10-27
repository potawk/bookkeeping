import Link from "next/link";
import type { ReactNode } from "react";
import { AppLogo } from "@/components/layout/app-logo";
import { ButtonLink } from "@/components/ui/button-link";
import { APP_NAME } from "@/lib/constants";

/** アプリの特徴（requirements.md「1.5 提供価値」をもとにした説明） */
const FEATURES: { title: string; description: string; icon: ReactNode }[] = [
  {
    title: "複式簿記で正確に記帳",
    description:
      "すべての取引を借方・貸方の仕訳で記録するので、収支と残高が必ず一致します。カード払いやローンも「未払金」「借入金」で実態どおりに記帳できます。",
    icon: <path d="M4 7h16M12 7v12M6 12h3M15 12h3" />,
  },
  {
    title: "損益計算書と貸借対照表",
    description:
      "好きな期間の損益計算書と、好きな日の貸借対照表を自動で作成。家計の「経営成績」と「財政状態」がひと目で分かります。",
    icon: <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />,
  },
  {
    title: "勘定科目を自由に設計",
    description:
      "勘定科目と補助科目（例：普通預金 → ○○銀行）を、自分の家計に合わせて追加・編集・削除できます。よく使う科目は最初から用意されています。",
    icon: <path d="M8 6h13M8 12h13M8 18h13M3 6h1M3 12h1M3 18h1" />,
  },
  {
    title: "カレンダーから入力、どの端末でも",
    description:
      "カレンダーで日付を選んで、その日の仕訳を登録します。ブラウザで動くので、スマホでも PC でも同じ帳簿を使えます。",
    icon: (
      <>
        <rect x="3" y="5" width="18" height="16" rx="2" />
        <path d="M3 10h18M8 3v4M16 3v4" />
      </>
    ),
  },
];

/** はじめ方（requirements.md「1.8 利用の流れ」） */
const STEPS = [
  {
    title: "新規登録",
    description:
      "メールアドレスとパスワードで登録します。標準の勘定科目が自動で用意されます。",
  },
  {
    title: "期首残高を入力",
    description:
      "利用を始める日の現金・預金などの資産と、カードの未払金などの負債を入力します。",
  },
  {
    title: "カレンダーから記帳",
    description:
      "日々の取引を仕訳で記録し、月末や年末に損益計算書・貸借対照表で家計を「決算」します。",
  },
];

/**
 * トップページ（/）。未ログインのユーザーが最初に見るページ。
 * ログイン済みで開いた場合は proxy.ts がカレンダー画面へリダイレクトする。
 */
export default function TopPage() {
  return (
    <div className="flex min-h-full flex-1 flex-col bg-white">
      <header className="border-b border-gray-300">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
          <Link
            href="/"
            className="rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1"
          >
            <AppLogo />
          </Link>
          <nav aria-label="アカウント" className="flex gap-2">
            <ButtonLink href="/signin" variant="secondary" size="sm">
              ログイン
            </ButtonLink>
            <ButtonLink
              href="/signup"
              size="sm"
              className="hidden sm:inline-flex"
            >
              新規登録
            </ButtonLink>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <section
          aria-labelledby="hero-heading"
          className="mx-auto w-full max-w-5xl px-4 py-16 text-center sm:px-6 sm:py-24 lg:px-8"
        >
          <p className="inline-block rounded-md border border-blue-700 px-3 py-1 text-sm font-medium text-blue-700">
            複式簿記で記帳する Web 家計簿
          </p>
          <h1
            id="hero-heading"
            className="mt-6 text-4xl font-bold leading-tight text-gray-900 sm:text-5xl"
          >
            家計を“決算”しよう
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-gray-700 sm:text-lg">
            {APP_NAME}{" "}
            は、企業会計と同じ複式簿記で記帳する家計簿です。お金の流れ（損益計算書）も、資産・負債の全体像（貸借対照表）も、まるごと見えるようになります。
          </p>
          <div className="mt-10 flex flex-col justify-center gap-3 sm:flex-row">
            <ButtonLink href="/signup">新規登録して始める</ButtonLink>
            <ButtonLink href="/signin" variant="secondary">
              ログイン
            </ButtonLink>
          </div>
        </section>

        <section
          aria-labelledby="features-heading"
          className="mx-auto w-full max-w-5xl px-4 pb-16 sm:px-6 lg:px-8"
        >
          <h2
            id="features-heading"
            className="text-center text-2xl font-semibold leading-snug text-gray-900 sm:text-3xl"
          >
            {APP_NAME} の特徴
          </h2>
          <ul className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2">
            {FEATURES.map((feature) => (
              <li
                key={feature.title}
                className="rounded-2xl border border-gray-300 bg-white p-6 shadow-md"
              >
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl border border-blue-200 bg-blue-100 text-blue-700">
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-6 w-6"
                  >
                    {feature.icon}
                  </svg>
                </span>
                <h3 className="mt-4 text-xl font-semibold leading-snug text-gray-900">
                  {feature.title}
                </h3>
                <p className="mt-2 text-base leading-relaxed text-gray-700">
                  {feature.description}
                </p>
              </li>
            ))}
          </ul>
        </section>

        <section
          aria-labelledby="steps-heading"
          className="mx-auto w-full max-w-5xl px-4 pb-16 sm:px-6 lg:px-8"
        >
          <h2
            id="steps-heading"
            className="text-center text-2xl font-semibold leading-snug text-gray-900 sm:text-3xl"
          >
            はじめ方
          </h2>
          <ol className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-3">
            {STEPS.map((step, index) => (
              <li
                key={step.title}
                className="rounded-2xl border border-gray-300 bg-white p-6"
              >
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-blue-700 text-lg font-bold text-white">
                  {index + 1}
                </span>
                <h3 className="mt-4 text-lg font-semibold leading-normal text-gray-900">
                  {step.title}
                </h3>
                <p className="mt-2 text-base leading-relaxed text-gray-700">
                  {step.description}
                </p>
              </li>
            ))}
          </ol>
        </section>

        <section
          aria-labelledby="cta-heading"
          className="mx-auto w-full max-w-5xl px-4 pb-16 sm:px-6 lg:px-8"
        >
          <div className="rounded-2xl border border-gray-300 bg-white p-8 text-center shadow-md sm:p-12">
            <h2
              id="cta-heading"
              className="text-2xl font-semibold leading-snug text-gray-900"
            >
              さっそく、家計の決算を始めましょう
            </h2>
            <p className="mt-3 text-base leading-relaxed text-gray-700">
              登録はメールアドレスとパスワードだけ。標準の勘定科目が用意されているので、すぐに記帳を始められます。
            </p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <ButtonLink href="/signup">新規登録して始める</ButtonLink>
              <ButtonLink href="/signin" variant="secondary">
                ログイン
              </ButtonLink>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-gray-300">
        <p className="mx-auto w-full max-w-5xl px-4 py-6 text-center text-sm text-gray-600 sm:px-6 lg:px-8">
          {APP_NAME} ― 複式簿記で記帳する Web 家計簿
        </p>
      </footer>
    </div>
  );
}
