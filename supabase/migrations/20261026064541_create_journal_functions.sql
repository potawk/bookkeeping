-- =============================================================
-- 仕訳の保存関数
--
-- 仕訳（journals）と仕訳明細（journal_lines）を1回の呼び出し（1トランザクション）で
-- 登録・更新する。途中で失敗した場合はすべて取り消される。
-- SECURITY INVOKER（既定）のため、呼び出したユーザーの権限で動き、RLS が適用される。
--
-- 引数 p_lines の形式（JSON 配列）:
--   [{"side": "debit", "account_id": "...", "sub_account_id": null, "amount": 1000}, ...]
-- =============================================================
create function public.save_journal(
  p_journal_id uuid,
  p_entry_date date,
  p_description text,
  p_lines jsonb
)
returns uuid
language plpgsql
set search_path = ''
as $$
declare
  saved_journal_id uuid;
  debit_total bigint;
  credit_total bigint;
begin
  if p_entry_date is null then
    raise exception '日付を入力してください。' using errcode = 'check_violation';
  end if;

  if jsonb_typeof(p_lines) <> 'array' or jsonb_array_length(p_lines) < 2 then
    raise exception '仕訳明細は借方・貸方をそれぞれ1行以上入力してください。'
      using errcode = 'check_violation';
  end if;

  select
    coalesce(sum((line ->> 'amount')::bigint) filter (where line ->> 'side' = 'debit'), 0),
    coalesce(sum((line ->> 'amount')::bigint) filter (where line ->> 'side' = 'credit'), 0)
  into debit_total, credit_total
  from jsonb_array_elements(p_lines) as line;

  if debit_total = 0 or credit_total = 0 then
    raise exception '仕訳明細は借方・貸方をそれぞれ1行以上入力してください。'
      using errcode = 'check_violation';
  end if;

  if debit_total <> credit_total then
    raise exception '借方合計（%）と貸方合計（%）が一致しません。', debit_total, credit_total
      using errcode = 'check_violation';
  end if;

  if p_journal_id is null then
    -- 新規登録（user_id は DEFAULT auth.uid() で本人の ID が入る）
    insert into public.journals (entry_date, description)
    values (p_entry_date, nullif(trim(p_description), ''))
    returning id into saved_journal_id;
  else
    -- 更新（RLS により本人の仕訳以外は対象にならない）
    update public.journals
    set entry_date = p_entry_date,
        description = nullif(trim(p_description), '')
    where id = p_journal_id
    returning id into saved_journal_id;

    if saved_journal_id is null then
      raise exception '仕訳が見つかりません。' using errcode = 'no_data_found';
    end if;

    delete from public.journal_lines where journal_id = saved_journal_id;
  end if;

  insert into public.journal_lines (journal_id, side, account_id, sub_account_id, amount, line_no)
  select
    saved_journal_id,
    (line ->> 'side')::public.entry_side,
    (line ->> 'account_id')::uuid,
    nullif(line ->> 'sub_account_id', '')::uuid,
    (line ->> 'amount')::bigint,
    (ordinality - 1)::smallint
  from jsonb_array_elements(p_lines) with ordinality as lines(line, ordinality);

  return saved_journal_id;
end;
$$;

-- ログインユーザーだけが呼び出せるようにする
revoke execute on function public.save_journal(uuid, date, text, jsonb) from public, anon;
grant execute on function public.save_journal(uuid, date, text, jsonb) to authenticated;
