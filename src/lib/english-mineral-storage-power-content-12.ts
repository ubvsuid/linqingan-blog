import type { EnglishBeginnerArticle } from "@/lib/english-beginner-content";
import { englishMineralExtractorArticle } from "@/lib/english-mineral-extractor-12";
import { englishStorageEnergyArticle } from "@/lib/english-storage-energy-12";
import { englishPowerSpawnArticle } from "@/lib/english-power-spawn-12";

export const englishMineralStoragePowerBatchTwelveArticles = [
  englishMineralExtractorArticle,
  englishStorageEnergyArticle,
  englishPowerSpawnArticle,
] satisfies EnglishBeginnerArticle[];

export const englishMineralStoragePowerBatchTwelveBySlug = Object.fromEntries(
  englishMineralStoragePowerBatchTwelveArticles.map((article) => [article.slug, article]),
) as Record<string, EnglishBeginnerArticle>;

export function getEnglishMineralStoragePowerBatchTwelveArticle(
  slug: string,
): EnglishBeginnerArticle | undefined {
  return englishMineralStoragePowerBatchTwelveBySlug[slug];
}
