import Link from "next/link";
import { isActiveItem, NAV_ITEMS } from "./nav-items";

type NavLinksProps = {
  /** sidebar: PC の左サイドバー（縦並び）／ bottom: スマホの画面下部（横並び） */
  variant: "sidebar" | "bottom";
  /** 現在のパス。null の場合はどの項目もアクティブにしない */
  pathname: string | null;
};

/** ナビゲーションメニューのリンク一覧（表示のみ。現在のパスは呼び出し側から受け取る） */
export function NavLinks({ variant, pathname }: NavLinksProps) {
  const isSidebar = variant === "sidebar";

  return (
    <ul className={isSidebar ? "space-y-1" : "grid grid-cols-4"}>
      {NAV_ITEMS.map((item) => {
        const active = isActiveItem(item, pathname);
        return (
          <li key={item.href}>
            <Link
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={`flex transition-colors duration-150 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500 ${
                isSidebar
                  ? "min-h-12 items-center gap-3 rounded-xl px-4 text-base font-semibold"
                  : "min-h-16 flex-col items-center justify-center gap-1 text-xs font-semibold"
              } ${
                active
                  ? "bg-blue-700 text-white"
                  : "text-gray-700 hover:bg-blue-50 hover:text-blue-700"
              }`}
            >
              {item.icon}
              <span>{item.label}</span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
