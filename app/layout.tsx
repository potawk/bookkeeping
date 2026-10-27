import type { Metadata } from "next";
import { APP_NAME } from "@/lib/constants";
import "./globals.css";

export const metadata: Metadata = {
  // 各ページの title は「ログイン | サービス名」のように表示する
  title: { default: APP_NAME, template: `%s | ${APP_NAME}` },
  description:
    "企業会計と同じ複式簿記で、お金の流れも資産・負債の全体像も見える家計簿",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // フォントは Tailwind の標準（端末のシステムフォント）を使う。日本語も各端末の読みやすい書体で表示される
    <html lang="ja" className="h-full antialiased">
      <body className="flex min-h-full flex-col bg-white text-gray-900">
        {children}
      </body>
    </html>
  );
}
