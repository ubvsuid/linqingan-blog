import {
  buildResolverDemandRanking,
  resolverDemandMinimums,
  resolverDemandWeights,
} from "./resolver-demand-ranking.mjs";

export const resolverExpansionSelectionWeights = Object.freeze({
  search: Number((resolverDemandWeights.search / (resolverDemandWeights.search + resolverDemandWeights.gsc)).toFixed(5)),
  gsc: Number((resolverDemandWeights.gsc / (resolverDemandWeights.search + resolverDemandWeights.gsc)).toFixed(5)),
});

function asNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : 0;
}

function normalizedScore(value, maximum) {
  if (value === null) return null;
  if (maximum <= 0) return 0;
  return Number(((value / maximum) * 100).toFixed(2));
}

function weightedAvailableScore(componentScores, weights) {
  let numerator = 0;
  let denominator = 0;
  for (const [source, value] of Object.entries(componentScores)) {
    if (value === null) continue;
    const weight = weights[source] ?? 0;
    numerator += value * weight;
    denominator += weight;
  }
  return denominator > 0 ? Number((numerator / denominator).toFixed(2)) : 0;
}

function maxSignal(candidates, field) {
  return Math.max(0, ...candidates.map((candidate) => asNumber(candidate.rawSignals[field])));
}

function resolverContext(rows) {
  let starts = 0;
  let outcomes = 0;
  let downstreamClicks = 0;
  for (const row of rows ?? []) {
    starts += asNumber(row.starts);
    outcomes += asNumber(row.outcomes);
    downstreamClicks += asNumber(row.downstreamClicks ?? row.downstream_clicks);
  }
  return {
    starts,
    outcomes,
    downstreamClicks,
    outcomeRate: starts > 0 ? Number(((outcomes / starts) * 100).toFixed(2)) : 0,
    downstreamClickRate: outcomes > 0 ? Number(((downstreamClicks / outcomes) * 100).toFixed(2)) : 0,
  };
}

