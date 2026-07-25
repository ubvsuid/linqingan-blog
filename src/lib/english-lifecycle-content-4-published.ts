import type { EnglishBeginnerArticle } from "@/lib/english-beginner-content";
import { englishLifecycleBatchFourArticles as sourceArticles } from "@/lib/english-lifecycle-content-4";

const pureDestructureBefore = `    renewThreshold,\n    targetTtl,\n    hasClaimPart,`;
const pureDestructureAfter = `    renewThreshold,\n    targetTtl,\n    renewMissionActive,\n    hasClaimPart,`;

const pureOrderBefore = `  if (ticksToLive > renewThreshold) {\n    return {\n      ready: false,\n      action: 'work',\n      reason: 'ttl-sufficient'\n    };\n  }\n\n  if (ticksToLive >= targetTtl) {\n    return {\n      ready: false,\n      action: 'work',\n      reason: 'target-ttl-reached'\n    };\n  }`;
const pureOrderAfter = `  if (ticksToLive >= targetTtl) {\n    return {\n      ready: false,\n      action: 'work',\n      reason: 'target-ttl-reached'\n    };\n  }\n\n  if (\n    renewMissionActive !== true\n    && ticksToLive > renewThreshold\n  ) {\n    return {\n      ready: false,\n      action: 'work',\n      reason: 'ttl-sufficient'\n    };\n  }`;

const runtimeOrderBefore = `  if (creep.ticksToLive > renewThreshold) {\n    return {\n      status: 'ttl-sufficient',\n      ticksToLive: creep.ticksToLive\n    };\n  }\n\n  if (creep.ticksToLive >= targetTtl) {\n    return {\n      status: 'target-ttl-reached',\n      ticksToLive: creep.ticksToLive\n    };\n  }`;
const runtimeOrderAfter = `  if (creep.ticksToLive >= targetTtl) {\n    creep.memory.renewing = false;\n\n    return {\n      status: 'target-ttl-reached',\n      ticksToLive: creep.ticksToLive\n    };\n  }\n\n  if (\n    creep.memory.renewing !== true\n    && creep.ticksToLive > renewThreshold\n  ) {\n    return {\n      status: 'ttl-sufficient',\n      ticksToLive: creep.ticksToLive\n    };\n  }\n\n  if (creep.ticksToLive <= renewThreshold) {\n    creep.memory.renewing = true;\n  }`;

const stateImpactBefore = `<p><strong>State impact:</strong> this script may move <code>Worker1</code> toward <code>Spawn1</code> and may submit repeated renewal actions until the configured target TTL is reached. A successful renewal consumes Spawn Energy, occupies the Spawn action, increases TTL after tick processing, and removes all Boosts.</p>`;
const stateImpactAfter = `<p><strong>State impact:</strong> this script writes <code>creep.memory.renewing</code>, may move <code>Worker1</code> toward <code>Spawn1</code>, and may submit repeated renewal actions until the configured target TTL is reached. A successful renewal consumes Spawn Energy, occupies the Spawn action, increases TTL after tick processing, and removes all Boosts.</p>`;

const correctionParagraph = `<p><strong>Source correction:</strong> a renewal mission must remember that it has started. Checking only whether the current TTL is above the start threshold would stop the mission immediately after the first successful step. The published code uses <code>creep.memory.renewing</code> so the Creep continues until <code>targetTtl</code>, then clears the flag.</p>`;

export const englishLifecycleBatchFourArticles = sourceArticles.map((article) => {
  if (article.slug !== "screeps-renew-creep") {
    return article;
  }

  return {
    ...article,
    verification: [
      ...article.verification.slice(0, 4),
      [
        "Source correction",
        "Persistent renewing state keeps the mission active until targetTtl",
      ],
      ...article.verification.slice(4),
    ] as EnglishBeginnerArticle["verification"],
    articleHtml: article.articleHtml
      .replace(pureDestructureBefore, pureDestructureAfter)
      .replace(pureOrderBefore, pureOrderAfter)
      .replace(runtimeOrderBefore, runtimeOrderAfter)
      .replace(stateImpactBefore, stateImpactAfter)
      .replace(
        `<h2 id="spawn-contention">Renewal competes with spawning</h2>`,
        `${correctionParagraph}\n\n<h2 id="spawn-contention">Renewal competes with spawning</h2>`,
      ),
  };
}) satisfies EnglishBeginnerArticle[];

export const englishLifecycleBatchFourBySlug = Object.fromEntries(
  englishLifecycleBatchFourArticles.map((article) => [article.slug, article]),
) as Record<string, EnglishBeginnerArticle>;

export function getEnglishLifecycleBatchFourArticle(
  slug: string,
): EnglishBeginnerArticle | undefined {
  return englishLifecycleBatchFourBySlug[slug];
}
