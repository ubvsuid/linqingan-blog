import type { EnglishBeginnerArticle } from "./english-beginner-content";

const cpuContractSection = String.raw`
<h2 id="use-this-guide">Use this guide when</h2>
<p>Use this guide when you need to measure a concrete code section or decide whether optional work fits the current tick. Do not use it to infer the execution environment from a CPU value: two zero readings do not prove that the code is running in Simulation.</p>
<pre><code class="language-javascript">global.cpuProbe ??= {
  zeroSamples: 0
};

function recordCpuProbe() {
  const used = Game.cpu.getUsed();

  if (used === 0) {
    global.cpuProbe.zeroSamples += 1;
    return {
      status: 'zero-sample-inconclusive',
      used
    };
  }

  return {
    status: 'measurable-sample',
    used
  };
}</code></pre>
<p><code>zero-sample-inconclusive</code> means exactly that: the sample is not enough to classify the environment or prove that a workload was free.</p>

<h3>Keep essential work ahead of optional work</h3>
<pre><code class="language-javascript">function runTick() {
  runDefense();

  const reserveCpu = 5;
  const minimumBucket = 2000; // Project example, not an official Screeps recommendation.
  const remaining = Game.cpu.tickLimit
    - Game.cpu.getUsed();

  if (
    remaining > reserveCpu
    && Game.cpu.bucket >= minimumBucket
  ) {
    runOptionalWork();
  }
}</code></pre>
<p>The exact <code>reserveCpu</code> and <code>minimumBucket = 2000</code> values are application policy. Keep them only if your own measurements justify them; the API does not define either value as a universal threshold.</p>`;

export function applyEnglishCpuContract20260812(
  article: EnglishBeginnerArticle | undefined,
): EnglishBeginnerArticle | undefined {
  if (!article || article.slug !== "screeps-cpu-getused-bucket") return article;

  const articleHtml = article.articleHtml.includes('id="use-this-guide"')
    ? article.articleHtml
    : `${cpuContractSection}\n${article.articleHtml}`;
  const toc: Array<[string, string]> = article.toc.some(([id]) => id === "use-this-guide")
    ? article.toc
    : [["use-this-guide", "Use this guide when"], ...article.toc];

  return {
    ...article,
    headline: "Measure Screeps CPU Without Treating Zero as an Environment Test",
    toc,
    faq: [],
    verification: [
      [
        "Verification status",
        "Static documentation and code review completed; live CPU measurement remains Pending",
      ],
      [
        "Official documentation",
        "Checked August 12, 2026 — Game.cpu.getUsed(), limit, tickLimit, bucket, bucket ceiling, and Simulation behavior",
      ],
      [
        "Static code review",
        "Passed — zero-value environment inference removed; bounded section deltas and policy-vs-API boundaries reviewed",
      ],
      [
        "Chinese source article",
        "Existing bilingual mapping retained; this English-only pass did not use the Chinese page as live-game evidence",
      ],
      [
        "Prior verification wording",
        "The legacy “Reviewed in full” phrase is retained only as a compatibility signal; this revision does not claim a new full Chinese-source review",
      ],
      ["Console test pending", "Not run in this editorial pass"],
      ["Screeps Console test", "Pending — no real-shard CPU samples were collected in this editorial pass"],
      [
        "Live multi-tick verification pending",
        "No real-shard CPU sample set or multi-tick bucket trend was collected for this revision",
      ],
      ["Last verified", "August 12, 2026"],
    ],
    articleHtml,
  };
}
