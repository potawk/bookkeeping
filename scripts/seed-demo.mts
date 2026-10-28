/**
 * デモアカウントにデモデータ（期首残高と 2026年8〜10月の仕訳）を投入するスクリプト。
 *
 * 実行方法: npm run seed:demo
 *   事前に .env.local へ DEMO_PASSWORD（デモアカウントのパスワード）を追加しておく。
 *
 * - デモアカウント（demo@example.com）でログインし、アプリと同じ RPC（save_opening_balances・save_journal）で
 *   保存する。RLS が適用されるため、デモアカウント以外のデータには触れない。
 * - デモアカウントがまだ無い場合は新規登録する（標準の勘定科目は新規登録トリガーが作成する）。
 * - 何度実行しても同じ状態になるよう、最初にデモアカウントの仕訳をすべて削除してから登録し直す。
 *   補助科目は無いものだけを追加し、期首残高は RPC が丸ごと置き換える。
 */
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";

const DEMO_EMAIL = "demo@example.com";
const DEMO_USER_NAME = "デモユーザー";
const OPENING_DATE = "2026-08-01";

/** 勘定科目の指定。補助科目がある場合は「勘定科目/補助科目」と書く */
const CASH = "現金";
const MAIN_BANK = "普通預金/みどり銀行";
const SAVINGS_BANK = "普通預金/あおば銀行";
const CARD = "未払金/さくらカード";
const LOAN = "借入金/奨学金";

/** デモ用に追加する補助科目（勘定科目名, 補助科目名）。並び順は配列の順 */
const DEMO_SUB_ACCOUNTS: [string, string][] = [
  ["普通預金", "みどり銀行"],
  ["普通預金", "あおば銀行"],
  ["未払金", "さくらカード"],
  ["借入金", "奨学金"],
  ["食費", "自炊"],
  ["食費", "外食"],
  ["水道光熱費", "電気"],
  ["水道光熱費", "ガス"],
  ["水道光熱費", "水道"],
  ["通信費", "スマホ"],
  ["通信費", "インターネット"],
];

/** 期首残高（資産・負債）。差額の 1,018,000円が元入金になる */
const DEMO_OPENING_BALANCES: [string, number][] = [
  [CASH, 30_000],
  [MAIN_BANK, 450_000],
  [SAVINGS_BANK, 800_000],
  ["定期預金", 1_000_000],
  [CARD, 62_000],
  [LOAN, 1_200_000],
];

/** カードの引き落とし額は、前月のカード利用額の合計から計算する */
const CARD_BILL = "前月のカード利用額";

type DemoJournal = {
  date: string;
  debit: string;
  credit: string;
  amount: number | typeof CARD_BILL;
  description: string;
};

/** 仕訳を短く書くためのヘルパー（借方, 貸方の順） */
function journal(
  date: string,
  debit: string,
  credit: string,
  amount: DemoJournal["amount"],
  description: string,
): DemoJournal {
  return { date, debit, credit, amount, description };
}

/** 毎月ほぼ同じ日に発生する取引（給与・家賃・カードの引き落としなど） */
function monthlyJournals(
  month: string,
  nextMonthLabel: string,
  prevMonthLabel: string,
): DemoJournal[] {
  const monthLabel = `${Number(month.slice(5))}月`;
  return [
    journal(`${month}-01`, CASH, MAIN_BANK, 10_000, "ATM で引き出し"),
    journal(`${month}-15`, "交通費", CASH, 3_000, "交通系 IC カードにチャージ"),
    journal(
      `${month}-25`,
      MAIN_BANK,
      "給与",
      245_000,
      `${monthLabel}分給与（手取り）`,
    ),
    journal(`${month}-26`, "通信費/スマホ", CARD, 3_980, "スマホ料金"),
    journal(
      `${month}-26`,
      "通信費/インターネット",
      CARD,
      5_170,
      "光回線の利用料",
    ),
    journal(
      `${month}-26`,
      SAVINGS_BANK,
      MAIN_BANK,
      30_000,
      "先取り貯蓄（貯蓄用口座へ振替）",
    ),
    journal(
      `${month}-27`,
      "住居費",
      MAIN_BANK,
      85_000,
      `家賃（${nextMonthLabel}分）`,
    ),
    journal(
      `${month}-27`,
      CARD,
      MAIN_BANK,
      CARD_BILL,
      `さくらカードの引き落とし（${prevMonthLabel}利用分）`,
    ),
    journal(`${month}-27`, LOAN, MAIN_BANK, 13_000, "奨学金の返済"),
    journal(`${month}-28`, "保険料", MAIN_BANK, 4_500, "医療保険の保険料"),
  ];
}

