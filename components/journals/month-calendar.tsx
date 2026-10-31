import Link from "next/link";
import { getCalendarWeeks, getWeekdayIndex, WEEKDAY_LABELS } from "@/lib/dates";
import { formatDateWithWeekday } from "@/lib/format";

type MonthCalendarProps = {
  /** 表示する年月（YYYY-MM） */
  month: string;
  /** 日本時間の今日（YYYY-MM-DD） */
  today: string;
  /** 日付ごとの仕訳件数（undefined の間は読み込み中として件数を表示しない） */
  journalCounts?: Record<string, number>;
};

/** 曜日の文字色（日曜は赤、土曜は青。曜日名も表示するので色だけに頼らない） */
function weekdayTextClass(weekday: number): string {
  if (weekday === 0) return "text-red-600";
  if (weekday === 6) return "text-blue-700";
  return "text-gray-900";
}

/**
 * 月間カレンダー（日曜始まり）。各日付は日別仕訳一覧へのリンクで、
 * 仕訳がある日は背景を強調し、仕訳件数をバッジで表示する。
 */
export function MonthCalendar({
  month,
  today,
  journalCounts,
}: MonthCalendarProps) {
  const weeks = getCalendarWeeks(month);

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-300 bg-white shadow-md">
      <table className="w-full table-fixed border-collapse">
        <caption className="sr-only">
          月間カレンダー。日付を選ぶとその日の仕訳一覧を表示します。
        </caption>
        <thead>
          <tr className="border-b border-gray-300">
            {WEEKDAY_LABELS.map((label, weekday) => (
              <th
                key={label}
                scope="col"
                className={`py-2 text-center text-sm font-semibold ${weekdayTextClass(weekday)}`}
              >
                {label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {weeks.map((week) => (
            <tr
              key={week.find(Boolean)}
              className="border-b border-gray-200 last:border-b-0"
            >
              {week.map((date, index) =>
                date ? (
                  <td
                    key={date}
                    className="border-r border-gray-200 p-0 align-top last:border-r-0"
                  >
                    <DayCell
                      date={date}
                      isToday={date === today}
                      count={journalCounts ? (journalCounts[date] ?? 0) : null}
                    />
                  </td>
                ) : (
                  // 月の前後の空きマス
                  <td
                    key={`empty-${index}`}
                    className="border-r border-gray-200 bg-gray-50 last:border-r-0"
                  />
                ),
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** カレンダーの1日分のマス */
function DayCell({
  date,
  isToday,
  count,
}: {
  date: string;
  isToday: boolean;
  count: number | null;
}) {
  const day = Number(date.slice(8, 10));
  const hasJournals = count !== null && count > 0;
  const label = [
    formatDateWithWeekday(date),
    isToday ? "今日" : null,
    count === null ? null : count > 0 ? `仕訳${count}件` : "仕訳なし",
  ]
    .filter(Boolean)
    .join("、");

  return (
    <Link
      href={`/calendar/${date}`}
      aria-label={label}
      aria-current={isToday ? "date" : undefined}
      className={`flex h-16 w-full flex-col items-center gap-1 p-1 transition-colors duration-150 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500 sm:h-24 sm:items-start sm:p-2 ${
        hasJournals ? "bg-blue-50 hover:bg-blue-100" : "hover:bg-blue-50"
      }`}
    >
      <span
        className={`flex h-7 w-7 items-center justify-center rounded-full text-sm ${
          isToday
            ? "bg-blue-700 font-bold text-white"
            : `${weekdayTextClass(getWeekdayIndex(date))} ${hasJournals ? "font-bold" : "font-medium"}`
        }`}
      >
        {day}
      </span>
      {hasJournals && (
        <span className="rounded-md border border-blue-800 bg-white px-1.5 text-xs font-semibold leading-5 text-blue-800">
          {count}
          <span className="hidden sm:inline">件</span>
        </span>
      )}
    </Link>
  );
}
