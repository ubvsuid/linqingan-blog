import generatedBeginnerRoadmapRegistry from "@/generated/beginner-roadmap-registry.json";

export interface BeginnerRoadmapMetadata {
  id: "beginner";
  stage: string;
  order: number;
  difficulty: "beginner";
}

export interface BeginnerRoadmapSeoMetadata {
  primaryKeyword: string;
  searchIntent: string;
  keywordRole: "owner" | "supporting";
}

export interface BeginnerRoadmapRegistryRecord {
  slug: string;
  roadmap: BeginnerRoadmapMetadata;
  seo: BeginnerRoadmapSeoMetadata;
  source: "migration-sidecar";
}

const beginnerRoadmapRegistry = (
  generatedBeginnerRoadmapRegistry as readonly BeginnerRoadmapRegistryRecord[]
)
  .filter((record) => record.roadmap.id === "beginner")
  .sort(
    (left, right) =>
      left.roadmap.order - right.roadmap.order ||
      left.slug.localeCompare(right.slug),
  );

export function getBeginnerRoadmapRegistry(): readonly BeginnerRoadmapRegistryRecord[] {
  return beginnerRoadmapRegistry;
}

export function getBeginnerRoadmapRecord(
  slug: string,
): BeginnerRoadmapRegistryRecord | null {
  return beginnerRoadmapRegistry.find((record) => record.slug === slug) ?? null;
}
