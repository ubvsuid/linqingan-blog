export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_REPORT_LENGTH = 16_384;
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_REQUESTS = 60;
const MAX_RATE_LIMIT_KEYS = 1_000;

type JsonRecord = Record<string, unknown>;
type RateLimitEntry = { count: number; resetAt: number };

const rateLimitEntries = new Map<string, RateLimitEntry>();

function asRecord(value: unknown): JsonRecord | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as JsonRecord)
    : null;
}

function redactUrl(value: unknown): string | undefined {
  if (typeof value !== "string" || !value) return undefined;

  try {
    const url = new URL(value, "https://www.linqingan.com");
    return `${url.origin}${url.pathname}`;
  } catch {
    return value.slice(0, 256);
  }
}

function summarizeLegacyReport(value: JsonRecord): JsonRecord {
  const report = asRecord(value["csp-report"]) ?? value;

  return {
    documentUri: redactUrl(report["document-uri"] ?? report.documentURL),
    blockedUri: redactUrl(report["blocked-uri"] ?? report.blockedURL),
    effectiveDirective: report["effective-directive"] ?? report.effectiveDirective,
    violatedDirective: report["violated-directive"],
    disposition: report.disposition,
    statusCode: report["status-code"] ?? report.statusCode,
    sourceFile: redactUrl(report["source-file"] ?? report.sourceFile),
    lineNumber: report["line-number"] ?? report.lineNumber,
    columnNumber: report["column-number"] ?? report.columnNumber,
  };
}

function summarizeReportPayload(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.slice(0, 10).map((entry) => {
      const record = asRecord(entry);
      if (!record) return { type: "invalid-report" };
      const body = asRecord(record.body);

      return {
        type: record.type,
        age: record.age,
        url: redactUrl(record.url),
        body: body ? summarizeLegacyReport(body) : undefined,
      };
    });
  }

  const record = asRecord(value);
  return record ? summarizeLegacyReport(record) : { type: "invalid-report" };
}

function getClientKey(request: Request): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  const address = forwardedFor?.split(",")[0]?.trim()
    || request.headers.get("x-real-ip")
    || "unknown";
  return address.slice(0, 128);
}

function pruneRateLimitEntries(now: number) {
  if (rateLimitEntries.size < MAX_RATE_LIMIT_KEYS) return;

  for (const [key, entry] of rateLimitEntries) {
    if (entry.resetAt <= now) rateLimitEntries.delete(key);
  }

  while (rateLimitEntries.size >= MAX_RATE_LIMIT_KEYS) {
    const oldestKey = rateLimitEntries.keys().next().value as string | undefined;
    if (!oldestKey) break;
    rateLimitEntries.delete(oldestKey);
  }
}

function applyRateLimit(request: Request): { limited: boolean; retryAfter: number } {
  const now = Date.now();
  const key = getClientKey(request);
  const current = rateLimitEntries.get(key);

  if (!current || current.resetAt <= now) {
    pruneRateLimitEntries(now);
    rateLimitEntries.set(key, {
      count: 1,
      resetAt: now + RATE_LIMIT_WINDOW_MS,
    });
    return { limited: false, retryAfter: 0 };
  }

  current.count += 1;
  rateLimitEntries.delete(key);
  rateLimitEntries.set(key, current);

  return {
    limited: current.count > RATE_LIMIT_REQUESTS,
    retryAfter: Math.max(1, Math.ceil((current.resetAt - now) / 1_000)),
  };
}

function responseHeaders() {
  return {
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
    "X-Robots-Tag": "noindex, nofollow",
  };
}

export async function POST(request: Request) {
  const rateLimit = applyRateLimit(request);
  if (rateLimit.limited) {
    return new Response(null, {
      status: 429,
      headers: {
        ...responseHeaders(),
        "Retry-After": String(rateLimit.retryAfter),
      },
    });
  }

  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.includes("application/csp-report") && !contentType.includes("application/reports+json") && !contentType.includes("application/json")) {
    return new Response(null, { status: 415, headers: responseHeaders() });
  }

  const declaredLength = Number(request.headers.get("content-length") ?? "0");
  if (Number.isFinite(declaredLength) && declaredLength > MAX_REPORT_LENGTH) {
    return new Response(null, { status: 413, headers: responseHeaders() });
  }

  const body = await request.text();
  if (body.length > MAX_REPORT_LENGTH) {
    return new Response(null, { status: 413, headers: responseHeaders() });
  }

  if (body) {
    try {
      console.warn("[csp-report]", JSON.stringify(summarizeReportPayload(JSON.parse(body))));
    } catch {
      console.warn("[csp-report]", JSON.stringify({ type: "invalid-json", length: body.length }));
    }
  }

  return new Response(null, {
    status: 204,
    headers: responseHeaders(),
  });
}
