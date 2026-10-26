import type { Metadata } from "next";
import { TextLink } from "@/components/ui/text-link";
import { SignUpForm } from "./signup-form";

export const metadata: Metadata = {
  title: "新規登録",
};

/** 新規登録画面（/signup） */
export default function SignUpPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold leading-snug text-gray-900">
        新規登録
      </h1>
      <SignUpForm />
      <p className="text-center text-sm leading-relaxed text-gray-700">
        アカウントをお持ちの方は
        <TextLink href="/signin" className="ml-1">
          ログインはこちら
        </TextLink>
      </p>
    </div>
  );
}
