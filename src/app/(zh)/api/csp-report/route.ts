export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_REPORT_LENGTH = 16_384;

type JsonRecord = Record<string, unknown>;

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

export async function POST(request: Request) {
  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.includes("application/csp-report") && !contentType.includes("application/reports+json") && !contentType.includes("application/json")) {
    return new Response(null, { status: 415 });
  }

  const declaredLength = Number(request.headers.get("content-length") ?? "0");
  if (Number.isFinite(declaredLength) && declaredLength > MAX_REPORT_LENGTH) {
    return new Response(null, { status: 413 });
  }

  const body = await request.text();
  if (body.length > MAX_REPORT_LENGTH) {
    return new Response(null, { status: 413 });
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
    headers: {
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
