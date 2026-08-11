import { getScreepsApiHubHref, screepsApiHubs } from "@/lib/screeps-api-hubs";
import { screepsApiReference } from "@/lib/screeps-api-reference";
import { screepsDiagnosticSymptoms } from "@/lib/screeps-diagnostic-symptoms";
import { screepsErrorDiagnostics } from "@/lib/screeps-error-diagnostics";
import { screepsErrorCodes } from "@/lib/screeps-errors";
import { verificationCoveragePlans } from "@/lib/verification-coverage";

export type ScreepsEntityLocale = "zh" | "en";
export type ScreepsEntityKind =
  | "symptom"
  | "error"
  | "api"
  | "hub"
  | "guide"
  | "tool"
  | "verification";

export type ScreepsEntityRelation =
  | "symptom-error"
  | "symptom-api"
  | "symptom-hub"
  | "symptom-guide"
  | "symptom-tool"
  | "symptom-verification"
  | "error-api"
  | "error-hub"
  | "error-guide"
  | "error-tool"
  | "api-hub"
  | "api-guide"
  | "hub-guide"
  | "hub-tool";

export interface ScreepsEntityNode {
  id: string;
  kind: ScreepsEntityKind;
  zhLabel: string;
  enLabel: string;
  zhDescription: string;
  enDescription: string;
  zhHref: string;
  enHref: string;
  zhAliases: readonly string[];
  enAliases: readonly string[];
}

export interface ScreepsEntityEdge {
  from: string;
  to: string;
  relation: ScreepsEntityRelation;
}

export interface ScreepsIntentPromotion {
  entityId: string;
  kind: ScreepsEntityKind;
  score: number;
  title: string;
  description: string;
  href: string;
  aliases: readonly string[];
}

const symptomAliasOverrides: Record<
  string,
  { zh: readonly string[]; en: readonly string[] }
> = {
  "creep-not-moving": {
    zh: ["creep不动", "creep不走", "不动", "不走", "卡住", "站着不动"],
    en: ["creep not moving", "creep stuck", "won't move", "cannot move"],
  },
  "creep-not-harvesting": {
    zh: ["creep不采集", "不采矿", "harvest没反应", "采集失败"],
    en: ["creep not harvesting", "harvest not working", "cannot harvest"],
  },
  "spawn-not-spawning": {
    zh: ["spawn不生产", "spawn不出creep", "生产不出来", "孵化失败"],
    en: ["spawn not spawning", "spawn will not spawn", "cannot spawn creep"],
  },
  "controller-downgrade": {
    zh: ["controller掉级", "controller快掉级", "快掉级", "要降级", "升级不上"],
    en: ["controller downgrade", "controller about to downgrade", "upgrader not upgrading"],
  },
  "link-not-transferring": {
    zh: ["link不传能", "link不传能量", "传不了能量", "link没反应"],
    en: ["link not transferring", "link not transferring energy", "link transfer failed"],
  },
  "market-action-failed": {
    zh: ["market交易失败", "deal失败", "createorder失败", "市场下单失败"],
    en: ["market action failed", "market deal failed", "createorder failed"],
  },
  "cpu-too-high": {
    zh: ["cpu太高", "cpu过高", "爆cpu", "bucket下降"],
    en: ["cpu too high", "high cpu", "cpu spike", "bucket dropping"],
  },
  "resources-not-moving": {
    zh: ["资源运不过去", "资源搬不过去", "物流断了", "搬运卡住"],
    en: ["resources not moving", "hauling stalled", "logistics stuck", "resources not delivered"],
  },
};

