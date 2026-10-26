-- =============================================================
-- 初期スキーマ：プロフィール・勘定科目・補助科目・期首残高・仕訳・仕訳明細
--
-- ・全テーブルに user_id を持たせ、RLS で本人のデータだけを参照・操作できるようにする
-- ・テーブル間の参照は (id, user_id) の複合外部キーにし、他人の勘定科目などを
--   参照できないようにする（外部キーの検査は RLS を経由しないため）
-- ・仕訳や期首残高で使用中の勘定科目・補助科目は ON DELETE RESTRICT で削除できない
-- =============================================================

-- 勘定科目の区分（資産・負債・純資産・収益・費用）
create type public.account_category as enum (
  'asset',
  'liability',
  'equity',
  'revenue',
  'expense'
);

-- 仕訳明細の貸借区分（借方・貸方）
create type public.entry_side as enum ('debit', 'credit');

-- 更新日時を自動で更新するトリガー関数
create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- -------------------------------------------------------------
-- プロフィール（auth.users と 1対1。新規登録時にトリガーで作成する）
-- -------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  user_name text not null check (char_length(user_name) between 1 and 20),
  -- 期首残高の基準日（利用開始日）。期首残高を登録するまでは NULL
  opening_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

-- -------------------------------------------------------------
-- 勘定科目
-- -------------------------------------------------------------
create table public.accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 20),
  category public.account_category not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- 科目名はユーザー内でユニーク
  unique (user_id, name),
  -- 複合外部キーの参照先
  unique (id, user_id)
);

create index accounts_user_id_category_idx on public.accounts (user_id, category, sort_order);

create trigger set_accounts_updated_at
before update on public.accounts
for each row execute function public.set_updated_at();

-- -------------------------------------------------------------
-- 補助科目（勘定科目ごと）
-- -------------------------------------------------------------
create table public.sub_accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  account_id uuid not null,
  name text not null check (char_length(name) between 1 and 20),
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- 補助科目名は同一勘定科目内でユニーク
  unique (account_id, name),
  -- 仕訳明細・期首残高から「その勘定科目の補助科目」であることを保証するための参照先
  unique (id, account_id),
  -- 勘定科目を削除すると、その補助科目も削除する（使用中なら下記の RESTRICT で止まる）
  foreign key (account_id, user_id) references public.accounts (id, user_id) on delete cascade
);

create index sub_accounts_account_id_idx on public.sub_accounts (account_id, sort_order);

create trigger set_sub_accounts_updated_at
before update on public.sub_accounts
for each row execute function public.set_updated_at();

-- -------------------------------------------------------------
-- 期首残高（資産・負債の科目のみ。期首日は profiles.opening_date）
-- -------------------------------------------------------------
create table public.opening_balances (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  account_id uuid not null,
  sub_account_id uuid,
  amount bigint not null check (amount >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- 同じ勘定科目・補助科目の組み合わせは1行だけ（補助科目なしも1行だけ）
  unique nulls not distinct (user_id, account_id, sub_account_id),
  foreign key (account_id, user_id) references public.accounts (id, user_id) on delete restrict,
  foreign key (sub_account_id, account_id) references public.sub_accounts (id, account_id) on delete restrict
);

create index opening_balances_sub_account_id_idx on public.opening_balances (sub_account_id);

create trigger set_opening_balances_updated_at
before update on public.opening_balances
for each row execute function public.set_updated_at();

-- -------------------------------------------------------------
-- 仕訳（日付・摘要）
-- -------------------------------------------------------------
create table public.journals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  entry_date date not null,
  description text check (char_length(description) <= 200),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, user_id)
);

create index journals_user_id_entry_date_idx on public.journals (user_id, entry_date);

create trigger set_journals_updated_at
before update on public.journals
for each row execute function public.set_updated_at();

