"use client";

import Link from "next/link";

import { useBeginnerProgress } from "@/hooks/use-beginner-progress";
import { getBeginnerResumeSlug } from "@/lib/beginner-progress";
import { beginnerSeriesSlugs } from "@/lib/beginner-series";

export function HomeLearningActions() {
  const progress = useBeginnerProgress();
  const resumeSlug = getBeginnerResumeSlug(progress);
  const resumeIndex = beginnerSeriesSlugs.indexOf(resumeSlug) + 1;
  const hasProgress = Boolean(
    progress.lastVisitedSlug || progress.completedSlugs.length > 0,
  );

  return (
    <div className="home-learning-actions">
      <div className="home-learning-links">
        <Link className="home-learning-primary" href={`/blog/${resumeSlug}`}>
          {hasProgress
            ? `继续学习 · 第 ${resumeIndex} 篇`
            : "开始学习 Screeps"}
          <span aria-hidden="true">→</span>
        </Link>
        {hasProgress ? (
          <Link className="home-learning-secondary" href="/beginner">
            查看学习路线
          </Link>
        ) : null}
      </div>
      {hasProgress ? (
        <p>
          已完成 {progress.completedSlugs.length} / {beginnerSeriesSlugs.length} 篇
        </p>
      ) : null}

      <style>{`
        .home-learning-actions {
          display: grid;
          justify-items: center;
          gap: 14px;
          margin-top: 42px;
        }

        .home-learning-links {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          justify-content: center;
          gap: 12px;
        }

        .home-learning-primary,
        .home-learning-secondary {
          display: inline-flex;
          min-height: 46px;
          align-items: center;
          justify-content: center;
          border-radius: 999px;
          padding: 0 20px;
          font-size: 14px;
          font-weight: 680;
          transition:
            transform 160ms ease,
            border-color 160ms ease;
        }

        .home-learning-primary {
          gap: 10px;
          border: 1px solid var(--foreground);
          background: var(--foreground);
          color: var(--background);
        }

        .home-learning-secondary {
          border: 1px solid var(--border);
          background: var(--surface);
        }

        .home-learning-primary:hover,
        .home-learning-secondary:hover {
          transform: translateY(-2px);
          text-decoration: none;
        }

        .home-learning-secondary:hover {
          border-color: var(--muted);
        }

        .home-learning-actions p {
          margin: 0;
          color: var(--muted);
          font-family: "SFMono-Regular", Consolas, "Liberation Mono", monospace;
          font-size: 12px;
        }

        @media (max-width: 480px) {
          .home-learning-actions {
            margin-top: 32px;
          }

          .home-learning-links {
            width: 100%;
          }

          .home-learning-primary,
          .home-learning-secondary {
            width: min(100%, 280px);
          }
        }
      `}</style>
    </div>
  );
}