export const screepsIntentAcceptanceCases = [
  { locale: "zh", query: "creep 为什么不动", expectedSymptomId: "creep-not-moving" },
  { locale: "zh", query: "spawn 返回 -6", expectedSymptomId: "spawn-not-spawning" },
  { locale: "zh", query: "controller 快掉级", expectedSymptomId: "controller-downgrade" },
  { locale: "en", query: "creep not moving", expectedSymptomId: "creep-not-moving" },
  { locale: "en", query: "spawn returns -6", expectedSymptomId: "spawn-not-spawning" },
  { locale: "en", query: "controller about to downgrade", expectedSymptomId: "controller-downgrade" },
] as const;

const nodes = new Map<string, ScreepsEntityNode>();
const edges: ScreepsEntityEdge[] = [];
const edgeKeys = new Set<string>();

function localizedGuideHref(zhHref: string): string {
  if (!zhHref.startsWith("/")) return zhHref;
  if (zhHref.startsWith("/en/")) return zhHref;
  return `/en${zhHref}`;
}

function stableLinkId(kind: "guide" | "tool", href: string): string {
  return `${kind}:${href
    .replace(/^https?:\/\//, "")
    .replace(/^\//, "")
    .replace(/[^a-zA-Z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "")}`;
}

function addNode(node: ScreepsEntityNode): void {
  const existing = nodes.get(node.id);
  if (!existing) {
    nodes.set(node.id, node);
    return;
  }

  nodes.set(node.id, {
    ...existing,
    zhAliases: [...new Set([...existing.zhAliases, ...node.zhAliases])],
    enAliases: [...new Set([...existing.enAliases, ...node.enAliases])],
  });
}

function addEdge(from: string, to: string, relation: ScreepsEntityRelation): void {
  const key = `${from}|${to}|${relation}`;
  if (edgeKeys.has(key)) return;
  edgeKeys.add(key);
  edges.push({ from, to, relation });
}

function addLinkedNode(input: {
  kind: "guide" | "tool";
  zhLabel: string;
  enLabel: string;
  zhHref: string;
  enHref: string;
}): string {
  const id = stableLinkId(input.kind, input.zhHref);
  addNode({
    id,
    kind: input.kind,
    zhLabel: input.zhLabel,
    enLabel: input.enLabel,
    zhDescription: input.kind === "guide" ? "相关 Screeps 教程入口。" : "相关 Screeps 工具入口。",
    enDescription: input.kind === "guide" ? "Related Screeps guide." : "Related Screeps tool.",
    zhHref: input.zhHref,
    enHref: input.enHref,
    zhAliases: [input.zhLabel],
    enAliases: [input.enLabel],
  });
  return id;
}

const errorCodeByName = new Map(screepsErrorCodes.map((entry) => [entry.name, entry]));
const apiById = new Map(screepsApiReference.map((entry) => [entry.id, entry]));
const hubBySlug = new Map(screepsApiHubs.map((hub) => [hub.slug, hub]));
const diagnosticByName = new Map(screepsErrorDiagnostics.map((entry) => [entry.name, entry]));
const coverageBySymptom = new Map(verificationCoveragePlans.map((plan) => [plan.symptomId, plan]));

for (const diagnostic of screepsErrorDiagnostics) {
  const code = errorCodeByName.get(diagnostic.name);
  const errorId = `error:${diagnostic.name}`;
  addNode({
    id: errorId,
    kind: "error",
    zhLabel: code ? `${diagnostic.name}（${code.value}）` : diagnostic.name,
    enLabel: code ? `${diagnostic.name} (${code.value})` : diagnostic.name,
    zhDescription: diagnostic.zhSummary,
    enDescription: diagnostic.enSummary,
    zhHref: `/screeps-errors#${diagnostic.name.toLowerCase()}`,
    enHref: `/en/screeps-errors#${diagnostic.name.toLowerCase()}`,
    zhAliases: [diagnostic.name, ...(code ? [String(code.value)] : []), ...diagnostic.zhSearchTerms],
    enAliases: [diagnostic.name, ...(code ? [String(code.value)] : []), ...diagnostic.enSearchTerms],
  });

  for (const apiId of diagnostic.apiEntryIds) {
    addEdge(errorId, `api:${apiId}`, "error-api");
  }
  for (const hubSlug of diagnostic.hubSlugs) {
    addEdge(errorId, `hub:${hubSlug}`, "error-hub");
  }
  for (const guide of diagnostic.guides) {
    const guideId = addLinkedNode({ kind: "guide", ...guide });
    addEdge(errorId, guideId, "error-guide");
  }
  for (const tool of diagnostic.tools) {
    const toolId = addLinkedNode({ kind: "tool", ...tool });
    addEdge(errorId, toolId, "error-tool");
  }
}

