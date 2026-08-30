import {
  englishArticleRoutePairs as bilingualEnglishArticleRoutePairs,
  publishedEnglishArticles as bilingualPublishedEnglishArticles,
  type EnglishArticleRecord as BilingualEnglishArticleRecord,
} from "./english-articles-complete-bilingual";
import { englishCreepAttackBatchTwentyOneRegistry } from "./english-creep-attack-registry-21";
import { englishCreepPullBatchTwentyRegistry } from "./english-creep-pull-registry-20";
import { englishPathfinderBatchNineteenRegistry } from "./english-pathfinder-registry-19";

export interface EnglishArticleRecord extends Omit<BilingualEnglishArticleRecord, "chinesePath"> {
  chinesePath?: string;
  updatedAt?: string;
}

export const publishedEnglishArticles: EnglishArticleRecord[] = [
  ...bilingualPublishedEnglishArticles,
  ...englishPathfinderBatchNineteenRegistry,
  ...englishCreepPullBatchTwentyRegistry,
  ...englishCreepAttackBatchTwentyOneRegistry,
];

// This map is intentionally bilingual-only: its key is a Chinese source route.
// English-original articles have no Chinese counterpart and therefore do not
// belong in the Chinese -> English route-pair lookup.
export const englishArticleRoutePairs = bilingualEnglishArticleRoutePairs;
