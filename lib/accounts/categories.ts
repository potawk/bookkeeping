import type { Database } from "@/types/database.types";

/** 勘定科目の区分（データベースの enum account_category と同じ値） */
export type AccountCategory = Database["public"]["Enums"]["account_category"];

/** 区分の表示順と表示名（資産・負債・純資産・収益・費用） */
export const ACCOUNT_CATEGORIES: { value: AccountCategory; label: string }[] = [
  { value: "asset", label: "資産" },
  { value: "liability", label: "負債" },
  { value: "equity", label: "純資産" },
  { value: "revenue", label: "収益" },
  { value: "expense", label: "費用" },
];

export function isAccountCategory(value: unknown): value is AccountCategory {
  return ACCOUNT_CATEGORIES.some((category) => category.value === value);
}

export function getCategoryLabel(category: AccountCategory): string {
  return (
    ACCOUNT_CATEGORIES.find((item) => item.value === category)?.label ?? ""
  );
}
