import "server-only";
import { getMonthRange } from "@/lib/dates";
import { fetchAllRows } from "@/lib/supabase/fetch-all";
import { createClient } from "@/lib/supabase/server";
import { isUuid } from "@/lib/uuid";
import type { Database } from "@/types/database.types";

/** 貸借区分（データベースの enum entry_side と同じ値） */
export type EntrySide = Database["public"]["Enums"]["entry_side"];

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

/** 日付（YYYY-MM-DD）ごとの仕訳件数（カレンダーのバッジに表示する） */
export async function getJournalCountsByDate(
  month: string,
): Promise<Record<string, number>> {
  const { start, end } = getMonthRange(month);
  const supabase = await createClient();

  const journals = await fetchAllRows((from, to) =>
    supabase
      .from("journals")
      .select("entry_date")
      .gte("entry_date", start)
      .lte("entry_date", end)
      .order("id")
      .range(from, to),
  );

  const counts: Record<string, number> = {};
  for (const journal of journals) {
    counts[journal.entry_date] = (counts[journal.entry_date] ?? 0) + 1;
  }
  return counts;
}
