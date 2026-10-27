"use server";

import type { PostgrestError } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/user";
import { getFormString, type FormState } from "@/lib/form-state";
import { toDbErrorMessage } from "@/lib/supabase/errors";
import { createClient } from "@/lib/supabase/server";
import { validateJournal, type JournalFormValues } from "./validation";

/** save_journal が「仕訳が見つからない」ときに返すエラーコード（no_data_found） */
const PG_NO_DATA_FOUND = "P0002";

function readJournalForm(formData: FormData): JournalFormValues {
  return {
    entryDate: getFormString(formData, "entryDate"),
    debitAccountId: getFormString(formData, "debitAccountId"),
    debitSubAccountId: getFormString(formData, "debitSubAccountId"),
    debitAmount: getFormString(formData, "debitAmount"),
    creditAccountId: getFormString(formData, "creditAccountId"),
    creditSubAccountId: getFormString(formData, "creditSubAccountId"),
    creditAmount: getFormString(formData, "creditAmount"),
    description: getFormString(formData, "description"),
  };
}

function toJournalErrorMessage(error: PostgrestError): string {
  if (error.code === PG_NO_DATA_FOUND) {
    return "仕訳が見つかりません。削除された可能性があります。";
  }
  return toDbErrorMessage(error, {
    // 勘定科目・補助科目が削除された、または補助科目が別の勘定科目のもの
    inUse:
      "選択した勘定科目・補助科目が見つかりません。画面を再読み込みしてください。",
  });
}

/**
 * 仕訳を検証し、データベース関数 save_journal で保存する。
 * journalId が null なら新規登録、指定があれば更新する。成功したら保存した仕訳の ID を返す。
 */
async function saveJournal(
  journalId: string | null,
  formData: FormData,
): Promise<{ state: FormState } | { id: string; entryDate: string }> {
  await getCurrentUser();
  const values = readJournalForm(formData);

  const { errors, balanceError, lines } = validateJournal(values);
  if (Object.keys(errors).length > 0 || balanceError) {
    return {
      state: {
        fieldErrors: errors,
        message:
          balanceError ??
          "入力内容に誤りがあります。各項目のメッセージを確認してください。",
      },
    };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("save_journal", {
    // 生成される型は引数の null を表せないため、新規登録の null はキャストして渡す
    p_journal_id: journalId as string,
    p_entry_date: values.entryDate,
    p_description: values.description,
    p_lines: lines,
  });

  if (error) {
    return {
      state: { fieldErrors: {}, message: toJournalErrorMessage(error) },
    };
  }
  return { id: data, entryDate: values.entryDate };
}

/** 仕訳を登録し、その日の仕訳一覧へ移動する */
export async function createJournal(
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const result = await saveJournal(null, formData);
  if ("state" in result) return result.state;
  redirect(`/calendar/${result.entryDate}`);
}

/** 仕訳を更新し、仕訳詳細へ戻る */
export async function updateJournal(
  journalId: string,
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const result = await saveJournal(journalId, formData);
  if ("state" in result) return result.state;
  redirect(`/journals/${result.id}`);
}

/** 仕訳を削除し、その日の仕訳一覧へ戻る（仕訳明細も一緒に削除される） */
export async function deleteJournal(journalId: string): Promise<FormState> {
  await getCurrentUser();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("journals")
    .delete()
    .eq("id", journalId)
    .select("entry_date")
    .maybeSingle();

  if (error) {
    return { fieldErrors: {}, message: toJournalErrorMessage(error) };
  }

  redirect(data ? `/calendar/${data.entry_date}` : "/calendar");
}
