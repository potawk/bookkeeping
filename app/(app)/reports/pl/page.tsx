import type { Metadata } from "next";
import { PlaceholderPage } from "@/components/layout/placeholder-page";

export const metadata: Metadata = {
  title: "損益計算書",
};

/** 損益計算書画面（/reports/pl）。集計・表示はフェーズ 6 で実装する */
export default function ProfitAndLossPage() {
  return <PlaceholderPage title="損益計算書" />;
}
