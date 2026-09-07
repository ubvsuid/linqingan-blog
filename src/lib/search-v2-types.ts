import type { KnowledgeClusterHandoff } from "@/lib/knowledge-cluster-handoff";
import type { SearchDocument } from "@/lib/search";

export type SearchV2Source = "database" | "static";

export interface SearchV2Response {
  query: string;
  normalizedQuery: string;
  results: SearchDocument[];
  total: number;
  source: SearchV2Source;
  clusterHandoff?: KnowledgeClusterHandoff | null;
}

export interface SearchEventResponse {
  queryId: number | null;
}

export interface SearchIdentity {
  anonymousId?: string | null;
  sessionId?: string | null;
  sourcePath?: string | null;
}
