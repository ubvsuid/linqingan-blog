import type { EnglishBeginnerArticle } from "@/lib/english-beginner-content";

const TARGET_SLUG = "screeps-lab-boost-creep";
const UPDATED_AT = "2026-09-09";
const USE_THIS_GUIDE_HEADING = '<h2 id="use-this-guide">Use this guide when</h2>';
const FIRST_SCREEN_ANSWER = String.raw`<p><strong>Quick answer:</strong> Use <code>lab.boostCreep(creep, bodyPartsCount)</code> when the target Creep is adjacent to the owned Lab, the Lab mineral can boost eligible parts on that Creep, and the Lab has enough mineral and Energy. Omit <code>bodyPartsCount</code> to boost all eligible parts; provide it to limit how many matching parts are boosted.</p>
<p><strong>Return codes:</strong> <code>OK</code> means the operation was scheduled successfully. <code>ERR_NOT_FOUND</code> means the Lab mineral cannot boost any matching Creep body part; <code>ERR_NOT_ENOUGH_RESOURCES</code> means mineral or Energy is short; <code>ERR_INVALID_TARGET</code> means the target is not a valid Creep; <code>ERR_NOT_IN_RANGE</code> means it is too far away. Ownership and RCL failures return <code>ERR_NOT_OWNER</code> and <code>ERR_RCL_NOT_ENOUGH</code>.</p>
<p><strong>Verify afterward:</strong> Do not turn <code>OK</code> into a body-change claim. Preserve the exact Creep ID and expected body-part indexes, then compare the resulting <code>part.boost</code> values and Lab Store deltas after the tick is processed.</p>`;

export function applyEnglishLabBoostCtrBatch03A20260909(
  article: EnglishBeginnerArticle | undefined,
): EnglishBeginnerArticle | undefined {
  if (!article || article.slug !== TARGET_SLUG) return article;

  const articleHtml = article.articleHtml.includes(FIRST_SCREEN_ANSWER)
    ? article.articleHtml
    : article.articleHtml.includes(USE_THIS_GUIDE_HEADING)
      ? article.articleHtml.replace(
          USE_THIS_GUIDE_HEADING,
          `${FIRST_SCREEN_ANSWER}\n${USE_THIS_GUIDE_HEADING}`,
        )
      : `${FIRST_SCREEN_ANSWER}\n${article.articleHtml}`;

  return {
    ...article,
    title: "Screeps Lab boostCreep(): Requirements, Usage, and Return Codes",
    headline: "How to Use StructureLab.boostCreep() in Screeps",
    description:
      "Learn StructureLab.boostCreep() requirements, bodyPartsCount usage, return codes, current-tick scheduling, and how to verify exact boosted body parts afterward.",
    keywords: Array.from(new Set([
      ...article.keywords,
      "Screeps Lab boostCreep",
      "Screeps boostCreep requirements",
      "Screeps boostCreep return codes",
    ])),
    articleHtml,
  };
}

export function getEnglishLabBoostCtrUpdatedAt20260909(
  slug: string,
): string | undefined {
  return slug === TARGET_SLUG ? UPDATED_AT : undefined;
}
