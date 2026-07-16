"use client";

import { useBeginnerProgress } from "@/hooks/use-beginner-progress";

interface BeginnerProgressMarkerProps {
  slug: string;
}

export function BeginnerProgressMarker({
  slug,
}: BeginnerProgressMarkerProps) {
  const progress = useBeginnerProgress();
  const isCompleted = progress.completedSlugs.includes(slug);

  return (
    <>
      <span
        className={
          isCompleted
            ? "beginner-progress-marker beginner-progress-marker-complete"
            : "beginner-progress-marker"
        }
        aria-label={isCompleted ? "已完成" : "未完成"}
      >
        {isCompleted ? "✓ 已读" : "未读"}
      </span>
      <style>{`
        .beginner-progress-marker {
          display: inline-flex;
          min-height: 24px;
          align-items: center;
          border: 1px solid var(--border);
          border-radius: 999px;
          padding: 0 8px;
          color: var(--muted);
          font-size: 11px;
        }

        .beginner-progress-marker-complete {
          border-color: color-mix(in srgb, var(--foreground) 32%, var(--border));
          color: var(--foreground);
        }
      `}</style>
    </>
  );
}
