import {
  problemResolverFlows,
  type ProblemResolverLocale,
  type ProblemResolverOutcomeStep,
} from "@/lib/problem-resolver";
import type {
  KnowledgeGraphNode,
  KnowledgeGraphV1,
} from "@/lib/knowledge-graph-v1";
import { getToolHref, toolCatalog } from "@/lib/tool-catalog";

export type ProblemResolverGraphRelation =
  | "solvedBy"
  | "involvesApi"
  | "returns";

export interface ProblemResolverGraphPath {
  href: string;
  label: string;
  relation: ProblemResolverGraphRelation;
  targetNodeId: string;
  targetType: "Article" | "BeginnerLesson" | "API" | "Tool";
}

export type ProblemResolverGraphPathsByStep = Readonly<
  Record<string, readonly ProblemResolverGraphPath[]>
>;

interface Candidate extends ProblemResolverGraphPath {
  priority: number;
}

const toolById = new Map(toolCatalog.map((tool) => [tool.toolId, tool] as const));

function localizedTarget(
  node: KnowledgeGraphNode,
  locale: ProblemResolverLocale,
): Omit<ProblemResolverGraphPath, "relation" | "targetNodeId"> | null {
  if (node.type === "Article" || node.type === "BeginnerLesson") {
    if (node.locale !== locale || !node.href) return null;
    return {
      href: node.href,
      label: `${locale === "en" ? "Guide" : "教程"} · ${node.title}`,
      targetType: node.type,
    };
  }

  if (node.type === "Tool") {
    const tool = toolById.get(node.id as (typeof toolCatalog)[number]["toolId"]);
    if (!tool) return null;
    return {
      href: getToolHref(tool.slug, locale),
      label: `${locale === "en" ? "Tool" : "工具"} · ${
        locale === "en" ? tool.enTitle : tool.zhTitle
      }`,
      targetType: "Tool",
    };
  }

  if (node.type === "API") {
    const apiId = node.id.startsWith("api:") ? node.id.slice("api:".length) : "";
    if (!apiId) return null;
    return {
      href: `${locale === "en" ? "/en" : ""}/screeps-api#${apiId}`,
      label: `API · ${node.title}`,
      targetType: "API",
    };
  }

  return null;
}

function candidatePriority(
  relation: ProblemResolverGraphRelation,
  target: KnowledgeGraphNode,
): number {
  if (relation === "solvedBy") {
    if (target.type === "Article" || target.type === "BeginnerLesson") return 300;
    if (target.type === "Tool") return 290;
  }
  if (relation === "involvesApi" && target.type === "API") return 260;
  if (relation === "returns" && target.type === "API") return 240;
  return 0;
}

function collectOutcomePaths(
  step: ProblemResolverOutcomeStep,
  locale: ProblemResolverLocale,
  graph: KnowledgeGraphV1,
  limit: number,
): readonly ProblemResolverGraphPath[] {
  const nodeById = new Map(graph.nodes.map((node) => [node.id, node] as const));
  const symptomAnchor = `symptom:${step.diagnosticSymptomId}`;
  const returnCodeAnchor = step.returnCodeName
    ? `return-code:${step.returnCodeName}`
    : null;
  const byHref = new Map<string, Candidate>();

  const addCandidate = (
    targetNodeId: string,
    relation: ProblemResolverGraphRelation,
  ) => {
    const target = nodeById.get(targetNodeId);
    if (!target) return;
    const priority = candidatePriority(relation, target);
    if (priority <= 0) return;
    const localized = localizedTarget(target, locale);
    if (!localized) return;

    const candidate: Candidate = {
      ...localized,
      relation,
      targetNodeId: target.id,
      priority,
    };
    const current = byHref.get(candidate.href);
    if (
      !current ||
      candidate.priority > current.priority ||
      (candidate.priority === current.priority &&
        candidate.targetNodeId.localeCompare(current.targetNodeId) < 0)
    ) {
      byHref.set(candidate.href, candidate);
    }
  };

  for (const edge of graph.edges) {
    if (edge.from === symptomAnchor && edge.relation === "solvedBy") {
      addCandidate(edge.to, "solvedBy");
    }
    if (edge.from === symptomAnchor && edge.relation === "involvesApi") {
      addCandidate(edge.to, "involvesApi");
    }
    if (
      returnCodeAnchor &&
      edge.to === returnCodeAnchor &&
      edge.relation === "returns"
    ) {
      addCandidate(edge.from, "returns");
    }
  }

  const safeLimit = Math.max(1, Math.min(limit, 6));
  return [...byHref.values()]
    .sort(
      (left, right) =>
        right.priority - left.priority ||
        left.href.localeCompare(right.href) ||
        left.targetNodeId.localeCompare(right.targetNodeId),
    )
    .slice(0, safeLimit)
    .map(({ priority: _priority, ...path }) => path);
}

export function buildProblemResolverGraphPaths(
  locale: ProblemResolverLocale,
  graph: KnowledgeGraphV1,
  limit = 4,
): ProblemResolverGraphPathsByStep {
  if (graph.schemaVersion !== 1 || graph.unmapped.length > 0) return {};

  const pathsByStep: Record<string, readonly ProblemResolverGraphPath[]> = {};
  for (const flow of problemResolverFlows) {
    for (const step of flow.steps) {
      if (step.kind !== "outcome") continue;
      const paths = collectOutcomePaths(step, locale, graph, limit);
      if (paths.length > 0) pathsByStep[step.stepId] = paths;
    }
  }
  return pathsByStep;
}
