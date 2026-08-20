import { normalizeKeyword, normalizeKeywordLoose, normalizePagePath } from "./content-asset-index.mjs";

function numeric(value) {
  const parsed = Number.parseFloat(String(value ?? "0"));
  return Number.isFinite(parsed) ? parsed : 0;
}

function clean(value) {
  return String(value ?? "").trim();
}

function unique(map, key) {
  const value = map.get(key);
  return value && !Array.isArray(value) ? value : null;
}

function addUnique(map, key, asset) {
  if (!key) return;
  const current = map.get(key);
  if (!current) map.set(key, asset);
  else if (Array.isArray(current)) current.push(asset);
  else map.set(key, [current, asset]);
}

function buildLookup(assetMaster) {
  if (!assetMaster?.assets) throw new Error("assetMaster.assets is required");

  const byPath = new Map();
  const byArticleSlug = new Map();
  const byToolSlug = new Map();
  const byOwnerStrict = new Map();
  const byOwnerLoose = new Map();

  for (const asset of assetMaster.assets) {
    if (asset.routeKind === "page") {
      const path = normalizePagePath(asset.path);
      if (path) addUnique(byPath, path, asset);
    }
    if (asset.assetType === "article" && asset.slug) byArticleSlug.set(asset.slug, asset);
    if (asset.assetType === "tool" && asset.slug) byToolSlug.set(asset.slug, asset);
    if (asset.keywordRole === "owner" && asset.primaryKeyword) {
      addUnique(byOwnerStrict, normalizeKeyword(asset.primaryKeyword), asset);
      addUnique(byOwnerLoose, normalizeKeywordLoose(asset.primaryKeyword), asset);
    }
  }

  return {
    resolvePath(value) {
      return unique(byPath, normalizePagePath(value));
    },
    resolveArticleSlug(slug) {
      return byArticleSlug.get(clean(slug)) ?? null;
    },
    resolveToolSlug(slug) {
      return byToolSlug.get(clean(slug)) ?? null;
    },
    resolveOwnerKeyword(value) {
      const strict = unique(byOwnerStrict, normalizeKeyword(value));
      if (strict) return { asset: strict, source: "owner-keyword-exact" };
      const loose = unique(byOwnerLoose, normalizeKeywordLoose(value));
      if (loose) return { asset: loose, source: "owner-keyword-normalized" };
      return { asset: null, source: null };
    },
  };
}

export function behavioralSampleGate(total) {
  return numeric(total) >= 20 ? "eligible-for-ranking" : "observe-only";
}

function gscKind(record) {
  if (record.ownerStatus === "owner-mismatch") return "gsc-owner-mismatch";
  switch (record.action) {
    case "Improve title and description": return "gsc-low-ctr";
    case "Strengthen content and internal links": return "gsc-ranking-opportunity";
    case "Reassess intent or consolidate": return "gsc-intent-review";
    case "Protect and expand": return "gsc-protect-expand";
    case "Review unmapped article URL": return "gsc-unmapped-article";
    case "No Search Console signal": return "gsc-no-signal";
    default: return "gsc-monitor";
  }
}

function signal({ source, kind, key, asset, relatedAsset = null, sampleGate, rankingEligible = false, observedAt = null, payload = {} }) {
  return {
    signalId: [source, kind, asset?.assetId ?? "unmapped", key].map((part) => clean(part).replace(/\s+/g, "-")).join(":"),
    source,
    kind,
    assetId: asset?.assetId ?? null,
    relatedAssetId: relatedAsset?.assetId ?? null,
    sampleGate,
    rankingEligible,
    observedAt,
    payload,
  };
}

function addSignal(collection, value) {
  if (value.assetId) {
    const current = collection.byAsset.get(value.assetId) ?? [];
    current.push(value);
    collection.byAsset.set(value.assetId, current);
  } else {
    collection.unmapped.push(value);
  }
}

