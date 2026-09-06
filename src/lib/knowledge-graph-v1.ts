import knowledgeIdentityPayload from "../../content/knowledge-identities.json";
import roadmapIdentityPayload from "../../content/roadmap-identities.json";
import standaloneEnglishIdentityPayload from "../../content/english-standalone-identities.json";
import knowledgeArticleRegistryPayload from "@/generated/knowledge-article-registry.json";
import beginnerRoadmapRegistryPayload from "@/generated/beginner-roadmap-registry.json";
import { articleLanguageAssociations } from "@/lib/article-language-associations";
import { publishedEnglishArticles } from "@/lib/english-articles-complete";
import { screepsApiReference } from "@/lib/screeps-api-reference";
import { screepsDiagnosticSymptoms } from "@/lib/screeps-diagnostic-symptoms";
import { screepsErrorCodes } from "@/lib/screeps-errors";
import { tickLabExperiments } from "@/lib/tick-lab-experiments";
import { getToolHref, toolCatalog } from "@/lib/tool-catalog";

export type KnowledgeGraphNodeType =
  | "Article"
  | "BeginnerLesson"
  | "API"
  | "ReturnCode"
  | "Symptom"
  | "Tool"
  | "TickLabExperiment"
  | "RuntimeEvidence";

export type KnowledgeGraphRelation =
  | "explains"
  | "usesApi"
  | "returns"
  | "involvesApi"
  | "solvedBy"
  | "testedBy"
  | "evidencedBy"
  | "prerequisiteOf"
  | "relatedTo";

export interface KnowledgeGraphNode {
  id: string;
  type: KnowledgeGraphNodeType;
  title: string;
  locale: "zh" | "en" | "neutral";
  source: string;
  href?: string;
}

export interface KnowledgeGraphEdge {
  id: string;
  from: string;
  to: string;
  relation: KnowledgeGraphRelation;
  provenance: string;
}

export interface KnowledgeGraphUnmapped {
  source: string;
  locator: string;
  reason: string;
}

export interface KnowledgeGraphV1 {
  schemaVersion: 1;
  generatedFrom: "authoritative-source-adapters";
  runtimeEvidenceMode: "accepted-only-runtime-adapter";
  nodes: KnowledgeGraphNode[];
  edges: KnowledgeGraphEdge[];
  unmapped: KnowledgeGraphUnmapped[];
}

export interface KnowledgeGraphCoverage {
  nodes: number;
  edges: number;
  unmapped: number;
  byNodeType: Record<KnowledgeGraphNodeType, number>;
  byRelation: Record<KnowledgeGraphRelation, number>;
  runtimeEvidenceMode: KnowledgeGraphV1["runtimeEvidenceMode"];
}

interface RegistryRecord {
  contentId: string;
  slug: string;
  knowledge?: { module: string; stage: string; order: number };
  roadmap?: { id: string; stage: string; order: number };
  seo?: { primaryKeyword?: string };
}

interface IdentityRecord {
  slug: string;
  contentId: string;
}

const knowledgeRegistry =
  knowledgeArticleRegistryPayload as unknown as readonly RegistryRecord[];
const beginnerRegistry =
  beginnerRoadmapRegistryPayload as unknown as readonly RegistryRecord[];
const chineseIdentityRecords = [
  ...(knowledgeIdentityPayload.records as readonly IdentityRecord[]),
  ...(roadmapIdentityPayload.records as readonly IdentityRecord[]),
];
const standaloneEnglishIds = new Map<string, string>(
  standaloneEnglishIdentityPayload.records.map(
    (record) => [String(record.href), String(record.contentId)] as const,
  ),
);
const chineseIdentityByPath = new Map<string, IdentityRecord>(
  chineseIdentityRecords.map(
    (record) => [`/blog/${record.slug}`, record] as const,
  ),
);

