import type { PostgrestError } from "@supabase/supabase-js";

/** PostgreSQL のエラーコード（マイグレーションの制約・トリガーが返すもの） */
const PG_UNIQUE_VIOLATION = "23505";
const PG_FOREIGN_KEY_VIOLATION = "23503";
const PG_CHECK_VIOLATION = "23514";

type ErrorMessages = {
  /** 同じ名前がすでにある（ユニーク制約違反） */
  duplicate?: string;
  /** 仕訳・期首残高などで使用中のため削除できない（外部キー制約違反） */
  inUse?: string;
};

/**
 * データベースのエラーを、画面に表示する日本語のメッセージに変換する。
 * チェック制約違反は、トリガーが日本語のメッセージを返すのでそのまま使う。
 */
export function toDbErrorMessage(
  error: PostgrestError,
  messages: ErrorMessages = {},
): string {
  switch (error.code) {
    case PG_UNIQUE_VIOLATION:
      return messages.duplicate ?? "同じ内容のデータがすでに登録されています。";
    case PG_FOREIGN_KEY_VIOLATION:
      return messages.inUse ?? "ほかのデータで使用中のため、処理できません。";
    case PG_CHECK_VIOLATION:
      return error.message;
    default:
      return "保存に失敗しました。時間をおいて再度お試しください。";
  }
}
