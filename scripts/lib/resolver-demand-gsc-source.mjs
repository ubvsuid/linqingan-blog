import fs from "node:fs";
import path from "node:path";

function fileSource(filePath, status) {
  return {
    kind: "file",
    status,
    fileName: path.basename(filePath),
  };
}

function siteIntelligenceSource(status, row = null) {
  return {
    kind: "site-intelligence",
    status,
    sourceImportId: row?.source_import_id ?? null,
    periodStart: row?.period_start ?? null,
    periodEnd: row?.period_end ?? null,
    capturedAt: row?.captured_at ?? null,
  };
}

function readFileOverride(inputPath, cwd) {
  const absolute = path.resolve(cwd, inputPath);
  if (!fs.existsSync(absolute)) {
    console.warn("Configured settled GSC override does not exist; ranking will fail closed as INSUFFICIENT_DATA.");
    return { rows: null, source: fileSource(absolute, "missing") };
  }

  try {
    const payload = JSON.parse(fs.readFileSync(absolute, "utf8"));
    if (!Array.isArray(payload.records)) {
      console.warn("Settled GSC override has no records array; ranking will fail closed as INSUFFICIENT_DATA.");
      return { rows: null, source: fileSource(absolute, "invalid") };
    }

    return {
      rows: payload.records.map((row) => ({
        query: row?.query ?? null,
        impressions: row?.impressions ?? 0,
        clicks: row?.clicks ?? 0,
      })),
      source: fileSource(absolute, "ready"),
    };
  } catch {
    console.warn("Settled GSC override could not be parsed; ranking will fail closed as INSUFFICIENT_DATA.");
    return { rows: null, source: fileSource(absolute, "invalid") };
  }
}

async function readSiteIntelligence(sql) {
  try {
    const imports = await sql`
      SELECT
        source_import_id,
        min(period_start)::text AS period_start,
        max(period_end)::text AS period_end,
        max(captured_at)::text AS captured_at
      FROM site_intelligence_gsc_observations
      WHERE query IS NOT NULL
        AND btrim(query) <> ''
      GROUP BY source_import_id
      ORDER BY max(period_end) DESC, max(captured_at) DESC, source_import_id DESC
      LIMIT 1;
    `;

    const latest = imports[0] ?? null;
    if (!latest) {
      console.warn("Site Intelligence has no settled GSC observations in this database; ranking will remain INSUFFICIENT_DATA.");
      return { rows: [], source: siteIntelligenceSource("empty") };
    }

    const rows = await sql`
      SELECT
        query,
        sum(impressions)::bigint AS impressions,
        sum(clicks)::bigint AS clicks
      FROM site_intelligence_gsc_observations
      WHERE source_import_id = ${latest.source_import_id}
        AND query IS NOT NULL
        AND btrim(query) <> ''
      GROUP BY query
      ORDER BY sum(impressions) DESC, query ASC;
    `;

    return {
      rows,
      source: siteIntelligenceSource("ready", latest),
    };
  } catch {
    console.warn("Site Intelligence GSC source is unavailable; ranking will fail closed as INSUFFICIENT_DATA.");
    return { rows: null, source: siteIntelligenceSource("unavailable") };
  }
}

export async function readResolverDemandGscRows({
  sql,
  inputPath = null,
  cwd = process.cwd(),
} = {}) {
  if (inputPath) return readFileOverride(inputPath, cwd);
  if (typeof sql !== "function") {
    return { rows: null, source: siteIntelligenceSource("unavailable") };
  }
  return readSiteIntelligence(sql);
}