function englishContentId(
  article: (typeof publishedEnglishArticles)[number],
): string {
  if (article.chinesePath) {
    const source = chineseIdentityByPath.get(article.chinesePath);
    if (!source) {
      throw new Error(
        `Knowledge Graph V1: English article points to unknown Chinese identity ${article.chinesePath}`,
      );
    }
    return `en_${source.contentId}`;
  }

  const standalone = standaloneEnglishIds.get(article.href);
  if (!standalone) {
    throw new Error(
      `Knowledge Graph V1: English-original article has no standalone identity ${article.href}`,
    );
  }
  return standalone;
}

function edgeId(
  from: string,
  relation: KnowledgeGraphRelation,
  to: string,
): string {
  return `${from}|${relation}|${to}`;
}

function addEdge(
  edges: KnowledgeGraphEdge[],
  seen: Set<string>,
  from: string,
  relation: KnowledgeGraphRelation,
  to: string,
  provenance: string,
): void {
  const id = edgeId(from, relation, to);
  if (seen.has(id)) return;
  seen.add(id);
  edges.push({ id, from, to, relation, provenance });
}

function sequenceKey(record: RegistryRecord): string | null {
  if (record.knowledge) {
    return `knowledge:${record.knowledge.module}:${record.knowledge.stage}`;
  }
  if (record.roadmap) {
    return `roadmap:${record.roadmap.id}:${record.roadmap.stage}`;
  }
  return null;
}

function sequenceOrder(record: RegistryRecord): number {
  return record.knowledge?.order ?? record.roadmap?.order ?? 0;
}

