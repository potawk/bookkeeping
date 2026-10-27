-- =============================================================
-- 決算書の集計関数
--
-- 指定した期間（開始日〜終了日、両端を含む）の仕訳明細を、勘定科目・補助科目ごとに
-- 借方合計・貸方合計で集計する。損益計算書・貸借対照表・カレンダーの当月集計で使う。
-- 区分ごとの増減方向（資産・費用は借方、負債・純資産・収益は貸方）の計算はアプリ側で行う。
-- SECURITY INVOKER（既定）のため、呼び出したユーザーの権限で動き、RLS により本人の仕訳だけが集計される。
--
-- 引数 p_start_date が null の場合は、終了日までのすべての仕訳を集計する。
-- =============================================================
create function public.get_journal_line_totals(
  p_start_date date,
  p_end_date date
)
returns table (
  account_id uuid,
  sub_account_id uuid,
  debit_total bigint,
  credit_total bigint
)
language sql
stable
set search_path = ''
as $$
  select
    lines.account_id,
    lines.sub_account_id,
    coalesce(sum(lines.amount) filter (where lines.side = 'debit'), 0)::bigint,
    coalesce(sum(lines.amount) filter (where lines.side = 'credit'), 0)::bigint
  from public.journal_lines as lines
  join public.journals as journals on journals.id = lines.journal_id
  where (p_start_date is null or journals.entry_date >= p_start_date)
    and journals.entry_date <= p_end_date
  group by lines.account_id, lines.sub_account_id;
$$;

-- ログインユーザーだけが呼び出せるようにする
revoke execute on function public.get_journal_line_totals(date, date) from public, anon;
grant execute on function public.get_journal_line_totals(date, date) to authenticated;
