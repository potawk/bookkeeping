/** 決算書を読み込んでいる間の表示 */
export function ReportSkeleton({ label }: { label: string }) {
  return (
    <div role="status" aria-label={label} className="space-y-6">
      <div className="h-40 w-full animate-pulse rounded-2xl bg-gray-100 motion-reduce:animate-none" />
      <div className="h-96 w-full animate-pulse rounded-2xl bg-gray-100 motion-reduce:animate-none" />
    </div>
  );
}