-- -------------------------------------------------------------
-- 仕訳明細（貸借区分・勘定科目・補助科目・金額）
-- 画面は借方1行・貸方1行だが、複合仕訳に拡張できるよう1仕訳に複数行を持てる
-- -------------------------------------------------------------
create table public.journal_lines (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  journal_id uuid not null,
  side public.entry_side not null,
  account_id uuid not null,
  sub_account_id uuid,
  amount bigint not null check (amount > 0),
  -- 仕訳内での表示順
  line_no smallint not null default 0,
  created_at timestamptz not null default now(),
  foreign key (journal_id, user_id) references public.journals (id, user_id) on delete cascade,
  foreign key (account_id, user_id) references public.accounts (id, user_id) on delete restrict,
  foreign key (sub_account_id, account_id) references public.sub_accounts (id, account_id) on delete restrict
);

create index journal_lines_journal_id_idx on public.journal_lines (journal_id, line_no);
create index journal_lines_account_id_idx on public.journal_lines (account_id);
create index journal_lines_sub_account_id_idx on public.journal_lines (sub_account_id);

-- =============================================================
-- 整合性チェック
-- =============================================================

-- 期首残高に登録できるのは資産・負債の勘定科目だけ
create function public.check_opening_balance_category()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if not exists (
    select 1 from public.accounts
    where id = new.account_id and category in ('asset', 'liability')
  ) then
    raise exception '期首残高には資産・負債の勘定科目のみ登録できます。'
      using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

create trigger check_opening_balance_category
before insert or update of account_id on public.opening_balances
for each row execute function public.check_opening_balance_category();

-- 仕訳・期首残高で使用中の勘定科目は区分を変更できない
create function public.prevent_used_account_category_change()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.category <> old.category and (
    exists (select 1 from public.journal_lines where account_id = old.id)
    or exists (select 1 from public.opening_balances where account_id = old.id)
  ) then
    raise exception '仕訳または期首残高で使用中の勘定科目は、区分を変更できません。'
      using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

create trigger prevent_used_account_category_change
before update of category on public.accounts
for each row execute function public.prevent_used_account_category_change();

-- 仕訳ごとに借方合計と貸方合計が一致していることを、トランザクションの終了時に確認する
-- （明細を1行ずつ書き換える途中は一致しないため、DEFERRABLE INITIALLY DEFERRED にする）
create function public.check_journal_balanced()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  target_journal_id uuid := coalesce(new.journal_id, old.journal_id);
  debit_total bigint;
  credit_total bigint;
begin
  select
    coalesce(sum(amount) filter (where side = 'debit'), 0),
    coalesce(sum(amount) filter (where side = 'credit'), 0)
  into debit_total, credit_total
  from public.journal_lines
  where journal_id = target_journal_id;

  if debit_total <> credit_total then
    raise exception '借方合計（%）と貸方合計（%）が一致しません。', debit_total, credit_total
      using errcode = 'check_violation';
  end if;
  return null;
end;
$$;

create constraint trigger check_journal_balanced
after insert or update or delete on public.journal_lines
deferrable initially deferred
for each row execute function public.check_journal_balanced();

-- =============================================================
-- Row Level Security（本人のデータのみ参照・操作できる）
-- =============================================================
alter table public.profiles enable row level security;
alter table public.accounts enable row level security;
alter table public.sub_accounts enable row level security;
alter table public.opening_balances enable row level security;
alter table public.journals enable row level security;
alter table public.journal_lines enable row level security;

-- プロフィールは新規登録時のトリガーで作成し、削除は auth.users の削除に連動させる
create policy "Users can view own profile"
on public.profiles for select to authenticated
using ((select auth.uid()) = id);

create policy "Users can update own profile"
on public.profiles for update to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

-- 勘定科目・補助科目・期首残高・仕訳・仕訳明細は、本人の行のみ全操作を許可する
create policy "Users can manage own accounts"
on public.accounts for all to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "Users can manage own sub accounts"
on public.sub_accounts for all to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "Users can manage own opening balances"
on public.opening_balances for all to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "Users can manage own journals"
on public.journals for all to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "Users can manage own journal lines"
on public.journal_lines for all to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);