export function buildKnowledgeGraphV1(): KnowledgeGraphV1 {
  const nodes: KnowledgeGraphNode[] = [];
  const edges: KnowledgeGraphEdge[] = [];
  const unmapped: KnowledgeGraphUnmapped[] = [];
  const nodeIds = new Set<string>();
  const edgeIds = new Set<string>();

  const addNode = (node: KnowledgeGraphNode) => {
    if (nodeIds.has(node.id)) {
      throw new Error(`Knowledge Graph V1 duplicate node id: ${node.id}`);
    }
    nodeIds.add(node.id);
    nodes.push(node);
  };

  for (const record of knowledgeRegistry) {
    addNode({
      id: record.contentId,
      type: "Article",
      title: record.seo?.primaryKeyword ?? record.slug,
      href: `/blog/${record.slug}`,
      locale: "zh",
      source: "src/generated/knowledge-article-registry.json",
    });
  }

  for (const record of beginnerRegistry) {
    addNode({
      id: record.contentId,
      type: "BeginnerLesson",
      title: record.seo?.primaryKeyword ?? record.slug,
      href: `/blog/${record.slug}`,
      locale: "zh",
      source: "src/generated/beginner-roadmap-registry.json",
    });
  }

  const englishIdByHref = new Map<string, string>();
  for (const article of publishedEnglishArticles) {
    const id = englishContentId(article);
    englishIdByHref.set(article.href, id);
    addNode({
      id,
      type: "Article",
      title: article.title,
      href: article.href,
      locale: "en",
      source: article.chinesePath
        ? "src/lib/english-articles-complete.ts#source-derived"
        : "content/english-standalone-identities.json",
    });
  }

  for (const api of screepsApiReference) {
    addNode({
      id: `api:${api.id}`,
      type: "API",
      title: api.signature,
      href: `/screeps-api#${api.id}`,
      locale: "neutral",
      source: "src/lib/screeps-api-reference.ts",
    });
  }

  for (const code of screepsErrorCodes) {
    addNode({
      id: `return-code:${code.name}`,
      type: "ReturnCode",
      title: `${code.name} (${code.value})`,
      href: `/screeps-errors#${code.name.toLowerCase()}`,
      locale: "neutral",
      source: "src/lib/screeps-errors.ts",
    });
  }

  for (const symptom of screepsDiagnosticSymptoms) {
    addNode({
      id: `symptom:${symptom.id}`,
      type: "Symptom",
      title: symptom.zhTitle,
      href: `/diagnostics#${symptom.id}`,
      locale: "zh",
      source: "src/lib/screeps-diagnostic-symptoms.ts",
    });
  }

  for (const tool of toolCatalog) {
    addNode({
      id: tool.toolId,
      type: "Tool",
      title: tool.zhTitle,
      href: getToolHref(tool.slug, "zh"),
      locale: "zh",
      source: "src/lib/tool-catalog.ts",
    });
  }

  for (const experiment of tickLabExperiments) {
    addNode({
      id: experiment.experimentId,
      type: "TickLabExperiment",
      title: experiment.key,
      href: "/tick-lab",
      locale: "neutral",
      source: "src/lib/tick-lab-experiments.ts",
    });
  }

  for (const association of articleLanguageAssociations) {
    const chinese = chineseIdentityByPath.get(association.chinesePath);
    const english = englishIdByHref.get(association.englishPath);

    if (!chinese || !english) {
      unmapped.push({
        source: "content/article-language-associations.json",
        locator: `${association.chinesePath}|${association.englishPath}`,
        reason: "counterpart identity is missing",
      });
      continue;
    }

    addEdge(
      edges,
      edgeIds,
      chinese.contentId,
      "relatedTo",
      english,
      "content/article-language-associations.json",
    );
    addEdge(
      edges,
      edgeIds,
      english,
      "relatedTo",
      chinese.contentId,
      "content/article-language-associations.json",
    );
  }

  const sequences = new Map<string, RegistryRecord[]>();
  for (const record of [...knowledgeRegistry, ...beginnerRegistry]) {
    const key = sequenceKey(record);
    if (!key) continue;
    const current = sequences.get(key) ?? [];
    current.push(record);
    sequences.set(key, current);
  }

  for (const [key, records] of sequences) {
    const ordered = [...records].sort(
      (left, right) =>
        sequenceOrder(left) - sequenceOrder(right) ||
        left.slug.localeCompare(right.slug),
    );
    for (let index = 0; index < ordered.length - 1; index += 1) {
      addEdge(
        edges,
        edgeIds,
        ordered[index].contentId,
        "prerequisiteOf",
        ordered[index + 1].contentId,
        `registry-order:${key}`,
      );
    }
  }

  const chineseArticleByHref = new Map<string, string>(
    [...knowledgeRegistry, ...beginnerRegistry].map(
      (record) => [`/blog/${record.slug}`, record.contentId] as const,
    ),
  );
  const englishByChinesePath = new Map<string, string>(
    articleLanguageAssociations.map(
      (record) => [record.chinesePath, record.englishPath] as const,
    ),
  );

  for (const api of screepsApiReference) {
    for (const returnCodeName of api.returnCodeNames ?? []) {
      const target = `return-code:${returnCodeName}`;
      if (nodeIds.has(target)) {
        addEdge(
          edges,
          edgeIds,
          `api:${api.id}`,
          "returns",
          target,
          "src/lib/screeps-api-reference.ts#returnCodeNames",
        );
      } else {
        unmapped.push({
          source: "src/lib/screeps-api-reference.ts",
          locator: `${api.id}:${returnCodeName}`,
          reason: "ReturnCode owner is missing",
        });
      }
    }

    if (api.guideHref?.startsWith("/blog/")) {
      const articleId = chineseArticleByHref.get(api.guideHref);
      if (articleId) {
        addEdge(
          edges,
          edgeIds,
          articleId,
          "explains",
          `api:${api.id}`,
          "src/lib/screeps-api-reference.ts#guideHref",
        );

        const englishHref = englishByChinesePath.get(api.guideHref);
        const englishId = englishHref
          ? englishIdByHref.get(englishHref)
          : undefined;
        if (englishId) {
          addEdge(
            edges,
            edgeIds,
            englishId,
            "usesApi",
            `api:${api.id}`,
            "content/article-language-associations.json#counterpart-api",
          );
        }
      } else {
        unmapped.push({
          source: "src/lib/screeps-api-reference.ts",
          locator: api.guideHref,
          reason: "guideHref has no Chinese content identity",
        });
      }
    }
  }

  const toolIdByHref = new Map<string, string>();
  for (const tool of toolCatalog) {
    toolIdByHref.set(getToolHref(tool.slug, "zh"), tool.toolId);
    toolIdByHref.set(getToolHref(tool.slug, "en"), tool.toolId);
  }

  for (const symptom of screepsDiagnosticSymptoms) {
    const symptomId = `symptom:${symptom.id}`;

    for (const apiId of symptom.directApiEntryIds ?? []) {
      const target = `api:${apiId}`;
      if (nodeIds.has(target)) {
        addEdge(
          edges,
          edgeIds,
          symptomId,
          "involvesApi",
          target,
          "src/lib/screeps-diagnostic-symptoms.ts#directApiEntryIds",
        );
      } else {
        unmapped.push({
          source: "src/lib/screeps-diagnostic-symptoms.ts",
          locator: `${symptom.id}:${apiId}`,
          reason: "direct API owner is missing",
        });
      }
    }

    for (const errorName of symptom.errorNames) {
      const target = `return-code:${errorName}`;
      if (nodeIds.has(target)) {
        addEdge(
          edges,
          edgeIds,
          symptomId,
          "relatedTo",
          target,
          "src/lib/screeps-diagnostic-symptoms.ts#errorNames",
        );
      } else {
        unmapped.push({
          source: "src/lib/screeps-diagnostic-symptoms.ts",
          locator: `${symptom.id}:${errorName}`,
          reason: "ReturnCode owner is missing",
        });
      }
    }

    for (const toolLink of symptom.tools ?? []) {
      const target =
        toolIdByHref.get(toolLink.zhHref) ??
        toolIdByHref.get(toolLink.enHref);
      if (target) {
        addEdge(
          edges,
          edgeIds,
          symptomId,
          "solvedBy",
          target,
          "src/lib/screeps-diagnostic-symptoms.ts#tools",
        );
      }
    }

    const symptomGuides = "guides" in symptom ? symptom.guides : [];
    for (const guide of symptomGuides) {
      const zhArticle = chineseArticleByHref.get(guide.zhHref);
      const enArticle = englishIdByHref.get(guide.enHref);
      if (zhArticle) {
        addEdge(
          edges,
          edgeIds,
          symptomId,
          "solvedBy",
          zhArticle,
          "src/lib/screeps-diagnostic-symptoms.ts#guides",
        );
      }
      if (enArticle) {
        addEdge(
          edges,
          edgeIds,
          symptomId,
          "solvedBy",
          enArticle,
          "src/lib/screeps-diagnostic-symptoms.ts#guides",
        );
      }
    }
  }

  const experimentApiMap: Readonly<Record<string, string>> = {
    "creep-transfer": "creep-transfer",
    "spawn-creep": "spawn-spawn-creep",
    "cpu-bucket": "game-cpu-get-used",
  };

  for (const experiment of tickLabExperiments) {
    const apiId = experimentApiMap[experiment.key];
    const target = apiId ? `api:${apiId}` : null;
    if (target && nodeIds.has(target)) {
      addEdge(
        edges,
        edgeIds,
        target,
        "testedBy",
        experiment.experimentId,
        "src/lib/tick-lab-experiments.ts#experiment-key-contract",
      );
    }
  }

  nodes.sort(
    (left, right) =>
      left.type.localeCompare(right.type) || left.id.localeCompare(right.id),
  );
  edges.sort(
    (left, right) =>
      left.from.localeCompare(right.from) ||
      left.relation.localeCompare(right.relation) ||
      left.to.localeCompare(right.to),
  );
  unmapped.sort(
    (left, right) =>
      left.source.localeCompare(right.source) ||
      left.locator.localeCompare(right.locator),
  );

  return {
    schemaVersion: 1,
    generatedFrom: "authoritative-source-adapters",
    runtimeEvidenceMode: "accepted-only-runtime-adapter",
    nodes,
    edges,
    unmapped,
  };
}

