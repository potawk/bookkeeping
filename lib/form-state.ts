/**
 * useActionState で Server Action から受け取るフォームの結果。
 * - fieldErrors: 入力欄ごとのエラーメッセージ
 * - message: フォーム全体のメッセージ（保存失敗などのエラー。ok が true のときは完了のお知らせ）
 * - values: 送信後も入力内容を残すための値
 * - ok: 処理が成功したとき true
 */
export type FormState = {
  fieldErrors: Record<string, string>;
  message?: string;
  values?: Record<string, string>;
  ok?: boolean;
};

export const initialFormState: FormState = { fieldErrors: {} };

/** FormData から文字列を取り出す（未入力・ファイルは空文字にし、前後の空白を除く） */
export function getFormString(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}
