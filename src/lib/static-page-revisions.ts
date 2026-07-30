import staticPageRevisions from "@/data/static-page-revisions.json";

export type StaticPagePath = keyof typeof staticPageRevisions;

const fallbackRevision = "2026-07-17";

function latestDate(values: string[]): Date {
  const latest = values
    .map((value) => new Date(value))
    .filter((date) => Number.isFinite(date.getTime()))
    .sort((left, right) => right.getTime() - left.getTime())[0];

  return latest ?? new Date(fallbackRevision);
}

export function getStaticPageLastModified(
  pathname: StaticPagePath,
  dependentContentDates: string[] = [],
): Date {
  return latestDate([
    staticPageRevisions[pathname],
    ...dependentContentDates,
  ]);
}
