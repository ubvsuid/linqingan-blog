import type { EnglishBeginnerArticle } from "@/lib/english-beginner-content";
import {
  englishEditorialMarketCreateOrderArticle20260805,
  englishEditorialMarketDealArticle20260805,
  englishEditorialTerminalSendArticle20260805,
} from "./english-editorial-market-transaction-evidence-20260805";

export const englishEditorialMarketCreateOrderArticleFinal20260805 =
  englishEditorialMarketCreateOrderArticle20260805;

export const englishEditorialMarketDealArticleFinal20260805 =
  englishEditorialMarketDealArticle20260805;

export const englishEditorialTerminalSendArticleFinal20260805: EnglishBeginnerArticle = {
  ...englishEditorialTerminalSendArticle20260805,
  articleHtml: englishEditorialTerminalSendArticle20260805.articleHtml.replace(
    String.raw`const description = normalizeSendDescription(
    request.description
  );`,
    String.raw`const description = normalizeSendDescription(
    request?.description
  );`,
  ),
};

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
