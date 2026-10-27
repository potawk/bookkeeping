/**
 * ボタン・ボタン型リンクの共通クラス（design_system.md「ボタン設計原則」）
 * - primary: 主要な操作（作成・保存）
 * - secondary: 補助的な操作（編集・キャンセル）
 * - danger: 削除などの取り消せない操作
 * サイズ sm は最小高さ 44px、md は 48px を確保する。
 */
const BASE =
  "inline-flex cursor-pointer items-center justify-center gap-2 font-semibold transition-all duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100";

const VARIANTS = {
  primary:
    "bg-blue-500 text-white shadow-md hover:bg-blue-600 hover:shadow-lg focus-visible:ring-blue-500",
  secondary:
    "border-2 border-blue-700 bg-white text-blue-700 shadow-sm hover:bg-blue-50 hover:shadow-md focus-visible:ring-blue-500",
  danger:
    "bg-red-600 text-white shadow-md hover:bg-red-700 hover:shadow-lg focus-visible:ring-red-600",
} as const;

const SIZES = {
  sm: "min-h-11 rounded-lg px-3 py-2 text-sm",
  md: "min-h-12 rounded-xl px-6 py-3 text-base",
} as const;

export function buttonClassName(
  variant: keyof typeof VARIANTS = "primary",
  size: keyof typeof SIZES = "md",
): string {
  return `${BASE} ${VARIANTS[variant]} ${SIZES[size]}`;
}
