"use client";

export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="not-found">
      <div className="container">
        <p className="eyebrow">APPLICATION ERROR</p>
        <h1>页面暂时无法加载</h1>
        <p>请重试；如果问题持续出现，请检查部署日志。</p>
        <button className="button button-primary" onClick={() => reset()}>
          重新加载
        </button>
      </div>
    </main>
  );
}
