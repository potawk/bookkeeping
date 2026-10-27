import type { PostgrestError } from "@supabase/supabase-js";

/** Supabase（PostgREST）が1回の問い合わせで返す最大件数（既定の 1,000 件） */
const PAGE_SIZE = 1000;

/**
 * 1,000 件を超える可能性がある集計用の問い合わせを、ページに分けてすべて取得する。
 * fetchPage には range(from, to) と、順序を固定する order を付けた問い合わせを渡す。
 */
export async function fetchAllRows<T>(
  fetchPage: (
    from: number,
    to: number,
  ) => PromiseLike<{ data: T[] | null; error: PostgrestError | null }>,
): Promise<T[]> {
  const rows: T[] = [];
  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await fetchPage(from, from + PAGE_SIZE - 1);
    if (error) throw error;
    rows.push(...(data ?? []));
    if (!data || data.length < PAGE_SIZE) return rows;
  }
}
