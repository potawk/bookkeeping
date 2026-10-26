import type { Metadata } from "next";
import { PlaceholderPage } from "@/components/layout/placeholder-page";

export const metadata: Metadata = {
  title: "カレンダー",
};

/** カレンダー画面（/calendar）。ログイン後のホーム。カレンダー機能はフェーズ 5 で実装する */
export default function CalendarPage() {
  return <PlaceholderPage title="カレンダー" />;
}