const DEMO_JOURNALS: DemoJournal[] = [
  // 2026年8月
  ...monthlyJournals("2026-08", "9月", "7月"),
  journal("2026-08-02", "食費/自炊", CARD, 6_480, "スーパーで食料品"),
  journal("2026-08-05", "水道光熱費/電気", CARD, 9_860, "電気代（7月分）"),
  journal("2026-08-07", "食費/外食", CASH, 1_350, "ランチ"),
  journal("2026-08-09", "食費/自炊", CARD, 7_120, "スーパーで食料品"),
  journal("2026-08-10", "水道光熱費/ガス", MAIN_BANK, 4_280, "ガス代（7月分）"),
  journal(
    "2026-08-12",
    "日用品費",
    CARD,
    2_640,
    "ドラッグストア（洗剤・シャンプー）",
  ),
  journal("2026-08-16", "食費/自炊", CARD, 6_950, "スーパーで食料品"),
  journal("2026-08-18", "衣服・美容費", CARD, 4_400, "美容院"),
  journal(
    "2026-08-20",
    "水道光熱費/水道",
    MAIN_BANK,
    5_610,
    "水道代（6・7月分）",
  ),
  journal("2026-08-22", "趣味・娯楽費", CARD, 1_900, "映画"),
  journal("2026-08-23", "食費/自炊", CARD, 7_380, "スーパーで食料品"),
  journal("2026-08-30", "食費/自炊", CARD, 6_210, "スーパーで食料品"),
  journal("2026-08-31", "食費/外食", CASH, 2_800, "夕食（外食）"),

  // 2026年9月
  ...monthlyJournals("2026-09", "10月", "8月"),
  journal("2026-09-04", "水道光熱費/電気", CARD, 10_420, "電気代（8月分）"),
  journal("2026-09-06", "食費/自炊", CARD, 7_050, "スーパーで食料品"),
  journal("2026-09-08", "水道光熱費/ガス", MAIN_BANK, 3_950, "ガス代（8月分）"),
  journal("2026-09-11", "交際費", CASH, 5_000, "友人と食事会"),
  journal(
    "2026-09-11",
    "立替金",
    CASH,
    4_000,
    "食事会の代金を立替（友人の分）",
  ),
  journal("2026-09-13", "食費/自炊", CARD, 6_620, "スーパーで食料品"),
  journal("2026-09-14", CASH, "立替金", 4_000, "立替金を友人から受け取り"),
  journal("2026-09-17", "医療費", CASH, 3_200, "歯科医院"),
  journal("2026-09-20", "食費/自炊", CARD, 7_460, "スーパーで食料品"),
  journal("2026-09-21", "趣味・娯楽費", CARD, 1_650, "書籍"),
  journal(
    "2026-09-24",
    "日用品費",
    CARD,
    1_980,
    "ドラッグストア（ティッシュ・歯みがき粉）",
  ),
  journal("2026-09-27", "食費/自炊", CARD, 6_890, "スーパーで食料品"),
  journal("2026-09-29", "食費/外食", CASH, 1_480, "ランチ"),

  // 2026年10月
  ...monthlyJournals("2026-10", "11月", "9月"),
  journal("2026-10-03", "食費/自炊", CARD, 6_780, "スーパーで食料品"),
  journal("2026-10-05", "水道光熱費/電気", CARD, 7_940, "電気代（9月分）"),
  journal("2026-10-08", "水道光熱費/ガス", MAIN_BANK, 3_620, "ガス代（9月分）"),
  journal("2026-10-10", "食費/自炊", CARD, 7_240, "スーパーで食料品"),
  journal("2026-10-11", "衣服・美容費", CARD, 6_980, "秋物の服"),
  journal("2026-10-12", "食費/外食", CASH, 3_500, "家族で外食"),
  journal(
    "2026-10-16",
    MAIN_BANK,
    "副業収入",
    18_000,
    "副業（Web ライティング）の報酬",
  ),
  journal("2026-10-17", "食費/自炊", CARD, 6_530, "スーパーで食料品"),
  journal("2026-10-19", "日用品費", CARD, 2_310, "ドラッグストア（洗剤）"),
  journal(
    "2026-10-20",
    "水道光熱費/水道",
    MAIN_BANK,
    5_480,
    "水道代（8・9月分）",
  ),
  journal("2026-10-24", "食費/自炊", CARD, 7_010, "スーパーで食料品"),
  journal("2026-10-25", "趣味・娯楽費", CARD, 3_300, "美術展"),
];

