"use client";

import Link from "next/link";

import { useBeginnerProgress } from "@/hooks/use-beginner-progress";
import { getBeginnerResumeSlug } from "@/lib/beginner-progress";
import { beginnerSeriesSlugs } from "@/lib/beginner-series";

export function BeginnerProgressSummary() {
  const progress = useBeginnerProgress();
  const total = beginnerSeriesSlugs.length;
  const completed = progress.completedSlugs.length;
  const resumeSlug = getBeginnerResumeSlug(progress);
  const resumeIndex = beginnerSeriesSlugs.indexOf(resumeSlug) + 1;
  const hasProgress = Boolean(
    progress.lastVisitedSlug || progress.completedSlugs.length > 0,
  );

  return (
    <section className="beginner-progress-summary" aria-label="你的学习进度">
      <div className="beginner-progress-summary-copy">
        <div>
          <span>你的学习进度</span>
          <strong>
            已完成 {completed} / {total} 篇
          </strong>
        </div>
        <Link href={`/blog/${resumeSlug}`}>
          {hasProgress ? `继续第 ${resumeIndex} 篇 →` : "从第 1 篇开始 →"}
        </Link>
      </div>
      <div
        className="beginner-progress-summary-bar"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={completed}
      >
        <span style={{ width: `${(completed / total) * 100}%` }} />
      </div>

      <style>{`
        .beginner-progress-summary {
          display: grid;
          gap: 16px;
          margin: -18px 0 48px;
          border-top: 1px solid var(--border);
          border-bottom: 1px solid var(--border);
          padding: 20px 0 22px;
          background: transparent;
        }
        .beginner-progress-summary-copy { display: flex; align-items: center; justify-content: space-between; gap: 24px; }
        .beginner-progress-summary-copy > div { display: grid; gap: 3px; }
        .beginner-progress-summary-copy span { color: #888; font-size: 11px; }
        .beginner-progress-summary-copy strong { color: #000; font-size: 15px; }
        .beginner-progress-summary-copy a { font-size: 12px; font-weight: 650; white-space: nowrap; }
        .beginner-progress-summary-bar { height: 2px; overflow: hidden; background: #ededed; }
        .beginner-progress-summary-bar span { display: block; height: 100%; background: #000; transition: width 220ms ease; }
        @media (max-width: 640px) {
          .beginner-progress-summary-copy { align-items: flex-start; flex-direction: column; gap: 12px; }
        }
      `}</style>
    </section>
  );
}
