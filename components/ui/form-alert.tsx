/** フォーム全体に関わるエラーメッセージ（ログイン失敗など）。表示されたら読み上げられるよう role="alert" を付ける */
export function FormAlert({ message }: { message?: string }) {
  if (!message) return null;

  return (
    <p
      role="alert"
      className="rounded-lg border border-red-600 bg-white px-4 py-3 text-sm font-semibold leading-relaxed text-red-600"
    >
      {message}
    </p>
  );
}