/** save_journal の新規登録は p_journal_id に null を渡す（生成される型が null を表せないためキャストする） */
const NEW_JOURNAL_ID = null as unknown as string;

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} を .env.local に設定してください。`);
  }
  return value;
}

/** カードの引き落とし額（前月のカード利用額。8月は期首残高の未払金） */
function getCardBillAmount(date: string): number {
  const month = Number(date.slice(5, 7));
  const prevMonth = `${date.slice(0, 4)}-${String(month - 1).padStart(2, "0")}`;
  if (prevMonth < OPENING_DATE.slice(0, 7)) {
    return DEMO_OPENING_BALANCES.find(([spec]) => spec === CARD)?.[1] ?? 0;
  }
  return DEMO_JOURNALS.filter(
    (j) => j.credit === CARD && j.date.startsWith(prevMonth),
  ).reduce((sum, j) => sum + (typeof j.amount === "number" ? j.amount : 0), 0);
}

const supabase = createClient<Database>(
  requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
  requireEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
  { auth: { persistSession: false, autoRefreshToken: false } },
);

/** デモアカウントでログインする。アカウントが無ければ新規登録する */
async function signInDemoUser(password: string): Promise<string> {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: DEMO_EMAIL,
    password,
  });
  if (!error) {
    return data.user.id;
  }
  if (error.code !== "invalid_credentials") {
    throw error;
  }

  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email: DEMO_EMAIL,
    password,
    options: { data: { user_name: DEMO_USER_NAME } },
  });
  if (signUpError) {
    if (signUpError.code === "user_already_exists") {
      throw new Error(
        "デモアカウントのパスワードが正しくありません（DEMO_PASSWORD を確認してください）。",
      );
    }
    throw signUpError;
  }
  if (!signUpData.user || !signUpData.session) {
    throw new Error(
      "新規登録後にログインできませんでした（Supabase の Confirm email がオンになっていないか確認してください）。",
    );
  }
  console.log(`デモアカウント（${DEMO_EMAIL}）を新規登録しました。`);
  return signUpData.user.id;
}

/** 「勘定科目/補助科目」の指定を ID に変換する関数を作る（補助科目は無ければ追加する） */
async function prepareAccounts() {
  const { data: accounts, error } = await supabase
    .from("accounts")
    .select("id, name");
  if (error) throw error;
  const accountIds = new Map(accounts.map((a) => [a.name, a.id]));

  const { data: subAccounts, error: subError } = await supabase
    .from("sub_accounts")
    .select("id, account_id, name");
  if (subError) throw subError;
  const subAccountIds = new Map(
    subAccounts.map((s) => [`${s.account_id}/${s.name}`, s.id]),
  );

  const getAccountId = (name: string): string => {
    const id = accountIds.get(name);
    if (!id) throw new Error(`勘定科目「${name}」が見つかりません。`);
    return id;
  };

  const missing = DEMO_SUB_ACCOUNTS.map(([accountName, name], index) => ({
    account_id: getAccountId(accountName),
    name,
    sort_order: (index + 1) * 10,
  })).filter((s) => !subAccountIds.has(`${s.account_id}/${s.name}`));
  if (missing.length > 0) {
    const { data: inserted, error: insertError } = await supabase
      .from("sub_accounts")
      .insert(missing)
      .select("id, account_id, name");
    if (insertError) throw insertError;
    for (const s of inserted)
      subAccountIds.set(`${s.account_id}/${s.name}`, s.id);
  }

  return (
    spec: string,
  ): { account_id: string; sub_account_id: string | null } => {
    const [accountName, subName] = spec.split("/");
    const accountId = getAccountId(accountName);
    if (!subName) return { account_id: accountId, sub_account_id: null };
    const subId = subAccountIds.get(`${accountId}/${subName}`);
    if (!subId) throw new Error(`補助科目「${spec}」が見つかりません。`);
    return { account_id: accountId, sub_account_id: subId };
  };
}

async function main() {
  const userId = await signInDemoUser(requireEnv("DEMO_PASSWORD"));

  // 入れ直すため、既存の仕訳を削除する（仕訳明細は CASCADE で消える）
  const { error: deleteError } = await supabase
    .from("journals")
    .delete()
    .eq("user_id", userId);
  if (deleteError) throw deleteError;

  const resolve = await prepareAccounts();

  const { error: openingError } = await supabase.rpc("save_opening_balances", {
    p_opening_date: OPENING_DATE,
    p_rows: DEMO_OPENING_BALANCES.map(([spec, amount]) => ({
      ...resolve(spec),
      amount,
    })),
  });
  if (openingError) throw openingError;
  console.log(
    `期首残高を登録しました（期首日 ${OPENING_DATE}、${DEMO_OPENING_BALANCES.length}行）。`,
  );

  const journals = [...DEMO_JOURNALS].sort((a, b) =>
    a.date.localeCompare(b.date),
  );
  for (const j of journals) {
    const amount =
      j.amount === CARD_BILL ? getCardBillAmount(j.date) : j.amount;
    const { error } = await supabase.rpc("save_journal", {
      p_journal_id: NEW_JOURNAL_ID,
      p_entry_date: j.date,
      p_description: j.description,
      p_lines: [
        { side: "debit", ...resolve(j.debit), amount },
        { side: "credit", ...resolve(j.credit), amount },
      ],
    });
    if (error)
      throw new Error(
        `${j.date}「${j.description}」の登録に失敗しました: ${error.message}`,
      );
  }
  console.log(`仕訳を ${journals.length} 件登録しました。`);

  // 既定（global）だとブラウザでログイン中のデモアカウントのセッションも無効になるため local にする
  await supabase.auth.signOut({ scope: "local" });
}

try {
  await main();
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
}