for (const api of screepsApiReference) {
  const apiId = `api:${api.id}`;
  addNode({
    id: apiId,
    kind: "api",
    zhLabel: api.signature,
    enLabel: api.signature,
    zhDescription: api.summary,
    enDescription: `Screeps API surface: ${api.signature}.`,
    zhHref: `/screeps-api#${api.id}`,
    enHref: `/en/screeps-api#${api.id}`,
    zhAliases: [api.id, api.signature, ...api.keywords],
    enAliases: [api.id, api.signature, ...api.keywords],
  });

  if (api.guideHref) {
    const guideId = addLinkedNode({
      kind: "guide",
      zhLabel: `${api.signature} 教程`,
      enLabel: `${api.signature} guide`,
      zhHref: api.guideHref,
      enHref: localizedGuideHref(api.guideHref),
    });
    addEdge(apiId, guideId, "api-guide");
  }
}

for (const hub of screepsApiHubs) {
  const hubId = `hub:${hub.slug}`;
  addNode({
    id: hubId,
    kind: "hub",
    zhLabel: hub.zhTitle,
    enLabel: hub.enTitle,
    zhDescription: hub.zhDescription,
    enDescription: hub.enDescription,
    zhHref: getScreepsApiHubHref(hub.slug, "zh"),
    enHref: getScreepsApiHubHref(hub.slug, "en"),
    zhAliases: [hub.objectName, hub.zhTitle, ...hub.keywords],
    enAliases: [hub.objectName, hub.enTitle, ...hub.keywords],
  });

  for (const apiId of hub.entryIds) addEdge(`api:${apiId}`, hubId, "api-hub");
  for (const link of [...hub.modules, ...(hub.extraGuides ?? [])]) {
    const guideId = addLinkedNode({ kind: "guide", ...link });
    addEdge(hubId, guideId, "hub-guide");
  }
  for (const link of hub.tools) {
    const toolId = addLinkedNode({ kind: "tool", ...link });
    addEdge(hubId, toolId, "hub-tool");
  }
}

