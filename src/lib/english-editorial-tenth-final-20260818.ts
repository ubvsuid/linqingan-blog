import type { EnglishBeginnerArticle } from "@/lib/english-beginner-content";
import { applyEnglishEditorialEleventhCleanup20260818 } from "@/lib/english-editorial-eleventh-cleanup-20260818";
import { applyEnglishEditorialEleventh20260818 } from "@/lib/english-editorial-eleventh-20260818";

function replaceRequired(
  html: string,
  search: string,
  replacement: string,
  label: string,
): string {
  if (!html.includes(search)) {
    throw new Error(`Tenth English editorial finalizer could not find ${label}`);
  }
  return html.replace(search, replacement);
}

export function applyEnglishEditorialTenthFinal20260818(
  article: EnglishBeginnerArticle | undefined,
): EnglishBeginnerArticle | undefined {
  if (!article) return article;

  let finalizedArticle = article;

  if (article.slug === "screeps-controller-downgrade") {
    const articleHtml = replaceRequired(
      article.articleHtml,
      `<tr><td><code>ERR_ACCESS_DENIED</code></td><td>The Controller is owned or reserved by another player and this Creep cannot perform the attempted Controller upgrade/attack action.</td><td>Inspect Controller ownership/reservation before retrying.</td></tr>`,
      `<tr><td><code>ERR_ACCESS_DENIED</code></td><td>You do not have access to the restricted shard where the action is being attempted.</td><td>Check restricted-shard access; do not diagnose this code as Controller ownership or reservation failure.</td></tr>`,
      "ERR_ACCESS_DENIED meaning",
    );

    const verification = article.verification.map(([term, value]) => {
      if (term === "Official documentation") {
        return [
          term,
          "Checked August 18, 2026 — StructureController.ticksToDowngrade, upgradeBlocked, Creep.upgradeController() range and current return codes including restricted-shard ERR_ACCESS_DENIED, and Room.getEventLog()",
        ] as [string, string];
      }

      if (term === "Live multi-tick verification pending") {
        return [
          term,
          "No live emergency-entry, accepted upgrade, next-tick event, threshold exit, ownership failure, blocked-upgrade failure, or restricted-shard access trace was collected for this revision",
        ] as [string, string];
      }

      return [term, value] as [string, string];
    });

    finalizedArticle = {
      ...article,
      verification,
      articleHtml,
    };
  }

  const eleventhArticle = applyEnglishEditorialEleventh20260818(finalizedArticle);
  return applyEnglishEditorialEleventhCleanup20260818(eleventhArticle);
}
