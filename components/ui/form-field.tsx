import type { InputHTMLAttributes } from "react";

type FormFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  /** input の id・name に使う */
  name: string;
  label: string;
  /** 入力欄の下に表示する補足説明 */
  hint?: string;
  error?: string;
};

/**
 * ラベル・入力欄・補足説明・エラーメッセージをまとめた入力項目。
 * エラーは aria-invalid と aria-describedby で入力欄に関連付け、スクリーンリーダーでも読み上げられるようにする。
 */
export function FormField({
  name,
  label,
  hint,
  error,
  className,
  ...inputProps
}: FormFieldProps) {
  const hintId = hint ? `${name}-hint` : undefined;
  const errorId = error ? `${name}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;

  return (
    <div className="space-y-2">
      <label
        htmlFor={name}
        className="block text-sm font-semibold text-gray-900"
      >
        {label}
      </label>
      <input
        id={name}
        name={name}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={`h-12 w-full rounded-lg border bg-white px-4 text-base text-gray-900 placeholder-gray-500 outline-none transition-colors duration-150 ease-in-out focus:ring-2 ${
          error
            ? "border-red-500 focus:border-red-500 focus:ring-red-500/20"
            : "border-gray-300 focus:border-blue-500 focus:ring-blue-500/20"
        } ${className ?? ""}`}
        {...inputProps}
      />
      {hint && (
        <p id={hintId} className="text-xs leading-normal text-gray-600">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className="text-sm leading-relaxed text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
