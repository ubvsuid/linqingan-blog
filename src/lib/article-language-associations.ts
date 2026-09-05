import associationPayload from "../../content/article-language-associations.json";

export interface ArticleLanguageAssociation {
  chinesePath: string;
  englishPath: string;
}

const CHINESE_ARTICLE_PATH = /^\/blog\/[a-z0-9-]+$/;
const ENGLISH_ARTICLE_PATH = /^\/en\/blog\/[a-z0-9-]+$/;

function loadArticleLanguageAssociations(): readonly ArticleLanguageAssociation[] {
  if (associationPayload.schemaVersion !== 1 || !Array.isArray(associationPayload.records)) {
    throw new Error("content/article-language-associations.json must use schemaVersion 1 with records[]");
  }

  const chinesePaths = new Set<string>();
  const englishPaths = new Set<string>();

  return Object.freeze(
    associationPayload.records.map((rawRecord) => {
      const chinesePath = String(rawRecord.chinesePath ?? "").trim();
      const englishPath = String(rawRecord.englishPath ?? "").trim();

      if (!CHINESE_ARTICLE_PATH.test(chinesePath)) {
        throw new Error(`Invalid explicit Chinese article path: ${chinesePath || "(empty)"}`);
      }
      if (!ENGLISH_ARTICLE_PATH.test(englishPath)) {
        throw new Error(`Invalid explicit English article path: ${englishPath || "(empty)"}`);
      }
      if (chinesePaths.has(chinesePath)) {
        throw new Error(`Duplicate explicit Chinese article path: ${chinesePath}`);
      }
      if (englishPaths.has(englishPath)) {
        throw new Error(`Duplicate explicit English article path: ${englishPath}`);
      }

      chinesePaths.add(chinesePath);
      englishPaths.add(englishPath);
      return Object.freeze({ chinesePath, englishPath });
    }),
  );
}

export const articleLanguageAssociations = loadArticleLanguageAssociations();

export const articleLanguageRoutePairs = Object.freeze(
  Object.fromEntries(
    articleLanguageAssociations.map(({ chinesePath, englishPath }) => [chinesePath, englishPath]),
  ) as Record<string, string>,
);

const englishByChinese = new Map(
  articleLanguageAssociations.map(({ chinesePath, englishPath }) => [chinesePath, englishPath]),
);
const chineseByEnglish = new Map(
  articleLanguageAssociations.map(({ chinesePath, englishPath }) => [englishPath, chinesePath]),
);

export function getEnglishArticlePathForChinese(chinesePath: string): string | null {
  return englishByChinese.get(chinesePath) ?? null;
}

export function getChineseArticlePathForEnglish(englishPath: string): string | null {
  return chineseByEnglish.get(englishPath) ?? null;
}
