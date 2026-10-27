-- =============================================================
-- 期首残高の保存関数
--
-- 期首日（profiles.opening_date）と期首残高（opening_balances）を、1回の呼び出し
-- （1トランザクション）で丸ごと置き換える。途中で失敗した場合はすべて取り消される。
-- SECURITY INVOKER（既定）のため、呼び出したユーザーの権限で動き、RLS が適用される。
--
-- 引数 p_rows の形式（JSON 配列）:
--   [{"account_id": "...", "sub_account_id": null, "amount": 100000}, ...]
-- =============================================================
create function public.save_opening_balances(
  p_opening_date date,
  p_rows jsonb
)
returns void
language plpgsql
set search_path = ''
as $$
begin
  if p_opening_date is null then
    raise exception '期首日を入力してください。' using errcode = 'check_violation';
  end if;

  if jsonb_typeof(p_rows) <> 'array' then
    raise exception '期首残高の形式が正しくありません。' using errcode = 'check_violation';
  end if;

  update public.profiles
  set opening_date = p_opening_date
  where id = auth.uid();

  if not found then
    raise exception 'ユーザー情報が見つかりません。' using errcode = 'no_data_found';
  end if;

  -- 本人の期首残高をすべて削除してから、送られてきた行を登録し直す
  delete from public.opening_balances where user_id = auth.uid();

  insert into public.opening_balances (account_id, sub_account_id, amount)
  select
    (row_data ->> 'account_id')::uuid,
    nullif(row_data ->> 'sub_account_id', '')::uuid,
    (row_data ->> 'amount')::bigint
  from jsonb_array_elements(p_rows) as row_data;
end;
$$;

-- ログインユーザーだけが呼び出せるようにする
revoke execute on function public.save_opening_balances(date, jsonb) from public, anon;
grant execute on function public.save_opening_balances(date, jsonb) to authenticated;