export function getKnowledgeGraphCoverage(
  graph = buildKnowledgeGraphV1(),
): KnowledgeGraphCoverage {
  const nodeTypes: KnowledgeGraphNodeType[] = [
    "Article",
    "BeginnerLesson",
    "API",
    "ReturnCode",
    "Symptom",
    "Tool",
    "TickLabExperiment",
    "RuntimeEvidence",
  ];
  const relations: KnowledgeGraphRelation[] = [
    "explains",
    "usesApi",
    "returns",
    "involvesApi",
    "solvedBy",
    "testedBy",
    "evidencedBy",
    "prerequisiteOf",
    "relatedTo",
  ];

  const byNodeType = Object.fromEntries(
    nodeTypes.map((type) => [type, 0]),
  ) as Record<KnowledgeGraphNodeType, number>;
  const byRelation = Object.fromEntries(
    relations.map((relation) => [relation, 0]),
  ) as Record<KnowledgeGraphRelation, number>;

  for (const node of graph.nodes) byNodeType[node.type] += 1;
  for (const edge of graph.edges) byRelation[edge.relation] += 1;

  return {
    nodes: graph.nodes.length,
    edges: graph.edges.length,
    unmapped: graph.unmapped.length,
    byNodeType,
    byRelation,
    runtimeEvidenceMode: graph.runtimeEvidenceMode,
  };
}

