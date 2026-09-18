import { englishCreepAttackBatchTwentyOneRegistry } from "@/lib/english-creep-attack-registry-21";
import { GRAPH_SEARCH_ANCHOR_MIN_SCORE } from "@/lib/knowledge-graph-search-policy";
import {
  getProblemResolverDeepLink,
  problemResolverFlows,
} from "@/lib/problem-resolver";
import {
  screepsEntityGraph,
  getScreepsIntentPromotions,
  type ScreepsEntityKind,
  type ScreepsEntityLocale,
  type ScreepsEntityNode,
  type ScreepsIntentPromotion,
} from "@/lib/screeps-entity-intent";
import {
  getScreepsDoctorDeepLink,
  getScreepsDoctorLaunchByDiagnosticSymptom,
} from "@/lib/screeps-doctor-launcher";

export type SearchRouteV1IntentKind = "symptom" | "api" | "error";
export type SearchRouteV1ActionKind =
  | "doctor"
  | "resolver"
  | "diagnostics"
  | "api"
  | "error";
export type SearchRouteV1RelatedKind =
  | "api"
  | "error"
  | "hub"
  | "guide"
  | "tool"
  | "verification";

export interface SearchRouteV1Action {
  kind: SearchRouteV1ActionKind;
  targetId: string;
  href: string;
  label: string;
}

export interface SearchRouteV1RelatedPath {
  kind: SearchRouteV1RelatedKind;
  targetId: string;
  href: string;
  title: string;
  description: string;
}

export interface SearchRouteV1 {
  version: 1;
  locale: ScreepsEntityLocale;
  intent: {
    kind: SearchRouteV1IntentKind;
    entityId: string;
    score: number;
    title: string;
  };
  answer: string;
  primaryAction: SearchRouteV1Action;
  secondaryActions: SearchRouteV1Action[];
  relatedPaths: SearchRouteV1RelatedPath[];
}

export const SEARCH_ROUTE_V1_ACCEPTANCE_CASES = [
  { locale: "en", query: "creep not moving", intent: "symptom", primary: "doctor" },
  { locale: "zh", query: "Creep 不动", intent: "symptom", primary: "doctor" },
  { locale: "en", query: "spawn not working", intent: "symptom", primary: "doctor" },
  { locale: "en", query: "creep not harvesting", intent: "symptom", primary: "doctor" },
  { locale: "en", query: "controller about to downgrade", intent: "symptom", primary: "resolver" },
  { locale: "en", query: "CPU too high", intent: "symptom", primary: "resolver" },
  { locale: "en", query: "lab boost failed", intent: "symptom", primary: "resolver" },
  { locale: "en", query: "spawn returns -6", intent: "symptom", primary: "doctor" },
  { locale: "en", query: "ERR_NOT_IN_RANGE", intent: "error", primary: "error" },
  { locale: "en", query: "Screeps Arena spawnCreep", intent: "api", primary: "api" },
  { locale: "en", query: "Screeps World spawnCreep", intent: "api", primary: "api" },
  { locale: "en", query: "spawnCreep", intent: null, primary: null },
  { locale: "en", query: "unknown random query", intent: null, primary: null },
] as const;

const entityNodeById = new Map(
  screepsEntityGraph.nodes.map((node) => [node.id, node] as const),
);

function localizeNode(node: ScreepsEntityNode, locale: ScreepsEntityLocale) {
  return locale === "en"
    ? {
        title: node.enLabel,
        description: node.enDescription,
        href: node.enHref,
      }
    : {
        title: node.zhLabel,
        description: node.zhDescription,
        href: node.zhHref,
      };
}

function actionLabel(kind: SearchRouteV1ActionKind, locale: ScreepsEntityLocale): string {
  const labels: Record<SearchRouteV1ActionKind, { zh: string; en: string }> = {
    doctor: { zh: "运行 Doctor", en: "Run Doctor" },
    resolver: { zh: "启动 Resolver", en: "Start Resolver" },
    diagnostics: { zh: "打开 Diagnostics", en: "Open Diagnostics" },
    api: { zh: "打开 API Reference", en: "Open API Reference" },
    error: { zh: "打开错误码", en: "Open Error Code" },
  };
  return labels[kind][locale];
}

function relatedKindPriority(kind: SearchRouteV1RelatedKind): number {
  const order: Record<SearchRouteV1RelatedKind, number> = {
    api: 0,
    error: 1,
    hub: 2,
    guide: 3,
    tool: 4,
    verification: 5,
  };
  return order[kind];
}

