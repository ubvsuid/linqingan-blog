import { NextResponse } from "next/server";

import {
  assertSearchIndexBudget,
  getSearchDocuments,
  getSearchIndexSummary,
  SEARCH_INDEX_MAX_BYTES,
  SEARCH_INDEX_WARN_BYTES,
  type SearchDocument,
} from "@/lib/search";

export const dynamic = "force-static";

const LEGACY_SEARCH_TEXT_MAX_TOKENS = 40;
const LEGACY_SEARCH_TEXT_MAX_CHARS = 320;

function searchTokens(value: string): string[] {
  return (
    value
      .normalize("NFKC")
      .replace(/<[^>]*>/g, " ")
      .replace(/https?:\/\/\S+/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .match(/[A-Za-z_][A-Za-z0-9_.:-]*|[\u3400-\u9fff]{1,8}|\d+(?:\.\d+)?/g) ?? []
  );
}

function compactLegacySearchText(document: SearchDocument): string {
  const metadataTokens = new Set(
    searchTokens(
      [document.title, document.description, document.meta, ...document.keywords].join(" "),
    ).map((token) => token.toLocaleLowerCase("zh-CN")),
  );
  const seen = new Set<string>();
  const compactTokens: string[] = [];

  for (const token of searchTokens(document.text)) {
    const key = token.toLocaleLowerCase("zh-CN");
    if (metadataTokens.has(key) || seen.has(key)) continue;
    seen.add(key);
    compactTokens.push(token);
    if (compactTokens.length >= LEGACY_SEARCH_TEXT_MAX_TOKENS) break;
  }

  return compactTokens.join(" ").slice(0, LEGACY_SEARCH_TEXT_MAX_CHARS);
}

function getLegacySearchIndexDocuments(): SearchDocument[] {
  return getSearchDocuments().map((document) => ({
    ...document,
    text: compactLegacySearchText(document),
  }));
}

export function GET() {
  const documents = getLegacySearchIndexDocuments();
  const payloadBytes = assertSearchIndexBudget(documents);
  const summary = getSearchIndexSummary(documents);

  return NextResponse.json(documents, {
    headers: {
      "Cache-Control":
        "public, max-age=0, must-revalidate, s-maxage=3600, stale-while-revalidate=86400",
      "Content-Language": "zh-CN",
      "X-Robots-Tag": "noindex, nofollow",
      "X-Search-Index-Total": String(summary.total),
      "X-Search-Index-Articles": String(summary.articleCount),
      "X-Search-Index-Public-Tools": String(summary.publicToolCount),
      "X-Search-Index-Tool-Documents": String(summary.toolDocumentCount),
      "X-Search-Index-Bytes": String(payloadBytes),
      "X-Search-Index-Warning-Bytes": String(SEARCH_INDEX_WARN_BYTES),
      "X-Search-Index-Budget-Bytes": String(SEARCH_INDEX_MAX_BYTES),
      "X-Search-Index-Headroom-Bytes": String(SEARCH_INDEX_MAX_BYTES - payloadBytes),
    },
  });
}
