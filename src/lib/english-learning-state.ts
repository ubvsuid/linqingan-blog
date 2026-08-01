export const ENGLISH_LEARNING_STORAGE_KEY = "linqingan:english-learning:v1";
export const ENGLISH_LEARNING_EVENT = "linqingan:english-learning-change";
export const ENGLISH_LEARNING_EXPORT_VERSION = 1;

export const ENGLISH_BEGINNER_PATHS = [
  "/en/blog/screeps-introduction",
  "/en/blog/screeps-first-room",
  "/en/blog/screeps-tick-game-loop",
  "/en/blog/screeps-creep-harvest-energy",
  "/en/blog/screeps-transfer-energy-to-spawn",
  "/en/blog/screeps-creep-body-parts",
  "/en/blog/screeps-spawn-creep",
  "/en/blog/screeps-creep-roles",
  "/en/blog/screeps-upgrade-controller",
  "/en/blog/screeps-first-extension",
  "/en/blog/screeps-build-repair",
  "/en/blog/screeps-first-room-code",
] as const;

const MAX_RECENT_ARTICLES = 8;

export interface RecentEnglishArticle {
  href: string;
  title: string;
  visitedAt: string;
}

export interface EnglishLearningState {
  completedPaths: string[];
  lastVisitedPath: string | null;
  recentArticles: RecentEnglishArticle[];
}

interface EnglishLearningExport {
  schemaVersion: number;
  exportedAt: string;
  state: EnglishLearningState;
}

export const emptyEnglishLearningState: EnglishLearningState = {
  completedPaths: [],
  lastVisitedPath: null,
  recentArticles: [],
};

export function isEnglishBeginnerPath(value: unknown): value is string {
  return (
    typeof value === "string" &&
    ENGLISH_BEGINNER_PATHS.some((path) => path === value)
  );
}

function isEnglishArticlePath(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.startsWith("/en/blog/") &&
    !value.includes("?") &&
    !value.includes("#")
  );
}

function normalizeRecentArticle(value: unknown): RecentEnglishArticle | null {
  if (!value || typeof value !== "object") return null;

  const candidate = value as Partial<RecentEnglishArticle>;
  if (
    !isEnglishArticlePath(candidate.href) ||
    typeof candidate.title !== "string" ||
    !candidate.title.trim() ||
    typeof candidate.visitedAt !== "string" ||
    !Number.isFinite(Date.parse(candidate.visitedAt))
  ) {
    return null;
  }

  return {
    href: candidate.href,
    title: candidate.title.trim().slice(0, 180),
    visitedAt: candidate.visitedAt,
  };
}

export function normalizeEnglishLearningState(
  value: unknown,
): EnglishLearningState {
  if (!value || typeof value !== "object") {
    return emptyEnglishLearningState;
  }

  const candidate = value as Partial<EnglishLearningState>;
  const completedPaths = Array.isArray(candidate.completedPaths)
    ? candidate.completedPaths.filter(isEnglishBeginnerPath)
    : [];
  const lastVisitedPath = isEnglishBeginnerPath(candidate.lastVisitedPath)
    ? candidate.lastVisitedPath
    : null;
  const recentArticles = Array.isArray(candidate.recentArticles)
    ? candidate.recentArticles
        .map(normalizeRecentArticle)
        .filter((article): article is RecentEnglishArticle => article !== null)
    : [];

  const uniqueRecentArticles: RecentEnglishArticle[] = [];
  const seenHrefs = new Set<string>();
  for (const article of recentArticles) {
    if (seenHrefs.has(article.href)) continue;
    seenHrefs.add(article.href);
    uniqueRecentArticles.push(article);
    if (uniqueRecentArticles.length === MAX_RECENT_ARTICLES) break;
  }

  return {
    completedPaths: [...new Set(completedPaths)],
    lastVisitedPath,
    recentArticles: uniqueRecentArticles,
  };
}

export function serializeEnglishLearningState(
  state: EnglishLearningState,
): string {
  return JSON.stringify(normalizeEnglishLearningState(state));
}

