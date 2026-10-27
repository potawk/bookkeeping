import type { SelectHTMLAttributes } from "react";
import { FieldMessages } from "./field-messages";
import { fieldAriaProps, fieldClassName } from "./field-styles";

type SelectFieldProps = SelectHTMLAttributes<HTMLSelectElement> & {
  /** select の id・name に使う */
  name: string;
  label: string;
  options: { value: string; label: string }[];
  /** 入力欄の下に表示する補足説明 */
  hint?: string;
  error?: string;
};

/** ラベル・セレクトボックス・補足説明・エラーメッセージをまとめた選択項目 */
export function SelectField({
  name,
  label,
  options,
  hint,
  error,
  id,
  ...selectProps
}: SelectFieldProps) {
  const selectId = id ?? name;
  const { hintId, errorId, ...ariaProps } = fieldAriaProps(
    selectId,
    hint,
    error,
  );

  return (
    <div className="space-y-2">
      <label
        htmlFor={selectId}
        className="block text-sm font-semibold text-gray-900"
      >
        {label}
      </label>
      <select
        id={selectId}
        name={name}
        className={fieldClassName(Boolean(error))}
        {...ariaProps}
        {...selectProps}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <FieldMessages
        hint={hint}
        hintId={hintId}
        error={error}
        errorId={errorId}
      />
    </div>
  );
}
