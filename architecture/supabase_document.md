# Supabase 汎用ガイド - 初期構築とデータ操作
 
## 概要
 
このドキュメントは、Supabaseを使用したアプリケーション開発における初期構築とデータ操作に焦点を当てたガイドです。認証には Supabase の認証機能（Supabase Auth）を使い、Next.js（App Router）から利用する前提で書いています。
 
## 目次
 
1. [開発環境のセットアップ](#開発環境のセットアップ)
2. [データベース設計](#データベース設計)
3. [Supabaseクライアントの実装](#supabaseクライアントの実装)
4. [認証（Supabase Auth）](#認証supabase-auth)
5. [基本的なCRUD操作](#基本的なcrud操作)
6. [Row Level Security (RLS)](#row-level-security-rls)
7. [リアルタイム機能](#リアルタイム機能)
8. [ファイルストレージ](#ファイルストレージ)
9. [本番環境へのデプロイ](#本番環境へのデプロイ)
10. [トラブルシューティング](#トラブルシューティング)
 
## 開発環境のセットアップ
 
### 方法1: クラウドベース（推奨）
 
Docker Desktopが使えない場合や、より簡単にセットアップしたい場合は、Supabaseのクラウド環境を使用します。
 
#### 1. 開発用プロジェクトの作成
 
1. https://supabase.com にアクセス
2. サインアップまたはログイン
3. 「New project」をクリック
4. プロジェクト名を入力（例：`myapp-dev`）
5. データベースパスワードを設定
6. リージョンを選択（日本の場合は東京推奨）
 
#### 2. APIキーとURLの取得
 
プロジェクトダッシュボード → Settings → API から以下を取得：
 
- Project URL
- anon public key
- service_role key（秘密鍵）
 
#### 3. 環境変数の設定
 
`.env.local`ファイルを作成：
 
```bash
# 開発環境（Supabaseクラウド）
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<開発環境のanon key>
SUPABASE_SERVICE_ROLE_KEY=<開発環境のservice role key>
```
 
> **注意**: 環境変数の値（APIキーなど）は必ずユーザーが設定する必要があります。セキュリティ上の理由から、これらの値は共有できません。
 
#### 4. Supabase CLIのインストールと接続
 
Supabase CLI は `npm install -g` によるグローバルインストールに対応していないため、プロジェクトの開発用依存として入れ、`npx` で実行します。
 
```bash
# Supabase CLIのインストール（プロジェクトの devDependencies に追加）
npm install -D supabase
 
# プロジェクトの初期化
npx supabase init
 
# クラウドプロジェクトにリンク
npx supabase login
npx supabase link --project-ref <プロジェクトID>
```
 
### 方法2: Docker Desktop（ローカル環境）
 
Docker Desktopが使用できる場合は、完全にローカルで開発できます。
 
**注意**: ローカル開発でポート競合が発生する場合があります。
- **問題**: ポート54322が既に使用されている
- **解決**: `supabase stop --all` で全てのコンテナを停止してから再起動
 
#### 1. 必要なツール
 
```bash
# Docker Desktop
# https://www.docker.com/products/docker-desktop からインストール
 
# Supabase CLI（グローバルインストール不可のため devDependencies に追加）
npm install -D supabase
```
 
#### 2. ローカル環境の起動
 
```bash
# プロジェクトディレクトリで実行
npx supabase init
 
# Docker Desktopが起動していることを確認してから実行
npx supabase start
```
 
起動完了後、以下の情報が表示されます：
 
```
Started supabase local development setup.
 
         API URL: http://127.0.0.1:54321
     GraphQL URL: http://127.0.0.1:54321/graphql/v1
          DB URL: postgresql://postgres:postgres@127.0.0.1:54322/postgres
      Studio URL: http://127.0.0.1:54323
        anon key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
service_role key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```
 
#### 3. 環境変数の設定
 
`.env.local`ファイルを作成：
 
```bash
# ローカル環境（Docker）
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<表示されたanon keyをコピー>
SUPABASE_SERVICE_ROLE_KEY=<表示されたservice_role keyをコピー>
```
 
> **注意**: 環境変数の値（APIキーなど）は必ずユーザーが設定する必要があります。セキュリティ上の理由から、これらの値は共有できません。
 
## データベース設計
 
### 方法1: Supabase Studio（クラウド環境）を使用
 
クラウド環境の場合、Supabase Studioから直接テーブルを作成できます。
 
1. プロジェクトダッシュボード → Table Editor
2. 「Create a new table」をクリック
3. GUIでテーブルを設計
 
または、SQL Editorから直接SQLを実行：
 
ユーザー本体（メールアドレス・パスワード）は Supabase Auth が `auth.users` テーブルで管理するため、自前の users テーブルは作りません。表示名などアプリ独自のユーザー情報が必要な場合は、`auth.users` を参照する `profiles` テーブルを作ります。
 
```sql
-- プロフィールテーブル（auth.users と 1対1）
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
 
-- 投稿テーブル
CREATE TABLE posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT,
  published BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
 
-- インデックスの作成
CREATE INDEX idx_posts_user_id ON posts(user_id);
CREATE INDEX idx_posts_published ON posts(published);
```
 
### 方法2: マイグレーションファイル（推奨）
 
バージョン管理したい場合は、マイグレーションファイルを使用します。
 
#### 1. マイグレーションファイルの作成
 
```bash
# 新しいマイグレーションファイルを作成
npx supabase migration new create_initial_tables
```
 
#### 2. マイグレーションファイルの編集
 
`supabase/migrations/[timestamp]_create_initial_tables.sql`:
 
```sql
-- プロフィールテーブル（auth.users と 1対1）
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
 
-- 投稿テーブル
CREATE TABLE posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT,
  published BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
 
-- インデックスの作成
CREATE INDEX idx_posts_user_id ON posts(user_id);
CREATE INDEX idx_posts_published ON posts(published);
 
-- 更新日時を自動更新するトリガー
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';
 
CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON profiles
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
 
CREATE TRIGGER update_posts_updated_at
BEFORE UPDATE ON posts
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
```
 
#### 3. マイグレーションの実行
 
```bash
# クラウド環境の場合
npx supabase db push
 
# ローカル環境（Docker）の場合
npx supabase db reset
 
# マイグレーションの状態確認
npx supabase migration list
```
 
## Supabaseクライアントの実装
 
Next.js で Supabase Auth を使う場合は、ログイン状態（セッション）を Cookie で受け渡すため `@supabase/ssr` を使い、ブラウザ用とサーバー用のクライアントを分けて作ります。
 
```bash
npm install @supabase/supabase-js @supabase/ssr
```
 
環境変数は `NEXT_PUBLIC_` 付きの名前を使います。Next.js ではこの接頭辞が付いた環境変数だけがブラウザ側のコードに埋め込まれるため、ブラウザ用クライアントで使う URL と anon key には必須です。
 
### ブラウザ用クライアント（Client Component で使用）
 
```typescript
// lib/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr'
 
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```
 
### サーバー用クライアント（Server Component・Server Action・Route Handler で使用）
 
```typescript
// lib/supabase/server.ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
 
export async function createClient() {
  const cookieStore = await cookies()
 
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Server Component からは Cookie を書き込めない。
            // セッションの更新は proxy.ts で行うため、ここでは無視してよい。
          }
        },
      },
    }
  )
}
```
 
### 管理操作用クライアント（RLSをバイパス・サーバー側のみ）
 
```typescript
// lib/supabase/admin.ts
import { createClient } from '@supabase/supabase-js'
 
// SUPABASE_SERVICE_ROLE_KEY は RLS を無視して全データにアクセスできる。
// NEXT_PUBLIC_ を付けず、ブラウザに渡るコードからは絶対に import しない。
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)
```
 
通常のデータ操作はログインユーザーの権限で動くブラウザ用・サーバー用クライアントで行い、RLS によって本人のデータだけに絞り込まれるようにします。管理操作用クライアントは、デモデータの投入などどうしても必要な場合に限って使います。
 
### TypeScript型定義の生成
 
```bash
# リンクしているクラウドのプロジェクトから TypeScript 型定義を生成
npx supabase gen types typescript --linked > types/database.types.ts
```
 
## 認証（Supabase Auth）
 
メールアドレスとパスワードによる認証を Supabase Auth で行います。
 
### ダッシュボードでの設定
 
1. Authentication → Sign In / Providers で「Email」が有効になっていることを確認
2. 「Confirm email」（メールアドレスの確認）を使うかどうかを決める
   - 有効：サインアップ後に確認メールのリンクを開くまでログインできない
   - 無効：サインアップ直後からログインできる（開発中やデモでは無効にすると確認しやすい）
3. Authentication → URL Configuration の「Site URL」に、アプリの URL（開発中は `http://localhost:3000`）を設定
 
### サインアップ・ログイン・ログアウト
 
```typescript
// app/(auth)/actions.ts
'use server'
 
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
 
// サインアップ
export async function signUp(formData: FormData) {
  const supabase = await createClient()
  const { error } = await supabase.auth.signUp({
    email: String(formData.get('email')),
    password: String(formData.get('password')),
  })
  if (error) {
    // エラーメッセージを画面に返す
  }
  redirect('/')
}
 
// ログイン
export async function signIn(formData: FormData) {
  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({
    email: String(formData.get('email')),
    password: String(formData.get('password')),
  })
  if (error) {
    // エラーメッセージを画面に返す
  }
  redirect('/')
}
 
// ログアウト
export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}
```
 
### ログインユーザーの取得
 
```typescript
const supabase = await createClient()
const {
  data: { user },
} = await supabase.auth.getUser()
 
if (!user) {
  redirect('/login')
}
```
 
サーバー側でユーザーを確認するときは `getSession()` ではなく `getUser()` を使います。`getSession()` は Cookie の内容をそのまま信用するため改ざんを見抜けませんが、`getUser()` は Supabase Auth のサーバーに問い合わせて検証します。
 
### セッションの更新（proxy.ts）
 
ログイン状態を保つため、リクエストのたびにセッション（アクセストークン）を更新します。Next.js 16 では `middleware.ts` が `proxy.ts` に名前を変えているので、プロジェクト直下に `proxy.ts` を作ります。
 
```typescript
// proxy.ts
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
 
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request })
 
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )
 
  // セッションを更新する（この呼び出しを消さない）
  const {
    data: { user },
  } = await supabase.auth.getUser()
 
  // 未ログインでログイン必須のページに来たらログイン画面へ
  const isAuthPage = ['/login', '/signup'].includes(request.nextUrl.pathname)
  if (!user && !isAuthPage) {
    return NextResponse.redirect(new URL('/login', request.url))
  }
 
  return response
}
 
export const config = {
  // 静的ファイルや画像には適用しない
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
```
 
### 新規登録時の初期データ作成
 
サインアップ時にプロフィールや初期データを作る場合は、`auth.users` への INSERT をきっかけに動くトリガーを使います。アプリ側で作るよりも、作り忘れや途中失敗が起きにくくなります。
 
```sql
-- 新規ユーザー登録時にプロフィールを作成する
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id) VALUES (NEW.id);
  RETURN NEW;
END;
$$;
 
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();
```
 
## 基本的なCRUD操作
 
### Create (作成)
 
`user_id` は `DEFAULT auth.uid()` によりログインユーザーの ID が自動で入るため、省略できます（RLS により他人の ID では作成できません）。
 
```typescript
// 単一レコードの作成
const { data, error } = await supabase
  .from('posts')
  .insert({
    title: 'Hello World',
    content: 'This is my first post'
  })
  .select()
  .single()
 
// 複数レコードの作成
const { data, error } = await supabase
  .from('posts')
  .insert([
    { title: 'Post 1', content: 'Content 1' },
    { title: 'Post 2', content: 'Content 2' }
  ])
  .select()
```
 
### Read (読み取り)
 
```typescript
// 全件取得
const { data, error } = await supabase
  .from('posts')
  .select('*')
 
// 条件付き取得
const { data, error } = await supabase
  .from('posts')
  .select('*')
  .eq('published', true)
  .order('created_at', { ascending: false })
  .limit(10)
 
// JOINを使用した取得（posts.user_id → profiles.id の外部キーが必要）
const { data, error } = await supabase
  .from('posts')
  .select(`
    *,
    profiles (
      id,
      name
    )
  `)
  .eq('published', true)
 
// 単一レコードの取得
const { data, error } = await supabase
  .from('posts')
  .select('*')
  .eq('id', 'post-uuid')
  .single()
```
 
### Update (更新)
 
```typescript
// 単一レコードの更新
const { data, error } = await supabase
  .from('posts')
  .update({ title: 'Updated Title', published: true })
  .eq('id', 'post-uuid')
  .select()
  .single()
 
// 複数レコードの更新
const { data, error } = await supabase
  .from('posts')
  .update({ published: true })
  .eq('user_id', 'user-uuid')
  .select()
```
 
### Delete (削除)
 
```typescript
// 単一レコードの削除
const { error } = await supabase
  .from('posts')
  .delete()
  .eq('id', 'post-uuid')
 
// 条件に一致するレコードの削除
const { error } = await supabase
  .from('posts')
  .delete()
  .eq('user_id', 'user-uuid')
  .eq('published', false)
```
 
### Upsert (作成または更新)
 
```typescript
// 存在すれば更新、なければ作成
const { data, error } = await supabase
  .from('profiles')
  .upsert({
    id: user.id, // auth.getUser() で取得したログインユーザーの ID
    name: 'John Doe'
  }, {
    onConflict: 'id'
  })
  .select()
```
 
## Row Level Security (RLS)
 
### RLSの有効化
 
```sql
-- テーブルごとにRLSを有効化
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
```
 
RLS を有効にしたテーブルは、ポリシーで許可した行しか読み書きできなくなります（ポリシーが1つもなければ全て拒否）。public スキーマのテーブルは必ず RLS を有効にしてください。
 
### Supabase Auth と RLS
 
- `auth.uid()` は、リクエストを送ったログインユーザーの ID（`auth.users.id`）を返します。未ログインのときは NULL です。
- ブラウザ用・サーバー用クライアントはログインユーザーのトークンを付けて問い合わせるため、`auth.uid()` を使ったポリシーで「本人のデータだけ」に絞り込めます。アプリ側で `.eq('user_id', ...)` を付け忘れても、他人のデータは返りません。
- `TO authenticated` を付けると、ログイン済みユーザーだけにポリシーが適用されます。
- `auth.uid()` は `(SELECT auth.uid())` と書くと、行ごとに再計算されず高速になります。
 
### 基本的なRLSポリシー（本人のデータのみ操作可能）
 
```sql
-- 本人のデータのみ参照可能
CREATE POLICY "Users can view own posts"
ON posts
FOR SELECT
TO authenticated
USING ((SELECT auth.uid()) = user_id);
 
-- 本人のデータとしてのみ作成可能
CREATE POLICY "Users can create own posts"
ON posts
FOR INSERT
TO authenticated
WITH CHECK ((SELECT auth.uid()) = user_id);
 
-- 本人のデータのみ更新可能（他人の ID への書き換えも禁止）
CREATE POLICY "Users can update own posts"
ON posts
FOR UPDATE
TO authenticated
USING ((SELECT auth.uid()) = user_id)
WITH CHECK ((SELECT auth.uid()) = user_id);
 
-- 本人のデータのみ削除可能
CREATE POLICY "Users can delete own posts"
ON posts
FOR DELETE
TO authenticated
USING ((SELECT auth.uid()) = user_id);
 
-- プロフィールは本人のみ参照・更新可能
CREATE POLICY "Users can view own profile"
ON profiles
FOR SELECT
TO authenticated
USING ((SELECT auth.uid()) = id);
 
CREATE POLICY "Users can update own profile"
ON profiles
FOR UPDATE
TO authenticated
USING ((SELECT auth.uid()) = id)
WITH CHECK ((SELECT auth.uid()) = id);
```
 
### 子テーブルのポリシー
 
`user_id` を持たない子テーブル（例：親テーブルの ID だけを持つ明細テーブル）は、親テーブルの持ち主で判定します。
 
```sql
-- post_comments は post_id だけを持ち、posts の持ち主のみ操作できる
CREATE POLICY "Users can manage comments on own posts"
ON post_comments
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM posts
    WHERE posts.id = post_comments.post_id
      AND posts.user_id = (SELECT auth.uid())
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM posts
    WHERE posts.id = post_comments.post_id
      AND posts.user_id = (SELECT auth.uid())
  )
);
```
 
## リアルタイム機能
 
### リアルタイム購読の設定
 
```typescript
// テーブルの変更を監視
const channel = supabase
  .channel('posts-channel')
  .on(
    'postgres_changes',
    {
      event: '*', // INSERT, UPDATE, DELETE, または '*' で全て
      schema: 'public',
      table: 'posts'
    },
    (payload) => {
      console.log('Change received!', payload)
    }
  )
  .subscribe()
 
// 特定の条件でフィルタリング
const channel = supabase
  .channel('user-posts')
  .on(
    'postgres_changes',
    {
      event: 'INSERT',
      schema: 'public',
      table: 'posts',
      filter: 'user_id=eq.user-uuid'
    },
    (payload) => {
      console.log('New post created!', payload.new)
    }
  )
  .subscribe()
 
// 購読の解除
channel.unsubscribe()
```
 
## ファイルストレージ
 
### バケットの作成（SQL）
 
```sql
-- ストレージバケットの作成
INSERT INTO storage.buckets (id, name, public)
VALUES ('images', 'images', true);
```
 
### ファイルのアップロード
 
```typescript
// ファイルのアップロード
const { data, error } = await supabase.storage
  .from('images')
  .upload('path/to/file.jpg', file, {
    cacheControl: '3600',
    upsert: false
  })
 
// 公開URLの取得
const { data } = supabase.storage
  .from('images')
  .getPublicUrl('path/to/file.jpg')
```
 
### ファイルの削除
 
```typescript
const { error } = await supabase.storage
  .from('images')
  .remove(['path/to/file.jpg'])
```
 
## 本番環境へのデプロイ
 
### クラウドベースの場合
 
開発環境と同様に、本番用の別プロジェクトを作成します。
 
#### 1. 本番用プロジェクトの作成
 
1. https://supabase.com にアクセス
2. 「New project」をクリック
3. プロジェクト名を入力（例：`myapp-prod`）
4. 強力なデータベースパスワードを設定
5. リージョンを選択
 
#### 2. 環境変数の管理
 
開発環境と本番環境で異なる環境変数を使用：
 
```bash
# .env.local（開発環境）
NEXT_PUBLIC_SUPABASE_URL=https://dev-xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<開発環境のanon key>
SUPABASE_SERVICE_ROLE_KEY=<開発環境のservice role key>
 
# .env.production（本番環境）
NEXT_PUBLIC_SUPABASE_URL=https://prod-xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<本番環境のanon key>
SUPABASE_SERVICE_ROLE_KEY=<本番環境のservice role key>
```
 
#### 3. マイグレーションの適用
 
```bash
# 本番プロジェクトにリンク
npx supabase link --project-ref <本番プロジェクトID>
 
# マイグレーションを本番環境に適用
npx supabase db push
```
 
### ローカル開発環境からの移行
 
Docker Desktopを使用していた場合：
 
```bash
# 本番プロジェクトを作成後、リンク
npx supabase link --project-ref <本番プロジェクトID>
 
# ローカルのマイグレーションを本番に適用
npx supabase db push
 
# 型定義をリンクした本番環境から生成
npx supabase gen types typescript --linked > types/database.types.ts
```
 
## トラブルシューティング
 
### よくあるエラーと解決方法
 
#### 1. PGRST204エラー（No rows found）
 
```typescript
// ❌ エラーが発生する可能性
const { data, error } = await supabase
  .from('posts')
  .select('*')
  .eq('id', 'non-existent-id')
  .single() // 0件でエラー
 
// ✅ 安全な実装
const { data, error } = await supabase
  .from('posts')
  .select('*')
  .eq('id', 'non-existent-id')
  .maybeSingle() // 0件の場合はnull
```
 
#### 2. RLSポリシーエラー
 
RLS が有効なテーブルで、データが空で返る・`new row violates row-level security policy` が出る場合は、次を確認します。
 
- ログインしているか（`supabase.auth.getUser()` で `user` が取れるか）
- サーバー側では `@supabase/ssr` のサーバー用クライアントを使っているか（Cookie を渡さないクライアントでは未ログイン扱いになる）
- 対象の操作（SELECT / INSERT / UPDATE / DELETE）に対応するポリシーがあるか
- INSERT・UPDATE で `user_id` がログインユーザーの ID になっているか
 
Service Role キー（`supabaseAdmin`）で RLS を回避するのは、原因が分からないときの逃げ道として使わないでください。本人以外のデータまで見えてしまいます。
 
#### 3. データ型の不一致
 
```typescript
// 型定義を生成して型安全性を確保
import { Database } from './types/database.types'
 
type Post = Database['public']['Tables']['posts']['Row']
 
const { data, error } = await supabase
  .from('posts')
  .select('*')
  .returns<Post[]>()
```
 
### デバッグのヒント
 
1. **Supabase Studio**:
   - クラウド環境: プロジェクトダッシュボードから直接アクセス
   - ローカル環境: `http://localhost:54323` でアクセス
 
2. **RLSポリシーのデバッグSQL**（SQL Editor で実行）:
   ```sql
   -- 特定のユーザーとしてログインしている状態を再現してポリシーをテスト
   BEGIN;
   SET LOCAL role TO 'authenticated';
   SET LOCAL request.jwt.claims TO '{"sub": "<auth.users の id>"}';
   SELECT auth.uid();        -- 指定したユーザー ID が返ることを確認
   SELECT * FROM your_table; -- そのユーザーのデータだけが返ることを確認
   ROLLBACK;
   ```
 
3. **登録済みユーザーの確認**: Dashboard → Authentication → Users で、サインアップしたユーザーやメール確認の状態を確認
 
4. **ローカル開発でのポート競合**:
   ```bash
   # Supabaseコンテナを完全に停止・再起動
   supabase stop --all
   supabase start
   ```
 
5. **ログの確認**:
   - クラウド環境: Dashboard → Logs でリアルタイムログを確認
   - ローカル環境: `npx supabase status` で各サービスの状態を確認
 
6. **SQLエディタ**: Supabase Studioから直接SQLを実行してテスト
 
## まとめ
 
このガイドでは、Supabaseの初期構築とデータ操作の基本を解説しました。重要なポイント：
 
1. **開発環境の選択**:
   - クラウドベース: Docker不要で簡単セットアップ（推奨）
   - ローカル環境: Docker Desktopで完全にオフライン開発
 
2. **環境の分離**: 開発用と本番用で別々のプロジェクトを作成
 
3. **マイグレーション**: SQLファイルでスキーマを管理
 
4. **型安全性**: TypeScript型定義の自動生成
 
5. **認証とRLS**: Supabase Auth（メールアドレス＋パスワード）でログインし、`auth.uid()` を使った RLS で本人のデータだけにアクセスを制限
 
6. **リアルタイム**: WebSocketを使用したリアルタイム更新
 
7. **ストレージ**: ファイルの保存と管理
 
詳細な情報は[Supabase公式ドキュメント](https://supabase.com/docs)を参照してください。