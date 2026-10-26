import { signOut } from "@/lib/auth/actions";

/** ログアウトボタン（サーバー側の signOut を呼び出し、ログイン画面へ移動する） */
export function LogoutButton() {
  return (
    <form action={signOut}>
      <button
        type="submit"
        className="min-h-11 cursor-pointer rounded-lg border-2 border-blue-700 bg-white px-3 py-2 text-sm font-semibold text-blue-700 shadow-sm transition-all duration-200 ease-in-out hover:bg-blue-50 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 active:scale-95"
      >
        ログアウト
      </button>
    </form>
  );
}
