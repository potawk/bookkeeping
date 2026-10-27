"use server";

import { refresh } from "next/cache";
import { getCurrentUser } from "@/lib/auth/user";
import { getFormString, type FormState } from "@/lib/form-state";
import { toDbErrorMessage } from "@/lib/supabase/errors";
import { createClient } from "@/lib/supabase/server";
import {
  validateOpeningBalances,
  type OpeningBalanceInputRow,
} from "./validation";

/** 画面から送られた行の JSON を読み取る（形式が不正なら null） */
function parseRows(value: string): OpeningBalanceInputRow[] | null {
  try {
    const parsed: unknown = JSON.parse(value);
    if (!Array.isArray(parsed)) return null;
    return parsed.map((row) => ({
      key: String(row?.key ?? ""),
      accountId: String(row?.accountId ?? ""),
      subAccountId: String(row?.subAccountId ?? ""),
      amount: String(row?.amount ?? ""),
    }));
  } catch {
    return null;
  }
}

/** 期首日と期首残高を保存する（既存の期首残高は丸ごと置き換える） */
export async function saveOpeningBalances(
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  await getCurrentUser();
  const openingDate = getFormString(formData, "openingDate");
  const rows = parseRows(getFormString(formData, "rows"));

  if (!rows) {
    return {
      fieldErrors: {},
      message: "入力内容を読み取れませんでした。画面を再読み込みしてください。",
    };
  }

  const { errors, validRows } = validateOpeningBalances(openingDate, rows);
  if (Object.keys(errors).length > 0) {
    return {
      fieldErrors: errors,
      message:
        "入力内容に誤りがあります。各項目のメッセージを確認してください。",
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("save_opening_balances", {
    p_opening_date: openingDate,
    p_rows: validRows,
  });

  if (error) {
    return {
      fieldErrors: {},
      message: toDbErrorMessage(error, {
        duplicate: "同じ勘定科目・補助科目の行が重複しています。",
      }),
    };
  }

  refresh();
  return { fieldErrors: {}, ok: true };
}
