import type { Metadata } from "next";
import { PlaceholderPage } from "@/components/layout/placeholder-page";

export const metadata: Metadata = {
  title: "勘定科目",
};

/** 勘定科目一覧画面（/accounts）。勘定科目の管理はフェーズ 3 で実装する */
export default function AccountsPage() {
  return <PlaceholderPage title="勘定科目" />;
}
