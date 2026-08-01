import type { EnglishBeginnerArticle } from "./english-beginner-content";
import { englishEditorialTowerAttackEventArticle20260801 } from "./english-editorial-tower-attack-event-20260801";
import { englishEditorialTowerHealEventArticle20260801 } from "./english-editorial-tower-heal-event-20260801";
import { englishEditorialTowerRepairEventArticle20260801 } from "./english-editorial-tower-repair-event-20260801";

export const englishEditorialTowerEventsOverrides20260801: Record<
  string,
  EnglishBeginnerArticle
> = Object.fromEntries(
  [
    englishEditorialTowerAttackEventArticle20260801,
    englishEditorialTowerHealEventArticle20260801,
    englishEditorialTowerRepairEventArticle20260801,
  ].map((article) => [article.slug, article]),
);
