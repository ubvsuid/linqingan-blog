export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_REPORT_LENGTH = 16_384;

export async function POST(request: Request) {
  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.includes("application/csp-report") && !contentType.includes("application/reports+json") && !contentType.includes("application/json")) {
    return new Response(null, { status: 415 });
  }

  const body = (await request.text()).slice(0, MAX_REPORT_LENGTH);
  if (body) {
    console.warn("[csp-report]", body);
  }

  return new Response(null, {
    status: 204,
    headers: {
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
