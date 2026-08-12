import type { EnglishBeginnerArticle } from "./english-beginner-content";

const STALE_WEIGHT_EXAMPLE = String.raw`<p>That means this tempting implementation is wrong:</p>
<pre><code class="language-javascript">// Wrong for movement weight.
const ordinaryWeight = creep.body.filter(
  part =>
    part.hits > 0
    && part.type !== MOVE
    && part.type !== CARRY
).length;</code></pre>`;

const SAFE_WEIGHT_WARNING = String.raw`<p>Do not filter ordinary movement-weight parts by <code>part.hits &gt; 0</code>. That would incorrectly make destroyed WORK, ATTACK, RANGED_ATTACK, HEAL, CLAIM, or TOUGH entries disappear from this weight calculation.</p>`;

export function applyEnglishEditorialSecondContract20260812(
  article: EnglishBeginnerArticle | undefined,
): EnglishBeginnerArticle | undefined {
  if (!article || article.slug !== "screeps-move-fatigue-body-ratio") {
    return article;
  }

  if (!article.articleHtml.includes(STALE_WEIGHT_EXAMPLE)) {
    throw new Error(
      "Second editorial movement contract could not find the stale copyable weight example.",
    );
  }

  return {
    ...article,
    articleHtml: article.articleHtml.replace(
      STALE_WEIGHT_EXAMPLE,
      SAFE_WEIGHT_WARNING,
    ),
  };
}