function ingestGsc(collection, records, lookup) {
  for (const [index, record] of records.entries()) {
    const pagePath = normalizePagePath(record.pagePath || record.page || "");
    const actualAsset = pagePath ? lookup.resolvePath(pagePath) : null;
    const ownerResolution = lookup.resolveOwnerKeyword(record.ownerKeyword || record.query || "");
    const expectedAsset = record.expectedOwnerHref
      ? lookup.resolvePath(record.expectedOwnerHref)
      : ownerResolution.asset;
    const targetAsset = actualAsset || expectedAsset;
    const priority = clean(record.priority);
    const kind = gscKind(record);

    addSignal(collection, signal({
      source: "gsc",
      kind,
      key: `${index}-${pagePath || record.query || "row"}`,
      asset: targetAsset,
      relatedAsset: record.ownerStatus === "owner-mismatch" ? expectedAsset : null,
      sampleGate: "report-classified",
      rankingEligible: Boolean(targetAsset) && (priority === "P0" || priority === "P1"),
      payload: {
        priority: priority || null,
        pagePath: pagePath || null,
        query: clean(record.query) || null,
        clicks: numeric(record.clicks),
        impressions: numeric(record.impressions),
        ctr: numeric(record.ctr),
        position: numeric(record.position),
        action: clean(record.action) || null,
        ownerStatus: clean(record.ownerStatus) || null,
        ownerKeyword: clean(record.ownerKeyword) || null,
        expectedOwnerHref: normalizePagePath(record.expectedOwnerHref || "") || null,
        mappingSource: clean(record.mappingSource) || null,
      },
    }));
  }
}

function ingestInternalSearch(collection, rows, lookup) {
  const totalSearches = rows.reduce((sum, row) => sum + numeric(row.searches), 0);
  const gate = behavioralSampleGate(totalSearches);

  for (const [index, row] of rows.entries()) {
    const query = clean(row.example_query || row.query || row.normalized_query);
    const ownerResolution = lookup.resolveOwnerKeyword(row.ownerKeyword || query);
    const searches = numeric(row.searches);
    const zeroResults = numeric(row.zero_results ?? row.zeroResults);
    const clicks = numeric(row.clicks);
    let kind = "internal-search-demand";
    if (zeroResults > 0) kind = "internal-search-zero-result";
    else if (searches > 0 && clicks === 0) kind = "internal-search-no-click";

    addSignal(collection, signal({
      source: "internal-search",
      kind,
      key: `${index}-${query || "query"}`,
      asset: ownerResolution.asset,
      sampleGate: gate,
      rankingEligible: gate === "eligible-for-ranking" && Boolean(ownerResolution.asset),
      payload: {
        query: query || null,
        normalizedQuery: clean(row.normalized_query) || null,
        searches,
        zeroResults,
        clicks,
        ownerMappingSource: ownerResolution.source,
      },
    }));
  }

  return totalSearches;
}

function ingestToolUsage(collection, rows, lookup) {
  const totalEvents = rows.reduce((sum, row) => sum + numeric(row.events), 0);
  const gate = behavioralSampleGate(totalEvents);

  for (const [index, row] of rows.entries()) {
    const toolSlug = clean(row.tool_id || row.toolId);
    const action = clean(row.action) || "event";
    addSignal(collection, signal({
      source: "tool-usage",
      kind: `tool-${action}`,
      key: `${index}-${toolSlug}-${action}`,
      asset: lookup.resolveToolSlug(toolSlug),
      sampleGate: gate,
      rankingEligible: gate === "eligible-for-ranking",
      observedAt: row.latest_at ?? row.latestAt ?? null,
      payload: {
        toolId: toolSlug || null,
        action,
        events: numeric(row.events),
      },
    }));
  }

  return totalEvents;
}

