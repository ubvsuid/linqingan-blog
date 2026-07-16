"use client";

import { useEffect } from "react";

import { useBeginnerProgress } from "@/hooks/use-beginner-progress";
import {
  markBeginnerVisited,
  toggleBeginnerCompleted,
} from "@/lib/beginner-progress";
import { beginnerSeriesSlugs } from "@/lib/beginner-series";

interface BeginnerProgressPanelProps {
  slug: string;
}

export function BeginnerProgressPanel({
  slug,
}: BeginnerProgressPanelProps) {
  const progress = useBeginnerProgress();
  const isCompleted = progress.completedSlugs.includes(slug);

  useEffect(() => {
    markBeginnerVisited(slug);
  }, [slug]);

  return (
    <section className="beginner-progress-panel" aria-label="文章学习状态">
      <div>
        <span>学习记录保存在当前浏览器</span>
        <strong>
          已完成 {progress.completedSlugs.length} / {beginnerSeriesSlugs.length} 篇
        </strong>
      </div>
      <button
        type="button"
        className={isCompleted ? "is-complete" : undefined}
        onClick={() => toggleBeginnerCompleted(slug)}
      >
        {isCompleted ? "✓ 本篇已完成" : "标记本篇为已读"}
      </button>

      <style>{`
        .beginner-progress-panel {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 22px;
          margin-top: 70px;
          border: 1px solid var(--border);
          border-radius: 18px;
          padding: 20px 22px;
          background: var(--surface);
        }

        .beginner-progress-panel > div {
          display: grid;
          gap: 4px;
        }

        .beginner-progress-panel span {
          color: var(--muted);
          font-size: 13px;
        }

        .beginner-progress-panel strong {
          font-size: 15px;
        }

        .beginner-progress-panel button {
          min-height: 42px;
          border: 1px solid var(--foreground);
          border-radius: 999px;
          padding: 0 18px;
          background: var(--foreground);
          color: var(--background);
          font-weight: 650;
          cursor: pointer;
          white-space: nowrap;
          transition:
            transform 160ms ease,
            opacity 160ms ease;
        }

        .beginner-progress-panel button:hover {
          transform: translateY(-2px);
        }

        .beginner-progress-panel button.is-complete {
          border-color: var(--border);
          background: transparent;
          color: var(--foreground);
        }

        @media (max-width: 640px) {
          .beginner-progress-panel {
            align-items: stretch;
            flex-direction: column;
          }

          .beginner-progress-panel button {
            width: 100%;
          }
        }
      `}</style>
    </section>
  );
}
