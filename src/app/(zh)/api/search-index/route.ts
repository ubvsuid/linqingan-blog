import { NextResponse } from "next/server";

import { getSearchDocuments, getSearchIndexSummary } from "@/lib/search";

export const dynamic = "force-static";

export function GET() {
  const documents = getSearchDocuments();
  const summary = getSearchIndexSummary(documents);

  return NextResponse.json(documents, {
    headers: {
      "Cache-Control": "public, max-age=0, must-revalidate, s-maxage=3600, stale-while-revalidate=86400",
      "Content-Language": "zh-CN",
      "X-Robots-Tag": "noindex, nofollow",
      "X-Search-Index-Total": String(summary.total),
      "X-Search-Index-Articles": String(summary.articleCount),
      "X-Search-Index-Public-Tools": String(summary.publicToolCount),
      "X-Search-Index-Tool-Documents": String(summary.toolDocumentCount),
    },
  });
}
