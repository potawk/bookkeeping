"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/user";
import { getFormString, type FormState } from "@/lib/form-state";
import { toDbErrorMessage } from "@/lib/supabase/errors";
import { createClient } from "@/lib/supabase/server";
import type { AccountCategory } from "./categories";
import { validateAccountInput, validateAccountName } from "./validation";

const DUPLICATE_ACCOUNT = "同じ名前の勘定科目がすでに登録されています。";
const DUPLICATE_SUB_ACCOUNT =
  "この勘定科目には、同じ名前の補助科目がすでに登録されています。";
const ACCOUNT_IN_USE =
  "仕訳または期首残高で使用中のため、この勘定科目は削除できません。";
const SUB_ACCOUNT_IN_USE =
  "仕訳または期首残高で使用中のため、この補助科目は削除できません。";

/** 区分内の末尾に追加するための表示順（既存の最大値 + 10） */
async function nextAccountSortOrder(category: AccountCategory) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("accounts")
    .select("sort_order")
    .eq("category", category)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();
  return (data?.sort_order ?? 0) + 10;
}

/** 勘定科目を作成し、詳細画面へ移動する */
export async function createAccount(
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  await getCurrentUser();
  const values = {
    name: getFormString(formData, "name"),
    category: getFormString(formData, "category"),
  };

  const { errors, category } = validateAccountInput(values);
  if (!category || Object.keys(errors).length > 0) {
    return { fieldErrors: errors, values };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("accounts")
    .insert({
      name: values.name,
      category,
      sort_order: await nextAccountSortOrder(category),
    })
    .select("id")
    .single();

  if (error) {
    return {
      fieldErrors: {},
      values,
      message: toDbErrorMessage(error, { duplicate: DUPLICATE_ACCOUNT }),
    };
  }

  redirect(`/accounts/${data.id}`);
}

/** 勘定科目を更新し、詳細画面へ戻る（使用中の科目の区分変更はトリガーで拒否される） */
export async function updateAccount(
  accountId: string,
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  await getCurrentUser();
  const values = {
    name: getFormString(formData, "name"),
    category: getFormString(formData, "category"),
  };

  const { errors, category } = validateAccountInput(values);
  if (!category || Object.keys(errors).length > 0) {
    return { fieldErrors: errors, values };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("accounts")
    .update({ name: values.name, category })
    .eq("id", accountId);

  if (error) {
    return {
      fieldErrors: {},
      values,
      message: toDbErrorMessage(error, { duplicate: DUPLICATE_ACCOUNT }),
    };
  }

  redirect(`/accounts/${accountId}`);
}

/** 勘定科目を削除し、その区分の一覧へ戻る（補助科目も一緒に削除される） */
export async function deleteAccount(accountId: string): Promise<FormState> {
  await getCurrentUser();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("accounts")
    .delete()
    .eq("id", accountId)
    .select("category")
    .maybeSingle();

  if (error) {
    return {
      fieldErrors: {},
      message: toDbErrorMessage(error, { inUse: ACCOUNT_IN_USE }),
    };
  }

  redirect(`/accounts?category=${data?.category ?? "asset"}`);
}

/** 補助科目を追加する */
export async function createSubAccount(
  accountId: string,
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  await getCurrentUser();
  const name = getFormString(formData, "name");

  const nameError = validateAccountName(name, "補助科目名");
  if (nameError) {
    return { fieldErrors: { name: nameError }, values: { name } };
  }

  const supabase = await createClient();
  const { data: last } = await supabase
    .from("sub_accounts")
    .select("sort_order")
    .eq("account_id", accountId)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { error } = await supabase.from("sub_accounts").insert({
    account_id: accountId,
    name,
    sort_order: (last?.sort_order ?? 0) + 10,
  });

  if (error) {
    return {
      fieldErrors: {},
      values: { name },
      message: toDbErrorMessage(error, { duplicate: DUPLICATE_SUB_ACCOUNT }),
    };
  }

  refresh();
  return { fieldErrors: {}, ok: true };
}

/** 補助科目の名前を変更する */
export async function updateSubAccount(
  subAccountId: string,
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  await getCurrentUser();
  const name = getFormString(formData, "name");

  const nameError = validateAccountName(name, "補助科目名");
  if (nameError) {
    return { fieldErrors: { name: nameError }, values: { name } };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("sub_accounts")
    .update({ name })
    .eq("id", subAccountId);

  if (error) {
    return {
      fieldErrors: {},
      values: { name },
      message: toDbErrorMessage(error, { duplicate: DUPLICATE_SUB_ACCOUNT }),
    };
  }

  refresh();
  return { fieldErrors: {}, ok: true };
}

/** 補助科目を削除する */
export async function deleteSubAccount(
  subAccountId: string,
): Promise<FormState> {
  await getCurrentUser();
  const supabase = await createClient();
  const { error } = await supabase
    .from("sub_accounts")
    .delete()
    .eq("id", subAccountId);

  if (error) {
    return {
      fieldErrors: {},
      message: toDbErrorMessage(error, { inUse: SUB_ACCOUNT_IN_USE }),
    };
  }

  refresh();
  return { fieldErrors: {}, ok: true };
}
