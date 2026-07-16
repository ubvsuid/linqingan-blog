"use client";

import type { FormEvent } from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";

interface SeriesArticleJumpProps {
  articleHrefs: string[];
  currentArticle: number;
  seriesLabel: string;
}

export function SeriesArticleJump({
  articleHrefs,
  currentArticle,
  seriesLabel,
}: SeriesArticleJumpProps) {
  const router = useRouter();
  const totalArticles = articleHrefs.length;
  const [articleValue, setArticleValue] = useState(String(currentArticle));
  const [error, setError] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const targetArticle = Number.parseInt(articleValue, 10);

    if (
      !Number.isInteger(targetArticle) ||
      targetArticle < 1 ||
      targetArticle > totalArticles
    ) {
      setError(`请输入 1 到 ${totalArticles} 之间的篇数`);
      return;
    }

    const targetHref = articleHrefs[targetArticle - 1];

    if (!targetHref) {
      setError("这篇内容暂时不存在");
      return;
    }

    setError("");
    router.push(targetHref);
  }

  return (
    <section className="series-article-jump" aria-label={`${seriesLabel}篇数跳转`}>
      <p className="series-article-jump-summary">
        {seriesLabel} · 第 {currentArticle} / {totalArticles} 篇
      </p>

      <form className="series-article-jump-form" onSubmit={handleSubmit}>
        <label htmlFor="series-article-number">跳转到第</label>
        <input
          id="series-article-number"
          className="series-article-jump-input"
          type="number"
          inputMode="numeric"
          min={1}
          max={totalArticles}
          step={1}
          value={articleValue}
          onChange={(event) => setArticleValue(event.target.value)}
          aria-describedby={error ? "series-article-jump-error" : undefined}
          required
        />
        <span>篇</span>
        <button className="series-article-jump-submit" type="submit">
          跳转
        </button>
      </form>

      <p
        id="series-article-jump-error"
        className="series-article-jump-error"
        role="status"
        aria-live="polite"
      >
        {error}
      </p>

      <style>{`
        .series-article-jump {
          display: grid;
          gap: 16px;
          margin-top: 80px;
          border-top: 1px solid var(--border);
          padding-top: 28px;
        }

        .series-article-jump + .article-pagination {
          margin-top: 24px;
        }

        .series-article-jump-summary {
          margin: 0;
          color: var(--muted);
          font-family: "SFMono-Regular", Consolas, "Liberation Mono", monospace;
          font-size: 13px;
          text-align: center;
        }

        .series-article-jump-form {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          justify-content: center;
          gap: 10px;
          color: var(--muted);
          font-size: 14px;
        }

        .series-article-jump-input {
          width: 82px;
          min-height: 42px;
          border: 1px solid var(--border);
          border-radius: 12px;
          padding: 0 10px;
          background: var(--surface);
          color: var(--foreground);
          text-align: center;
          outline: none;
        }

        .series-article-jump-input:focus {
          border-color: var(--foreground);
          box-shadow: 0 0 0 3px color-mix(in srgb, var(--foreground) 10%, transparent);
        }

        .series-article-jump-submit {
          min-height: 42px;
          border: 1px solid var(--foreground);
          border-radius: 999px;
          padding: 0 18px;
          background: var(--foreground);
          color: var(--background);
          font-weight: 650;
          cursor: pointer;
          transition: transform 160ms ease;
        }

        .series-article-jump-submit:hover {
          transform: translateY(-2px);
        }

        .series-article-jump-error {
          min-height: 22px;
          margin: -6px 0 0;
          color: var(--muted);
          font-size: 13px;
          text-align: center;
        }
      `}</style>
    </section>
  );
}
