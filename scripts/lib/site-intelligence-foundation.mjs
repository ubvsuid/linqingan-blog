import crypto from "node:crypto";

function text(value) { return String(value ?? "").trim(); }
function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (value && typeof value === "object") return Object.fromEntries(Object.keys(value).sort().map((key) => [key, stable(value[key])]));
  return value;
}
function hash(value) { return crypto.createHash("sha256").update(JSON.stringify(stable(value))).digest("hex"); }
function nonnegative(value, name) {
  const number = Number(value ?? 0);
  if (!Number.isInteger(number) || number < 0) throw new Error(`${name} must be a non-negative integer.`);
  return number;
}

export const GSC_GRAIN_CONTRACT = Object.freeze({
  version: "gsc-page-query-v1",
  searchType: "web",
  country: "all",
  device: "all",
  dimensions: Object.freeze(["page", "query"]),
});

function normalizeDimension(value) { return text(value).toLowerCase().replaceAll("_", "-"); }

export function validateGscGrain({
  searchType = GSC_GRAIN_CONTRACT.searchType,
  country = GSC_GRAIN_CONTRACT.country,
  device = GSC_GRAIN_CONTRACT.device,
  dimensions = GSC_GRAIN_CONTRACT.dimensions,
} = {}) {
  const normalized = {
    version: GSC_GRAIN_CONTRACT.version,
    searchType: normalizeDimension(searchType),
    country: normalizeDimension(country),
    device: normalizeDimension(device),
    dimensions: [...(Array.isArray(dimensions) ? dimensions : [])].map(normalizeDimension),
  };
  if (normalized.searchType !== "web") throw new Error("GSC historical warehouse V1 accepts Web search only.");
  if (normalized.country !== "all") throw new Error("GSC historical warehouse V1 does not accept country-segmented rows.");
  if (normalized.device !== "all") throw new Error("GSC historical warehouse V1 does not accept device-segmented rows.");
  if (normalized.dimensions.length !== 2 || normalized.dimensions[0] !== "page" || normalized.dimensions[1] !== "query") {
    throw new Error("GSC historical warehouse V1 requires exactly Page + Query dimensions in that order.");
  }
  return normalized;
}

export function validateImportCounts({ rowsReceived = 0, rowsAccepted = 0, rowsRejected = 0, rowsUnmapped = 0 } = {}) {
  const result = {
    rowsReceived: nonnegative(rowsReceived, "rowsReceived"),
    rowsAccepted: nonnegative(rowsAccepted, "rowsAccepted"),
    rowsRejected: nonnegative(rowsRejected, "rowsRejected"),
    rowsUnmapped: nonnegative(rowsUnmapped, "rowsUnmapped"),
  };
  if (result.rowsAccepted + result.rowsRejected > result.rowsReceived) throw new Error("Accepted + rejected rows cannot exceed received rows.");
  if (result.rowsUnmapped > result.rowsReceived) throw new Error("Unmapped rows cannot exceed received rows.");
  return result;
}

export function makeImportId({ source, fingerprint, startedAt = new Date().toISOString() }) {
  const cleanSource = text(source);
  if (!cleanSource) throw new Error("Import source is required.");
  const stamp = new Date(startedAt).toISOString().replace(/[-:.TZ]/g, "").slice(0, 14);
  return `import:${cleanSource}:${stamp}:${text(fingerprint).slice(0, 12) || "no-fingerprint"}`;
}

export function makeDataQualityFingerprint({ source, issueType, entityKind = null, entityKey = null }) {
  if (!text(source) || !text(issueType)) throw new Error("Data quality source and issueType are required.");
  return hash({ source: text(source), issueType: text(issueType), entityKind: text(entityKind) || null, entityKey: text(entityKey) || null });
}

export function makeGscRowFingerprint({ periodStart, periodEnd, pagePath, query, searchType, country, device, dimensions } = {}) {
  if (!text(periodStart) || !text(periodEnd) || !text(pagePath) || !text(query)) throw new Error("GSC periodStart, periodEnd, pagePath, and query are required.");
  const grain = validateGscGrain({ searchType, country, device, dimensions });
  return hash({ periodStart: text(periodStart), periodEnd: text(periodEnd), pagePath: text(pagePath), query: text(query), grainVersion: grain.version });
}

