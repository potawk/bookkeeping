import Link from "next/link";
import type { ComponentProps } from "react";

/** 本文中のリンク（白背景で読みやすい blue-700 と下線を使う） */
export function TextLink({ className, ...props }: ComponentProps<typeof Link>) {
  return (
    <Link
      className={`rounded font-semibold text-blue-700 underline underline-offset-2 transition-colors duration-150 ease-in-out hover:text-blue-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1 ${className ?? ""}`}
      {...props}
    />
  );
}
