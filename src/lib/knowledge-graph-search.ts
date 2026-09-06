import knowledgeGraphPayload from "@/generated/knowledge-graph-v1.json";
import {
  getScreepsIntentPromotions,
  type ScreepsEntityKind,
  type ScreepsEntityLocale,
} from "@/lib/screeps-entity-intent";

export const GRAPH_SEARCH_ANCHOR_MIN_SCORE = 120;

interface GraphNode {
  id: string;
  type:
    | "Article"
    | "BeginnerLesson"
    | "API"
    | "ReturnCode"
    | "Symptom"
    | "Tool"
    | "TickLabExperiment"
    | "RuntimeEvidence";
  title: string;
  locale: "zh" | "en" | "neutral";
  href?: string;
}

interface GraphEdge {
  from: string;
  to: string;
  relation: string;
}

interface GraphArtifact {
  schemaVersion: number;
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export interface KnowledgeGraphSearchPromotion {
  href: string;
  score: number;
  relation: string;
  direction: "outgoing" | "incoming";
  targetNodeId: string;
}

export interface KnowledgeGraphSearchContext {
  anchorEntityId: string;
  anchorGraphNodeId: string;
  anchorScore: number;
  promotions: KnowledgeGraphSearchPromotion[];
}

const graph = knowledgeGraphPayload as unknown as GraphArtifact;
const graphIsUsable =
  graph?.schemaVersion === 1 &&
  Array.isArray(graph.nodes) &&
  Array.isArray(graph.edges);
const graphNodes = graphIsUsable ? graph.nodes : [];
const graphEdges = graphIsUsable ? graph.edges : [];
const nodeById = new Map(graphNodes.map((node) => [node.id, node] as const));

function graphNodeIdForIntent(entityId: string, kind: ScreepsEntityKind): string | null {
  if (kind === "symptom" || kind === "api") return entityId;
  if (kind === "error" && entityId.startsWith("error:")) {
    return `return-code:${entityId.slice("error:".length)}`;
  }
  return null;
}

function graphAnchorEntityId(node: GraphNode): string | null {
  if (node.type === "Symptom" || node.type === "API") return node.id;
  if (node.type === "ReturnCode" && node.id.startsWith("return-code:")) {
    return `error:${node.id.slice("return-code:".length)}`;
  }
  return null;
}

function localizedBaseHref(href: string, locale: ScreepsEntityLocale): string {
  if (locale === "zh") return href;
  if (href.startsWith("/en/")) return href;
  return `/en${href}`;
}

function targetRoutes(
  node: GraphNode,
  locale: ScreepsEntityLocale,
): Array<{ href: string; penalty: number }> {
  if (node.type === "Article" || node.type === "BeginnerLesson") {
    if (node.locale !== locale || !node.href) return [];
    return [{ href: node.href, penalty: 0 }];
  }

  if (node.type === "Tool") {
    if (!node.href) return [];
    return [{ href: localizedBaseHref(node.href, locale), penalty: 0 }];
  }

  if (node.type === "API") {
    const apiId = node.id.startsWith("api:") ? node.id.slice("api:".length) : "";
    if (!apiId) return [];
    const base = localizedBaseHref("/screeps-api", locale);
    return [
      { href: `${base}#${apiId}`, penalty: 0 },
      { href: base, penalty: 8 },
    ];
  }

  if (node.type === "ReturnCode") {
    const codeName = node.id.startsWith("return-code:")
      ? node.id.slice("return-code:".length)
      : "";
    if (!codeName) return [];
    const base = localizedBaseHref("/screeps-errors", locale);
    return [
      { href: `${base}#${codeName.toLowerCase()}`, penalty: 0 },
      { href: base, penalty: 8 },
    ];
  }

  if (node.type === "TickLabExperiment") {
    return [{ href: localizedBaseHref(node.href ?? "/tick-lab", locale), penalty: 0 }];
  }

  return [];
}

function relationScore(
  anchor: GraphNode,
  target: GraphNode,
  relation: string,
  direction: "outgoing" | "incoming",
): number {
  if (anchor.type === "Symptom" && direction === "outgoing") {
    if (
      relation === "solvedBy" &&
      (target.type === "Article" ||
        target.type === "BeginnerLesson" ||
        target.type === "Tool")
    ) {
      return 72;
    }
    if (relation === "involvesApi" && target.type === "API") return 64;
    if (relation === "relatedTo" && target.type === "ReturnCode") return 56;
    return 0;
  }

  if (anchor.type === "API") {
    if (direction === "outgoing" && relation === "returns" && target.type === "ReturnCode") {
      return 64;
    }
    if (
      direction === "outgoing" &&
      relation === "testedBy" &&
      target.type === "TickLabExperiment"
    ) {
      return 60;
    }
    if (
      direction === "incoming" &&
      relation === "explains" &&
      (target.type === "Article" || target.type === "BeginnerLesson")
    ) {
      return 68;
    }
    if (direction === "incoming" && relation === "usesApi" && target.type === "Article") {
      return 58;
    }
    return 0;
  }

  if (
    anchor.type === "ReturnCode" &&
    direction === "incoming" &&
    relation === "returns" &&
    target.type === "API"
  ) {
    return 62;
  }

  return 0;
}

function collectGraphPromotions(
  anchor: GraphNode,
  locale: ScreepsEntityLocale,
): KnowledgeGraphSearchPromotion[] {
  const byHref = new Map<string, KnowledgeGraphSearchPromotion>();

  const addCandidate = (
    edge: GraphEdge,
    direction: "outgoing" | "incoming",
    targetNodeId: string,
  ) => {
    const target = nodeById.get(targetNodeId);
    if (!target || target.id === anchor.id) return;
    const baseScore = relationScore(anchor, target, edge.relation, direction);
    if (baseScore <= 0) return;

    for (const route of targetRoutes(target, locale)) {
      const score = Math.max(1, baseScore - route.penalty);
      const current = byHref.get(route.href);
      const next: KnowledgeGraphSearchPromotion = {
        href: route.href,
        score,
        relation: edge.relation,
        direction,
        targetNodeId: target.id,
      };
      if (
        !current ||
        next.score > current.score ||
        (next.score === current.score && next.targetNodeId.localeCompare(current.targetNodeId) < 0)
      ) {
        byHref.set(route.href, next);
      }
    }
  };

  for (const edge of graphEdges) {
    if (edge.from === anchor.id) addCandidate(edge, "outgoing", edge.to);
    if (edge.to === anchor.id) addCandidate(edge, "incoming", edge.from);
  }

  return [...byHref.values()].sort(
    (left, right) =>
      right.score - left.score ||
      left.href.localeCompare(right.href) ||
      left.targetNodeId.localeCompare(right.targetNodeId),
  );
}

export function getKnowledgeGraphSearchContext(
  query: string,
  locale: ScreepsEntityLocale,
  limit = 8,
): KnowledgeGraphSearchContext | null {
  if (!graphIsUsable) return null;

  const intentPromotions = getScreepsIntentPromotions(query, locale, 8);
  const anchorPromotion = intentPromotions.find((promotion) => {
    if (promotion.score < GRAPH_SEARCH_ANCHOR_MIN_SCORE) return false;
    const graphNodeId = graphNodeIdForIntent(promotion.entityId, promotion.kind);
    if (!graphNodeId) return false;
    const graphNode = nodeById.get(graphNodeId);
    return Boolean(graphNode && graphAnchorEntityId(graphNode) === promotion.entityId);
  });

  if (!anchorPromotion) return null;
  const anchorGraphNodeId = graphNodeIdForIntent(
    anchorPromotion.entityId,
    anchorPromotion.kind,
  );
  if (!anchorGraphNodeId) return null;
  const anchor = nodeById.get(anchorGraphNodeId);
  if (!anchor) return null;

  const promotions = collectGraphPromotions(anchor, locale).slice(
    0,
    Math.max(1, Math.min(limit, 12)),
  );
  if (promotions.length === 0) return null;

  return {
    anchorEntityId: anchorPromotion.entityId,
    anchorGraphNodeId,
    anchorScore: anchorPromotion.score,
    promotions,
  };
}
