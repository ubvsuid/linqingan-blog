import { NextResponse } from "next/server";

import {
  ARTICLE_SEARCH_TEXT_LIMIT,
  ARTICLE_SEARCH_TOKEN_LIMIT,
  getSearchDocuments,
  getSearchIndexSummary,
} from "@/lib/search";

export const dynamic = "force-static";

export function GET() {
  const documents = getSearchDocuments();
  const summary = getSearchIndexSummary(documents);
  const rawBytes = new TextEncoder().encode(JSON.stringify(documents)).byteLength;

  return NextResponse.json(documents, {
    headers: {
      "Cache-Control": "public, max-age=0, must-revalidate, s-maxage=900, stale-while-revalidate=3600",
      "Content-Language": "zh-CN",
      "X-Robots-Tag": "noindex, nofollow",
      "X-Search-Index-Total": String(summary.total),
      "X-Search-Index-Articles": String(summary.articleCount),
      "X-Search-Index-Public-Tools": String(summary.publicToolCount),
      "X-Search-Index-Tool-Documents": String(summary.toolDocumentCount),
      "X-Search-Index-Raw-Bytes": String(rawBytes),
      "X-Search-Index-Article-Token-Limit": String(ARTICLE_SEARCH_TOKEN_LIMIT),
      "X-Search-Index-Article-Text-Limit": String(ARTICLE_SEARCH_TEXT_LIMIT),
    },
  });
}
