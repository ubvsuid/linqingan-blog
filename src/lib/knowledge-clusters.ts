import clusterPayload from "../../content/knowledge-clusters-v1.json";
import {
  knowledgeModuleRegistry,
  type KnowledgeModuleConfig,
} from "@/lib/knowledge-module-registry";

export type KnowledgeClusterFacet =
  | "learn"
  | "build"
  | "solve"
  | "verify"
  | "explore";

export type KnowledgeClusterId =
  | "memory-engineering"
  | "spawn-lifecycle"
  | "room-economy"
  | "movement-vision"
  | "controller-control"
  | "construction-defense"
  | "market-advanced-resources"
  | "operations-debugging";

interface KnowledgeClusterRecord {
  clusterId: KnowledgeClusterId;
  sourceModuleId: KnowledgeClusterId;
  number: number;
  enTitle: string;
  enDescription: string;
  facets: readonly KnowledgeClusterFacet[];
  demonstrator: boolean;
}

export interface KnowledgeCluster extends KnowledgeClusterRecord {
  zhTitle: string;
  zhDescription: string;
  audience: string;
  learningGoal: string;
  sourceModule: KnowledgeModuleConfig;
}

const moduleById = new Map(
  knowledgeModuleRegistry.map((module) => [module.id, module] as const),
);

export const knowledgeClusterRegistry: readonly KnowledgeCluster[] =
  clusterPayload.clusters.map((raw) => {
    const record = raw as KnowledgeClusterRecord;
    const sourceModule = moduleById.get(record.sourceModuleId);
    if (!sourceModule) {
      throw new Error(
        `Knowledge Cluster V1: unknown source module ${record.sourceModuleId}`,
      );
    }
    if (sourceModule.id !== record.clusterId || sourceModule.number !== record.number) {
      throw new Error(
        `Knowledge Cluster V1: identity drift for ${record.clusterId}`,
      );
    }
    return {
      ...record,
      zhTitle: sourceModule.title,
      zhDescription: sourceModule.description,
      audience: sourceModule.audience,
      learningGoal: sourceModule.learningGoal,
      sourceModule,
    };
  });

const clusterById = new Map(
  knowledgeClusterRegistry.map((cluster) => [cluster.clusterId, cluster] as const),
);

export function getKnowledgeCluster(
  clusterId: string,
): KnowledgeCluster | undefined {
  return clusterById.get(clusterId as KnowledgeClusterId);
}

export function getKnowledgeClusterByModule(
  moduleId: string,
): KnowledgeCluster | undefined {
  return getKnowledgeCluster(moduleId);
}

export const knowledgeClusterFacets: readonly KnowledgeClusterFacet[] = [
  "learn",
  "build",
  "solve",
  "verify",
  "explore",
];
