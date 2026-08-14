import { getEnglishEditorialThirdUpdatedAt20260814 } from "./english-editorial-third-20260814";

const UPDATED_AT = "2026-08-12";

const selectedSlugs = new Set([
  "screeps-err-not-in-range",
  "screeps-moveto-not-moving",
  "screeps-cpu-getused-bucket",
  "screeps-memory-basics",
  "screeps-spawn-creep",
]);

export function getEnglishEditorialCoreUpdatedAt20260812(
  slug: string,
): string | undefined {
  return getEnglishEditorialThirdUpdatedAt20260814(slug)
    ?? (selectedSlugs.has(slug) ? UPDATED_AT : undefined);
}
