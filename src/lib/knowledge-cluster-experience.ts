import knowledgeArticleRegistryPayload from "@/generated/knowledge-article-registry.json";
import graphPayload from "@/generated/knowledge-graph-v1.json";
import { getEnglishArticlePathForChinese } from "@/lib/article-language-associations";
import {
  getKnowledgeCluster,
  knowledgeClusterRegistry,
  type KnowledgeClusterId,
} from "@/lib/knowledge-clusters";
import type {
  KnowledgeGraphNode,
  KnowledgeGraphV1,
} from "@/lib/knowledge-graph-v1";
import { screepsDiagnosticSymptoms } from "@/lib/screeps-diagnostic-symptoms";
import { getToolHref, toolCatalog } from "@/lib/tool-catalog";
import clusterCoveragePayload from "../../reports/knowledge-cluster-coverage-v1.json";

export type KnowledgeClusterExperienceLocale = "zh" | "en";

export interface KnowledgeClusterExperienceLink {
  href: string;
  label: string;
  meta: string;
  nodeId?: string;
}

export interface KnowledgeClusterExperience {
  clusterId: KnowledgeClusterId;
  articleCount: number;
  stageCount: number;
  firstGuide: KnowledgeClusterExperienceLink;
  tools: readonly KnowledgeClusterExperienceLink[];
  symptoms: readonly KnowledgeClusterExperienceLink[];
  experiments: readonly KnowledgeClusterExperienceLink[];
  apis: readonly KnowledgeClusterExperienceLink[];
  returnCodeCount: number;
}

interface RegistryRecord {
  contentId: string;
  slug: string;
  knowledge: {
    module: string;
    stage: string;
    order: number;
  };
  seo?: {
    primaryKeyword?: string;
  };
}

interface ClusterCoverageDocument {
  schemaVersion: 1;
  graphUnmappedCount: number;
  clusters: Array<{
    clusterId: string;
    primaryKnowledgeArticleCount: number;
    demonstrator: boolean;
  }>;
  demonstrator: {
    clusterId: string;
    graphSurface: {
      articleIds: string[];
      apiIds: string[];
      returnCodeIds: string[];
      symptomIds: string[];
      toolIds: string[];
      tickLabExperimentIds: string[];
    };
  };
}

const graph = graphPayload as unknown as KnowledgeGraphV1;
const coverage = clusterCoveragePayload as unknown as ClusterCoverageDocument;
const knowledgeRegistry =
  knowledgeArticleRegistryPayload as unknown as readonly RegistryRecord[];
const graphNodeById = new Map(graph.nodes.map((node) => [node.id, node] as const));
const graphNodeByHref = new Map(
  graph.nodes
    .filter((node) => node.href)
    .map((node) => [node.href as string, node] as const),
);
const toolById = new Map(toolCatalog.map((tool) => [tool.toolId, tool] as const));
const symptomById = new Map<string, (typeof screepsDiagnosticSymptoms)[number]>(
  screepsDiagnosticSymptoms.map((symptom) => [symptom.id, symptom]),
);

function localizedNodeLink(
  node: KnowledgeGraphNode,
  locale: KnowledgeClusterExperienceLocale,
): KnowledgeClusterExperienceLink | null {
  const prefix = locale === "en" ? "/en" : "";

  if (node.type === "API") {
    const apiId = node.id.startsWith("api:") ? node.id.slice(4) : "";
    if (!apiId) return null;
    return {
      href: `${prefix}/screeps-api#${apiId}`,
      label: node.title,
      meta: "API",
      nodeId: node.id,
    };
  }

  if (node.type === "TickLabExperiment") {
    return {
      href: `${prefix}/tick-lab`,
      label: `Tick Lab · ${node.title}`,
      meta: locale === "en" ? "Modeled experiment" : "确定性教学实验",
      nodeId: node.id,
    };
  }

  return null;
}

function localizedToolLink(
  toolId: string,
  locale: KnowledgeClusterExperienceLocale,
): KnowledgeClusterExperienceLink | null {
  const tool = toolById.get(toolId as (typeof toolCatalog)[number]["toolId"]);
  if (!tool) return null;
  return {
    href: getToolHref(tool.slug, locale),
    label: locale === "en" ? tool.enTitle : tool.zhTitle,
    meta: locale === "en" ? "Interactive tool" : "交互工具",
    nodeId: tool.toolId,
  };
}

