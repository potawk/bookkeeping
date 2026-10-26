import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "カレンダー",
};

/** カレンダー画面（/calendar）。ログイン後のホーム。カレンダー機能は今後実装する */
export default function CalendarPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-semibold leading-tight text-gray-900">
        カレンダー
      </h1>
      <p className="text-base leading-relaxed text-gray-700">
        この画面は準備中です。
      </p>
    </div>
  );
}
