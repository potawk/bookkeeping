import type { ReactNode } from "react";

type FormAlertProps = {
  message?: ReactNode;
  /** error: 保存失敗など（既定）／ success: 保存完了などのお知らせ */
  variant?: "error" | "success";
};

/**
 * フォーム全体に関わるメッセージ（ログイン失敗・保存完了など）。
 * エラーは role="alert"、完了のお知らせは role="status" で読み上げられるようにする。
 */
export function FormAlert({ message, variant = "error" }: FormAlertProps) {
  if (!message) return null;

  const isError = variant === "error";
  return (
    <div
      role={isError ? "alert" : "status"}
      className={`rounded-lg border bg-white px-4 py-3 text-sm font-semibold leading-relaxed ${
        isError
          ? "border-red-600 text-red-600"
          : "border-green-600 text-green-700"
      }`}
    >
      {message}
    </div>
  );
}