export interface AcceptedRuntimeEvidenceGraphInput {
  status: "accepted";
  evidenceKey: string;
  title: string;
  subjectNodeIds: readonly string[];
}

export function withAcceptedRuntimeEvidence(
  graph: KnowledgeGraphV1,
  evidenceRecords: readonly AcceptedRuntimeEvidenceGraphInput[],
): KnowledgeGraphV1 {
  const next: KnowledgeGraphV1 = {
    ...graph,
    nodes: [...graph.nodes],
    edges: [...graph.edges],
    unmapped: [...graph.unmapped],
  };
  const nodeIds = new Set(next.nodes.map((node) => node.id));
  const edgeIds = new Set(next.edges.map((edge) => edge.id));

  for (const evidence of evidenceRecords) {
    const evidenceId = `evidence:${evidence.evidenceKey}`;
    if (!nodeIds.has(evidenceId)) {
      next.nodes.push({
        id: evidenceId,
        type: "RuntimeEvidence",
        title: evidence.title,
        locale: "neutral",
        source: "verification_evidence_public",
      });
      nodeIds.add(evidenceId);
    }

    for (const subjectId of evidence.subjectNodeIds) {
      if (!nodeIds.has(subjectId)) {
        next.unmapped.push({
          source: "verification_evidence_public",
          locator: `${evidence.evidenceKey}:${subjectId}`,
          reason: "accepted evidence subject has no graph node",
        });
        continue;
      }
      addEdge(
        next.edges,
        edgeIds,
        subjectId,
        "evidencedBy",
        evidenceId,
        "verification_evidence_public#accepted-only",
      );
    }
  }

  next.nodes.sort(
    (left, right) =>
      left.type.localeCompare(right.type) || left.id.localeCompare(right.id),
  );
  next.edges.sort(
    (left, right) =>
      left.from.localeCompare(right.from) ||
      left.relation.localeCompare(right.relation) ||
      left.to.localeCompare(right.to),
  );
  next.unmapped.sort(
    (left, right) =>
      left.source.localeCompare(right.source) ||
      left.locator.localeCompare(right.locator),
  );

  return next;
}
