import Link from "next/link";
import {
  ACCOUNT_CATEGORIES,
  type AccountCategory,
} from "@/lib/accounts/categories";

/**
 * 勘定科目一覧の区分タブ（資産・負債・純資産・収益・費用）。
 * 区分は URL の ?category= で切り替え、スマホでは横にスクロールできる。
 */
export function CategoryTabs({ current }: { current: AccountCategory }) {
  return (
    <nav aria-label="勘定科目の区分" className="-mx-4 overflow-x-auto px-4">
      <ul className="flex min-w-max gap-2 border-b border-gray-300 pb-3">
        {ACCOUNT_CATEGORIES.map((category) => {
          const active = category.value === current;
          return (
            <li key={category.value}>
              <Link
                href={`/accounts?category=${category.value}`}
                aria-current={active ? "page" : undefined}
                className={`inline-flex min-h-11 items-center rounded-lg px-4 text-sm font-semibold transition-colors duration-150 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500 ${
                  active
                    ? "bg-blue-700 text-white"
                    : "text-gray-700 hover:bg-blue-50 hover:text-blue-700"
                }`}
              >
                {category.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
