-- =============================================================
-- 新規登録時の初期データ作成
--
-- auth.users に行が追加されたとき（サインアップ時）に、次を作成する。
-- ・プロフィール（サインアップ時に user_metadata.user_name に保存したユーザー名を移す）
-- ・標準の勘定科目（28科目。登録後はユーザーが自由に追加・編集・削除できる）
--
-- トリガーはログインユーザーの権限ではなく auth スキーマの処理から実行されるため、
-- SECURITY DEFINER で実行し、user_id は auth.uid() ではなく new.id を明示する。
-- =============================================================
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, user_name)
  values (
    new.id,
    -- ユーザー名が無い場合（ダッシュボードから作成した場合など）はメールアドレスの @ より前を使う
    left(
      coalesce(
        nullif(trim(new.raw_user_meta_data ->> 'user_name'), ''),
        split_part(new.email, '@', 1)
      ),
      20
    )
  );

  insert into public.accounts (user_id, name, category, sort_order)
  select new.id, template.name, template.category::public.account_category, template.sort_order
  from (
    values
      -- 資産
      ('現金', 'asset', 10),
      ('普通預金', 'asset', 20),
      ('定期預金', 'asset', 30),
      ('有価証券', 'asset', 40),
      ('立替金', 'asset', 50),
      -- 負債
      ('未払金', 'liability', 10),
      ('借入金', 'liability', 20),
      -- 純資産
      ('元入金', 'equity', 10),
      -- 収益
      ('給与', 'revenue', 10),
      ('賞与', 'revenue', 20),
      ('副業収入', 'revenue', 30),
      ('受取利息・配当', 'revenue', 40),
      ('雑収入', 'revenue', 50),
      -- 費用
      ('食費', 'expense', 10),
      ('日用品費', 'expense', 20),
      ('住居費', 'expense', 30),
      ('水道光熱費', 'expense', 40),
      ('通信費', 'expense', 50),
      ('交通費', 'expense', 60),
      ('保険料', 'expense', 70),
      ('医療費', 'expense', 80),
      ('教育費', 'expense', 90),
      ('交際費', 'expense', 100),
      ('趣味・娯楽費', 'expense', 110),
      ('衣服・美容費', 'expense', 120),
      ('税金・社会保険料', 'expense', 130),
      ('支払利息', 'expense', 140),
      ('雑費', 'expense', 150)
  ) as template (name, category, sort_order);

  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- トリガー専用の関数のため、API から直接呼び出せないようにする
revoke execute on function public.handle_new_user() from public, anon, authenticated;
