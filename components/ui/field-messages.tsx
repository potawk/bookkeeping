/** 入力項目の下に表示する補足説明とエラーメッセージ */
export function FieldMessages({
  hint,
  hintId,
  error,
  errorId,
}: {
  hint?: string;
  hintId?: string;
  error?: string;
  errorId?: string;
}) {
  return (
    <>
      {hint && (
        <p id={hintId} className="text-xs leading-normal text-gray-600">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className="text-sm leading-relaxed text-red-600">
          {error}
        </p>
      )}
    </>
  );
}
