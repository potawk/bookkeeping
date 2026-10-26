import type { ReactNode } from "react";

type SubmitButtonProps = {
  children: ReactNode;
  /** 送信中はスピナーを表示し、二重送信を防ぐためにボタンを無効にする */
  pending: boolean;
  pendingLabel: string;
};

/** フォーム送信用のプライマリボタン（送信中はローダーを表示する） */
export function SubmitButton({
  children,
  pending,
  pendingLabel,
}: SubmitButtonProps) {
  return (
    <button
      type="submit"
      disabled={pending}
      aria-disabled={pending}
      className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-blue-500 px-6 py-3 text-base font-semibold text-white shadow-md transition-all duration-200 ease-in-out hover:bg-blue-600 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100"
    >
      {pending && (
        <svg
          aria-hidden="true"
          className="h-5 w-5 animate-spin motion-reduce:animate-none"
          viewBox="0 0 24 24"
          fill="none"
        >
          <circle
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
            className="opacity-25"
          />
          <path
            d="M4 12a8 8 0 0 1 8-8"
            stroke="currentColor"
            strokeWidth="4"
            strokeLinecap="round"
          />
        </svg>
      )}
      <span>{pending ? pendingLabel : children}</span>
    </button>
  );
}
