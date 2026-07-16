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
      <Link className="home-learning-primary" href={`/blog/${resumeSlug}`}>
        {hasProgress ? `继续学习 · 第 ${resumeIndex} 篇` : "开始学习 Screeps"}
        <span aria-hidden="true">→</span>
      </Link>
      {hasProgress ? (
        <Link className="home-learning-secondary" href="/beginner">
          查看学习路线
        </Link>
      ) : null}
      {hasProgress ? (
        <p>
          已完成 {progress.completedSlugs.length} / {beginnerSeriesSlugs.length} 篇
        </p>
      ) : null}
    </div>
  );
}
