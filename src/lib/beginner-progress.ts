import { beginnerSeriesSlugs } from "@/lib/beginner-series";

export const BEGINNER_PROGRESS_STORAGE_KEY = "linqingan.beginner-progress.v1";
export const BEGINNER_PROGRESS_EVENT = "linqingan:beginner-progress-change";

export interface BeginnerProgress {
  completedSlugs: string[];
  lastVisitedSlug: string | null;
}

export const emptyBeginnerProgress: BeginnerProgress = {
  completedSlugs: [],
  lastVisitedSlug: null,
};

function isPublishedBeginnerSlug(value: unknown): value is string {
  return (
    typeof value === "string" && beginnerSeriesSlugs.some((slug) => slug === value)
  );
}

export function normalizeBeginnerProgress(value: unknown): BeginnerProgress {
  if (!value || typeof value !== "object") {
    return emptyBeginnerProgress;
  }

  const candidate = value as Partial<BeginnerProgress>;
  const completedSlugs = Array.isArray(candidate.completedSlugs)
    ? candidate.completedSlugs.filter(isPublishedBeginnerSlug)
    : [];
  const lastVisitedSlug = isPublishedBeginnerSlug(candidate.lastVisitedSlug)
    ? candidate.lastVisitedSlug
    : null;

  return {
    completedSlugs: [...new Set(completedSlugs)],
    lastVisitedSlug,
  };
}

export function readBeginnerProgress(): BeginnerProgress {
  if (typeof window === "undefined") {
    return emptyBeginnerProgress;
  }

  try {
    const saved = window.localStorage.getItem(BEGINNER_PROGRESS_STORAGE_KEY);
    return saved
      ? normalizeBeginnerProgress(JSON.parse(saved))
      : emptyBeginnerProgress;
  } catch {
    return emptyBeginnerProgress;
  }
}

export function serializeBeginnerProgress(progress: BeginnerProgress): string {
  return JSON.stringify(normalizeBeginnerProgress(progress));
}

export function writeBeginnerProgress(progress: BeginnerProgress): void {
  if (typeof window === "undefined") {
    return;
  }

  const normalized = normalizeBeginnerProgress(progress);
  window.localStorage.setItem(
    BEGINNER_PROGRESS_STORAGE_KEY,
    JSON.stringify(normalized),
  );
  window.dispatchEvent(new Event(BEGINNER_PROGRESS_EVENT));
}

export function markBeginnerVisited(slug: string): void {
  if (!isPublishedBeginnerSlug(slug)) {
    return;
  }

  const current = readBeginnerProgress();

  if (current.lastVisitedSlug === slug) {
    return;
  }

  writeBeginnerProgress({
    ...current,
    lastVisitedSlug: slug,
  });
}

export function toggleBeginnerCompleted(slug: string): void {
  if (!isPublishedBeginnerSlug(slug)) {
    return;
  }

  const current = readBeginnerProgress();
  const isCompleted = current.completedSlugs.includes(slug);
  const completedSlugs = isCompleted
    ? current.completedSlugs.filter((item) => item !== slug)
    : [...current.completedSlugs, slug];

  writeBeginnerProgress({
    completedSlugs,
    lastVisitedSlug: slug,
  });
}

export function getBeginnerResumeSlug(progress: BeginnerProgress): string {
  const normalized = normalizeBeginnerProgress(progress);
  const firstIncomplete = beginnerSeriesSlugs.find(
    (slug) => !normalized.completedSlugs.includes(slug),
  );

  if (!normalized.lastVisitedSlug) {
    return firstIncomplete ?? beginnerSeriesSlugs[0];
  }

  if (!normalized.completedSlugs.includes(normalized.lastVisitedSlug)) {
    return normalized.lastVisitedSlug;
  }

  const lastVisitedIndex = beginnerSeriesSlugs.indexOf(
    normalized.lastVisitedSlug,
  );
  const nextIncomplete = beginnerSeriesSlugs
    .slice(lastVisitedIndex + 1)
    .find((slug) => !normalized.completedSlugs.includes(slug));

  return (
    nextIncomplete ??
    firstIncomplete ??
    beginnerSeriesSlugs[beginnerSeriesSlugs.length - 1]
  );
}