export function buildResolverExpansionRanking({
  resolverRows = null,
  searchRows = null,
  gscRows = null,
} = {}) {
  const base = buildResolverDemandRanking({ resolverRows, searchRows, gscRows });
  const covered = base.rankedCandidates.filter((candidate) => candidate.coverageStatus === "COVERED");
  const uncovered = base.rankedCandidates.filter((candidate) => candidate.coverageStatus === "UNCOVERED");

  const coveredMaximums = {
    resolver: maxSignal(covered, "resolverStarts"),
    search: maxSignal(covered, "searches"),
    gsc: maxSignal(covered, "gscImpressions"),
  };
  const uncoveredMaximums = {
    search: maxSignal(uncovered, "searches"),
    gsc: maxSignal(uncovered, "gscImpressions"),
  };

  const coveredFlowBenchmarks = covered
    .map((candidate) => {
      const componentScores = {
        resolver: base.sources.resolver.available
          ? normalizedScore(candidate.rawSignals.resolverStarts, coveredMaximums.resolver)
          : null,
        search: base.sources.search.available
          ? normalizedScore(candidate.rawSignals.searches, coveredMaximums.search)
          : null,
        gsc: base.sources.gsc.available
          ? normalizedScore(candidate.rawSignals.gscImpressions, coveredMaximums.gsc)
          : null,
      };
      return {
        candidateId: candidate.candidateId,
        coveredByFlowId: candidate.coveredByFlowId,
        rawSignals: candidate.rawSignals,
        componentScores,
        benchmarkScore: weightedAvailableScore(componentScores, resolverDemandWeights),
      };
    })
    .sort((left, right) =>
      right.benchmarkScore - left.benchmarkScore || left.candidateId.localeCompare(right.candidateId),
    );

  const uncoveredCandidates = uncovered
    .map((candidate) => {
      const componentScores = {
        search: base.sources.search.available
          ? normalizedScore(candidate.rawSignals.searches, uncoveredMaximums.search)
          : null,
        gsc: base.sources.gsc.available
          ? normalizedScore(candidate.rawSignals.gscImpressions, uncoveredMaximums.gsc)
          : null,
      };
      return {
        candidateId: candidate.candidateId,
        coverageStatus: "UNCOVERED",
        rawSignals: {
          searches: candidate.rawSignals.searches,
          gscImpressions: candidate.rawSignals.gscImpressions,
          gscClicks: candidate.rawSignals.gscClicks,
        },
        componentScores,
        expansionScore: weightedAvailableScore(componentScores, resolverExpansionSelectionWeights),
        mappingSources: {
          search: candidate.mappingSources.search,
          gsc: candidate.mappingSources.gsc,
        },
      };
    })
    .sort((left, right) =>
      right.expansionScore - left.expansionScore || left.candidateId.localeCompare(right.candidateId),
    );

  const uncoveredMatchedSearches = uncoveredCandidates.reduce(
    (sum, candidate) => sum + asNumber(candidate.rawSignals.searches),
    0,
  );
  const uncoveredMatchedGscImpressions = uncoveredCandidates.reduce(
    (sum, candidate) => sum + asNumber(candidate.rawSignals.gscImpressions),
    0,
  );
  const uncoveredMatchedGscClicks = uncoveredCandidates.reduce(
    (sum, candidate) => sum + asNumber(candidate.rawSignals.gscClicks),
    0,
  );

  const sources = {
    resolver: {
      ...base.sources.resolver,
      role: "readiness_gate_and_covered_flow_benchmark",
      sufficient:
        base.sources.resolver.available &&
        base.sources.resolver.totalStarts >= resolverDemandMinimums.resolverStarts,
    },
    search: {
      ...base.sources.search,
      role: "uncovered_candidate_ranker",
      uncoveredMatchedSearches,
      sufficient:
        base.sources.search.available &&
        uncoveredMatchedSearches >= resolverDemandMinimums.matchedSearches,
    },
    gsc: {
      ...base.sources.gsc,
      role: "uncovered_candidate_ranker",
      uncoveredMatchedImpressions: uncoveredMatchedGscImpressions,
      uncoveredMatchedClicks: uncoveredMatchedGscClicks,
      sufficient:
        base.sources.gsc.available &&
        uncoveredMatchedGscImpressions >= resolverDemandMinimums.matchedGscImpressions,
    },
  };

  const reasons = [];
  if (!sources.resolver.available) reasons.push("resolver_source_unavailable");
  else if (!sources.resolver.sufficient) reasons.push(`resolver_starts_below_${sources.resolver.minimum}`);
  if (!sources.search.available) reasons.push("search_source_unavailable");
  else if (!sources.search.sufficient) reasons.push(`uncovered_matched_searches_below_${sources.search.minimum}`);
  if (!sources.gsc.available) reasons.push("gsc_source_unavailable");
  else if (!sources.gsc.sufficient) reasons.push(`uncovered_matched_gsc_impressions_below_${sources.gsc.minimum}`);

  const first = uncoveredCandidates[0] ?? null;
  const second = uncoveredCandidates[1] ?? null;
  const winnerMargin = first
    ? Number((first.expansionScore - (second?.expansionScore ?? 0)).toFixed(2))
    : 0;
  const hasClearWinner =
    Boolean(first) &&
    first.expansionScore > 0 &&
    (!second || winnerMargin >= resolverDemandMinimums.winnerMargin);
  if (reasons.length === 0 && !hasClearWinner) reasons.push("no_clear_uncovered_winner");

  const status = reasons.length === 0 ? "READY" : "INSUFFICIENT_DATA";
  return {
    schemaVersion: 2,
    selectionMode: "uncovered-expansion-v2",
    sourceRoles: {
      resolver: "readiness_gate_and_covered_flow_benchmark",
      search: "uncovered_candidate_ranker",
      gsc: "uncovered_candidate_ranker",
    },
    benchmarkWeights: resolverDemandWeights,
    selectionWeights: resolverExpansionSelectionWeights,
    minimums: resolverDemandMinimums,
    sources,
    resolverContext: resolverContext(resolverRows),
    recommendation: {
      candidateId: status === "READY" ? first.candidateId : null,
      score: status === "READY" ? first.expansionScore : null,
      marginToNext: status === "READY" ? winnerMargin : null,
    },
    status,
    reasons,
    coveredFlowBenchmarks,
    uncoveredCandidates,
  };
}
