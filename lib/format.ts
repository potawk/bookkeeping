/** 日付を「2026年10月26日」の形式で表示する（日本時間で判定する） */
const dateFormatter = new Intl.DateTimeFormat("ja-JP", {
  year: "numeric",
  month: "long",
  day: "numeric",
  timeZone: "Asia/Tokyo",
});

export function formatDate(value: string | Date): string {
  return dateFormatter.format(
    typeof value === "string" ? new Date(value) : value,
  );
}

/** 金額を「1,234円」の形式で表示する（マイナスは「-1,234円」） */
const amountFormatter = new Intl.NumberFormat("ja-JP");

export function formatYen(amount: number): string {
  return `${amountFormatter.format(amount)}円`;
}

/**
 * 入力された金額の文字列を整数に変換する。3桁区切りのカンマ・全角数字も受け付ける。
 * 0 以上の整数として読めない場合は null を返す。
 */
export function parseAmount(value: string): number | null {
  const normalized = value
    .replace(/[０-９]/g, (digit) =>
      String.fromCharCode(digit.charCodeAt(0) - 0xfee0),
    )
    .replace(/[,，\s]/g, "");
  if (!/^\d+$/.test(normalized)) return null;
  const amount = Number(normalized);
  return Number.isSafeInteger(amount) ? amount : null;
}
