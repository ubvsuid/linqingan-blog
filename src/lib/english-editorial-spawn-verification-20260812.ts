import type { EnglishBeginnerArticle } from "./english-beginner-content";

export function applyEnglishSpawnVerification20260812(
  article: EnglishBeginnerArticle | undefined,
): EnglishBeginnerArticle | undefined {
  if (!article || article.slug !== "screeps-spawn-creep") return article;

  return {
    ...article,
    headline: "How to Make a Screeps Spawn Create a New Creep",
    verification: [
      [
        "Official documentation",
        "Checked August 12, 2026 — StructureSpawn.spawnCreep(), dryRun, documented return codes, Spawn.spawning, Creep.spawning, and CREEP_SPAWN_TIME",
      ],
      [
        "Static code review",
        "Passed — 200-Energy body cost, fixed-name beginner guard, request acceptance, and later completion boundary reviewed",
      ],
      [
        "Offline branch review",
        "Passed — request branches and documented return-code boundaries were reviewed without claiming a live shard execution",
      ],
      ["Console test pending", "Not run in this editorial pass"],
      [
        "Live spawn cycle",
        "Pending — no live Worker1 spawn cycle was observed for this revision",
      ],
      [
        "Live multi-tick verification pending",
        "No live Worker1 spawn cycle or multi-tick spawning trace was observed for this revision",
      ],
      ["Last verified", "August 12, 2026"],
    ],
  };
}
