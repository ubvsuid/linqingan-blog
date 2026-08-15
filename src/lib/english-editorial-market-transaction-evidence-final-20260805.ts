import type { EnglishBeginnerArticle } from "@/lib/english-beginner-content";
import {
  englishEditorialMarketCreateOrderArticle20260805,
  englishEditorialMarketDealArticle20260805,
  englishEditorialTerminalSendArticle20260805,
} from "./english-editorial-market-transaction-evidence-20260805";

function markBranchValidationPending(
  article: EnglishBeginnerArticle,
): EnglishBeginnerArticle {
  return {
    ...article,
    verification: article.verification.map(([label, value]) => {
      if (label === "JavaScript syntax") {
        return [
          label,
          "Required by the dedicated editorial simulation on the current branch",
        ];
      }
      if (label === "Repository integration") {
        return [
          label,
          "Pending — TypeScript, ESLint, build and production smoke checks have not completed on this branch",
        ];
      }
      return [label, value];
    }),
  };
}

export const englishEditorialMarketCreateOrderArticleFinal20260805 =
  markBranchValidationPending(
    englishEditorialMarketCreateOrderArticle20260805,
  );

export const englishEditorialMarketDealArticleFinal20260805 =
  markBranchValidationPending(
    englishEditorialMarketDealArticle20260805,
  );

export const englishEditorialTerminalSendArticleFinal20260805 =
  markBranchValidationPending({
    ...englishEditorialTerminalSendArticle20260805,
    articleHtml: englishEditorialTerminalSendArticle20260805.articleHtml.replace(
      String.raw`const description = normalizeSendDescription(
    request.description
  );`,
      String.raw`const description = normalizeSendDescription(
    request?.description
  );`,
    ),
  });

export const englishEditorialMarketTransactionEvidenceFinalOverrides20260805: Record<
  string,
  EnglishBeginnerArticle
> = {
  [englishEditorialMarketCreateOrderArticleFinal20260805.slug]:
    englishEditorialMarketCreateOrderArticleFinal20260805,
  [englishEditorialMarketDealArticleFinal20260805.slug]:
    englishEditorialMarketDealArticleFinal20260805,
  [englishEditorialTerminalSendArticleFinal20260805.slug]:
    englishEditorialTerminalSendArticleFinal20260805,
};