for (const symptom of screepsDiagnosticSymptoms) {
  const symptomId = `symptom:${symptom.id}`;
  const overrides = symptomAliasOverrides[symptom.id] ?? { zh: [], en: [] };
  addNode({
    id: symptomId,
    kind: "symptom",
    zhLabel: symptom.zhTitle,
    enLabel: symptom.enTitle,
    zhDescription: symptom.zhSummary,
    enDescription: symptom.enSummary,
    zhHref: `/diagnostics#${symptom.id}`,
    enHref: `/en/diagnostics#${symptom.id}`,
    zhAliases: [symptom.zhTitle, ...symptom.zhSearchTerms, ...overrides.zh],
    enAliases: [symptom.enTitle, ...symptom.enSearchTerms, ...overrides.en],
  });

  for (const errorName of symptom.errorNames) {
    addEdge(symptomId, `error:${errorName}`, "symptom-error");
  }
  for (const apiId of symptom.directApiEntryIds ?? []) {
    addEdge(symptomId, `api:${apiId}`, "symptom-api");
  }
  for (const hubSlug of symptom.directHubSlugs ?? []) {
    addEdge(symptomId, `hub:${hubSlug}`, "symptom-hub");
  }
  for (const guide of symptom.guides ?? []) {
    const guideId = addLinkedNode({ kind: "guide", ...guide });
    addEdge(symptomId, guideId, "symptom-guide");
  }
  for (const tool of symptom.tools ?? []) {
    const toolId = addLinkedNode({ kind: "tool", ...tool });
    addEdge(symptomId, toolId, "symptom-tool");
  }

  const coverage = coverageBySymptom.get(symptom.id);
  if (coverage) {
    const verificationId = `verification:${symptom.id}`;
    addNode({
      id: verificationId,
      kind: "verification",
      zhLabel: `${symptom.zhTitle} 验证覆盖`,
      enLabel: `${symptom.enTitle} verification coverage`,
      zhDescription: coverage.zhNextEvidence,
      enDescription: coverage.enNextEvidence,
      zhHref: `/verification/coverage#coverage-${symptom.id}`,
      enHref: `/en/verification/coverage#coverage-${symptom.id}`,
      zhAliases: ["验证覆盖", "evidence", coverage.targetLevel, coverage.priority, symptom.zhTitle],
      enAliases: ["verification coverage", "evidence", coverage.targetLevel, coverage.priority, symptom.enTitle],
    });
    addEdge(symptomId, verificationId, "symptom-verification");
  }

  for (const errorName of symptom.errorNames) {
    const diagnostic = diagnosticByName.get(errorName);
    if (!diagnostic) continue;
    for (const guide of diagnostic.guides) {
      addEdge(symptomId, stableLinkId("guide", guide.zhHref), "symptom-guide");
    }
    for (const tool of diagnostic.tools) {
      addEdge(symptomId, stableLinkId("tool", tool.zhHref), "symptom-tool");
    }
  }

  for (const apiId of symptom.directApiEntryIds ?? []) {
    const api = apiById.get(apiId);
    if (api?.guideHref) {
      addEdge(symptomId, stableLinkId("guide", api.guideHref), "symptom-guide");
    }
    for (const hub of screepsApiHubs) {
      if (hub.entryIds.includes(apiId)) addEdge(symptomId, `hub:${hub.slug}`, "symptom-hub");
    }
  }
}

export const screepsEntityGraph = {
  nodes: [...nodes.values()],
  edges,
} as const;

const nodeById = new Map(screepsEntityGraph.nodes.map((node) => [node.id, node]));
const outgoingById = new Map<string, ScreepsEntityEdge[]>();
for (const edge of screepsEntityGraph.edges) {
  const current = outgoingById.get(edge.from) ?? [];
  current.push(edge);
  outgoingById.set(edge.from, current);
}

