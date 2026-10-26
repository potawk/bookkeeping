import Link from "next/link";
import { APP_NAME } from "@/lib/constants";

/** ログイン・新規登録画面の共通レイアウト（サービス名と中央寄せのカード） */
export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <main className="flex min-h-full flex-1 flex-col items-center justify-center bg-white px-4 py-12 sm:px-6">
      <div className="w-full max-w-md space-y-8">
        <Link
          href="/"
          className="block rounded-lg text-center text-3xl font-bold leading-tight text-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1"
        >
          {APP_NAME}
        </Link>
        <div className="rounded-2xl border border-gray-300 bg-white p-6 shadow-md sm:p-8">
          {children}
        </div>
      </div>
    </main>
  );
}
