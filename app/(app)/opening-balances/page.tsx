import type { Metadata } from "next";
import { PlaceholderPage } from "@/components/layout/placeholder-page";

export const metadata: Metadata = {
  title: "期首残高入力",
};

/** 期首残高入力画面（/opening-balances）。新規登録直後の移動先。入力機能はフェーズ 4 で実装する */
export default function OpeningBalancesPage() {
  return <PlaceholderPage title="期首残高入力" />;
}
