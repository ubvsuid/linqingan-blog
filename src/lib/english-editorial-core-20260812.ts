const UPDATED_AT = "2026-08-12";
const FOURTH_UPDATED_AT = "2026-08-14";

const selectedSlugs = new Set([
  "screeps-err-not-in-range",
  "screeps-moveto-not-moving",
  "screeps-cpu-getused-bucket",
  "screeps-memory-basics",
  "screeps-spawn-creep",
]);

const fourthEditorialSlugs = new Set([
  "screeps-creep-harvest-energy",
  "screeps-first-extension",
  "screeps-build-repair",
]);

export function getEnglishEditorialCoreUpdatedAt20260812(
  slug: string,
): string | undefined {
  if (fourthEditorialSlugs.has(slug)) return FOURTH_UPDATED_AT;
  return selectedSlugs.has(slug) ? UPDATED_AT : undefined;
}
