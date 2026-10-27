import { APP_NAME } from "@/lib/constants";

/**
 * ロゴマーク。簿記で借方・貸方を左右に書き分ける「T字勘定」を図案にしている。
 * ブラウザのタブのアイコン（app/icon.svg）も同じ図案。
 */
export function LogoMark({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 32 32"
      className={`shrink-0 ${className}`}
    >
      <rect width="32" height="32" rx="8" className="fill-blue-700" />
      <path
        d="M8 11h16M16 11v13"
        fill="none"
        stroke="white"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

/** ロゴマークとサービス名（ヘッダーなどに表示する） */
export function AppLogo({ size = "md" }: { size?: "md" | "lg" }) {
  return (
    <span className="inline-flex items-center gap-2">
      <LogoMark className={size === "lg" ? "h-10 w-10" : "h-8 w-8"} />
      <span
        className={`font-bold text-blue-700 ${
          size === "lg" ? "text-3xl leading-tight" : "text-xl leading-snug"
        }`}
      >
        {APP_NAME}
      </span>
    </span>
  );
}
