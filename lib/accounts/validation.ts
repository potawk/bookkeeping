import { isAccountCategory, type AccountCategory } from "./categories";

/** 勘定科目名・補助科目名は20文字以内（architecture/specification.md） */
export const ACCOUNT_NAME_MAX_LENGTH = 20;

/** 科目名（勘定科目・補助科目共通）を検証し、エラーメッセージを返す */
export function validateAccountName(
  name: string,
  label = "科目名",
): string | undefined {
  if (!name) return `${label}を入力してください。`;
  if (name.length > ACCOUNT_NAME_MAX_LENGTH) {
    return `${label}は${ACCOUNT_NAME_MAX_LENGTH}文字以内で入力してください。`;
  }
  return undefined;
}

/** 勘定科目フォームの入力値を検証する */
export function validateAccountInput(input: {
  name: string;
  category: string;
}): { errors: Record<string, string>; category?: AccountCategory } {
  const errors: Record<string, string> = {};

  const nameError = validateAccountName(input.name);
  if (nameError) errors.name = nameError;

  if (!isAccountCategory(input.category)) {
    errors.category = "区分を選択してください。";
    return { errors };
  }

  return { errors, category: input.category };
}
