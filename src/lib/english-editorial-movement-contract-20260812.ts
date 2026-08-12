import type { EnglishBeginnerArticle } from "./english-beginner-content";

const errIntentBoundary = String.raw`
<h2 id="intent-boundary">Choose another guide when</h2>
<p>If the original action is already in range but <code>moveTo()</code> returns <code>ERR_NO_PATH</code>, use the <a href="/en/blog/screeps-err-no-path">ERR_NO_PATH guide</a>. If <code>moveTo()</code> returns <code>OK</code> but the Creep position does not progress on later ticks, use the <a href="/en/blog/screeps-moveto-not-moving">accepted-movement guide</a>. Do not turn either case into another blind range retry.</p>
<pre><code class="language-javascript">const harvestResult = creep.harvest(source);

if (harvestResult === ERR_NOT_IN_RANGE) {
  const moveResult = creep.moveTo(source, {
    range: 1,
    reusePath: 5
  });

  // Keep harvestResult and moveResult separate.
}</code></pre>`;

const moveUseSection = String.raw`
<h2 id="use-this-guide">Use this guide when</h2>
<p>Use this guide only after the current movement call returns <code>OK</code> and later-tick observations show no position progress. A non-OK return belongs in the return-code branch first; a Creep already inside the requested range may correctly stay on the same tile.</p>
<pre><code class="language-javascript">function countUnchangedTicks(previous, currentKey) {
  const consecutive = previous
    && previous.tick === Game.time - 1
    && previous.position === currentKey;

  return consecutive
    ? (previous.unchangedTicks ?? 0) + 1
    : 0;
}
</code></pre>
<p><code>unchangedTicks</code> is evidence of repeated position stability, not proof of a traffic cause. Combine it with the final movement intent, requested range, fatigue, and nearby occupancy before changing path policy.</p>`;

function withEvidenceContract(
  article: EnglishBeginnerArticle,
  consoleBoundary: string,
): EnglishBeginnerArticle {
  const verification: Array<[string, string]> = [
    ...article.verification,
    [
      "Evidence level",
      "Static official-documentation review and code review; live server evidence remains Pending",
    ],
    ["Screeps Console test", `Pending — ${consoleBoundary}`],
  ];

  return {
    ...article,
    faq: [],
    verification,
  };
}

export function applyEnglishMovementContract20260812(
  article: EnglishBeginnerArticle | undefined,
): EnglishBeginnerArticle | undefined {
  if (!article) return article;

  if (article.slug === "screeps-err-not-in-range") {
    const articleHtml = article.articleHtml.includes('id="intent-boundary"')
      ? article.articleHtml
      : `${article.articleHtml}\n${errIntentBoundary}`;
    const toc: Array<[string, string]> = article.toc.some(([id]) => id === "intent-boundary")
      ? article.toc
      : [...article.toc, ["intent-boundary", "Choose another guide when"]];

    return withEvidenceContract(
      {
        ...article,
        title: "Screeps ERR_NOT_IN_RANGE: Use the Correct Action Range",
        toc,
        articleHtml,
      },
      "the action-to-movement retry sequence was not run in the Screeps Console for this revision",
    );
  }

  if (article.slug === "screeps-moveto-not-moving") {
    const articleHtml = article.articleHtml.includes('id="use-this-guide"')
      ? article.articleHtml
      : `${moveUseSection}\n${article.articleHtml}`;
    const toc: Array<[string, string]> = article.toc.some(([id]) => id === "use-this-guide")
      ? article.toc
      : [["use-this-guide", "Use this guide when"], ...article.toc];

    return withEvidenceContract(
      {
        ...article,
        title: "Screeps moveTo() Returns OK but the Creep Stays Put",
        toc,
        articleHtml,
      },
      "no live multi-tick traffic or position-stall trace was run for this revision",
    );
  }

  return article;
}