export function makeRelationshipId({ fromKind, fromKey, relationshipType, toKind, toKey }) {
  const payload = {
    fromKind: text(fromKind), fromKey: text(fromKey), relationshipType: text(relationshipType), toKind: text(toKind), toKey: text(toKey),
  };
  if (Object.values(payload).some((value) => !value)) throw new Error("Relationship endpoints and type are required.");
  if (payload.fromKind === payload.toKind && payload.fromKey === payload.toKey) throw new Error("Self relationships are not allowed.");
  return `rel:${hash(payload).slice(0, 24)}`;
}

function esc(value) { return String(value ?? "").replaceAll("|", "\\|").replaceAll("\n", " "); }

export function renderFoundationMarkdown({ generatedAt, actionSummary = [], imports = [], duplicateImports = [], dataQuality = [], gscPeriods = [], relationships = [], actionLinks = [] }) {
  const lines = [
    "# Site Intelligence Database Foundation",
    "",
    `Generated: ${generatedAt}`,
    "",
    "## Action timing",
    "",
    "| State | Actions |",
    "|---|---:|",
    ...actionSummary.map((row) => `| ${esc(row.aging_state)} | ${row.actions} |`),
    "",
    "## Recent imports",
    "",
    "| Source | Status | Period | Received | Accepted | Rejected | Unmapped | Started |",
    "|---|---|---|---:|---:|---:|---:|---|",
    ...imports.map((row) => `| ${esc(row.source)} | ${row.status} | ${row.period_start ?? "—"} → ${row.period_end ?? "—"} | ${row.rows_received} | ${row.rows_accepted} | ${row.rows_rejected} | ${row.rows_unmapped} | ${row.started_at} |`),
    "",
    "## Duplicate import fingerprints",
    "",
    "| Source | Fingerprint | Runs |",
    "|---|---|---:|",
    ...duplicateImports.map((row) => `| ${esc(row.source)} | ${esc(row.input_fingerprint)} | ${row.runs} |`),
    "",
    "## Open data-quality issues",
    "",
    "| Severity | Type | Source | Entity | Occurrences | Last seen |",
    "|---|---|---|---|---:|---|",
    ...dataQuality.map((row) => `| ${row.severity} | ${row.issue_type} | ${esc(row.source)} | ${esc(row.entity_key ?? row.asset_id ?? "—")} | ${row.occurrence_count} | ${row.last_seen_at} |`),
    "",
    "## GSC historical periods",
    "",
    "| Period | Rows | Mapped | Owner mismatch | Clicks | Impressions | CTR | Weighted position |",
    "|---|---:|---:|---:|---:|---:|---:|---:|",
    ...gscPeriods.map((row) => `| ${row.period_start} → ${row.period_end} | ${row.observation_rows} | ${row.mapped_rows} | ${row.owner_mismatch_rows} | ${row.clicks} | ${row.impressions} | ${Number(row.ctr ?? 0).toFixed(4)} | ${row.impression_weighted_position === null ? "—" : Number(row.impression_weighted_position).toFixed(2)} |`),
    "",
    "## Relationship graph",
    "",
    "| Relationship | Basis | Active rows |",
    "|---|---|---:|",
    ...relationships.map((row) => `| ${row.relationship_type} | ${row.basis} | ${row.relationships} |`),
    "",
    "## Action links",
    "",
    "| Relationship | Links |",
    "|---|---:|",
    ...actionLinks.map((row) => `| ${row.relationship_type} | ${row.links} |`),
    "",
    `GSC warehouse grain: ${GSC_GRAIN_CONTRACT.version} (Web, Country=All, Device=All, dimensions=Page+Query). Segmented GSC rows must be rejected before persistence.`,
    "This report is read-only. It does not create, close, reprioritize, publish, redirect, or modify site content automatically.",
    "",
  ];
  return lines.join("\n");
}