export function exportEnglishLearningState(
  state: EnglishLearningState,
): string {
  const payload: EnglishLearningExport = {
    schemaVersion: ENGLISH_LEARNING_EXPORT_VERSION,
    exportedAt: new Date().toISOString(),
    state: normalizeEnglishLearningState(state),
  };

  return JSON.stringify(payload, null, 2);
}

export function importEnglishLearningState(serialized: string): EnglishLearningState {
  const parsed: unknown = JSON.parse(serialized);
  const candidate = parsed && typeof parsed === "object"
    ? parsed as Partial<EnglishLearningExport> & Partial<EnglishLearningState>
    : null;

  if (!candidate) {
    throw new Error("Learning progress file must contain a JSON object.");
  }

  if ("schemaVersion" in candidate) {
    if (candidate.schemaVersion !== ENGLISH_LEARNING_EXPORT_VERSION) {
      throw new Error("This learning progress file uses an unsupported version.");
    }
    if (!candidate.state || typeof candidate.state !== "object") {
      throw new Error("Learning progress file does not contain a valid state.");
    }
    const normalized = normalizeEnglishLearningState(candidate.state);
    writeEnglishLearningState(normalized);
    return normalized;
  }

  const normalized = normalizeEnglishLearningState(candidate);
  writeEnglishLearningState(normalized);
  return normalized;
}

export function readEnglishLearningState(): EnglishLearningState {
  if (typeof window === "undefined") return emptyEnglishLearningState;

  try {
    const stored = window.localStorage.getItem(ENGLISH_LEARNING_STORAGE_KEY);
    return stored
      ? normalizeEnglishLearningState(JSON.parse(stored))
      : emptyEnglishLearningState;
  } catch {
    return emptyEnglishLearningState;
  }
}

export function writeEnglishLearningState(
  state: EnglishLearningState,
): void {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(
      ENGLISH_LEARNING_STORAGE_KEY,
      serializeEnglishLearningState(state),
    );
    window.dispatchEvent(new Event(ENGLISH_LEARNING_EVENT));
  } catch {
    // Local learning history is optional; pages remain usable without storage.
  }
}

export function recordEnglishArticleVisit(href: string, title: string): void {
  if (!isEnglishArticlePath(href) || !title.trim()) return;

  const current = readEnglishLearningState();
  const recentArticles = [
    {
      href,
      title: title.trim().slice(0, 180),
      visitedAt: new Date().toISOString(),
    },
    ...current.recentArticles.filter((article) => article.href !== href),
  ].slice(0, MAX_RECENT_ARTICLES);

  writeEnglishLearningState({
    ...current,
    lastVisitedPath: isEnglishBeginnerPath(href)
      ? href
      : current.lastVisitedPath,
    recentArticles,
  });
}

export function toggleEnglishLessonCompleted(path: string): void {
  if (!isEnglishBeginnerPath(path)) return;

  const current = readEnglishLearningState();
  const completedPaths = current.completedPaths.includes(path)
    ? current.completedPaths.filter((item) => item !== path)
    : [...current.completedPaths, path];

  writeEnglishLearningState({
    ...current,
    completedPaths,
    lastVisitedPath: path,
  });
}

export function getEnglishResumePath(state: EnglishLearningState): string {
  const normalized = normalizeEnglishLearningState(state);
  const firstIncomplete = ENGLISH_BEGINNER_PATHS.find(
    (path) => !normalized.completedPaths.includes(path),
  );

  if (
    normalized.lastVisitedPath &&
    !normalized.completedPaths.includes(normalized.lastVisitedPath)
  ) {
    return normalized.lastVisitedPath;
  }

  if (normalized.lastVisitedPath) {
    const lastIndex = ENGLISH_BEGINNER_PATHS.indexOf(
      normalized.lastVisitedPath as (typeof ENGLISH_BEGINNER_PATHS)[number],
    );
    const nextIncomplete = ENGLISH_BEGINNER_PATHS.slice(lastIndex + 1).find(
      (path) => !normalized.completedPaths.includes(path),
    );
    if (nextIncomplete) return nextIncomplete;
  }

  return (
    firstIncomplete ??
    ENGLISH_BEGINNER_PATHS[ENGLISH_BEGINNER_PATHS.length - 1]
  );
}

export function clearEnglishLearningState(): void {
  writeEnglishLearningState(emptyEnglishLearningState);
}
