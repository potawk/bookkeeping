"use client";

import { useActionState, useId, useRef } from "react";
import type { FormState } from "@/lib/form-state";
import { buttonClassName } from "./button-styles";
import { FormAlert } from "./form-alert";
import { SubmitButton } from "./submit-button";

type ConfirmDeleteDialogProps = {
  /** 削除を実行する Server Action（失敗時はエラーメッセージを返す。成功時はリダイレクトまたは ok を返す） */
  action: () => Promise<FormState>;
  /** 開くボタンの文言 */
  triggerLabel: string;
  title: string;
  description: string;
  /** 開くボタンを小さく表示する（一覧の行の中など） */
  size?: "sm" | "md";
};

/**
 * 削除確認ダイアログ。ブラウザ標準の confirm() ではなく、HTML の <dialog> で画面内に表示する。
 * Escape キーまたは「キャンセル」で閉じる。削除に失敗した場合はダイアログ内に理由を表示する。
 */
export function ConfirmDeleteDialog({
  action,
  triggerLabel,
  title,
  description,
  size = "sm",
}: ConfirmDeleteDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descriptionId = useId();

  const [state, formAction, pending] = useActionState(async () => {
    const result = await action();
    // 成功したら閉じる（リダイレクトする場合はここに来ない）
    if (result.ok) dialogRef.current?.close();
    return result;
  }, {} as FormState);

  return (
    <>
      <button
        type="button"
        onClick={() => dialogRef.current?.showModal()}
        className={buttonClassName("danger", size)}
      >
        {triggerLabel}
      </button>
      <dialog
        ref={dialogRef}
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        className="m-auto w-[calc(100%-2rem)] max-w-md rounded-3xl border border-gray-300 bg-white p-6 shadow-xl backdrop:bg-gray-900/50 sm:p-8"
      >
        <form action={formAction} className="space-y-6">
          <h2
            id={titleId}
            className="text-xl font-semibold leading-snug text-gray-900"
          >
            {title}
          </h2>
          <p
            id={descriptionId}
            className="text-base leading-relaxed text-gray-700"
          >
            {description}
          </p>
          <FormAlert message={state.message} />
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => dialogRef.current?.close()}
              className={buttonClassName("secondary", "md")}
            >
              キャンセル
            </button>
            <SubmitButton
              pending={pending}
              pendingLabel="削除中…"
              variant="danger"
            >
              削除する
            </SubmitButton>
          </div>
        </form>
      </dialog>
    </>
  );
}
