import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "期首残高入力",
};

/** 期首残高入力画面（/opening-balances）。新規登録直後の移動先。入力機能は今後実装する */
export default function OpeningBalancesPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-semibold leading-tight text-gray-900">
        期首残高入力
      </h1>
      <p className="text-base leading-relaxed text-gray-700">
        この画面は準備中です。
      </p>
    </div>
  );
}
