import type { ReactNode } from "react";

export type NavItem = {
  href: string;
  label: string;
  /** このパスで始まるページを開いているとき、メニューをアクティブ表示にする */
  matchPrefix: string;
  icon: ReactNode;
};

/** アイコンの共通設定（装飾なので読み上げ対象から外す） */
function Icon({ children }: { children: ReactNode }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-6 w-6 shrink-0"
    >
      {children}
    </svg>
  );
}

/** ログイン後のナビゲーションメニューの項目（仕様書 2-2 の「ナビゲーションメニュー」） */
export const NAV_ITEMS: NavItem[] = [
  {
    href: "/calendar",
    label: "カレンダー",
    // 日別仕訳一覧・仕訳の作成／詳細／編集もカレンダーのまとまりとして扱う
    matchPrefix: "/calendar",
    icon: (
      <Icon>
        <rect x="3" y="5" width="18" height="16" rx="2" />
        <path d="M3 10h18M8 3v4M16 3v4" />
      </Icon>
    ),
  },
  {
    href: "/accounts",
    label: "勘定科目",
    matchPrefix: "/accounts",
    icon: (
      <Icon>
        <path d="M8 6h13M8 12h13M8 18h13" />
        <circle cx="4" cy="6" r="1" />
        <circle cx="4" cy="12" r="1" />
        <circle cx="4" cy="18" r="1" />
      </Icon>
    ),
  },
  {
    href: "/reports/pl",
    label: "レポート",
    // 損益計算書・貸借対照表の両方でアクティブにする
    matchPrefix: "/reports",
    icon: (
      <Icon>
        <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />
      </Icon>
    ),
  },
  {
    href: "/mypage",
    label: "マイページ",
    matchPrefix: "/mypage",
    icon: (
      <Icon>
        <circle cx="12" cy="8" r="4" />
        <path d="M4 21c0-4 4-6 8-6s8 2 8 6" />
      </Icon>
    ),
  },
];

/**
 * メニュー項目をアクティブ表示にするか判定する。
 * 仕訳の画面（/journals/...）はカレンダー、期首残高入力（/opening-balances）は
 * マイページから開く画面なのでマイページのまとまりに含める。
 */
export function isActiveItem(item: NavItem, pathname: string | null): boolean {
  if (!pathname) return false;
  if (item.matchPrefix === "/calendar" && pathname.startsWith("/journals")) {
    return true;
  }
  if (item.matchPrefix === "/mypage" && pathname === "/opening-balances") {
    return true;
  }
  return (
    pathname === item.matchPrefix || pathname.startsWith(`${item.matchPrefix}/`)
  );
}
