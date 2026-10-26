import type { Metadata } from "next";
import { TextLink } from "@/components/ui/text-link";
import { SignInForm } from "./signin-form";

export const metadata: Metadata = {
  title: "ログイン",
};

/** ログイン画面（/signin） */
export default function SignInPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold leading-snug text-gray-900">
        ログイン
      </h1>
      <SignInForm />
      <p className="text-center text-sm leading-relaxed text-gray-700">
        アカウントをお持ちでない方は
        <TextLink href="/signup" className="ml-1">
          新規登録はこちら
        </TextLink>
      </p>
    </div>
  );
}
