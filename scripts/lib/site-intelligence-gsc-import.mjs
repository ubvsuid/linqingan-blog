import { normalizePagePath } from "./content-asset-index.mjs";
import { GSC_GRAIN_CONTRACT, makeDataQualityFingerprint, makeGscRowFingerprint, makeRelationshipId, validateGscGrain } from "./site-intelligence-foundation.mjs";
import { classifyGscMetrics } from "./site-intelligence-gsc.mjs";
import { buildSiteAssetLookup, databaseOwnerStatus, resolveGscOwnership } from "./site-intelligence-mapping.mjs";

function text(value) { return String(value ?? "").trim(); }
function issueId(fingerprint) { return `dq:${fingerprint.slice(0, 24)}`; }
function invalidIssue(row, reason, source) {
  const entityKey = [normalizePagePath(row.page), text(row.query), reason].join("|");
  const fingerprint = makeDataQualityFingerprint({ source, issueType: "invalid_row", entityKind: "gsc-row", entityKey });
  return { issueId: issueId(fingerprint), issueType: "invalid_row", severity: "error", source, entityKind: "gsc-row", entityKey, issueFingerprint: fingerprint, rawPayload: row, metadata: { reason, rowNumber: row.rowNumber ?? null } };
}
function missingAssetIssue(pagePath, row, source, pageLanguage) {
  const fingerprint = makeDataQualityFingerprint({ source, issueType: "missing_asset", entityKind: "path", entityKey: pagePath });
  return { issueId: issueId(fingerprint), issueType: "missing_asset", severity: "warning", source, entityKind: "path", entityKey: pagePath, issueFingerprint: fingerprint, rawPayload: row, metadata: { pageLanguage } };
}

function unknownOwnerIssue(query, row, source, pageLanguage) {
  const normalizedQuery = text(query).normalize("NFKC").toLowerCase().replace(/\s+/g, " ");
  const entityKey = `${pageLanguage || "unknown"}|${normalizedQuery}`;
  const fingerprint = makeDataQualityFingerprint({ source, issueType: "unknown_keyword_owner", entityKind: "keyword", entityKey });
  return { issueId: issueId(fingerprint), issueType: "unknown_keyword_owner", severity: "warning", source, entityKind: "keyword", entityKey, issueFingerprint: fingerprint, rawPayload: row, metadata: { pageLanguage, query: text(query) } };
}

export function planGscHistoricalImport({
  rows,
  assetMaster,
  periodStart,
  periodEnd,
  source = "gsc",
  searchType = "web",
  country = "all",
  device = "all",
  dimensions = ["page", "query"],
} = {}) {
  if (!Array.isArray(rows)) throw new Error("rows must be an array");
  if (!text(periodStart) || !text(periodEnd)) throw new Error("periodStart and periodEnd are required");
  if (new Date(`${periodEnd}T00:00:00Z`) < new Date(`${periodStart}T00:00:00Z`)) throw new Error("periodEnd cannot be before periodStart");
  const grain = validateGscGrain({ searchType, country, device, dimensions });
  const lookup = buildSiteAssetLookup(assetMaster);
  const accepted = [], rejected = [], issueMap = new Map(), relationshipMap = new Map(), resolvedIssueFingerprints = new Set();

  for (const row of rows) {
    try {
      const pagePath = normalizePagePath(row.page);
      const query = text(row.query);
      if (!pagePath || !query) throw new Error("V1 requires non-empty Page and Query values");
      if (!Number.isInteger(row.clicks) || row.clicks < 0) throw new Error("Clicks must be a non-negative integer");
      if (!Number.isInteger(row.impressions) || row.impressions < 0) throw new Error("Impressions must be a non-negative integer");
      if (row.clicks > row.impressions) throw new Error("Clicks cannot exceed impressions");
      if (!Number.isFinite(row.ctr) || row.ctr < 0 || row.ctr > 1) throw new Error("CTR must be a ratio from 0 to 1");
      if (row.position !== null && (!Number.isFinite(row.position) || row.position <= 0)) throw new Error("Position must be positive or null");

      const ownership = resolveGscOwnership({ pagePath, query }, lookup);
      const dbOwner = databaseOwnerStatus(ownership);
      const action = classifyGscMetrics(row);
      const rowFingerprint = makeGscRowFingerprint({ periodStart, periodEnd, pagePath, query, searchType, country, device, dimensions });
      const observation = {
        periodStart, periodEnd, pagePath, query,
        assetId: ownership.actualAsset?.assetId ?? null,
        ownerKeyword: ownership.expectedAsset?.primaryKeyword ?? null,
        ownerAssetId: ownership.expectedAsset?.assetId ?? null,
        ownerStatus: dbOwner.status,
        clicks: row.clicks, impressions: row.impressions, ctr: row.ctr, position: row.position,
        rowFingerprint,
        metadata: { grainVersion: grain.version, pageLanguage: ownership.pageLanguage, ownerMappingReason: dbOwner.reason, mappingSource: ownership.actualAsset ? "asset-path" : ownership.ownerResolution.source, classifierAction: action, sourceRow: row.rowNumber ?? null },
      };
      accepted.push(observation);

      if (!ownership.actualAsset) {
        const issue = missingAssetIssue(pagePath, row, source, ownership.pageLanguage);
        issueMap.set(issue.issueFingerprint, issue);
      } else {
        resolvedIssueFingerprints.add(makeDataQualityFingerprint({ source, issueType: "missing_asset", entityKind: "path", entityKey: pagePath }));
      }
      const ownerIssueKey = `${ownership.pageLanguage || "unknown"}|${query.normalize("NFKC").toLowerCase().replace(/\s+/g, " ")}`;
      if (!ownership.expectedAsset) {
        const issue = unknownOwnerIssue(query, row, source, ownership.pageLanguage);
        issueMap.set(issue.issueFingerprint, issue);
      } else {
        resolvedIssueFingerprints.add(makeDataQualityFingerprint({ source, issueType: "unknown_keyword_owner", entityKind: "keyword", entityKey: ownerIssueKey }));
      }
      if (ownership.expectedAsset?.primaryKeyword) {
        const relationshipId = makeRelationshipId({ fromKind: "keyword", fromKey: ownership.expectedAsset.primaryKeyword, relationshipType: "owned_by", toKind: "asset", toKey: ownership.expectedAsset.assetId });
        relationshipMap.set(relationshipId, {
          relationshipId,
          fromKind: "keyword", fromKey: ownership.expectedAsset.primaryKeyword,
          relationshipType: "owned_by", toKind: "asset", toKey: ownership.expectedAsset.assetId,
          basis: "keyword_owner", metadata: { language: ownership.expectedAsset.language },
        });
      }
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      rejected.push({ row, reason });
      const issue = invalidIssue(row, reason, source);
      issueMap.set(issue.issueFingerprint, issue);
    }
  }

  const rowsUnmapped = accepted.filter((row) => !row.assetId).length;
  return {
    grain,
    counts: { rowsReceived: rows.length, rowsAccepted: accepted.length, rowsRejected: rejected.length, rowsUnmapped },
    accepted,
    rejected,
    issues: [...issueMap.values()],
    relationships: [...relationshipMap.values()],
    resolvedIssueFingerprints: [...resolvedIssueFingerprints],
  };
}