function getRelatedPaths(
  anchorEntityId: string,
  locale: ScreepsEntityLocale,
  excludedHrefs: readonly string[],
): SearchRouteV1RelatedPath[] {
  const allowedKinds = new Set<SearchRouteV1RelatedKind>([
    "api",
    "error",
    "hub",
    "guide",
    "tool",
    "verification",
  ]);
  const excluded = new Set(excludedHrefs);
  const relatedNodeIds = new Set<string>();

  for (const edge of screepsEntityGraph.edges) {
    if (edge.from === anchorEntityId) relatedNodeIds.add(edge.to);
    if (edge.to === anchorEntityId) relatedNodeIds.add(edge.from);
  }

  const byHref = new Map<string, SearchRouteV1RelatedPath>();
  for (const nodeId of relatedNodeIds) {
    const node = entityNodeById.get(nodeId);
    if (!node || !allowedKinds.has(node.kind as SearchRouteV1RelatedKind)) continue;
    const localized = localizeNode(node, locale);
    if (!localized.href || excluded.has(localized.href)) continue;
    byHref.set(localized.href, {
      kind: node.kind as SearchRouteV1RelatedKind,
      targetId: node.id,
      href: localized.href,
      title: localized.title,
      description: localized.description,
    });
  }

  return [...byHref.values()]
    .sort(
      (left, right) =>
        relatedKindPriority(left.kind) - relatedKindPriority(right.kind) ||
        left.title.localeCompare(right.title, locale === "en" ? "en" : "zh-CN"),
    )
    .slice(0, 6);
}

function symptomRoute(
  promotion: ScreepsIntentPromotion,
  locale: ScreepsEntityLocale,
): SearchRouteV1 {
  const symptomId = promotion.entityId.slice("symptom:".length);
  const doctorLaunch = getScreepsDoctorLaunchByDiagnosticSymptom(symptomId);
  const doctorHref = doctorLaunch
    ? getScreepsDoctorDeepLink(doctorLaunch.doctorSymptom, locale)
    : null;
  const resolverFlow = problemResolverFlows.find((flow) => flow.symptomId === symptomId);
  const resolverHref = resolverFlow
    ? getProblemResolverDeepLink(resolverFlow.flowId, locale)
    : null;
  const diagnosticsHref = `${locale === "en" ? "/en" : ""}/diagnostics#${encodeURIComponent(symptomId)}`;

  let primaryAction: SearchRouteV1Action;
  const secondaryActions: SearchRouteV1Action[] = [];

  if (doctorLaunch && doctorHref) {
    primaryAction = {
      kind: "doctor",
      targetId: doctorLaunch.doctorSymptom,
      href: doctorHref,
      label: actionLabel("doctor", locale),
    };
    if (resolverFlow && resolverHref) {
      secondaryActions.push({
        kind: "resolver",
        targetId: resolverFlow.flowId,
        href: resolverHref,
        label: actionLabel("resolver", locale),
      });
    }
  } else if (resolverFlow && resolverHref) {
    primaryAction = {
      kind: "resolver",
      targetId: resolverFlow.flowId,
      href: resolverHref,
      label: actionLabel("resolver", locale),
    };
  } else {
    primaryAction = {
      kind: "diagnostics",
      targetId: symptomId,
      href: diagnosticsHref,
      label: actionLabel("diagnostics", locale),
    };
  }

  const answer = doctorLaunch
    ? locale === "en"
      ? `${promotion.title} is a supported deterministic Doctor symptom. Start with the read-only Doctor, then use Resolver when you need the real API result.`
      : `${promotion.title} 已有确定性的 Doctor 症状流程。先运行只读 Doctor；需要真实 API 返回值时再进入 Resolver。`
    : resolverFlow
      ? locale === "en"
        ? `${promotion.title} has a deterministic Resolver flow. Start there and answer only from observed game state.`
        : `${promotion.title} 已有确定性的 Resolver 流程。请从真实可观察的游戏状态开始逐步排查。`
      : locale === "en"
        ? `${promotion.title} is a high-confidence symptom match. Continue in Diagnostics without inventing a diagnosis.`
        : `${promotion.title} 是高置信症状匹配。继续进入 Diagnostics，不猜测未观察到的原因。`;

  const excludedHrefs = [primaryAction.href, ...secondaryActions.map((action) => action.href)];
  return {
    version: 1,
    locale,
    intent: {
      kind: "symptom",
      entityId: promotion.entityId,
      score: promotion.score,
      title: promotion.title,
    },
    answer,
    primaryAction,
    secondaryActions,
    relatedPaths: getRelatedPaths(promotion.entityId, locale, excludedHrefs),
  };
}

function referenceRoute(
  promotion: ScreepsIntentPromotion,
  locale: ScreepsEntityLocale,
): SearchRouteV1 {
  const kind = promotion.kind as "api" | "error";
  const primaryAction: SearchRouteV1Action = {
    kind,
    targetId: promotion.entityId,
    href: promotion.href,
    label: actionLabel(kind, locale),
  };
  const answer = kind === "api"
    ? locale === "en"
      ? `${promotion.title} is a high-confidence API match. Open the reference first; a related symptom never starts Doctor automatically.`
      : `${promotion.title} 是高置信 API 匹配。先打开 API Reference；即使它关联某个症状，也不会自动启动 Doctor。`
    : locale === "en"
      ? `${promotion.title} is a high-confidence return-code match. Open the code definition first; the code alone cannot choose one Doctor symptom.`
      : `${promotion.title} 是高置信返回码匹配。先打开错误码定义；单个返回码不能自动选择某个 Doctor 症状。`;

  return {
    version: 1,
    locale,
    intent: {
      kind,
      entityId: promotion.entityId,
      score: promotion.score,
      title: promotion.title,
    },
    answer,
    primaryAction,
    secondaryActions: [],
    relatedPaths: getRelatedPaths(promotion.entityId, locale, [promotion.href]),
  };
}

