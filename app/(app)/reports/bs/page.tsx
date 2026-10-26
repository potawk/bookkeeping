import type { Metadata } from "next";
import { PlaceholderPage } from "@/components/layout/placeholder-page";

export const metadata: Metadata = {
  title: "貸借対照表",
};

/** 貸借対照表画面（/reports/bs）。集計・表示はフェーズ 6 で実装する */
export default function BalanceSheetPage() {
  return <PlaceholderPage title="貸借対照表" />;
}
