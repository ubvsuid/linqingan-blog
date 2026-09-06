import graphPayload from "@/generated/knowledge-graph-v1.json";
import { englishKnowledgeModules } from "@/lib/i18n";
import {
  getKnowledgeCluster,
  knowledgeClusterRegistry,
  type KnowledgeClusterId,
} from "@/lib/knowledge-clusters";
import clusterCoveragePayload from "../../reports/knowledge-cluster-coverage-v1.json";

export type KnowledgeClusterHandoffLocale = "zh" | "en";

export interface KnowledgeClusterHandoff {
  clusterId: KnowledgeClusterId;
  href: string;
  title: string;
  description: string;
}

export interface KnowledgeClusterHandoffSignal extends KnowledgeClusterHandoff {
  anchorEntityIds: readonly string[];
  anchorGraphNodeIds: readonly string[];
}

interface ClusterCoverageDocument {
  schemaVersion: 1;
  clusterCount: number;
  primaryKnowledgeArticleCount: number;
  unmappedPrimaryKnowledgeArticles: string[];
  graphUnmappedCount: number;
  clusters: Array<{
    clusterId: string;
    number: number;
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

interface GraphDocument {
  schemaVersion: 1;
  nodes: Array<{ id: string }>;
  unmapped: unknown[];
}

const coverage = clusterCoveragePayload as unknown as ClusterCoverageDocument;
const graph = graphPayload as unknown as GraphDocument;
const graphNodeIds = new Set(graph.nodes.map((node) => node.id));

function getHealthyDemonstratorSignal(
  locale: KnowledgeClusterHandoffLocale,
): KnowledgeClusterHandoffSignal | null {
  if (
    graph.schemaVersion !== 1 ||
    graph.unmapped.length > 0 ||
    coverage.schemaVersion !== 1 ||
    coverage.graphUnmappedCount > 0 ||
    coverage.unmappedPrimaryKnowledgeArticles.length > 0 ||
    coverage.clusterCount !== knowledgeClusterRegistry.length
  ) {
    return null;
  }

  const cluster = getKnowledgeCluster(coverage.demonstrator.clusterId);
  const coverageRow = coverage.clusters.find(
    (row) => row.clusterId === coverage.demonstrator.clusterId,
  );
  if (!cluster?.demonstrator || !coverageRow?.demonstrator) return null;
  if (cluster.number !== coverageRow.number) return null;

  const surface = coverage.demonstrator.graphSurface;
  // Handoff V1 intentionally uses only high-specificity canonical anchors.
  // Return codes remain useful inside Search/Diagnostics, but generic codes can
  // span several problem spaces and therefore must not choose a Cluster.
  const anchorGraphNodeIds = [
    ...surface.apiIds,
    ...surface.symptomIds,
  ].sort();
  if (anchorGraphNodeIds.length === 0) return null;
  if (anchorGraphNodeIds.some((nodeId) => !graphNodeIds.has(nodeId))) return null;

  const anchorEntityIds = [...new Set(anchorGraphNodeIds)].sort();
  const englishModule = englishKnowledgeModules.find(
    (module) => module.number === cluster.number,
  );

  if (locale === "en") {
    if (!englishModule) return null;
    return {
      clusterId: cluster.clusterId,
      href: `/en/knowledge/${englishModule.slug}`,
      title: cluster.enTitle,
      description: cluster.enDescription,
      anchorEntityIds,
      anchorGraphNodeIds,
    };
  }

  return {
    clusterId: cluster.clusterId,
    href: `/knowledge/${cluster.sourceModule.id}`,
    title: cluster.zhTitle,
    description: cluster.zhDescription,
    anchorEntityIds,
    anchorGraphNodeIds,
  };
}

function stripSignal(signal: KnowledgeClusterHandoffSignal): KnowledgeClusterHandoff {
  return {
    clusterId: signal.clusterId,
    href: signal.href,
    title: signal.title,
    description: signal.description,
  };
}

export function getKnowledgeClusterHandoffSignals(
  locale: KnowledgeClusterHandoffLocale,
): readonly KnowledgeClusterHandoffSignal[] {
  const signal = getHealthyDemonstratorSignal(locale);
  return signal ? [signal] : [];
}

export function getKnowledgeClusterHandoffForGraphNodeId(
  graphNodeId: string,
  locale: KnowledgeClusterHandoffLocale,
): KnowledgeClusterHandoff | null {
  const signal = getHealthyDemonstratorSignal(locale);
  if (!signal?.anchorGraphNodeIds.includes(graphNodeId)) return null;
  return stripSignal(signal);
}

export function getKnowledgeClusterHandoffForEntityId(
  entityId: string,
  locale: KnowledgeClusterHandoffLocale,
): KnowledgeClusterHandoff | null {
  const signal = getHealthyDemonstratorSignal(locale);
  if (!signal?.anchorEntityIds.includes(entityId)) return null;
  return stripSignal(signal);
}
