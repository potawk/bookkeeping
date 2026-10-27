import Form from "next/form";
import Link from "next/link";
import { buttonClassName } from "@/components/ui/button-styles";
import { FormField } from "@/components/ui/form-field";

type ReportFilterFormProps = {
  /** 送信先（/reports/pl など）。入力した日付はクエリ文字列として付く */
  action: string;
  /** 日付の入力欄（開始日・終了日、または基準日） */
  fields: { name: string; label: string; value: string }[];
  /** プリセット（今月・先月など）。押すとその期間・基準日の決算書を表示する */
  presets: { label: string; href: string; active: boolean }[];
};

/**
 * 決算書の期間・基準日の指定フォーム。
 * next/form の Form は GET で送信し、ページを再読み込みせずに URL のクエリを更新する。
 */
export function ReportFilterForm({
  action,
  fields,
  presets,
}: ReportFilterFormProps) {
  return (
    <div className="space-y-4 rounded-2xl border border-gray-300 bg-white p-6 shadow-md">
      <nav aria-label="プリセット">
        <ul className="flex flex-wrap gap-2">
          {presets.map((preset) => (
            <li key={preset.label}>
              <Link
                href={preset.href}
                aria-current={preset.active ? "true" : undefined}
                className={
                  preset.active
                    ? "inline-flex min-h-11 items-center rounded-lg border border-blue-700 bg-blue-700 px-4 text-sm font-semibold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1"
                    : buttonClassName("secondary", "sm")
                }
              >
                {preset.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      {/* プリセットで日付が変わったときに入力欄も更新されるよう、日付を key にして作り直す */}
      <Form
        key={fields.map((field) => field.value).join(",")}
        action={action}
        className="flex flex-col gap-4 sm:flex-row sm:items-end"
      >
        {fields.map((field) => (
          <div key={field.name} className="sm:w-48">
            <FormField
              name={field.name}
              label={field.label}
              type="date"
              required
              defaultValue={field.value}
            />
          </div>
        ))}
        <button type="submit" className={buttonClassName("primary", "md")}>
          表示
        </button>
      </Form>
    </div>
  );
}