function ingestFeedback(collection, rows, lookup) {
  const totalVotes = rows.reduce((sum, row) => sum + numeric(row.votes), 0);
  const gate = behavioralSampleGate(totalVotes);

  for (const [index, row] of rows.entries()) {
    const slug = clean(row.article_slug || row.articleSlug);
    addSignal(collection, signal({
      source: "article-feedback",
      kind: "article-feedback",
      key: `${index}-${slug}`,
      asset: lookup.resolveArticleSlug(slug),
      sampleGate: gate,
      rankingEligible: gate === "eligible-for-ranking",
      observedAt: row.latest_at ?? row.latestAt ?? null,
      payload: {
        articleSlug: slug || null,
        votes: numeric(row.votes),
        helpful: numeric(row.helpful),
        notHelpful: numeric(row.not_helpful ?? row.notHelpful),
      },
    }));
  }

  return totalVotes;
}

function ingestEvidence(collection, rows, lookup) {
  let totalEvidence = 0;
  for (const [index, row] of rows.entries()) {
    const slug = clean(row.article_slug || row.articleSlug);
    const status = clean(row.status) || "unknown";
    const count = numeric(row.evidence ?? row.events ?? row.count ?? 1);
    totalEvidence += count;
    addSignal(collection, signal({
      source: "runtime-evidence",
      kind: `runtime-evidence-${status}`,
      key: `${index}-${slug}-${status}-${row.verification_type || row.verificationType || "any"}`,
      asset: lookup.resolveArticleSlug(slug),
      sampleGate: "direct-evidence",
      rankingEligible: false,
      observedAt: row.latest_at ?? row.latestAt ?? row.verified_at ?? null,
      payload: {
        articleSlug: slug || null,
        verificationType: clean(row.verification_type || row.verificationType) || null,
        status,
        evidence: count,
      },
    }));
  }
  return totalEvidence;
}

function sortSignals(signals) {
  return [...signals].sort((left, right) =>
    left.source.localeCompare(right.source)
    || left.kind.localeCompare(right.kind)
    || left.signalId.localeCompare(right.signalId));
}

export function buildSiteIntelligenceSignals({
  assetMaster,
  gscRecords = [],
  internalSearchRows = [],
  toolUsageRows = [],
  feedbackRows = [],
  evidenceRows = [],
  generatedAt = new Date().toISOString(),
} = {}) {
  const lookup = buildLookup(assetMaster);
  const collection = { byAsset: new Map(), unmapped: [] };

  ingestGsc(collection, gscRecords, lookup);
  const internalSearches = ingestInternalSearch(collection, internalSearchRows, lookup);
  const toolEvents = ingestToolUsage(collection, toolUsageRows, lookup);
  const feedbackVotes = ingestFeedback(collection, feedbackRows, lookup);
  const evidenceCount = ingestEvidence(collection, evidenceRows, lookup);

  const assets = assetMaster.assets.map((asset) => {
    const signals = sortSignals(collection.byAsset.get(asset.assetId) ?? []);
    return {
      assetId: asset.assetId,
      assetType: asset.assetType,
      language: asset.language,
      path: asset.path,
      canonicalPath: asset.canonicalPath,
      title: asset.title,
      contentSystem: asset.contentSystem,
      module: asset.module,
      roadmap: asset.roadmap,
      stage: asset.stage,
      primaryKeyword: asset.primaryKeyword,
      signals,
      signalCount: signals.length,
      rankingEligibleSignalCount: signals.filter((item) => item.rankingEligible).length,
    };
  });

  const assetsWithSignals = assets.filter((asset) => asset.signalCount > 0).length;
  return {
    schemaVersion: 1,
    generatedAt,
    policy: {
      behavioralMinimumForRanking: 20,
      behavioralRule: "Below 20 observations per source, behavioral signals are observe-only and cannot independently rank an asset.",
      evidenceRule: "Runtime evidence is direct evidence, not a popularity sample, and does not independently create SEO priority.",
      scoringRule: "This layer does not calculate a composite opportunity score.",
    },
    sourceSummary: {
      gscRows: gscRecords.length,
      internalSearches,
      internalSearchGate: behavioralSampleGate(internalSearches),
      toolEvents,
      toolUsageGate: behavioralSampleGate(toolEvents),
      feedbackVotes,
      feedbackGate: behavioralSampleGate(feedbackVotes),
      evidenceRows: evidenceCount,
    },
    coverage: {
      totalAssets: assets.length,
      assetsWithSignals,
      assetsWithoutSignals: assets.length - assetsWithSignals,
      unmappedSignals: collection.unmapped.length,
    },
    assets,
    unmappedSignals: sortSignals(collection.unmapped),
  };
}

