import type { EnglishBeginnerArticle } from "@/lib/english-beginner-content";
import { applyEnglishDeadCreepMemoryCtr20260911 } from "@/lib/english-ctr-dead-creep-memory-20260911";
import { applyEnglishPickupDroppedEnergyCtr20260911 } from "@/lib/english-ctr-pickup-dropped-energy-20260911";
import { applyEnglishRoomVisibilityCtr20260911 } from "@/lib/english-ctr-room-visibility-20260911";
import { applyEnglishTickGameLoopCtr20260911 } from "@/lib/english-ctr-tick-game-loop-20260911";

const TARGET_SLUG = "screeps-renew-creep";
const UPDATED_AT = "2026-09-10";
const FIRST_SECTION_HEADING = '<h2 id="evidence-contract">Start with the missing event</h2>';
const FIRST_SCREEN_ANSWER = String.raw`<p><strong>Quick answer:</strong> Use <code>spawn.renewCreep(creep)</code> when the owned Creep is adjacent to the owned Spawn, the Spawn is active and not already spawning, the Creep has no <code>CLAIM</code> body part, the Spawn has enough Energy, and the Creep lifetime is not already full. A successful renewal removes every Boost from the target.</p>
<p><strong>TTL and Energy:</strong> One scheduled renewal adds <code>floor(600 / bodySize)</code> ticks and costs <code>ceil(creepCost / 2.5 / bodySize)</code> Energy. Preserve the actual return code: common documented results include <code>OK</code>, <code>ERR_BUSY</code>, <code>ERR_NOT_ENOUGH_ENERGY</code>, <code>ERR_INVALID_TARGET</code>, <code>ERR_FULL</code>, <code>ERR_NOT_IN_RANGE</code>, <code>ERR_NOT_OWNER</code>, and <code>ERR_RCL_NOT_ENOUGH</code>.</p>
<p><strong>Verify afterward:</strong> <code>OK</code> means the renewal was scheduled successfully; it is not next-tick state proof. Keep the exact Spawn and Creep identities, then verify the expected TTL change after the tick is processed. The deeper sections below show how to keep Spawn contention, Energy transfers, and Boost removal visible instead of hiding them.</p>`;

function refreshLastVerified(
  verification: EnglishBeginnerArticle["verification"],
): EnglishBeginnerArticle["verification"] {
  return verification.map(([label, value]) =>
    label === "Last verified"
      ? [label, "September 10, 2026"]
      : [label, value],
  ) as EnglishBeginnerArticle["verification"];
}

function applyRenewCreepCtr20260910(
  article: EnglishBeginnerArticle | undefined,
): EnglishBeginnerArticle | undefined {
  if (!article || article.slug !== TARGET_SLUG) return article;

  const articleHtml = article.articleHtml.includes(FIRST_SCREEN_ANSWER)
    ? article.articleHtml
    : article.articleHtml.includes(FIRST_SECTION_HEADING)
      ? article.articleHtml.replace(
          FIRST_SECTION_HEADING,
          `${FIRST_SCREEN_ANSWER}\n${FIRST_SECTION_HEADING}`,
        )
      : `${FIRST_SCREEN_ANSWER}\n${article.articleHtml}`;

  return {
    ...article,
    title: "Screeps renewCreep(): Requirements, Cost, and Return Codes",
    headline: "How to Use StructureSpawn.renewCreep() in Screeps",
    description:
      "Learn StructureSpawn.renewCreep() requirements, TTL and Energy formulas, Boost and CLAIM limits, return codes, and how to verify renewal on the next tick.",
    primaryKeyword: "Screeps renewCreep",
    searchIntent:
      "API guide for using StructureSpawn.renewCreep(), understanding eligibility, TTL and Energy formulas, return codes, and later-tick verification",
    keywords: Array.from(new Set([
      ...article.keywords,
      "Screeps renewCreep",
      "StructureSpawn renewCreep",
      "Screeps renewCreep return codes",
    ])),
    verification: refreshLastVerified(article.verification),
    articleHtml,
  };
}

export function applyEnglishRenewCreepCtr20260910(
  article: EnglishBeginnerArticle | undefined,
): EnglishBeginnerArticle | undefined {
  return applyEnglishTickGameLoopCtr20260911(
    applyEnglishPickupDroppedEnergyCtr20260911(
      applyEnglishRoomVisibilityCtr20260911(
        applyEnglishDeadCreepMemoryCtr20260911(
          applyRenewCreepCtr20260910(article),
        ),
      ),
    ),
  );
}

export function getEnglishRenewCreepCtrUpdatedAt20260910(
  slug: string,
): string | undefined {
  return slug === TARGET_SLUG ? UPDATED_AT : undefined;
}
