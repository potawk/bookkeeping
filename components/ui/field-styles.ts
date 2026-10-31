/** 入力欄・セレクトボックス共通のクラス（architecture/design_system.md「入力フィールド」） */
export function fieldClassName(hasError: boolean): string {
  return `h-12 w-full rounded-lg border bg-white px-4 text-base text-gray-900 placeholder-gray-500 outline-none transition-colors duration-150 ease-in-out focus:ring-2 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-600 ${
    hasError
      ? "border-red-500 focus:border-red-500 focus:ring-red-500/20"
      : "border-gray-300 focus:border-blue-500 focus:ring-blue-500/20"
  }`;
}

/** 入力欄の id から、補足説明・エラーメッセージの id と aria 属性を作る */
export function fieldAriaProps(
  name: string,
  hint: string | undefined,
  error: string | undefined,
) {
  const hintId = hint ? `${name}-hint` : undefined;
  const errorId = error ? `${name}-error` : undefined;
  return {
    hintId,
    errorId,
    "aria-invalid": error ? true : undefined,
    "aria-describedby":
      [hintId, errorId].filter(Boolean).join(" ") || undefined,
  } as const;
}
