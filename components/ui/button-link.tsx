import Link from "next/link";
import type { ComponentProps } from "react";
import { buttonClassName } from "./button-styles";

type ButtonLinkProps = ComponentProps<typeof Link> & {
  variant?: "primary" | "secondary";
  size?: "sm" | "md";
};

/** ボタンの見た目をした画面遷移用のリンク（作成・編集・キャンセルなど） */
export function ButtonLink({
  variant = "primary",
  size = "md",
  className,
  ...props
}: ButtonLinkProps) {
  return (
    <Link
      className={`${buttonClassName(variant, size)} ${className ?? ""}`}
      {...props}
    />
  );
}
