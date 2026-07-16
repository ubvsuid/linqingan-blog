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
  border: "1px solid var(--border)",
  borderRadius: 999,
  padding: "0 8px",
  color: "var(--muted)",
  fontSize: 11,
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
              borderColor:
                "color-mix(in srgb, var(--foreground) 32%, var(--border))",
              color: "var(--foreground)",
            }
          : baseStyle
      }
      aria-label={isCompleted ? "已完成" : "未完成"}
    >
      {isCompleted ? "✓ 已读" : "未读"}
    </span>
  );
}
