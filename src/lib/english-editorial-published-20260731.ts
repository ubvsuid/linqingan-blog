import type { EnglishBeginnerArticle } from "./english-beginner-content";
import { englishEditorialCorePublished20260731 } from "./english-editorial-core-published-20260731";
import { englishEditorialFirstLoopStateNotifyOverrides20260731 } from "./english-editorial-first-loop-state-notify-overrides-20260731";
import { englishEditorialOverrides20260731 } from "./english-editorial-overrides-20260731";
import { englishEditorialRuntimeOverrides20260731 } from "./english-editorial-runtime-overrides-20260731";
import { englishEditorialSpawnRouteMemoryOverrides20260731 } from "./english-editorial-spawn-route-memory-overrides-20260731";
import { englishEditorialTargetsVisualModulesOverrides20260731 } from "./english-editorial-targets-visual-modules-overrides-20260731";

function insertBeforeOfficialDocs(
  articleHtml: string,
  sectionHtml: string,
): string {
  const marker = '<h2 id="official-docs">';
  return articleHtml.includes(marker)
    ? articleHtml.replace(marker, `${sectionHtml}\n${marker}`)
    : `${articleHtml}\n${sectionHtml}`;
}

function insertTocBeforeOfficialDocs(
  toc: Array<[string, string]>,
  item: [string, string],
): Array<[string, string]> {
  if (toc.some(([id]) => id === item[0])) return toc;

  const officialDocsIndex = toc.findIndex(([id]) => id === "official-docs");
  if (officialDocsIndex < 0) return [...toc, item];

  return [
    ...toc.slice(0, officialDocsIndex),
    item,
    ...toc.slice(officialDocsIndex),
  ];
}

function ensureVerificationBoundary(
  verification: Array<[string, string]>,
): Array<[string, string]> {
  const next = [...verification];

  if (!next.some(([label]) => label === "Screeps Console test")) {
    next.push(["Screeps Console test", "Pending"]);
  }

  const liveIndex = next.findIndex(([label]) =>
    /multi[- ]tick/i.test(label),
  );

  if (liveIndex >= 0) {
    next[liveIndex] = ["Live multi-tick verification", "Pending"];
  } else {
    next.push(["Live multi-tick verification", "Pending"]);
  }

  return next;
}

function normalizeEditorialArticle(
  article: EnglishBeginnerArticle,
): EnglishBeginnerArticle {
  let articleHtml = article.articleHtml;
  let toc = article.toc;

  if (article.slug === "screeps-err-not-in-range") {
    articleHtml = insertBeforeOfficialDocs(
      articleHtml,
      String.raw`<h2 id="intent-boundary">Choose another guide when</h2>
<p>Use <a href="/en/blog/screeps-moveto-not-moving">the accepted-movement diagnostic</a> when <code>moveTo()</code> returns <code>OK</code> but the Creep remains on the same position across later ticks. Use <a href="/en/blog/screeps-err-no-path">the path-search diagnostic</a> when the movement call itself returns <code>ERR_NO_PATH</code>. Those are movement problems; <code>ERR_NOT_IN_RANGE</code> belongs to the work action that was attempted too far from its target.</p>`,
    );
    toc = insertTocBeforeOfficialDocs(toc, [
      "intent-boundary",
      "Choose another guide when",
    ]);
  }

  if (article.slug === "screeps-err-no-path") {
    articleHtml = insertBeforeOfficialDocs(
      articleHtml,
      String.raw`<h2 id="tick-boundary">Current tick and later ticks</h2>
<p><code>moveTo()</code>, <code>PathFinder.search()</code>, and <code>Game.map.findRoute()</code> report the result of the search performed in the current tick. A successful recovery changes the order you can submit now; it does not prove that the Creep changed position in the same script execution. After correcting the goal, matrix, callback, or search limit, record the new return value and compare <code>roomName:x:y</code> on later ticks. Keep live multi-tick verification pending until those observations exist.</p>`,
    );
    toc = insertTocBeforeOfficialDocs(toc, [
      "tick-boundary",
      "Current tick and later ticks",
    ]);
  }

  return {
    ...article,
    verification: ensureVerificationBoundary(article.verification),
    toc,
    articleHtml,
  };
}

const movementEditorialArticles = Object.fromEntries(
  Object.entries(englishEditorialOverrides20260731).map(([slug, article]) => [
    slug,
    normalizeEditorialArticle(article),
  ]),
) as Record<string, EnglishBeginnerArticle>;

const firstLoopStateNotifyEditorialArticles = Object.fromEntries(
  Object.entries(
    englishEditorialFirstLoopStateNotifyOverrides20260731,
  ).map(([slug, article]) => {
    if (slug !== "screeps-first-room-code") {
      return [slug, article];
    }

    return [
      slug,
      {
        ...article,
        verification: [
          ...article.verification,
          ["Offline branch review", "Passed"] as [string, string],
          ["Live room test", "Pending"] as [string, string],
        ],
        articleHtml: article.articleHtml.replace(
          "Use this page after the individual beginner lessons already work",
          "The earlier question, How to Combine Your First Screeps Room Loop, becomes useful only after the individual beginner lessons already work. Use this page",
        ),
      },
    ];
  }),
) as Record<string, EnglishBeginnerArticle>;

export const englishEditorialPublished20260731: Record<
  string,
  EnglishBeginnerArticle
> = {
  ...movementEditorialArticles,
  ...englishEditorialCorePublished20260731,
  ...englishEditorialRuntimeOverrides20260731,
  ...englishEditorialSpawnRouteMemoryOverrides20260731,
  ...englishEditorialTargetsVisualModulesOverrides20260731,
  ...firstLoopStateNotifyEditorialArticles,
};

export function getEnglishEditorialPublished20260731(
  slug: string,
): EnglishBeginnerArticle | undefined {
  return englishEditorialPublished20260731[slug];
}
