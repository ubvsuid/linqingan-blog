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

function replaceRequired(
  articleHtml: string,
  search: string,
  replacement: string,
  label: string,
): string {
  if (!articleHtml.includes(search)) {
    throw new Error(`Terminal send finalizer could not find ${label}`);
  }
  return articleHtml.replace(search, replacement);
}

function finalizeTerminalSendArticle(
  article: EnglishBeginnerArticle,
): EnglishBeginnerArticle {
  let articleHtml = replaceRequired(
    article.articleHtml,
    String.raw`const description = normalizeSendDescription(
    request.description
  );`,
    String.raw`const description = normalizeSendDescription(
    request?.description
  );`,
    "optional request description guard",
  );

  articleHtml = replaceRequired(
    articleHtml,
    String.raw`  if (
    !request
    || request.enabled !== true
    || !Number.isInteger(request.revision)
    || request.revision < 1
    || request.confirmation
      !== buildTerminalSendConfirmation(request)
    || !Number.isInteger(request.amount)
    || request.amount < TERMINAL_MIN_SEND
  ) {`,
    String.raw`  if (
    !request
    || request.enabled !== true
    || typeof request.requestId !== 'string'
    || request.requestId.length === 0
    || !Number.isInteger(request.revision)
    || request.revision < 1
    || typeof request.terminalId !== 'string'
    || request.terminalId.length === 0
    || typeof request.resourceType !== 'string'
    || request.resourceType.length === 0
    || !Number.isInteger(request.amount)
    || request.amount < TERMINAL_MIN_SEND
    || typeof request.destination !== 'string'
    || request.destination.length === 0
    || !Number.isFinite(request.energyReserve)
    || request.energyReserve < 0
    || request.confirmation
      !== buildTerminalSendConfirmation(request)
  ) {`,
    "frozen request shape validation",
  );

  const verification = [
    ...article.verification.filter(
      ([label]) => label !== "Request shape validation"
        && label !== "Last verified",
    ),
    [
      "Request shape validation",
      "Checked — request ID, revision, Terminal ID, resource type, amount, destination and non-negative finite Energy reserve must be valid before budget calculation or send()",
    ] as [string, string],
    ["Last verified", "August 30, 2026"] as [string, string],
  ];

  return markBranchValidationPending({
    ...article,
    updatedAt: "2026-08-30",
    verification,
    articleHtml,
  });
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
  finalizeTerminalSendArticle(
    englishEditorialTerminalSendArticle20260805,
  );

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
