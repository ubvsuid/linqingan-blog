export const resolverDemandWeights = Object.freeze({
  resolver: 0.45,
  search: 0.30,
  gsc: 0.25,
});

export const resolverDemandMinimums = Object.freeze({
  resolverStarts: 20,
  matchedSearches: 10,
  matchedGscImpressions: 50,
  winnerMargin: 5,
});

export const resolverDemandCandidates = Object.freeze([
  {
    candidateId: "spawn-not-spawning",
    coveredByFlowId: "spawn-not-working",
    patterns: [
      "spawn not spawning",
      "spawn not working",
      "spawncreep",
      "spawn creep failed",
      "err busy spawn",
      "err name exists spawn",
      "spawn 不工作",
      "spawn 不生产",
      "spawn 生成 creep 失败",
    ],
  },
  {
    candidateId: "creep-not-moving",
    coveredByFlowId: "creep-not-moving",
    patterns: [
      "creep not moving",
      "moveto no path",
      "move to no path",
      "creep fatigue",
      "err no path",
      "creep 不移动",
      "creep 不走",
      "移动 没有路径",
    ],
  },
  {
    candidateId: "creep-not-harvesting",
    coveredByFlowId: "creep-not-harvesting",
    patterns: [
      "creep not harvesting",
      "harvest not working",
      "harvest failed",
      "creep harvest failed",
      "creep 不采集",
      "采集 不工作",
      "harvest 失败",
    ],
  },
  {
    candidateId: "controller-downgrade",
    coveredByFlowId: "creep-not-upgrading",
    patterns: [
      "creep not upgrading controller",
      "upgradecontroller",
      "upgrade controller failed",
      "controller downgrade",
      "controller not upgrading",
      "creep 不升级 controller",
      "控制器 不升级",
      "控制器 降级",
    ],
  },
  {
    candidateId: "lab-boost-failed",
    coveredByFlowId: "lab-boost-failed",
    patterns: [
      "boostcreep",
      "lab boost failed",
      "boost creep failed",
      "lab boost not working",
      "lab 强化 失败",
      "boost 失败",
      "boost creep 不工作",
    ],
  },
  {
    candidateId: "cpu-too-high",
    coveredByFlowId: "cpu-bucket-abnormal",
    patterns: [
      "cpu bucket",
      "bucket low",
      "cpu limit",
      "cpu too high",
      "cpu used high",
      "cpu bucket 异常",
      "cpu 太高",
      "bucket 太低",
    ],
  },
  {
    candidateId: "builder-not-building",
    coveredByFlowId: null,
    patterns: [
      "builder not building",
      "creep build failed",
      "build not working",
      "builder stopped building",
      "builder 不建造",
      "建造 creep 不工作",
      "build 失败",
    ],
  },
  {
    candidateId: "tower-not-acting",
    coveredByFlowId: null,
    patterns: [
      "tower not attacking",
      "tower not repairing",
      "tower not healing",
      "tower not working",
      "tower attack failed",
      "tower 不攻击",
      "tower 不维修",
      "tower 不治疗",
    ],
  },
  {
    candidateId: "resources-not-moving",
    coveredByFlowId: null,
    patterns: [
      "resource transfer failed",
      "creep transfer not working",
      "withdraw not working",
      "hauling stuck",
      "resource hauling stuck",
      "资源 不移动",
      "资源 搬运 失败",
      "物流 卡住",
    ],
  },
  {
    candidateId: "link-not-transferring",
    coveredByFlowId: null,
    patterns: [
      "link transferenergy",
      "link transfer energy",
      "link not transferring",
      "structurelink transfer",
      "link 不传能",
      "link 传输 失败",
    ],
  },
  {
    candidateId: "market-action-failed",
    coveredByFlowId: null,
    patterns: [
      "market deal failed",
      "market order failed",
      "createorder failed",
      "create order failed",
      "terminal send failed",
      "市场 交易 失败",
      "市场 订单 失败",
      "terminal 发送 失败",
    ],
  },
]);

function asNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : 0;
}

