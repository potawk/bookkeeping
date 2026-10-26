import Link from "next/link";
import { LogoutButton } from "@/components/auth/logout-button";
import { APP_NAME } from "@/lib/constants";

/**
 * ログイン後の画面の共通レイアウト（ヘッダーにサービス名とログアウトボタン）。
 * 未ログインでのアクセスは proxy.ts でログイン画面へリダイレクトしている。
 */
export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="flex min-h-full flex-1 flex-col bg-white">
      <header className="border-b border-gray-300 bg-white">
        <div className="mx-auto flex w-full max-w-4xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          <Link
            href="/calendar"
            className="rounded-lg text-xl font-bold leading-snug text-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1"
          >
            {APP_NAME}
          </Link>
          <LogoutButton />
        </div>
      </header>
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
        {children}
      </main>
    </div>
  );
}
