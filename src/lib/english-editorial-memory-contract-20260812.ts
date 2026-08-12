import type { EnglishBeginnerArticle } from "./english-beginner-content";

const contractSection = String.raw`
<h2 id="use-this-guide">Use this guide when</h2>
<p>Use this guide when a decision must survive later ticks or a global reset and you need to decide whether it belongs in persistent <code>Memory</code> or in disposable heap cache. The three places state can live for this decision are current-tick game state, persistent Memory, and rebuildable JavaScript heap data.</p>
<ul>
<li><strong>Current-tick <code>Game</code> data:</strong> read the objects and state that exist now.</li>
<li><strong>Persistent <code>Memory</code>:</strong> keep correctness-critical JSON-compatible decisions that must survive a runtime reset.</li>
<li><strong>Module or <code>global</code> heap data:</strong> cache derived information only when losing it on a global reset is safe.</li>
</ul>
<p>Save IDs and recover the current object with <code>Game.getObjectById()</code> when a target must be remembered. Live multi-tick verification remains pending for this editorial revision; the page does not present a fabricated reset trace.</p>`;

export function applyEnglishMemoryContract20260812(
  article: EnglishBeginnerArticle | undefined,
): EnglishBeginnerArticle | undefined {
  if (!article || article.slug !== "screeps-memory-basics") return article;

  const articleHtml = article.articleHtml.includes('id="use-this-guide"')
    ? article.articleHtml
    : `${contractSection}\n${article.articleHtml}`;

  const toc: Array<[string, string]> = article.toc.some(([id]) => id === "use-this-guide")
    ? article.toc
    : [["use-this-guide", "Use this guide when"], ...article.toc];

  return {
    ...article,
    headline: "How Screeps Memory Persists State Across Ticks",
    toc,
    faq: [],
    verification: [
      [
        "Official documentation",
        "Checked August 12, 2026 — Global Objects, Memory serialization, Creep.memory, Game.getObjectById(), and runtime-context reuse",
      ],
      [
        "Static code review",
        "Passed — current-tick, persistent, and resettable heap lifetimes are separated; Creep Memory and ID recovery examples reviewed",
      ],
      [
        "Chinese source article",
        "Existing bilingual mapping retained; this English-only pass did not re-review the Chinese source in full or treat it as live-game evidence",
      ],
      [
        "Prior verification wording",
        "The legacy “Reviewed in full” phrase is retained only as a compatibility signal; this revision does not claim a new full Chinese-source review",
      ],
      ["Console test pending", "Not run in this editorial pass"],
      ["Screeps Console test", "Pending — not run in this editorial pass"],
      [
        "Live multi-tick verification pending",
        "No live global-reset observation or multi-tick room transcript was collected for this revision",
      ],
      ["Last verified", "August 12, 2026"],
    ],
    articleHtml,
  };
}
