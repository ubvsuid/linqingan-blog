function numeric(value) {
  const parsed = Number.parseFloat(String(value ?? "0"));
  return Number.isFinite(parsed) ? parsed : 0;
}

function assetFields(asset) {
  return {
    system: asset?.system ?? "unmapped",
    nodeType: asset?.nodeType ?? "query",
    module: asset?.module ?? "",
    stage: asset?.stage ?? "",
    ownerKeyword: asset?.ownerKeyword ?? "",
    href: asset?.href ?? "",
  };
}

function queryMapping(row, assetIndex) {
  const query = String(row.example_query ?? row.normalized_query ?? "").trim();
  const resolution = assetIndex.resolveQuery(query);
  return {
    query,
    resolution,
    ...assetFields(resolution.asset),
  };
}

export function buildPlatformSearchAnalysis({
  summary = {},
  topSearches = [],
  zeroResults = [],
  noClickQueries = [],
  topClicked = [],
  assetIndex,
}) {
  if (!assetIndex) throw new Error("assetIndex is required");

  const totalQueries = numeric(summary.total_queries);
  const clickedQueries = numeric(summary.clicked_queries);
  const zeroResultQueries = numeric(summary.zero_result_queries);

  const enrichedTopSearches = topSearches.map((row) => {
    const mapping = queryMapping(row, assetIndex);
    const searches = numeric(row.searches);
    const zeroResultCount = numeric(row.zero_results);
    return {
      ...mapping,
      normalizedQuery: String(row.normalized_query ?? ""),
      searches,
      zeroResults: zeroResultCount,
      zeroResultRate: searches > 0 ? (zeroResultCount / searches) * 100 : 0,
      avgResults: numeric(row.avg_results),
      ownerMappingSource: mapping.resolution.source ?? "",
    };
  });

  const zeroResultActions = zeroResults.map((row) => {
    const mapping = queryMapping(row, assetIndex);
    const hasOwner = Boolean(mapping.resolution.asset);
    return {
      priority: hasOwner ? "P0" : "P1",
      signal: "zero-result",
      query: mapping.query,
      searches: numeric(row.searches),
      action: hasOwner
        ? "Fix search alias / indexing for owned concept"
        : "Research content or search vocabulary gap",
      rationale: hasOwner
        ? "The site already owns this concept, but internal search returned zero results."
        : "No exact Owner keyword maps to this zero-result query; research intent before creating content.",
      ownerMappingSource: mapping.resolution.source ?? "",
      ...assetFields(mapping.resolution.asset),
    };
  });

  const noClickActions = noClickQueries.map((row) => {
    const mapping = queryMapping(row, assetIndex);
    const hasOwner = Boolean(mapping.resolution.asset);
    return {
      priority: hasOwner ? "P1" : "P2",
      signal: "results-no-click",
      query: mapping.query,
      searches: numeric(row.searches),
      action: hasOwner
        ? "Review owned result ranking / snippet"
        : "Review internal search relevance",
      rationale: hasOwner
        ? "Search returned results but users did not click; verify that the owned page is visible and described clearly."
        : "Search returned results without a tracked click; inspect relevance before treating this as a content gap.",
      ownerMappingSource: mapping.resolution.source ?? "",
      ...assetFields(mapping.resolution.asset),
    };
  });

  const clickedResults = topClicked.map((row) => {
    const href = String(row.result_href ?? "").trim();
    const asset = assetIndex.resolvePageOrSite(href);
    return {
      href,
      resultType: String(row.result_type ?? ""),
      clicks: numeric(row.clicks),
      avgPosition: numeric(row.avg_position),
      ...assetFields(asset),
    };
  });

  const actionQueue = [...zeroResultActions, ...noClickActions].sort((left, right) => {
    const priority = { P0: 3, P1: 2, P2: 1 };
    return (priority[right.priority] ?? 0) - (priority[left.priority] ?? 0)
      || right.searches - left.searches
      || left.query.localeCompare(right.query);
  });

  return {
    summary: {
      totalQueries,
      clickedQueries,
      zeroResultQueries,
      clickThroughRate: totalQueries > 0 ? (clickedQueries / totalQueries) * 100 : 0,
      zeroResultRate: totalQueries > 0 ? (zeroResultQueries / totalQueries) * 100 : 0,
    },
    topSearches: enrichedTopSearches,
    zeroResultActions,
    noClickActions,
    topClicked: clickedResults,
    actionQueue,
  };
}

function escapeTable(value) {
  return String(value ?? "").replaceAll("|", "\\|").replaceAll("\n", " ");
}

export function renderPlatformSearchMarkdown(analysis, { days, generatedAt = new Date().toISOString() } = {}) {
  const lines = [
    "# Platform Search opportunity report",
    "",
    `Window: last ${days ?? "?"} day(s)`,
    `Generated: ${generatedAt}`,
    "",
    "## Summary",
    "",
    `- Queries: ${analysis.summary.totalQueries}`,
    `- Zero-result queries: ${analysis.summary.zeroResultQueries} (${analysis.summary.zeroResultRate.toFixed(1)}%)`,
    `- Queries with a tracked click: ${analysis.summary.clickedQueries} (${analysis.summary.clickThroughRate.toFixed(1)}%)`,
    `- P0 actions: ${analysis.actionQueue.filter((row) => row.priority === "P0").length}`,
    `- P1 actions: ${analysis.actionQueue.filter((row) => row.priority === "P1").length}`,
    "",
    "## Action queue",
    "",
    "| Priority | Signal | Query | Searches | System | Module / roadmap | Stage | Owner keyword | Recommended action |",
    "|---|---|---|---:|---|---|---|---|---|",
    ...analysis.actionQueue.map((row) =>
      `| ${row.priority} | ${escapeTable(row.signal)} | ${escapeTable(row.query)} | ${row.searches} | ${escapeTable(row.system)} | ${escapeTable(row.module)} | ${escapeTable(row.stage)} | ${escapeTable(row.ownerKeyword)} | ${escapeTable(row.action)} |`,
    ),
    "",
    "## Top searches",
    "",
    "| Query | Searches | Zero results | Zero-result rate | Avg results | Owner keyword | Module / roadmap | Stage |",
    "|---|---:|---:|---:|---:|---|---|---|",
    ...analysis.topSearches.map((row) =>
      `| ${escapeTable(row.query)} | ${row.searches} | ${row.zeroResults} | ${row.zeroResultRate.toFixed(1)}% | ${row.avgResults.toFixed(1)} | ${escapeTable(row.ownerKeyword)} | ${escapeTable(row.module)} | ${escapeTable(row.stage)} |`,
    ),
    "",
    "## Top clicked results",
    "",
    "| Result | Clicks | Avg position | System | Type | Module / node | Stage | Owner keyword |",
    "|---|---:|---:|---|---|---|---|---|",
    ...analysis.topClicked.map((row) =>
      `| ${escapeTable(row.href)} | ${row.clicks} | ${row.avgPosition.toFixed(1)} | ${escapeTable(row.system)} | ${escapeTable(row.nodeType)} | ${escapeTable(row.module)} | ${escapeTable(row.stage)} | ${escapeTable(row.ownerKeyword)} |`,
    ),
    "",
    "## Interpretation boundaries",
    "",
    "This report uses aggregated internal-search counts only; it does not expose anonymous IDs or session IDs. A zero-result query without an Owner is a research signal, not an instruction to publish a new article. An owned zero-result query usually indicates search vocabulary/index coverage should be checked before content is created. A no-click query indicates result relevance or presentation should be reviewed before changing content architecture.",
    "",
  ];
  return lines.join("\n");
}
