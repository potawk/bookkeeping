"use client";

import { usePathname } from "next/navigation";
import { NavLinks } from "./nav-links";

/**
 * 現在のページをアクティブ表示するナビゲーションメニュー。
 * usePathname は URL にリクエスト時まで分からない値（/calendar/[date] など）を含むと
 * 処理を中断するため、呼び出し側で <Suspense> に囲み、fallback に NavLinks を表示すること。
 */
export function ActiveNavLinks({ variant }: { variant: "sidebar" | "bottom" }) {
  const pathname = usePathname();
  return <NavLinks variant={variant} pathname={pathname} />;
}
