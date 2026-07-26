export default function EnglishLoadingPage() {
  return (
    <main className="english-loading" lang="en" aria-busy="true" aria-live="polite">
      <div className="container">
        <p className="eyebrow">LOADING</p>
        <div className="english-loading-line english-loading-title" />
        <div className="english-loading-line" />
        <div className="english-loading-line english-loading-short" />
      </div>
      <style>{`
        .english-loading { min-height: 58vh; padding: 96px 0; }
        .english-loading-line { width: min(100%, 720px); height: 18px; margin-top: 18px; border-radius: 999px; background: var(--surface-soft); animation: english-loading-pulse 1.2s ease-in-out infinite alternate; }
        .english-loading-title { width: min(100%, 520px); height: 58px; margin-top: 0; }
        .english-loading-short { width: min(70%, 440px); }
        @keyframes english-loading-pulse { from { opacity: .5; } to { opacity: 1; } }
        @media (prefers-reduced-motion: reduce) { .english-loading-line { animation: none; } }
      `}</style>
    </main>
  );
}
