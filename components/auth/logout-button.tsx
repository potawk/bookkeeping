import { buttonClassName } from "@/components/ui/button-styles";
import { signOut } from "@/lib/auth/actions";

/** ログアウトボタン（サーバー側の signOut を呼び出し、ログイン画面へ移動する） */
export function LogoutButton() {
  return (
    <form action={signOut}>
      <button type="submit" className={buttonClassName("secondary", "sm")}>
        ログアウト
      </button>
    </form>
  );
}