function localizedSymptomLink(
  symptomId: string,
  locale: KnowledgeClusterExperienceLocale,
): KnowledgeClusterExperienceLink | null {
  const symptom = symptomById.get(symptomId);
  if (!symptom) return null;
  const prefix = locale === "en" ? "/en" : "";
  return {
    href: `${prefix}/diagnostics#${symptom.id}`,
    label: locale === "en" ? symptom.enTitle : symptom.zhTitle,
    meta: locale === "en" ? "Diagnostic symptom" : "诊断症状",
    nodeId: `symptom:${symptom.id}`,
  };
}

function firstGuideLink(
  clusterId: KnowledgeClusterId,
  locale: KnowledgeClusterExperienceLocale,
): KnowledgeClusterExperienceLink | null {
  const first = knowledgeRegistry
    .filter((record) => record.knowledge.module === clusterId)
    .sort(
      (left, right) =>
        left.knowledge.order - right.knowledge.order ||
        left.slug.localeCompare(right.slug),
    )[0];
  if (!first) return null;

  const chineseHref = `/blog/${first.slug}`;
  const href =
    locale === "en"
      ? getEnglishArticlePathForChinese(chineseHref)
      : chineseHref;
  if (!href) return null;

  const graphNode = graphNodeByHref.get(href);
  return {
    href,
    label: graphNode?.title ?? first.seo?.primaryKeyword ?? first.slug,
    meta: locale === "en" ? "First guide" : "第一篇指南",
    nodeId: graphNode?.id ?? first.contentId,
  };
}

export function getKnowledgeClusterExperienceByModuleNumber(
  moduleNumber: number,
  locale: KnowledgeClusterExperienceLocale,
): KnowledgeClusterExperience | null {
  const cluster = knowledgeClusterRegistry.find(
    (candidate) => candidate.number === moduleNumber,
  );
  if (!cluster?.demonstrator) return null;

  if (
    graph.schemaVersion !== 1 ||
    graph.unmapped.length > 0 ||
    coverage.schemaVersion !== 1 ||
    coverage.graphUnmappedCount > 0 ||
    coverage.demonstrator.clusterId !== cluster.clusterId
  ) {
    return null;
  }

  const coverageRow = coverage.clusters.find(
    (row) => row.clusterId === cluster.clusterId,
  );
  if (!coverageRow?.demonstrator) return null;

  const clusterRecord = getKnowledgeCluster(cluster.clusterId);
  if (!clusterRecord) return null;

  const articleCount = knowledgeRegistry.filter(
    (record) => record.knowledge.module === cluster.clusterId,
  ).length;
  if (articleCount !== coverageRow.primaryKnowledgeArticleCount) return null;

  const firstGuide = firstGuideLink(cluster.clusterId, locale);
  if (!firstGuide) return null;

  const surface = coverage.demonstrator.graphSurface;
  const tools = surface.toolIds
    .map((id) => localizedToolLink(id, locale))
    .filter((item): item is KnowledgeClusterExperienceLink => Boolean(item));
  const symptoms = surface.symptomIds
    .map((id) => localizedSymptomLink(id.replace(/^symptom:/, ""), locale))
    .filter((item): item is KnowledgeClusterExperienceLink => Boolean(item));
  const experiments = surface.tickLabExperimentIds
    .map((id) => graphNodeById.get(id))
    .map((node) => (node ? localizedNodeLink(node, locale) : null))
    .filter((item): item is KnowledgeClusterExperienceLink => Boolean(item));
  const apis = surface.apiIds
    .map((id) => graphNodeById.get(id))
    .map((node) => (node ? localizedNodeLink(node, locale) : null))
    .filter((item): item is KnowledgeClusterExperienceLink => Boolean(item));

  if (tools.length === 0 || symptoms.length === 0 || experiments.length === 0 || apis.length === 0) {
    return null;
  }

  return {
    clusterId: cluster.clusterId,
    articleCount,
    stageCount: clusterRecord.sourceModule.stages.length,
    firstGuide,
    tools,
    symptoms,
    experiments,
    apis,
    returnCodeCount: surface.returnCodeIds.length,
  };
}
