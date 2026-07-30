"use client";

import { useEffect, useState } from "react";

import Link from "next/link";

import { useEnglishLearning } from "@/hooks/use-english-learning";
import {
  clearEnglishLearningState,
  ENGLISH_BEGINNER_PATHS,
  getEnglishResumePath,
  isEnglishBeginnerPath,
  recordEnglishArticleVisit,
  toggleEnglishLessonCompleted,
} from "@/lib/english-learning-state";

export function EnglishBeginnerProgress() {
  const learning = useEnglishLearning();
  const [status, setStatus] = useState("");
  const completed = learning.completedPaths.length;
  const total = ENGLISH_BEGINNER_PATHS.length;
  const resumePath = getEnglishResumePath(learning);
  const resumeIndex = ENGLISH_BEGINNER_PATHS.indexOf(
    resumePath as (typeof ENGLISH_BEGINNER_PATHS)[number],
  ) + 1;
  const hasProgress =
    completed > 0 ||
    learning.lastVisitedPath !== null;

  function clearProgress() {
    clearEnglishLearningState();
    setStatus("Learning progress and recent reading were cleared.");
  }

  return (
    <section
      className="english-learning-summary"
      aria-labelledby="english-learning-summary-title"
    >
      <div className="english-learning-summary-copy">
        <div>
          <p className="eyebrow">YOUR LEARNING</p>
          <h2 id="english-learning-summary-title">
            {completed} of {total} lessons complete
          </h2>
          <p>
            Progress and recent reading stay in this browser. No Screeps
            account, room, or game data is collected.
          </p>
        </div>
        <div className="english-learning-summary-actions">
          <Link href={resumePath}>
            {hasProgress ? `Continue with lesson ${resumeIndex}` : "Start lesson 1"}
          </Link>
          {hasProgress ? (
            <button type="button" onClick={clearProgress}>
              Clear local history
            </button>
          ) : null}
        </div>
      </div>

      <progress
        className="english-learning-progressbar"
        aria-label="Beginner roadmap completion"
        max={total}
        value={completed}
      />

      {learning.recentArticles.length > 0 ? (
        <nav className="english-recent-reading" aria-label="Recently read English guides">
          <strong>Recently read</strong>
          <ul>
            {learning.recentArticles.slice(0, 4).map((article) => (
              <li key={article.href}>
                <Link href={article.href}>{article.title}</Link>
              </li>
            ))}
          </ul>
        </nav>
      ) : null}

      <p className="english-learning-status" role="status" aria-live="polite">
        {status}
      </p>
    </section>
  );
}

interface EnglishArticleLearningTrackerProps {
  href: string;
  title: string;
}

export function EnglishArticleLearningTracker({
  href,
  title,
}: EnglishArticleLearningTrackerProps) {
  const learning = useEnglishLearning();
  const isBeginnerLesson = isEnglishBeginnerPath(href);
  const isCompleted = learning.completedPaths.includes(href);

  useEffect(() => {
    recordEnglishArticleVisit(href, title);
  }, [href, title]);

  if (!isBeginnerLesson) return null;

  return (
    <aside
      className="english-lesson-progress"
      aria-label="Beginner lesson progress"
    >
      <div>
        <span>Saved only in this browser</span>
        <strong>
          {learning.completedPaths.length} of {ENGLISH_BEGINNER_PATHS.length}{" "}
          beginner lessons complete
        </strong>
      </div>
      <button
        type="button"
        className={isCompleted ? "is-complete" : undefined}
        aria-pressed={isCompleted}
        onClick={() => toggleEnglishLessonCompleted(href)}
      >
        {isCompleted ? "Completed — mark incomplete" : "Mark lesson complete"}
      </button>
    </aside>
  );
}