function normalizeIntentText(value: string, locale: ScreepsEntityLocale): string {
  return value
    .normalize("NFKC")
    .toLocaleLowerCase(locale === "en" ? "en" : "zh-CN")
    .replace(/[，。！？；：,!?;:"'`()\[\]{}]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenizeIntentText(value: string, locale: ScreepsEntityLocale): string[] {
  const normalized = normalizeIntentText(value, locale);
  return (
    normalized.match(/err_[a-z_]+|-?\d+|[a-z][a-z0-9_.-]*|[\u3400-\u9fff]{1,8}/g) ?? []
  );
}

function scoreAlias(
  normalizedQuery: string,
  queryTokens: readonly string[],
  alias: string,
  locale: ScreepsEntityLocale,
): number {
  const normalizedAlias = normalizeIntentText(alias, locale);
  if (!normalizedAlias) return 0;
  if (normalizedQuery === normalizedAlias) return 160;
  if (normalizedQuery.includes(normalizedAlias) && normalizedAlias.length >= 2) return 120;
  if (normalizedAlias.includes(normalizedQuery) && normalizedQuery.length >= 3) return 80;

  const aliasTokens = tokenizeIntentText(normalizedAlias, locale);
  if (aliasTokens.length === 0) return 0;
  const overlap = aliasTokens.filter((token) => queryTokens.includes(token));
  if (overlap.length === 0) return 0;
  if (overlap.length === aliasTokens.length) return 68 + Math.min(24, overlap.length * 8);
  return Math.min(60, overlap.length * 24);
}

function scoreNode(node: ScreepsEntityNode, query: string, locale: ScreepsEntityLocale): number {
  const normalizedQuery = normalizeIntentText(query, locale);
  const queryTokens = tokenizeIntentText(query, locale);
  if (!normalizedQuery || queryTokens.length === 0) return 0;
  const aliases = locale === "en" ? node.enAliases : node.zhAliases;
  let score = 0;
  for (const alias of aliases) {
    score = Math.max(score, scoreAlias(normalizedQuery, queryTokens, alias, locale));
  }

  const kindWeight: Record<ScreepsEntityKind, number> = {
    symptom: 1.18,
    error: 1.12,
    api: 1,
    hub: 0.92,
    guide: 0.72,
    tool: 0.78,
    verification: 0.7,
  };
  return Math.round(score * kindWeight[node.kind]);
}

function localizeNode(node: ScreepsEntityNode, locale: ScreepsEntityLocale) {
  return locale === "en"
    ? {
        title: node.enLabel,
        description: node.enDescription,
        href: node.enHref,
        aliases: node.enAliases,
      }
    : {
        title: node.zhLabel,
        description: node.zhDescription,
        href: node.zhHref,
        aliases: node.zhAliases,
      };
}

export function getScreepsIntentPromotions(
  query: string,
  locale: ScreepsEntityLocale,
  limit = 8,
): ScreepsIntentPromotion[] {
  const directScores = new Map<string, number>();
  for (const node of screepsEntityGraph.nodes) {
    const score = scoreNode(node, query, locale);
    if (score > 0) directScores.set(node.id, score);
  }

  const promotedScores = new Map(directScores);
  for (const symptom of screepsDiagnosticSymptoms) {
    const symptomNodeId = `symptom:${symptom.id}`;
    const direct = directScores.get(symptomNodeId) ?? 0;
    const relatedEdges = outgoingById.get(symptomNodeId) ?? [];
    const relatedMatches = relatedEdges
      .map((edge) => {
        const node = nodeById.get(edge.to);
        return node ? { kind: node.kind, score: directScores.get(edge.to) ?? 0 } : null;
      })
      .filter((entry): entry is { kind: ScreepsEntityKind; score: number } => Boolean(entry && entry.score > 0))
      .sort((left, right) => right.score - left.score);

    const matchedKinds = new Set(relatedMatches.filter((entry) => entry.score >= 45).map((entry) => entry.kind));
    const best = relatedMatches[0]?.score ?? 0;
    const second = relatedMatches[1]?.score ?? 0;
    let propagated = 0;

    if (direct >= 45) {
      propagated = direct + Math.round(best * 0.65) + matchedKinds.size * 18;
    } else if (matchedKinds.size >= 2) {
      propagated = best + Math.round(second * 0.65) + matchedKinds.size * 20;
    }

    if (propagated > (promotedScores.get(symptomNodeId) ?? 0)) {
      promotedScores.set(symptomNodeId, propagated);
    }
  }

  return [...promotedScores.entries()]
    .map(([entityId, score]) => {
      const node = nodeById.get(entityId);
      if (!node || score < 45) return null;
      const localized = localizeNode(node, locale);
      return {
        entityId,
        kind: node.kind,
        score: score + (node.kind === "symptom" ? 24 : node.kind === "error" ? 10 : 0),
        ...localized,
      } satisfies ScreepsIntentPromotion;
    })
    .filter((entry): entry is ScreepsIntentPromotion => Boolean(entry))
    .sort((left, right) => right.score - left.score || left.title.localeCompare(right.title, locale === "en" ? "en" : "zh-CN"))
    .slice(0, Math.max(1, Math.min(limit, 12)));
}
