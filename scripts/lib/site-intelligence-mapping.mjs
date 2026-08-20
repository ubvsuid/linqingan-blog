import { normalizeKeyword, normalizeKeywordLoose, normalizePagePath } from "./content-asset-index.mjs";
import { inferPathLanguage } from "./site-intelligence-identity.mjs";

function text(value) { return String(value ?? "").trim(); }
function languageKey(language, value) { return `${text(language) || "zh-CN"}\u0000${value}`; }
function addUnique(map, key, asset) {
  if (!key) return;
  const current = map.get(key);
  if (!current) map.set(key, asset);
  else if (Array.isArray(current)) current.push(asset);
  else map.set(key, [current, asset]);
}
function unique(map, key) {
  const value = map.get(key);
  return value && !Array.isArray(value) ? value : null;
}

export function buildSiteAssetLookup(assetMaster) {
  if (!assetMaster?.assets) throw new Error("assetMaster.assets is required");
  const byPath = new Map();
  const byArticleSlug = new Map();
  const byToolSlug = new Map();
  const byOwnerStrict = new Map();
  const byOwnerLoose = new Map();

  for (const asset of assetMaster.assets) {
    if (asset.routeKind === "page") {
      const normalizedPath = normalizePagePath(asset.path);
      if (normalizedPath) addUnique(byPath, normalizedPath, asset);
    }
    if (asset.assetType === "article" && asset.slug) addUnique(byArticleSlug, languageKey(asset.language, text(asset.slug)), asset);
    if (asset.assetType === "tool" && asset.slug) addUnique(byToolSlug, languageKey(asset.language, text(asset.slug)), asset);
    if (asset.keywordRole === "owner" && asset.primaryKeyword) {
      addUnique(byOwnerStrict, languageKey(asset.language, normalizeKeyword(asset.primaryKeyword)), asset);
      addUnique(byOwnerLoose, languageKey(asset.language, normalizeKeywordLoose(asset.primaryKeyword)), asset);
    }
  }

  return {
    resolvePath(value) { return unique(byPath, normalizePagePath(value)); },
    resolveArticleSlug(slug, language = "zh-CN") { return unique(byArticleSlug, languageKey(language, text(slug))); },
    resolveToolSlug(slug, language = "zh-CN") { return unique(byToolSlug, languageKey(language, text(slug))); },
    resolveOwnerKeyword(value, language = "zh-CN") {
      const strict = unique(byOwnerStrict, languageKey(language, normalizeKeyword(value)));
      if (strict) return { asset: strict, source: "owner-keyword-exact" };
      const loose = unique(byOwnerLoose, languageKey(language, normalizeKeywordLoose(value)));
      if (loose) return { asset: loose, source: "owner-keyword-normalized" };
      return { asset: null, source: null };
    },
  };
}

export function resolveGscOwnership(record, lookup) {
  const pagePath = normalizePagePath(record.pagePath || record.page || "");
  const actualAsset = pagePath ? lookup.resolvePath(pagePath) : null;
  const pageLanguage = actualAsset?.language ?? inferPathLanguage(pagePath);
  const ownerResolution = lookup.resolveOwnerKeyword(record.ownerKeyword || record.query || "", pageLanguage);
  const explicitExpected = record.expectedOwnerHref ? lookup.resolvePath(record.expectedOwnerHref) : null;
  const expectedAsset = explicitExpected?.language === pageLanguage ? explicitExpected : ownerResolution.asset;

  let ownerStatus = text(record.ownerStatus) || null;
  if (actualAsset && expectedAsset) ownerStatus = actualAsset.assetId === expectedAsset.assetId ? "owner-match" : "owner-mismatch";
  else if (pagePath && pageLanguage === "en" && !expectedAsset) ownerStatus = "owner-language-unmapped";
  else if (actualAsset && !expectedAsset && ownerStatus === "owner-mismatch") ownerStatus = "owner-unmapped";

  return { pagePath, actualAsset, expectedAsset, pageLanguage, ownerStatus, ownerResolution };
}

export function databaseOwnerStatus(ownership) {
  if (!ownership.actualAsset) return { status: "unmapped", reason: ownership.pageLanguage === "en" ? "page-language-unmapped" : "page-unmapped" };
  if (ownership.ownerStatus === "owner-match") return { status: "matched", reason: null };
  if (ownership.ownerStatus === "owner-mismatch") return { status: "mismatch", reason: null };
  if (ownership.ownerStatus === "owner-language-unmapped") return { status: "unmapped", reason: "owner-language-unmapped" };
  if (!ownership.expectedAsset) return { status: "unowned", reason: null };
  return { status: "not_evaluated", reason: null };
}
