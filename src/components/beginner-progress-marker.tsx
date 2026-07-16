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
  );
}
