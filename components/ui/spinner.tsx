/** 処理中を表す回転アイコン（動きを減らす設定のときは回転しない） */
export function Spinner() {
  return (
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
  );
}
