"use client";

import { useEffect, useMemo, useState } from "react";

interface ArticleFeedbackProps {
  slug: string;
  title: string;
  articleUrl: string;
  email: string;
  issueUrl: string;
}

type FeedbackValue = "helpful" | "needs-work";

export function ArticleFeedback({
  slug,
  title,
  articleUrl,
  email,
  issueUrl,
}: ArticleFeedbackProps) {
  const storageKey = `article-feedback:${slug}`;
  const [feedback, setFeedback] = useState<FeedbackValue | null>(null);

  useEffect(() => {
    const saved = window.localStorage.getItem(storageKey);
    if (saved === "helpful" || saved === "needs-work") {
      setFeedback(saved);
    }
  }, [storageKey]);

  const githubHref = useMemo(() => {
    const body = [
      `文章：${title}`,
      `地址：${articleUrl}`,
      "",
      "问题位置：",
      "",
      "问题描述：",
      "",
      "建议修改：",
    ].join("\n");

    const params = new URLSearchParams({
      title: `文章反馈：${title}`,
      body,
    });

    return `${issueUrl}?${params.toString()}`;
  }, [articleUrl, issueUrl, title]);

  function saveFeedback(value: FeedbackValue) {
    setFeedback(value);
    window.localStorage.setItem(storageKey, value);
    window.dispatchEvent(
      new CustomEvent("site:article-feedback", {
        detail: { slug, value },
      }),
    );
  }

  return (
    <section className="article-feedback" aria-labelledby="article-feedback-title">
      <div>
        <p className="eyebrow">FEEDBACK</p>
        <h2 id="article-feedback-title">这篇文章解决了你的问题吗？</h2>
        <p>反馈保存在当前浏览器中。发现代码或表述有错误时，也可以直接提交具体问题。</p>
      </div>

      <div className="article-feedback-actions">
        <div className="article-feedback-votes" role="group" aria-label="文章是否有帮助">
          <button
            type="button"
            className={feedback === "helpful" ? "feedback-active" : undefined}
            aria-pressed={feedback === "helpful"}
            onClick={() => saveFeedback("helpful")}
          >
            有帮助
          </button>
          <button
            type="button"
            className={feedback === "needs-work" ? "feedback-active" : undefined}
            aria-pressed={feedback === "needs-work"}
            onClick={() => saveFeedback("needs-work")}
          >
            需要改进
          </button>
        </div>

        <p className="article-feedback-status" aria-live="polite">
          {feedback === "helpful"
            ? "感谢反馈，我会继续保持这种写法。"
            : feedback === "needs-work"
              ? "已经记录。可以继续告诉我具体卡住的位置。"
              : "选择一个选项即可完成反馈。"}
        </p>

        <div className="article-feedback-links">
          <a href={githubHref} target="_blank" rel="noreferrer">
            在 GitHub 提交问题 ↗
          </a>
          <a
            href={`mailto:${email}?subject=${encodeURIComponent(`文章反馈：${title}`)}&body=${encodeURIComponent(`文章：${articleUrl}\n\n问题描述：`)}`}
          >
            通过邮箱反馈
          </a>
        </div>
      </div>

      <style>{`
        .article-feedback {
          display: grid;
          grid-template-columns: minmax(210px, .72fr) minmax(0, 1.28fr);
          gap: 46px;
          margin-top: 72px;
          border-top: 1px solid var(--border);
          border-bottom: 1px solid var(--border);
          padding: 42px 0;
        }

        .article-feedback h2 {
          margin: 8px 0 0;
          font-size: clamp(26px, 4vw, 38px);
          letter-spacing: -.035em;
        }

        .article-feedback > div > p:last-child,
        .article-feedback-status {
          color: var(--muted);
          line-height: 1.7;
        }

        .article-feedback-actions {
          display: grid;
          align-content: start;
          gap: 15px;
        }

        .article-feedback-votes,
        .article-feedback-links {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
        }

        .article-feedback button,
        .article-feedback-links a {
          display: inline-flex;
          min-height: 44px;
          align-items: center;
          border: 1px solid var(--border);
          border-radius: 999px;
          padding: 0 17px;
          background: var(--surface);
          color: var(--foreground);
          font: inherit;
          font-weight: 650;
          cursor: pointer;
        }

        .article-feedback button:hover,
        .article-feedback-links a:hover {
          border-color: var(--muted);
          text-decoration: none;
        }

        .article-feedback button.feedback-active {
          border-color: var(--foreground);
          background: var(--foreground);
          color: var(--background);
        }

        .article-feedback-status {
          min-height: 24px;
          margin: 0;
          font-size: 13px;
        }

        .article-feedback-links {
          margin-top: 3px;
        }

        @media (max-width: 720px) {
          .article-feedback {
            grid-template-columns: 1fr;
            gap: 26px;
          }
        }
      `}</style>
    </section>
  );
}