function normalizeDemandText(value) {
  return String(value ?? "")
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[_./()]+/g, " ")
    .replace(/[^\p{L}\p{N}\s-]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function mapResolverDemandText(value) {
  const normalized = normalizeDemandText(value);
  if (!normalized) return null;

  const matches = [];
  for (const candidate of resolverDemandCandidates) {
    candidate.patterns.forEach((pattern, patternIndex) => {
      const normalizedPattern = normalizeDemandText(pattern);
      if (
        normalized === normalizedPattern ||
        normalized.includes(normalizedPattern)
      ) {
        matches.push({
          candidateId: candidate.candidateId,
          mappingSource: "explicit-keyword-v1",
          patternId: `${candidate.candidateId}:${patternIndex + 1}`,
          specificity: normalizedPattern.length,
        });
      }
    });
  }

  matches.sort(
    (left, right) =>
      right.specificity - left.specificity ||
      left.candidateId.localeCompare(right.candidateId) ||
      left.patternId.localeCompare(right.patternId),
  );
  return matches[0] ?? null;
}

function emptyMetricMap() {
  return new Map(resolverDemandCandidates.map((candidate) => [candidate.candidateId, 0]));
}

function aggregateResolverRows(rows) {
  const startsByFlow = new Map();
  let totalStarts = 0;
  let mappedStarts = 0;

  for (const row of rows ?? []) {
    const starts = asNumber(row.starts);
    totalStarts += starts;
    const flowId = String(row.flowId ?? row.flow_id ?? "");
    if (!flowId) continue;
    startsByFlow.set(flowId, (startsByFlow.get(flowId) ?? 0) + starts);
    if (resolverDemandCandidates.some((candidate) => candidate.coveredByFlowId === flowId)) {
      mappedStarts += starts;
    }
  }

  return { startsByFlow, totalStarts, mappedStarts, unmappedStarts: Math.max(0, totalStarts - mappedStarts) };
}

function aggregateSearchRows(rows) {
  const searchesByCandidate = emptyMetricMap();
  let totalSearches = 0;
  let matchedSearches = 0;
  let mappedRows = 0;

  for (const row of rows ?? []) {
    const searches = asNumber(row.searches);
    totalSearches += searches;
    const mapping = mapResolverDemandText(row.query ?? row.normalized_query ?? row.normalizedQuery);
    if (!mapping) continue;
    searchesByCandidate.set(mapping.candidateId, (searchesByCandidate.get(mapping.candidateId) ?? 0) + searches);
    matchedSearches += searches;
    mappedRows += 1;
  }

  return {
    searchesByCandidate,
    totalSearches,
    matchedSearches,
    unmappedSearches: Math.max(0, totalSearches - matchedSearches),
    mappedRows,
  };
}

function aggregateGscRows(rows) {
  const impressionsByCandidate = emptyMetricMap();
  const clicksByCandidate = emptyMetricMap();
  let totalImpressions = 0;
  let matchedImpressions = 0;
  let totalClicks = 0;
  let matchedClicks = 0;
  let mappedRows = 0;

  for (const row of rows ?? []) {
    const impressions = asNumber(row.impressions);
    const clicks = asNumber(row.clicks);
    totalImpressions += impressions;
    totalClicks += clicks;
    const mapping = mapResolverDemandText(row.query);
    if (!mapping) continue;
    impressionsByCandidate.set(
      mapping.candidateId,
      (impressionsByCandidate.get(mapping.candidateId) ?? 0) + impressions,
    );
    clicksByCandidate.set(
      mapping.candidateId,
      (clicksByCandidate.get(mapping.candidateId) ?? 0) + clicks,
    );
    matchedImpressions += impressions;
    matchedClicks += clicks;
    mappedRows += 1;
  }

  return {
    impressionsByCandidate,
    clicksByCandidate,
    totalImpressions,
    matchedImpressions,
    unmappedImpressions: Math.max(0, totalImpressions - matchedImpressions),
    totalClicks,
    matchedClicks,
    mappedRows,
  };
}

function normalizedScore(value, maximum) {
  if (value === null) return null;
  if (maximum <= 0) return 0;
  return Number(((value / maximum) * 100).toFixed(2));
}

function weightedScore(parts) {
  let numerator = 0;
  let denominator = 0;
  for (const [source, value] of Object.entries(parts)) {
    if (value === null) continue;
    const weight = resolverDemandWeights[source];
    numerator += value * weight;
    denominator += weight;
  }
  return denominator > 0 ? Number((numerator / denominator).toFixed(2)) : 0;
}

export function buildResolverDemandRanking({
  resolverRows = null,
  searchRows = null,
  gscRows = null,
} = {}) {
  const resolverAvailable = Array.isArray(resolverRows);
  const searchAvailable = Array.isArray(searchRows);
  const gscAvailable = Array.isArray(gscRows);

  const resolver = aggregateResolverRows(resolverRows);
  const search = aggregateSearchRows(searchRows);
  const gsc = aggregateGscRows(gscRows);

  const resolverMaximum = Math.max(
    0,
    ...resolverDemandCandidates
      .filter((candidate) => candidate.coveredByFlowId)
      .map((candidate) => resolver.startsByFlow.get(candidate.coveredByFlowId) ?? 0),
  );
  const searchMaximum = Math.max(0, ...search.searchesByCandidate.values());
  const gscMaximum = Math.max(0, ...gsc.impressionsByCandidate.values());

  const rankedCandidates = resolverDemandCandidates.map((candidate) => {
    const resolverRaw = candidate.coveredByFlowId
      ? resolverAvailable
        ? resolver.startsByFlow.get(candidate.coveredByFlowId) ?? 0
        : null
      : null;
    const searchRaw = searchAvailable ? search.searchesByCandidate.get(candidate.candidateId) ?? 0 : null;
    const gscImpressions = gscAvailable ? gsc.impressionsByCandidate.get(candidate.candidateId) ?? 0 : null;
    const gscClicks = gscAvailable ? gsc.clicksByCandidate.get(candidate.candidateId) ?? 0 : null;

    const componentScores = {
      resolver: normalizedScore(resolverRaw, resolverMaximum),
      search: normalizedScore(searchRaw, searchMaximum),
      gsc: normalizedScore(gscImpressions, gscMaximum),
    };

    return {
      candidateId: candidate.candidateId,
      coverageStatus: candidate.coveredByFlowId ? "COVERED" : "UNCOVERED",
      coveredByFlowId: candidate.coveredByFlowId,
      rawSignals: {
        resolverStarts: resolverRaw,
        searches: searchRaw,
        gscImpressions,
        gscClicks,
      },
      componentScores,
      score: weightedScore(componentScores),
      mappingSources: {
        resolver: candidate.coveredByFlowId ? `flow:${candidate.coveredByFlowId}` : "not-applicable-uncovered",
        search: "explicit-keyword-v1",
        gsc: "explicit-keyword-v1",
      },
    };
  }).sort(
    (left, right) =>
      right.score - left.score ||
      left.candidateId.localeCompare(right.candidateId),
  );

  const uncoveredCandidates = rankedCandidates
    .filter((candidate) => candidate.coverageStatus === "UNCOVERED")
    .sort(
      (left, right) =>
        right.score - left.score ||
        left.candidateId.localeCompare(right.candidateId),
    );

  const sources = {
    resolver: {
      available: resolverAvailable,
      sufficient: resolverAvailable && resolver.totalStarts >= resolverDemandMinimums.resolverStarts,
      totalStarts: resolver.totalStarts,
      mappedStarts: resolver.mappedStarts,
      unmappedStarts: resolver.unmappedStarts,
      minimum: resolverDemandMinimums.resolverStarts,
    },
    search: {
      available: searchAvailable,
      sufficient: searchAvailable && search.matchedSearches >= resolverDemandMinimums.matchedSearches,
      totalSearches: search.totalSearches,
      matchedSearches: search.matchedSearches,
      unmappedSearches: search.unmappedSearches,
      mappedRows: search.mappedRows,
      minimum: resolverDemandMinimums.matchedSearches,
    },
    gsc: {
      available: gscAvailable,
      sufficient: gscAvailable && gsc.matchedImpressions >= resolverDemandMinimums.matchedGscImpressions,
      totalImpressions: gsc.totalImpressions,
      matchedImpressions: gsc.matchedImpressions,
      unmappedImpressions: gsc.unmappedImpressions,
      totalClicks: gsc.totalClicks,
      matchedClicks: gsc.matchedClicks,
      mappedRows: gsc.mappedRows,
      minimum: resolverDemandMinimums.matchedGscImpressions,
    },
  };

  const reasons = [];
  if (!sources.resolver.available) reasons.push("resolver_source_unavailable");
  else if (!sources.resolver.sufficient) reasons.push(`resolver_starts_below_${sources.resolver.minimum}`);
  if (!sources.search.available) reasons.push("search_source_unavailable");
  else if (!sources.search.sufficient) reasons.push(`matched_searches_below_${sources.search.minimum}`);
  if (!sources.gsc.available) reasons.push("gsc_source_unavailable");
  else if (!sources.gsc.sufficient) reasons.push(`matched_gsc_impressions_below_${sources.gsc.minimum}`);

  const first = uncoveredCandidates[0] ?? null;
  const second = uncoveredCandidates[1] ?? null;
  const winnerMargin = first
    ? Number((first.score - (second?.score ?? 0)).toFixed(2))
    : 0;
  const hasClearWinner =
    Boolean(first) &&
    first.score > 0 &&
    (!second || winnerMargin >= resolverDemandMinimums.winnerMargin);
  if (reasons.length === 0 && !hasClearWinner) reasons.push("no_clear_uncovered_winner");

  const status = reasons.length === 0 ? "READY" : "INSUFFICIENT_DATA";

  return {
    schemaVersion: 1,
    status,
    reasons,
    weights: resolverDemandWeights,
    minimums: resolverDemandMinimums,
    sources,
    recommendation: {
      candidateId: status === "READY" ? first.candidateId : null,
      score: status === "READY" ? first.score : null,
      marginToNext: status === "READY" ? winnerMargin : null,
    },
    rankedCandidates,
    uncoveredCandidates,
  };
}
