/** 未実装の画面に表示する仮の内容（各機能の実装時に置き換える） */
export function PlaceholderPage({ title }: { title: string }) {
  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-semibold leading-tight text-gray-900">
        {title}
      </h1>
      <p className="text-base leading-relaxed text-gray-700">
        この画面は準備中です。
      </p>
    </div>
  );
}
