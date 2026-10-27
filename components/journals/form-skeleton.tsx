/** 仕訳フォームを読み込んでいる間の表示 */
export function FormSkeleton({ label }: { label: string }) {
  return (
    <div role="status" aria-label={label} className="space-y-6">
      <div className="h-12 w-64 animate-pulse rounded-lg bg-gray-100 motion-reduce:animate-none" />
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="h-72 animate-pulse rounded-2xl bg-gray-100 motion-reduce:animate-none" />
        <div className="h-72 animate-pulse rounded-2xl bg-gray-100 motion-reduce:animate-none" />
      </div>
      <div className="h-12 w-full animate-pulse rounded-lg bg-gray-100 motion-reduce:animate-none" />
    </div>
  );
}
