import type { ReactNode } from "react";
import { buttonClassName } from "./button-styles";
import { Spinner } from "./spinner";

type SubmitButtonProps = {
  children: ReactNode;
  /** 送信中はスピナーを表示し、二重送信を防ぐためにボタンを無効にする */
  pending: boolean;
  pendingLabel: string;
  variant?: "primary" | "danger";
  size?: "sm" | "md";
  /** true のとき横幅いっぱいに広げる（ログイン・新規登録フォームなど） */
  fullWidth?: boolean;
};

/** フォーム送信用のボタン（送信中はローダーを表示する） */
export function SubmitButton({
  children,
  pending,
  pendingLabel,
  variant = "primary",
  size = "md",
  fullWidth = false,
}: SubmitButtonProps) {
  return (
    <button
      type="submit"
      disabled={pending}
      aria-disabled={pending}
      className={`${buttonClassName(variant, size)} ${fullWidth ? "w-full" : ""}`}
    >
      {pending && <Spinner />}
      <span>{pending ? pendingLabel : children}</span>
    </button>
  );
}
