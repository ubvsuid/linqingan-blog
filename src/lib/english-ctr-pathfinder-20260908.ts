import type { EnglishBeginnerArticle } from "@/lib/english-beginner-content";

const TARGET_SLUG = "screeps-pathfinder-costmatrix";

function replaceQuickAnswer(articleHtml: string): string {
  const heading = `<h2 id="quick-answer">Quick answer</h2>`;
  const headingIndex = articleHtml.indexOf(heading);

  if (headingIndex < 0) {
    throw new Error("PathFinder CTR Batch 01A could not find the Quick answer heading");
  }

  const contentStart = headingIndex + heading.length;
  const nextHeadingIndex = articleHtml.indexOf("<h2 ", contentStart);

  if (nextHeadingIndex < 0) {
    throw new Error("PathFinder CTR Batch 01A could not find the section after Quick answer");
  }

  const replacement = String.raw`${heading}
<p>In Screeps PathFinder, setting a <code>CostMatrix</code> tile to <code>255</code> makes it unwalkable. Leave a tile at <code>0</code> to use its terrain cost, and use <code>1</code> through <code>254</code> for a finite custom movement cost. Use <code>255</code> only for a real hard block; use a lower value when the tile should remain possible but less desirable.</p>
<p>This is PathFinder behavior, not a project-specific convention. The rest of this guide shows how that rule interacts with Roads, structures, Creep traffic, <code>roomCallback</code>, and incomplete searches.</p>`;

  return `${articleHtml.slice(0, headingIndex)}${replacement}\n\n${articleHtml.slice(nextHeadingIndex)}`;
}

export function applyEnglishPathfinderCtrBatch01A20260908(
  article: EnglishBeginnerArticle | undefined,
): EnglishBeginnerArticle | undefined {
  if (!article || article.slug !== TARGET_SLUG) return article;

  return {
    ...article,
    title: "Screeps CostMatrix 255: Why It Means Unwalkable",
    headline: "What CostMatrix 255 Means in Screeps PathFinder",
    description:
      "In Screeps PathFinder, a CostMatrix cost of 255 is unwalkable. See what 0, 1–254, and 255 mean, plus practical road, obstacle, and roomCallback rules.",
    articleHtml: replaceQuickAnswer(article.articleHtml),
  };
}
