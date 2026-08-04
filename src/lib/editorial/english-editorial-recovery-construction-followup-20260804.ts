import type { EnglishEditorialArticleOverride } from "../english-editorial-article-override";
import { englishEditorialRecoveryConstructionOverride20260803 } from "./english-editorial-recovery-construction-20260803";

function replaceRequired(
  source: string,
  before: string,
  after: string,
  label: string,
): string {
  if (!source.includes(before)) {
    throw new Error(`Construction follow-up patch could not find: ${label}`);
  }

  return source.replace(before, after);
}

let articleHtml = englishEditorialRecoveryConstructionOverride20260803.articleHtml;

articleHtml = replaceRequired(
  articleHtml,
  `  if (Game.time !== pending.submittedAt + 1) {
    return {
      status: 'verification-window-missed',
      submittedAt: pending.submittedAt,
      checkedAt: Game.time
    };
  }`,
  `  if (Game.time !== pending.submittedAt + 1) {
    delete room.memory.trackedBuild;

    return {
      status: 'verification-window-missed',
      submittedAt: pending.submittedAt,
      checkedAt: Game.time
    };
  }`,
  "missed verification window",
);

articleHtml = replaceRequired(
  articleHtml,
  `  if (matches.length === 0) {
    return {
      status: structure
        ? 'structure-observed-without-matching-event'
        : site
          ? 'site-active-without-matching-event'
          : 'site-missing-without-matching-event',
      progressNow: site?.progress ?? null,
      structureId: structure?.id ?? null
    };
  }`,
  `  if (matches.length === 0) {
    delete room.memory.trackedBuild;

    return {
      status: structure
        ? 'structure-observed-without-matching-event'
        : site
          ? 'site-active-without-matching-event'
          : 'site-missing-without-matching-event',
      progressNow: site?.progress ?? null,
      structureId: structure?.id ?? null
    };
  }`,
  "zero matching build events",
);

articleHtml = replaceRequired(
  articleHtml,
  `  if (matches.length > 1) {
    return {
      status: 'matching-build-event-ambiguous',
      matchCount: matches.length
    };
  }`,
  `  if (matches.length > 1) {
    delete room.memory.trackedBuild;

    return {
      status: 'matching-build-event-ambiguous',
      matchCount: matches.length
    };
  }`,
  "ambiguous matching build events",
);

articleHtml = replaceRequired(
  articleHtml,
  `  if (
    verification.status === 'accepted-this-tick'
    || verification.status === 'verification-window-missed'
  ) {
    return;
  }`,
  `  if (verification.status === 'accepted-this-tick') {
    return;
  }`,
  "sampling-loop terminal-state handling",
);

articleHtml = replaceRequired(
  articleHtml,
  "Preserve missed-window and ambiguous states instead of rewriting them as successful progress.",
  "Report missed-window and ambiguous states, then release the pending slot so a later diagnostic sample can run; never rewrite those states as successful progress.",
  "production adaptation guidance",
);

export const englishEditorialRecoveryConstructionOverride20260804 = {
  ...englishEditorialRecoveryConstructionOverride20260803,
  articleHtml,
} satisfies EnglishEditorialArticleOverride;
