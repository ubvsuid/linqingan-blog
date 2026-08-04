import type { EnglishBeginnerArticle } from "./english-beginner-content";

export type EnglishEditorialArticleOverride = Pick<
  EnglishBeginnerArticle,
  | "title"
  | "headline"
  | "description"
  | "category"
  | "readingTime"
  | "breadcrumbLabel"
  | "tags"
  | "keywords"
  | "primaryKeyword"
  | "searchIntent"
  | "finalScore"
  | "verification"
  | "toc"
  | "faq"
  | "articleHtml"
>;
