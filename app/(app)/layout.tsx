import Link from "next/link";
import { LogoutButton } from "@/components/auth/logout-button";
import { AppLogo } from "@/components/layout/app-logo";
import {
  BottomNavigation,
  SidebarNavigation,
} from "@/components/layout/app-navigation";

/**
 * ログイン後の画面の共通レイアウト。
 * - ヘッダー：サービス名とログアウトボタン（画面上部に固定）
 * - ナビゲーションメニュー：PC は左サイドバー、スマホは画面下部に固定
 * 未ログインでのアクセスは proxy.ts でログイン画面へリダイレクトしている。
 */
export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="flex min-h-full flex-1 flex-col bg-white">
      <header className="sticky top-0 z-20 border-b border-gray-300 bg-white">
        <div className="flex items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          <Link
            href="/calendar"
            className="rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1"
          >
            <AppLogo />
          </Link>
          <LogoutButton />
        </div>
      </header>
      <div className="flex flex-1">
        <SidebarNavigation />
        {/* スマホでは下部メニューに本文が隠れないよう、下に余白を取る */}
        <main className="w-full min-w-0 flex-1 pb-24 md:pb-0">
          <div className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
            {children}
          </div>
        </main>
      </div>
      <BottomNavigation />
    </div>
  );
}
