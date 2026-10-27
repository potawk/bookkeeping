import "server-only";
import type { AccountCategory } from "@/lib/accounts/categories";
import { getMonthRange } from "@/lib/dates";
import { fetchAllRows } from "@/lib/supabase/fetch-all";
import { createClient } from "@/lib/supabase/server";
import { isUuid } from "@/lib/uuid";
import type { Database } from "@/types/database.types";

/** 貸借区分（データベースの enum entry_side と同じ値） */
export type EntrySide = Database["public"]["Enums"]["entry_side"];

/** 仕訳フォームで選べる勘定科目と、その補助科目 */
export type JournalAccountOption = {
  id: string;
  name: string;
  category: AccountCategory;
  subAccounts: { id: string; name: string }[];
};

export type JournalLine = {
  side: EntrySide;
  accountId: string;
  accountName: string;
  subAccountId: string | null;
  subAccountName: string | null;
  amount: number;
};

export type Journal = {
  id: string;
  /** 日付（YYYY-MM-DD） */
  entryDate: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
  /** 仕訳明細（借方・貸方。表示順に並ぶ） */
  lines: JournalLine[];
};

export type MonthlyCalendarData = {
  /** 日付（YYYY-MM-DD）ごとの仕訳件数 */
  journalCounts: Record<string, number>;
  revenueTotal: number;
  expenseTotal: number;
};

const JOURNAL_COLUMNS =
  "id, entry_date, description, created_at, updated_at, journal_lines(side, amount, line_no, account_id, sub_account_id, accounts(name), sub_accounts(name))";

type JournalRow = {
  id: string;
  entry_date: string;
  description: string | null;
  created_at: string;
  updated_at: string;
  journal_lines: {
    side: EntrySide;
    amount: number;
    account_id: string;
    sub_account_id: string | null;
    accounts: { name: string };
    sub_accounts: { name: string } | null;
  }[];
};

function toJournal(row: JournalRow): Journal {
  return {
    id: row.id,
    entryDate: row.entry_date,
    description: row.description,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    lines: row.journal_lines.map((line) => ({
      side: line.side,
      accountId: line.account_id,
      accountName: line.accounts.name,
      subAccountId: line.sub_account_id,
      subAccountName: line.sub_accounts?.name ?? null,
      amount: line.amount,
    })),
  };
}

/** 仕訳フォームで選べる勘定科目（全区分・区分順）。RLS により本人の科目だけが返る */
export async function listJournalAccountOptions(): Promise<
  JournalAccountOption[]
> {
  const supabase = await createClient();
  // category は enum の定義順（資産・負債・純資産・収益・費用）で並ぶ
  const { data, error } = await supabase
    .from("accounts")
    .select("id, name, category, sub_accounts(id, name, sort_order)")
    .order("category")
    .order("sort_order")
    .order("name")
    .order("sort_order", { referencedTable: "sub_accounts" });

  if (error) throw error;

  return data.map((account) => ({
    id: account.id,
    name: account.name,
    category: account.category,
    subAccounts: account.sub_accounts.map((sub) => ({
      id: sub.id,
      name: sub.name,
    })),
  }));
}

/** 指定した日の仕訳一覧（登録順） */
export async function listJournalsByDate(date: string): Promise<Journal[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("journals")
    .select(JOURNAL_COLUMNS)
    .eq("entry_date", date)
    .order("created_at")
    .order("line_no", { referencedTable: "journal_lines" });

  if (error) throw error;
  return data.map(toJournal);
}

/** 仕訳を1件取得する。見つからなければ null */
export async function getJournal(id: string): Promise<Journal | null> {
  if (!isUuid(id)) return null;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("journals")
    .select(JOURNAL_COLUMNS)
    .eq("id", id)
    .order("line_no", { referencedTable: "journal_lines" })
    .maybeSingle();

  if (error) throw error;
  return data ? toJournal(data) : null;
}

/**
 * カレンダーに表示する月のデータ（日ごとの仕訳件数と、当月の収益合計・費用合計）。
 * 収益は「貸方－借方」、費用は「借方－貸方」で集計する（requirements.md 4.1）。
 */
export async function getMonthlyCalendarData(
  month: string,
): Promise<MonthlyCalendarData> {
  const { start, end } = getMonthRange(month);
  const supabase = await createClient();

  const [journals, lines] = await Promise.all([
    fetchAllRows((from, to) =>
      supabase
        .from("journals")
        .select("entry_date")
        .gte("entry_date", start)
        .lte("entry_date", end)
        .order("id")
        .range(from, to),
    ),
    fetchAllRows((from, to) =>
      supabase
        .from("journal_lines")
        // !inner: 結合先の条件（区分・日付）に合う明細だけに絞り込む
        .select(
          "side, amount, accounts!inner(category), journals!inner(entry_date)",
        )
        .in("accounts.category", ["revenue", "expense"])
        .gte("journals.entry_date", start)
        .lte("journals.entry_date", end)
        .order("id")
        .range(from, to),
    ),
  ]);

  const journalCounts: Record<string, number> = {};
  for (const journal of journals) {
    journalCounts[journal.entry_date] =
      (journalCounts[journal.entry_date] ?? 0) + 1;
  }

  let revenueTotal = 0;
  let expenseTotal = 0;
  for (const line of lines) {
    const signed = line.side === "debit" ? line.amount : -line.amount;
    if (line.accounts.category === "revenue") revenueTotal -= signed;
    if (line.accounts.category === "expense") expenseTotal += signed;
  }

  return { journalCounts, revenueTotal, expenseTotal };
}
