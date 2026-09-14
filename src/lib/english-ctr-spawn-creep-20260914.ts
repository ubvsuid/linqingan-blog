import type { EnglishBeginnerArticle } from "@/lib/english-beginner-content";

const TARGET_SLUG = "screeps-spawn-creep";
const UPDATED_AT = "2026-09-14";
const LESSON_BOUNDARY = '<p><strong>Lesson boundary:</strong> this lesson creates one fixed-name Creep. Dynamic names, population targets, role Memory, replacement timing, and spawn queues belong in later guides.</p>';
const GAME_MODE_SECTION = String.raw`<h2 id="game-mode-boundary">Game mode boundary</h2>
<p>This guide covers Screeps World/MMO, where <code>StructureSpawn.spawnCreep(body, name, opts)</code> is the relevant contract. Screeps Arena uses a different <code>spawnCreep(body)</code> contract. If you are playing Arena, use the dedicated <a href="/en/blog/screeps-arena-spawn-creep">Screeps Arena spawnCreep guide</a>.</p>`;

function insertGameModeToc(
  toc: EnglishBeginnerArticle["toc"],
): EnglishBeginnerArticle["toc"] {
  if (toc.some(([id]) => id === "game-mode-boundary")) return toc;

  const index = toc.findIndex(([id]) => id === "lesson-goal");
  const entry: [string, string] = ["game-mode-boundary", "Game mode boundary"];

  return index < 0
    ? [...toc, entry]
    : [...toc.slice(0, index + 1), entry, ...toc.slice(index + 1)];
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
  if (!article.articleHtml.includes(LESSON_BOUNDARY)) return article;

  return {
    ...article,
    toc: insertGameModeToc(article.toc),
    articleHtml: article.articleHtml.replace(
      LESSON_BOUNDARY,
      `${LESSON_BOUNDARY}\n\n${GAME_MODE_SECTION}`,
    ),
  };
}

export function getEnglishSpawnCreepCtrUpdatedAt20260914(
  slug: string,
): string | undefined {
  return slug === TARGET_SLUG ? UPDATED_AT : undefined;
}
