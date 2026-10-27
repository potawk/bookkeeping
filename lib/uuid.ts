const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** UUID の形式なら true（URL の ID をデータベースに問い合わせる前の確認に使う） */
export function isUuid(value: string): boolean {
  return UUID_REGEX.test(value);
}
