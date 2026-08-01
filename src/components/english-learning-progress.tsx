"use client";

import { useEffect, useRef, useState } from "react";

import Link from "next/link";

import { useEnglishLearning } from "@/hooks/use-english-learning";
import {
  clearEnglishLearningState,
  ENGLISH_BEGINNER_PATHS,
  exportEnglishLearningState,
  getEnglishResumePath,
  importEnglishLearningState,
  isEnglishBeginnerPath,
  recordEnglishArticleVisit,
  toggleEnglishLessonCompleted,
} from "@/lib/english-learning-state";

const MAX_IMPORT_BYTES = 65_536;

export function EnglishBeginnerProgress() {
  const learning = useEnglishLearning();
  const importInputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState("");
  const completed = learning.completedPaths.length;
  const total = ENGLISH_BEGINNER_PATHS.length;
  const resumePath = getEnglishResumePath(learning);
  const resumeIndex = ENGLISH_BEGINNER_PATHS.indexOf(
    resumePath as (typeof ENGLISH_BEGINNER_PATHS)[number],
  ) + 1;
  const hasProgress =
    completed > 0 ||
    learning.lastVisitedPath !== null ||
    learning.recentArticles.length > 0;

  function clearProgress() {
    clearEnglishLearningState();
    setStatus("Learning progress and recent reading were cleared.");
  }

  function exportProgress() {
    const blob = new Blob([exportEnglishLearningState(learning)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `linqingan-learning-progress-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.append(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    setStatus("A private progress file was exported. It contains no account or room data.");
  }

  async function importProgress(file: File | undefined) {
    if (!file) return;

    try {
      if (file.size > MAX_IMPORT_BYTES) {
        throw new Error("The selected file is larger than 64 KB.");
      }
      importEnglishLearningState(await file.text());
      setStatus("Learning progress was imported into this browser.");
    } catch (error) {
      setStatus(
        error instanceof Error
          ? `Progress import failed: ${error.message}`
          : "Progress import failed because the file is invalid.",
      );
    } finally {
      if (importInputRef.current) importInputRef.current.value = "";
    }
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
            account, room, or game data is collected. You can export a private
            JSON file to move this progress between browsers.
          </p>
        </div>
        <div className="english-learning-summary-actions">
          <Link href={resumePath}>
            {hasProgress ? `Continue with lesson ${resumeIndex}` : "Start lesson 1"}
          </Link>
          {hasProgress ? (
            <button type="button" onClick={exportProgress}>
              Export progress
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => importInputRef.current?.click()}
          >
            Import progress
          </button>
          <input
            ref={importInputRef}
            type="file"
            accept="application/json,.json"
            hidden
            aria-label="Choose a learning progress JSON file"
            onChange={(event) => void importProgress(event.target.files?.[0])}
          />
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
