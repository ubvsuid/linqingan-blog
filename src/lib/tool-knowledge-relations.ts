import { englishDiscoveryArticles } from "@/lib/english-discovery";
import { getAllPosts } from "@/lib/posts";
import {
  screepsApiHubs,
  type ScreepsApiHubSlug,
} from "@/lib/screeps-api-hubs";
import { screepsApiReference } from "@/lib/screeps-api-reference";
import { screepsErrorCodes } from "@/lib/screeps-errors";

export type ToolKnowledgeRelationsLocale = "zh" | "en";

export interface ToolKnowledgeRelationLink {
  href: string;
  label: string;
  meta?: string;
}

export interface ToolKnowledgeRelationRecord {
  toolHref: string;
  guides: ToolKnowledgeRelationLink[];
  apiHubs: ToolKnowledgeRelationLink[];
  errors: ToolKnowledgeRelationLink[];
}

interface ToolKnowledgeRelationProfile {
  hubSlugs: readonly ScreepsApiHubSlug[];
  entryIds: readonly string[];
  errorNames: readonly string[];
  extraGuideHrefs?: readonly string[];
  maxGuides?: number;
  maxHubs?: number;
  maxErrors?: number;
}

const toolRelationProfiles: Readonly<Record<string, ToolKnowledgeRelationProfile>> = {
  "/tools/creep-body-calculator": {
    hubSlugs: ["structure-spawn", "creep"],
    entryIds: ["spawn-spawn-creep"],
    errorNames: ["ERR_NOT_ENOUGH_RESOURCES", "ERR_INVALID_ARGS", "ERR_RCL_NOT_ENOUGH"],
    maxGuides: 3,
    maxHubs: 2,
    maxErrors: 3,
  },
  "/tools/hauling-throughput-planner": {
    hubSlugs: ["creep", "structure-link", "store"],
    entryIds: ["creep-transfer", "creep-withdraw", "creep-pickup", "link-transfer-energy"],
    errorNames: ["ERR_FULL", "ERR_NOT_ENOUGH_RESOURCES", "ERR_NOT_IN_RANGE"],
    maxGuides: 4,
    maxHubs: 3,
    maxErrors: 3,
  },
  "/tools/controller-downgrade-planner": {
    hubSlugs: ["controller", "structure-link", "creep"],
    entryIds: ["creep-upgrade-controller", "link-transfer-energy"],
    errorNames: ["ERR_NOT_IN_RANGE", "ERR_NOT_ENOUGH_RESOURCES", "ERR_INVALID_TARGET"],
    extraGuideHrefs: [
      "/blog/screeps-controller-downgrade",
      "/blog/screeps-upgrader-controller-link-not-upgrading",
    ],
    maxGuides: 4,
    maxHubs: 3,
    maxErrors: 3,
  },
  "/tools/room-diagnostics": {
    hubSlugs: [
      "room",
      "structure-spawn",
      "controller",
      "structure-link",
      "structure-tower",
      "path-finder",
    ],
    entryIds: [
      "room-get-event-log",
      "spawn-spawn-creep",
      "creep-upgrade-controller",
      "link-transfer-energy",
      "tower-attack-heal-repair",
      "pathfinder-search",
    ],
    errorNames: [
      "ERR_NOT_IN_RANGE",
      "ERR_NO_PATH",
      "ERR_NOT_ENOUGH_RESOURCES",
      "ERR_INVALID_TARGET",
      "ERR_BUSY",
    ],
    maxGuides: 5,
    maxHubs: 4,
    maxErrors: 5,
  },
  "/tools/spawn-queue-replacement-planner": {
    hubSlugs: ["structure-spawn"],
    entryIds: ["spawn-spawn-creep", "spawn-renew-creep", "spawn-recycle-creep"],
    errorNames: ["ERR_BUSY", "ERR_NOT_ENOUGH_RESOURCES", "ERR_NAME_EXISTS"],
    maxGuides: 3,
    maxHubs: 1,
    maxErrors: 3,
  },
  "/tools/market-terminal-cost-calculator": {
    hubSlugs: ["market", "structure-terminal"],
    entryIds: ["market-deal", "market-create-order", "terminal-send"],
    errorNames: ["ERR_NOT_ENOUGH_RESOURCES", "ERR_INVALID_ARGS", "ERR_TIRED"],
    maxGuides: 3,
    maxHubs: 2,
    maxErrors: 3,
  },
  "/tools/lab-reaction-boost-planner": {
    hubSlugs: ["structure-lab"],
    entryIds: ["lab-run-reaction", "lab-boost-creep"],
    errorNames: ["ERR_TIRED", "ERR_NOT_IN_RANGE", "ERR_NOT_ENOUGH_RESOURCES", "ERR_FULL"],
    maxGuides: 3,
    maxHubs: 1,
    maxErrors: 4,
  },
  "/tools/tower-damage-heal-repair-calculator": {
    hubSlugs: ["structure-tower"],
    entryIds: ["tower-attack-heal-repair"],
    errorNames: ["ERR_NOT_ENOUGH_RESOURCES", "ERR_INVALID_TARGET", "ERR_NOT_OWNER"],
    extraGuideHrefs: [
      "/blog/screeps-tower-auto-attack-hostiles",
      "/blog/screeps-tower-repair-threshold",
      "/blog/screeps-tower-heal-creeps",
    ],
    maxGuides: 4,
    maxHubs: 1,
    maxErrors: 3,
  },
};

