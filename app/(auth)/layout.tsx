import Link from "next/link";
import { AppLogo } from "@/components/layout/app-logo";

/** ログイン・新規登録画面の共通レイアウト（ロゴ・サービス名と中央寄せのカード）。ロゴはトップページへのリンク */
export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <main className="flex min-h-full flex-1 flex-col items-center justify-center bg-white px-4 py-12 sm:px-6">
      <div className="w-full max-w-md space-y-8">
        <Link
          href="/"
          className="mx-auto flex w-fit rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1"
        >
          <AppLogo size="lg" />
        </Link>
        <div className="rounded-2xl border border-gray-300 bg-white p-6 shadow-md sm:p-8">
          {children}
        </div>
      </div>
    </main>
  );
}
