import type { EnglishBeginnerArticle } from "@/lib/english-beginner-content";

const TARGET_SLUG = "screeps-creep-roles";
const UPDATED_AT = "2026-09-17";
const REVIEWED_AT = "September 17, 2026";
const ADVANCED_START = '<h2 id="role-contract">';
const ADVANCED_END = '<h2 id="completion-check">';

const REMOVED_VERIFICATION_TERMS = new Set([
  "Official documentation",
  "Role terminology",
  "Static code review",
  "Evidence level",
  "Screeps Console test",
  "Live multi-tick verification pending",
  "Last editorial review",
  "Publication status",
]);

function removeAdvancedRoleArchitecture(html: string): string {
  const start = html.indexOf(ADVANCED_START);
  if (start < 0) return html;

  const end = html.indexOf(ADVANCED_END, start);
  if (end < 0) {
    throw new Error(
      "Creep roles current layer found role-contract without completion-check boundary.",
    );
  }

  return `${html.slice(0, start).trimEnd()}\n\n${html.slice(end)}`;
}

function refreshVerification(
  verification: EnglishBeginnerArticle["verification"],
): EnglishBeginnerArticle["verification"] {
  return [
    ...verification.filter(([term]) => !REMOVED_VERIFICATION_TERMS.has(term)),
    [
      "Official documentation",
      "Checked September 17, 2026 — configurable Creep bodies, Game.creeps name keys, Creep Memory, modules, and repeated game-loop execution",
    ],
    [
      "Role terminology",
      "Harvester, Upgrader, and Builder are player-defined responsibilities; fixed names are teaching labels, not engine classes",
    ],
    [
      "Static code review",
      "Passed — the read-only Game.creeps inspection does not mutate game state or claim that a role label creates behavior",
    ],
    [
      "Evidence level",
      "Current official-documentation review plus static content/code review; no real-shard execution is claimed",
    ],
    [
      "Screeps Console test",
      "Pending — no live Console transcript was collected for this revision",
    ],
    [
      "Live multi-tick verification pending",
      "No live fixed-name Harvester, Upgrader, Builder, or later-tick role-behavior trace was collected for this revision",
    ],
    ["Last editorial review", REVIEWED_AT],
  ];
}

export function applyEnglishCreepRolesCurrent20260917(
  article: EnglishBeginnerArticle | undefined,
): EnglishBeginnerArticle | undefined {
  if (!article || article.slug !== TARGET_SLUG) return article;

  return {
    ...article,
    description:
      "Learn why Harvester, Upgrader, and Builder are player-defined responsibilities, how roles differ from body parts, and why a Creep name does not create behavior.",
    searchIntent:
      "Beginner concept lesson explaining player-defined Creep responsibilities, fixed-name teaching roles, and the difference between body ability, role, and current action",
    toc: article.toc.filter(
      ([id]) => id !== "role-contract" && id !== "role-capability-boundary",
    ),
    verification: refreshVerification(article.verification),
    articleHtml: removeAdvancedRoleArchitecture(article.articleHtml),
  };
}

export function getEnglishCreepRolesCurrentUpdatedAt20260917(
  slug: string,
): string | undefined {
  return slug === TARGET_SLUG ? UPDATED_AT : undefined;
}
