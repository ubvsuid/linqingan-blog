import fs from "node:fs";
import path from "node:path";

export const SITE_INTELLIGENCE_KEYWORD_OWNERSHIP_VERSION = "site-intelligence-keyword-ownership/v1";
export const SITE_INTELLIGENCE_KEYWORD_OWNERSHIP_PATH = "content/site-intelligence-keyword-ownership-v1.json";

function text(value) { return String(value ?? "").trim(); }

export function normalizeSiteIntelligenceOwnershipQuery(value) {
  return text(value).normalize("NFKC").toLowerCase().replace(/\s+/g, " ");
}

export function siteIntelligenceOwnershipKey(language, query) {
  const normalizedLanguage = text(language);
  const normalizedQuery = normalizeSiteIntelligenceOwnershipQuery(query);
  if (!normalizedLanguage || !normalizedQuery) throw new Error("language and query are required for Site Intelligence ownership keys");
  return `${normalizedLanguage}\u0000${normalizedQuery}`;
}

export function loadSiteIntelligenceKeywordOwnership(root = process.cwd()) {
  const file = path.join(root, SITE_INTELLIGENCE_KEYWORD_OWNERSHIP_PATH);
  const parsed = JSON.parse(fs.readFileSync(file, "utf8"));
  return parsed;
}

export function compileSiteIntelligenceKeywordOwnership(registry, assetMaster) {
  if (!registry || typeof registry !== "object") throw new Error("Site Intelligence keyword ownership registry is required");
  if (registry.version !== SITE_INTELLIGENCE_KEYWORD_OWNERSHIP_VERSION) {
    throw new Error(`Unsupported Site Intelligence keyword ownership registry version: ${registry.version ?? "missing"}`);
  }
  if (!Array.isArray(registry.owners) || !Array.isArray(registry.exclusions)) {
    throw new Error("Site Intelligence keyword ownership registry owners/exclusions must be arrays");
  }
  if (!assetMaster?.assets || !Array.isArray(assetMaster.assets)) throw new Error("assetMaster.assets is required");

  const assetById = new Map(assetMaster.assets.map((asset) => [text(asset.assetId), asset]));
  const ownerByKey = new Map();
  const exclusionByKey = new Map();
  const issueIds = new Set();

  for (const record of registry.owners) {
    if (record?.decision !== "approved-owner") throw new Error(`Invalid owner decision for ${record?.sourceIssueId ?? "unknown record"}`);
    const key = siteIntelligenceOwnershipKey(record.language, record.query);
    if (ownerByKey.has(key)) throw new Error(`Duplicate curated owner key: ${record.language}|${record.query}`);
    if (record.sourceIssueId) {
      if (issueIds.has(record.sourceIssueId)) throw new Error(`Duplicate sourceIssueId: ${record.sourceIssueId}`);
      issueIds.add(record.sourceIssueId);
    }
    const asset = assetById.get(text(record.ownerAssetId));
    if (!asset) throw new Error(`Curated owner asset does not exist: ${record.ownerAssetId}`);
    if (text(asset.language) !== text(record.language)) {
      throw new Error(`Curated owner language mismatch for ${record.query}: ${record.language} -> ${asset.language}`);
    }
    ownerByKey.set(key, { ...record, asset });
  }

  for (const record of registry.exclusions) {
    if (record?.decision !== "exclude-conflict") throw new Error(`Invalid exclusion decision for ${record?.sourceIssueId ?? "unknown record"}`);
    const key = siteIntelligenceOwnershipKey(record.language, record.query);
    if (exclusionByKey.has(key)) throw new Error(`Duplicate curated exclusion key: ${record.language}|${record.query}`);
    if (ownerByKey.has(key)) throw new Error(`Curated query cannot be both owner and exclusion: ${record.language}|${record.query}`);
    if (record.sourceIssueId) {
      if (issueIds.has(record.sourceIssueId)) throw new Error(`Duplicate sourceIssueId: ${record.sourceIssueId}`);
      issueIds.add(record.sourceIssueId);
    }
    if (record.candidateOwnerAssetId) {
      const candidate = assetById.get(text(record.candidateOwnerAssetId));
      if (!candidate) throw new Error(`Excluded candidate asset does not exist: ${record.candidateOwnerAssetId}`);
      if (text(candidate.language) !== text(record.language)) {
        throw new Error(`Excluded candidate language mismatch for ${record.query}: ${record.language} -> ${candidate.language}`);
      }
    }
    exclusionByKey.set(key, { ...record });
  }

  return { ownerByKey, exclusionByKey };
}
