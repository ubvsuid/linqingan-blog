import type {
  ScreepsEntityKind,
  ScreepsIntentPromotion,
} from "@/lib/screeps-entity-intent";

export const GRAPH_SEARCH_ANCHOR_MIN_SCORE = 120;

export interface KnowledgeGraphSearchSignal {
  anchorEntityId: string;
  score: number;
}

type GraphSearchAnchorPromotion = Pick<
  ScreepsIntentPromotion,
  "entityId" | "kind" | "score"
>;

function isGraphSearchAnchorKind(kind: ScreepsEntityKind): boolean {
  return kind === "symptom" || kind === "api" || kind === "error";
}

export function getKnowledgeGraphSearchAnchorEntityId(
  promotions: readonly GraphSearchAnchorPromotion[],
  availableAnchorEntityIds: ReadonlySet<string>,
): string | null {
  const anchor = promotions.find(
    (promotion) =>
      promotion.score >= GRAPH_SEARCH_ANCHOR_MIN_SCORE &&
      isGraphSearchAnchorKind(promotion.kind) &&
      availableAnchorEntityIds.has(promotion.entityId),
  );

  return anchor?.entityId ?? null;
}

export function getKnowledgeGraphSearchSignalScore(
  signals: readonly KnowledgeGraphSearchSignal[] | undefined,
  anchorEntityId: string | null,
): number {
  if (!anchorEntityId || !signals?.length) return 0;
  return signals.find((signal) => signal.anchorEntityId === anchorEntityId)?.score ?? 0;
}
