import type { EnglishArticleRecord } from "./english-articles";

export type DatedEnglishArticleRecord = EnglishArticleRecord & {
  updatedAt?: string;
};
