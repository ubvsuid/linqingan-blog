import type { EnglishBeginnerArticle } from "@/lib/english-beginner-content";

const TARGET_SLUG = "screeps-roomvisual-debug";
const QUICK_ANSWER_HEADING = '<h2 id="quick-answer">Quick answer</h2>';
const NO_FILL_ANSWER = String.raw`<p><strong>Need an outline with no interior fill?</strong> For <code>circle()</code> and <code>rect()</code>, use <code>fill: 'transparent'</code>. The official API documents <code>fill</code> as a string; <code>null</code> is not the documented no-fill value.</p>`;

export function applyEnglishRoomVisualCtrBatch02A20260909(
  article: EnglishBeginnerArticle | undefined,
): EnglishBeginnerArticle | undefined {
  if (!article || article.slug !== TARGET_SLUG) return article;

  const articleHtml = article.articleHtml.includes(NO_FILL_ANSWER)
    ? article.articleHtml
    : article.articleHtml.replace(
        QUICK_ANSWER_HEADING,
        `${QUICK_ANSWER_HEADING}\n${NO_FILL_ANSWER}`,
      );

  return {
    ...article,
    title: "Screeps RoomVisual: Transparent Fills, Labels, and Paths",
    headline: "How to Draw RoomVisual Debug Shapes Without a Fill",
    description:
      "Use fill: 'transparent' for unfilled RoomVisual circles and rectangles, then add debug labels and target paths without confusing visuals with game results.",
    keywords: Array.from(new Set([
      ...article.keywords,
      "Screeps RoomVisual transparent fill",
      "Screeps RoomVisual no fill",
    ])),
    articleHtml,
  };
}