function normalizeGameModeQuery(query: string): string {
  return query.normalize("NFKC").toLocaleLowerCase("en").replace(/\s+/g, " ").trim();
}

function buildSpawnCreepGameModeRoute(
  query: string,
  locale: ScreepsEntityLocale,
): SearchRouteV1 | null | undefined {
  const normalized = normalizeGameModeQuery(query);
  if (!/(?:spawn\s*\.\s*)?spawncreep\s*(?:\(|\b)/i.test(normalized)) return undefined;

  const arena = /\barena\b/.test(normalized);
  const world = /\b(?:world|mmo|persistent world)\b/.test(normalized);
  const compoundFailure = /\b(?:return|returns|returned|error|failed|failing)\b|err_[a-z_]+|-\d+|失败|返回/.test(normalized);

  if (arena === world) {
    return compoundFailure ? undefined : null;
  }

  const worldNode = entityNodeById.get("api:spawn-spawn-creep");
  if (!worldNode) return null;
  const localizedWorld = localizeNode(worldNode, locale);

  if (world) {
    const promotion: ScreepsIntentPromotion = {
      entityId: worldNode.id,
      kind: "api",
      score: 160,
      title: localizedWorld.title,
      description: localizedWorld.description,
      href: localizedWorld.href,
      aliases: locale === "en" ? worldNode.enAliases : worldNode.zhAliases,
    };
    const route = referenceRoute(promotion, locale);
    route.answer = locale === "en"
      ? "This query explicitly names Screeps World/MMO. Use spawnCreep(body, name, opts) and the MMO return-code contract."
      : "该查询明确指向 Screeps World/MMO。应使用 spawnCreep(body, name, opts) 与 MMO 返回码合同。";
    return route;
  }

  const arenaOwner = englishCreepAttackBatchTwentyOneRegistry.find(
    (entry) => entry.href === "/en/blog/screeps-arena-spawn-creep",
  );
  if (!arenaOwner) return null;

  return {
    version: 1,
    locale,
    intent: {
      kind: "api",
      entityId: `guide:${arenaOwner.href}`,
      score: 160,
      title: arenaOwner.title,
    },
    answer: locale === "en"
      ? "This query explicitly names Screeps Arena. Use spawnCreep(body) and read the Arena result object's object or error field; do not apply the World/MMO signature."
      : "该查询明确指向 Screeps Arena。应使用 spawnCreep(body)，并读取 Arena 结果对象的 object 或 error 字段；不要套用 World/MMO 签名。",
    primaryAction: {
      kind: "api",
      targetId: arenaOwner.href,
      href: arenaOwner.href,
      label: locale === "en" ? "Open the Arena API guide" : "打开 Arena API 指南",
    },
    secondaryActions: [],
    relatedPaths: [
      {
        kind: "api",
        targetId: worldNode.id,
        href: localizedWorld.href,
        title: localizedWorld.title,
        description: locale === "en"
          ? "World/MMO uses spawnCreep(body, name, opts), a different contract."
          : "World/MMO 使用 spawnCreep(body, name, opts)，属于不同合同。",
      },
    ],
  };
}

function isRouteIntentKind(kind: ScreepsEntityKind): kind is SearchRouteV1IntentKind {
  return kind === "symptom" || kind === "api" || kind === "error";
}

function getStandaloneErrorPromotion(
  query: string,
  promotions: readonly ScreepsIntentPromotion[],
): ScreepsIntentPromotion | null {
  const errorName = query.trim().toLocaleUpperCase("en");
  if (!/^ERR_[A-Z_]+$/.test(errorName)) return null;
  return promotions.find(
    (promotion) =>
      promotion.kind === "error" &&
      promotion.entityId === `error:${errorName}` &&
      promotion.score >= GRAPH_SEARCH_ANCHOR_MIN_SCORE,
  ) ?? null;
}

export function buildSearchRouteV1(
  query: string,
  locale: ScreepsEntityLocale,
): SearchRouteV1 | null {
  try {
    const normalizedQuery = query.normalize("NFKC").trim();
    if (!normalizedQuery) return null;

    const gameModeRoute = buildSpawnCreepGameModeRoute(normalizedQuery, locale);
    if (gameModeRoute !== undefined) return gameModeRoute;

    const promotions = getScreepsIntentPromotions(normalizedQuery, locale, 8);
    const standaloneError = getStandaloneErrorPromotion(
      normalizedQuery,
      promotions,
    );
    if (standaloneError) return referenceRoute(standaloneError, locale);

    const promotion = promotions.find(
      (candidate) =>
        candidate.score >= GRAPH_SEARCH_ANCHOR_MIN_SCORE &&
        isRouteIntentKind(candidate.kind),
    );
    if (!promotion) return null;

    return promotion.kind === "symptom"
      ? symptomRoute(promotion, locale)
      : referenceRoute(promotion, locale);
  } catch {
    // Search V3 is an optional orchestration layer. Search V2 must remain usable.
    return null;
  }
}