function appendUnique(
  target: ToolKnowledgeRelationLink[],
  item: ToolKnowledgeRelationLink | null,
) {
  if (!item || target.some((current) => current.href === item.href)) return;
  target.push(item);
}

function getCanonicalToolHref(toolHref: string, locale: ToolKnowledgeRelationsLocale): string {
  return locale === "en" ? toolHref.replace(/^\/en/, "") : toolHref;
}

function getFallbackProfile(toolHref: string, locale: ToolKnowledgeRelationsLocale): ToolKnowledgeRelationProfile | null {
  const matchingHubs = screepsApiHubs.filter((hub) =>
    hub.tools.some((tool) => (locale === "zh" ? tool.zhHref : tool.enHref) === toolHref),
  );
  const primaryHub = matchingHubs[0];
  if (!primaryHub) return null;

  return {
    hubSlugs: [primaryHub.slug],
    entryIds: primaryHub.entryIds.slice(0, 3),
    errorNames: primaryHub.errorNames.slice(0, 3),
    maxGuides: 3,
    maxHubs: 1,
    maxErrors: 3,
  };
}

export function getToolKnowledgeRelationIndex(
  locale: ToolKnowledgeRelationsLocale,
): ToolKnowledgeRelationRecord[] {
  const postsByHref = new Map(
    getAllPosts().map((post) => [
      `/blog/${post.slug}`,
      { href: `/blog/${post.slug}`, label: post.title },
    ]),
  );
  const englishByHref = new Map(
    englishDiscoveryArticles.map((article) => [
      article.href,
      { href: article.href, label: article.title },
    ]),
  );
  const englishByChinesePath = new Map(
    englishDiscoveryArticles.map((article) => [article.chinesePath, article]),
  );
  const apiById = new Map(screepsApiReference.map((entry) => [entry.id, entry]));
  const errorByName = new Map(screepsErrorCodes.map((error) => [error.name, error]));
  const allToolHrefs = new Set(
    screepsApiHubs.flatMap((hub) =>
      hub.tools.map((tool) => (locale === "zh" ? tool.zhHref : tool.enHref)),
    ),
  );
  const relations: ToolKnowledgeRelationRecord[] = [];

  for (const toolHref of allToolHrefs) {
    const canonicalHref = getCanonicalToolHref(toolHref, locale);
    const profile = toolRelationProfiles[canonicalHref] ?? getFallbackProfile(toolHref, locale);
    if (!profile) continue;

    const selectedHubs = profile.hubSlugs
      .map((slug) => screepsApiHubs.find((hub) => hub.slug === slug))
      .filter((hub): hub is NonNullable<typeof hub> => Boolean(hub))
      .filter((hub) =>
        hub.tools.some((tool) => (locale === "zh" ? tool.zhHref : tool.enHref) === toolHref),
      );

    const relation: ToolKnowledgeRelationRecord = {
      toolHref,
      guides: [],
      apiHubs: [],
      errors: [],
    };

    for (const hub of selectedHubs) {
      appendUnique(relation.apiHubs, {
        href: locale === "zh" ? `/screeps-api/${hub.slug}` : `/en/screeps-api/${hub.slug}`,
        label: locale === "zh" ? hub.zhTitle : hub.enTitle,
        meta: hub.objectName,
      });
    }

    for (const entryId of profile.entryIds) {
      const entry = apiById.get(entryId);
      const chineseGuideHref = entry?.guideHref;
      if (!entry || !chineseGuideHref) continue;

      if (locale === "zh") {
        const guide = postsByHref.get(chineseGuideHref);
        appendUnique(relation.guides, guide ? { ...guide, meta: entry.signature } : null);
        continue;
      }

      const englishArticle = englishByChinesePath.get(chineseGuideHref);
      const guide = englishArticle ? englishByHref.get(englishArticle.href) : null;
      appendUnique(relation.guides, guide ? { ...guide, meta: entry.signature } : null);
    }

    const allowedExtraGuideHrefs = new Set(profile.extraGuideHrefs ?? []);
    for (const hub of selectedHubs) {
      for (const extraGuide of hub.extraGuides ?? []) {
        if (!allowedExtraGuideHrefs.has(extraGuide.zhHref)) continue;
        appendUnique(relation.guides, {
          href: locale === "zh" ? extraGuide.zhHref : extraGuide.enHref,
          label: locale === "zh" ? extraGuide.zhLabel : extraGuide.enLabel,
        });
      }
    }

    for (const errorName of profile.errorNames) {
      const error = errorByName.get(errorName);
      if (!error) continue;
      appendUnique(relation.errors, {
        href: `${locale === "zh" ? "/screeps-errors" : "/en/screeps-errors"}#${error.name.toLowerCase()}`,
        label: error.name,
        meta: String(error.value),
      });
    }

    relations.push({
      ...relation,
      guides: relation.guides.slice(0, profile.maxGuides ?? 4),
      apiHubs: relation.apiHubs.slice(0, profile.maxHubs ?? 3),
      errors: relation.errors.slice(0, profile.maxErrors ?? 4),
    });
  }

  return relations;
}