function escapeTable(value) {
  return String(value ?? "").replaceAll("|", "\\|").replaceAll("\n", " ");
}

export function renderSiteIntelligenceSignalsMarkdown(snapshot) {
  const activeAssets = snapshot.assets.filter((asset) => asset.signalCount > 0);
  const lines = [
    "# Site Intelligence Signals",
    "",
    `Generated: ${snapshot.generatedAt}`,
    "",
    "## Policy",
    "",
    `- Behavioral minimum for ranking: ${snapshot.policy.behavioralMinimumForRanking} observations per source.`,
    `- Behavioral rule: ${snapshot.policy.behavioralRule}`,
    `- Evidence rule: ${snapshot.policy.evidenceRule}`,
    `- Scoring rule: ${snapshot.policy.scoringRule}`,
    "",
    "## Source summary",
    "",
    `- GSC rows: ${snapshot.sourceSummary.gscRows}`,
    `- Internal searches: ${snapshot.sourceSummary.internalSearches} (${snapshot.sourceSummary.internalSearchGate})`,
    `- Tool events: ${snapshot.sourceSummary.toolEvents} (${snapshot.sourceSummary.toolUsageGate})`,
    `- Feedback votes: ${snapshot.sourceSummary.feedbackVotes} (${snapshot.sourceSummary.feedbackGate})`,
    `- Runtime evidence rows: ${snapshot.sourceSummary.evidenceRows}`,
    "",
    "## Coverage",
    "",
    `- Total assets: ${snapshot.coverage.totalAssets}`,
    `- Assets with signals: ${snapshot.coverage.assetsWithSignals}`,
    `- Assets without signals: ${snapshot.coverage.assetsWithoutSignals}`,
    `- Unmapped signals retained for review: ${snapshot.coverage.unmappedSignals}`,
    "",
    "## Assets with signals",
    "",
    "| Asset | Type | Signals | Ranking-eligible signals | Sources |",
    "|---|---|---:|---:|---|",
    ...activeAssets.map((asset) => {
      const sources = [...new Set(asset.signals.map((item) => item.source))].sort().join(", ");
      return `| ${escapeTable(asset.path)} | ${escapeTable(asset.assetType)} | ${asset.signalCount} | ${asset.rankingEligibleSignalCount} | ${escapeTable(sources)} |`;
    }),
    "",
    "## Interpretation boundary",
    "",
    "This report is a signal normalization layer, not an automated optimization score. Low-volume behavioral sources stay observe-only. GSC classifications are preserved from the upstream Search Console opportunity report, while Runtime Evidence is treated as direct technical evidence. Unmapped signals are retained instead of silently discarded.",
    "",
  ];

  if (snapshot.unmappedSignals.length > 0) {
    lines.push(
      "## Unmapped signals",
      "",
      "| Source | Kind | Key detail | Gate |",
      "|---|---|---|---|",
      ...snapshot.unmappedSignals.map((item) => `| ${escapeTable(item.source)} | ${escapeTable(item.kind)} | ${escapeTable(item.payload.query || item.payload.pagePath || item.payload.articleSlug || item.payload.toolId || "—")} | ${escapeTable(item.sampleGate)} |`),
      "",
    );
  }

  return lines.join("\n");
}
