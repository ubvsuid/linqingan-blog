"use client";

import type { CSSProperties } from "react";

import { useBeginnerProgress } from "@/hooks/use-beginner-progress";

interface BeginnerProgressMarkerProps {
  slug: string;
}

const baseStyle: CSSProperties = {
  display: "inline-flex",
  minHeight: 24,
  alignItems: "center",
  padding: 0,
  color: "#888",
  fontFamily: '"SFMono-Regular", Consolas, "Liberation Mono", monospace',
  fontSize: 10,
};

export function BeginnerProgressMarker({
  slug,
}: BeginnerProgressMarkerProps) {
  const progress = useBeginnerProgress();
  const isCompleted = progress.completedSlugs.includes(slug);

  return (
    <span
      style={
        isCompleted
          ? {
              ...baseStyle,
              color: "#000",
            }
          : baseStyle
      }
      aria-label={isCompleted ? "已完成" : "未完成"}
    >
      {isCompleted ? "✓ 已读" : "未读"}
    </span>
  );
}
