import type { InputHTMLAttributes } from "react";
import { fieldAriaProps, fieldClassName } from "./field-styles";
import { FieldMessages } from "./field-messages";

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
  id,
  ...inputProps
}: FormFieldProps) {
  const inputId = id ?? name;
  const { hintId, errorId, ...ariaProps } = fieldAriaProps(
    inputId,
    hint,
    error,
  );

  return (
    <div className="space-y-2">
      <label
        htmlFor={inputId}
        className="block text-sm font-semibold text-gray-900"
      >
        {label}
      </label>
      <input
        id={inputId}
        name={name}
        className={`${fieldClassName(Boolean(error))} ${className ?? ""}`}
        {...ariaProps}
        {...inputProps}
      />
      <FieldMessages
        hint={hint}
        hintId={hintId}
        error={error}
        errorId={errorId}
      />
    </div>
  );
}
