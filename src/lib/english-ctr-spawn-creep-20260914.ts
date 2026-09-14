import type { EnglishBeginnerArticle } from "@/lib/english-beginner-content";

const TARGET_SLUG = "screeps-spawn-creep";
const UPDATED_AT = "2026-09-14";
const BEFORE_YOU_START_HEADING = /<h2 id="[^"]+">Before you start<\/h2>/;
const GAME_MODE_SECTION = String.raw`<h2 id="game-mode-boundary">Game mode boundary</h2>
<p>This guide covers Screeps World/MMO, where <code>StructureSpawn.spawnCreep(body, name, opts)</code> is the relevant contract. Screeps Arena uses a different <code>spawnCreep(body)</code> contract. If you are playing Arena, use the dedicated <a href="/en/blog/screeps-arena-spawn-creep">Screeps Arena spawnCreep guide</a>.</p>`;

function insertGameModeToc(
  toc: EnglishBeginnerArticle["toc"],
): EnglishBeginnerArticle["toc"] {
  if (toc.some(([id]) => id === "game-mode-boundary")) return toc;

  const afterGoalIndex = toc.findIndex(
    ([, label]) => label === "What you will build",
  );
  const beforeStartIndex = toc.findIndex(
    ([id, label]) => id === "before-you-start" || label === "Before you start",
  );
  const insertionIndex = afterGoalIndex >= 0
    ? afterGoalIndex + 1
    : beforeStartIndex >= 0
      ? beforeStartIndex
      : toc.length;
  const entry: [string, string] = ["game-mode-boundary", "Game mode boundary"];

  return [
    ...toc.slice(0, insertionIndex),
    entry,
    ...toc.slice(insertionIndex),
  ];
}

export function applyEnglishSpawnCreepCtr20260914(
  article: EnglishBeginnerArticle | undefined,
): EnglishBeginnerArticle | undefined {
  if (!article || article.slug !== TARGET_SLUG) return article;
  if (article.articleHtml.includes('id="game-mode-boundary"')) {
    return {
      ...article,
      toc: insertGameModeToc(article.toc),
    };
  }

  const headingMatch = article.articleHtml.match(BEFORE_YOU_START_HEADING);
  if (!headingMatch) return article;

  return {
    ...article,
    toc: insertGameModeToc(article.toc),
    articleHtml: article.articleHtml.replace(
      headingMatch[0],
      `${GAME_MODE_SECTION}\n\n${headingMatch[0]}`,
    ),
  };
}

export function getEnglishSpawnCreepCtrUpdatedAt20260914(
  slug: string,
): string | undefined {
  return slug === TARGET_SLUG ? UPDATED_AT : undefined;
}
