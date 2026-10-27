import Link from "next/link";

const REPORTS = [
  { href: "/reports/pl", label: "損益計算書" },
  { href: "/reports/bs", label: "貸借対照表" },
] as const;

/** 損益計算書・貸借対照表の切り替えタブ（ナビゲーションの「レポート」から両方へ移動できるようにする） */
export function ReportTabs({
  current,
}: {
  current: (typeof REPORTS)[number]["href"];
}) {
  return (
    <nav aria-label="レポートの種類">
      <ul className="flex gap-2 border-b border-gray-300 pb-3">
        {REPORTS.map((report) => {
          const active = report.href === current;
          return (
            <li key={report.href}>
              <Link
                href={report.href}
                aria-current={active ? "page" : undefined}
                className={`inline-flex min-h-11 items-center rounded-lg px-4 text-sm font-semibold transition-colors duration-150 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500 ${
                  active
                    ? "bg-blue-700 text-white"
                    : "text-gray-700 hover:bg-blue-50 hover:text-blue-700"
                }`}
              >
                {report.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
