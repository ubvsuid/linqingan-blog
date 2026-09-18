"use client";

import { track } from "@vercel/analytics";
import Link from "next/link";
import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from "react";

import type { EnglishSearchDocument } from "@/lib/english-search";
import type { KnowledgeClusterHandoffSignal } from "@/lib/knowledge-cluster-handoff";
import {
  getKnowledgeGraphSearchAnchorEntityId,
  getKnowledgeGraphSearchSignalScore,
} from "@/lib/knowledge-graph-search-policy";
import { getScreepsIntentPromotions, type ScreepsEntityKind } from "@/lib/screeps-entity-intent";

const popularQueries = ["ERR_NOT_IN_RANGE", "creep not moving", "CPU bucket", "body calculator", "Memory cleanup"];

const featuredResources: EnglishSearchDocument[] = [
  {
    id: "featured-beginner",
    title: "Screeps Beginner Roadmap",
    description: "Follow a guided sequence from the first Creep to roles, upgrading, construction, and a complete first-room loop.",
    href: "/en/beginner",
    type: "Page",
    keywords: ["beginner", "first Creep", "learning path"],
  },
  {
    id: "featured-errors",
    title: "Screeps Error Codes and Return Values",
    description: "Look up common return codes before changing movement, spawning, market, construction, or Controller logic.",
    href: "/en/screeps-errors",
    type: "Reference",
    keywords: ["return code", "ERR_NOT_IN_RANGE", "ERR_NO_PATH"],
  },
  {
    id: "featured-knowledge",
    title: "Screeps Knowledge Base",
    description: "Browse curated modules for Memory, spawning, economy, movement, Controllers, defense, resources, and debugging.",
    href: "/en/knowledge",
    type: "Page",
    keywords: ["knowledge", "modules", "systems"],
  },
  {
    id: "featured-body-calculator",
    title: "Screeps Creep Body Calculator",
    description: "Calculate Energy cost, spawn time, hits, carry capacity, and loaded movement speed in the browser.",
    href: "/en/tools/creep-body-calculator",
    type: "Tool",
    keywords: ["body calculator", "creep cost", "MOVE ratio"],
  },
  {
    id: "featured-room-diagnostics",
    title: "Screeps Room Snapshot Diagnostic",
    description: "Check Spawn, workforce, Energy, Controller, construction, CPU, and bucket risks from a static room snapshot.",
    href: "/en/tools/room-diagnostics",
    type: "Tool",
    keywords: ["room diagnostics", "CPU bucket", "Controller downgrade"],
  },
  {
    id: "featured-guides",
    title: "English Screeps Guide Library",
    description: "Browse all published English guides with filters for system, difficulty, content type, and topic.",
    href: "/en/blog",
    type: "Page",
    keywords: ["guides", "articles", "Screeps tutorials"],
  },
];

function normalize(value: string): string {
  return value.normalize("NFKC").trim().toLocaleLowerCase("en");
}

function tokenizeQuery(value: string): string[] {
  return normalize(value).split(/[^a-z0-9_-]+/).filter(Boolean);
}

function intentDocumentType(kind: ScreepsEntityKind): EnglishSearchDocument["type"] {
  if (kind === "guide") return "Article";
  if (kind === "tool") return "Tool";
  return "Reference";
}

function editDistance(left: string, right: string): number {
  const rows = Array.from({ length: left.length + 1 }, () => Array(right.length + 1).fill(0));
  for (let index = 0; index <= left.length; index += 1) rows[index][0] = index;
  for (let index = 0; index <= right.length; index += 1) rows[0][index] = index;
  for (let row = 1; row <= left.length; row += 1) {
    for (let column = 1; column <= right.length; column += 1) {
      rows[row][column] = Math.min(
        rows[row - 1][column] + 1,
        rows[row][column - 1] + 1,
        rows[row - 1][column - 1] + (left[row - 1] === right[column - 1] ? 0 : 1),
      );
    }
  }
  return rows[left.length][right.length];
}

function fuzzyTokenMatch(token: string, words: string[]): boolean {
  if (token.length < 4) return false;
  return words.some((word) => Math.abs(word.length - token.length) <= 1 && editDistance(token, word) <= 1);
}

function Highlight({ text, query }: { text: string; query: string }) {
  const token = tokenizeQuery(query)[0];
  if (!token) return text;
  const expression = new RegExp(`(${token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "ig");
  return text.split(expression).map((part, index) =>
    part.toLowerCase() === token.toLowerCase()
      ? <mark key={`${part}-${index}`}>{part}</mark>
      : <Fragment key={`${part}-${index}`}>{part}</Fragment>,
  );
}

export function EnglishSiteSearch({
  initialQuery = "",
  initialDocuments = [],
  clusterHandoffs = [],
}: {
  initialQuery?: string;
  initialDocuments?: EnglishSearchDocument[];
  clusterHandoffs?: readonly KnowledgeClusterHandoffSignal[];
}) {
  const [query, setQuery] = useState(initialQuery);
  const [type, setType] = useState("");
  const [documents, setDocuments] = useState<EnglishSearchDocument[]>(initialDocuments);
  const [fullIndexLoaded, setFullIndexLoaded] = useState(false);
  const [loadState, setLoadState] = useState<"idle" | "loading" | "ready" | "error">(
    initialDocuments.length > 0 ? "ready" : "idle",
  );
  const inputRef = useRef<HTMLInputElement>(null);
  const loadingRef = useRef(false);
  const lastTrackedZeroQueryRef = useRef("");
  const normalizedQuery = normalize(query);

  const loadSearchIndex = useCallback(async () => {
    if (fullIndexLoaded || loadingRef.current) return;

    loadingRef.current = true;
    setLoadState("loading");

    try {
      const response = await fetch("/en/search-index.json", {
        headers: { Accept: "application/json" },
      });
      if (!response.ok) throw new Error(`Search index request failed with ${response.status}`);
      const payload: unknown = await response.json();
      if (!Array.isArray(payload)) throw new Error("Search index response is not an array");
      setDocuments(payload as EnglishSearchDocument[]);
      setFullIndexLoaded(true);
      setLoadState("ready");
    } catch {
      setLoadState("error");
    } finally {
      loadingRef.current = false;
    }
  }, [fullIndexLoaded]);

  useEffect(() => {
    const handleShortcut = (event: KeyboardEvent) => {
      if (event.key !== "/" || event.metaKey || event.ctrlKey || event.altKey) return;
      const target = event.target;
      if (target instanceof HTMLElement && (target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName))) return;
      event.preventDefault();
      inputRef.current?.focus();
      void loadSearchIndex();
    };
    window.addEventListener("keydown", handleShortcut);
    return () => window.removeEventListener("keydown", handleShortcut);
  }, [loadSearchIndex]);

  useEffect(() => {
    const delay = normalizedQuery || type ? 0 : 1200;
    const timer = window.setTimeout(() => {
      void loadSearchIndex();
    }, delay);
    return () => window.clearTimeout(timer);
  }, [loadSearchIndex, normalizedQuery, type]);

  const results = useMemo(() => {
    const tokens = tokenizeQuery(query);
    const sourceDocuments = normalizedQuery || type ? documents : featuredResources;

    if (!normalizedQuery) {
      const filtered = type ? sourceDocuments.filter((document) => document.type === type) : sourceDocuments;
      return filtered.slice(0, 12);
    }

    const promotions = getScreepsIntentPromotions(query, "en", 8);
    const availableGraphAnchorEntityIds = new Set(
      sourceDocuments.flatMap((document) =>
        document.graphSearch?.map((signal) => signal.anchorEntityId) ?? [],
      ),
    );
    const graphAnchorEntityId = getKnowledgeGraphSearchAnchorEntityId(
      promotions,
      availableGraphAnchorEntityIds,
    );
    const promotionScoreByHref = new Map(promotions.map((promotion) => [promotion.href, promotion.score]));
    const intentOrderByHref = new Map(
      promotions
        .filter((promotion) => !type || intentDocumentType(promotion.kind) === type)
        .map((promotion, index) => [promotion.href, index] as const),
    );
    const mergedByHref = new Map(sourceDocuments.map((document) => [document.href, document]));

    for (const promotion of promotions) {
      if (mergedByHref.has(promotion.href)) continue;
      mergedByHref.set(promotion.href, {
        id: `intent:${promotion.entityId}`,
        title: promotion.title,
        description: promotion.description,
        href: promotion.href,
        type: intentDocumentType(promotion.kind),
        keywords: [...promotion.aliases],
      });
    }

    const filteredByType = type
      ? [...mergedByHref.values()].filter((document) => document.type === type)
      : [...mergedByHref.values()];

    return filteredByType
      .map((document) => {
        const title = normalize(document.title);
        const description = normalize(document.description);
        const keywords = normalize(document.keywords.join(" "));
        const words = `${title} ${description} ${keywords}`.split(/[^a-z0-9_-]+/).filter(Boolean);
        let score = promotionScoreByHref.get(document.href) ?? 0;

        for (const token of tokens) {
          if (title === token) score += 25;
          else if (title.includes(token)) score += 10;
          if (keywords.includes(token)) score += 6;
          if (description.includes(token)) score += 3;
          if (!`${title} ${description} ${keywords}`.includes(token) && fuzzyTokenMatch(token, words)) score += 2;
        }

        const graphScore = getKnowledgeGraphSearchSignalScore(
          document.graphSearch,
          graphAnchorEntityId,
        );

        return { document, score, graphScore };
      })
      .filter((item) => item.score > 0 || item.graphScore > 0)
      .sort((left, right) => {
        if (graphAnchorEntityId) {
          const leftIntentOrder = intentOrderByHref.get(left.document.href);
          const rightIntentOrder = intentOrderByHref.get(right.document.href);
          if (leftIntentOrder !== undefined || rightIntentOrder !== undefined) {
            if (leftIntentOrder === undefined) return 1;
            if (rightIntentOrder === undefined) return -1;
            if (leftIntentOrder !== rightIntentOrder) return leftIntentOrder - rightIntentOrder;
          }

          if (left.graphScore !== right.graphScore) return right.graphScore - left.graphScore;
        }

        return right.score - left.score;
      })
      .map((item) => item.document);
  }, [documents, normalizedQuery, query, type]);

  const activeClusterHandoff = useMemo(() => {
    if (!normalizedQuery || documents.length === 0) return null;
    const promotions = getScreepsIntentPromotions(query, "en", 8);
    const availableGraphAnchorEntityIds = new Set(
      documents.flatMap((document) =>
        document.graphSearch?.map((signal) => signal.anchorEntityId) ?? [],
      ),
    );
    const graphAnchorEntityId = getKnowledgeGraphSearchAnchorEntityId(
      promotions,
      availableGraphAnchorEntityIds,
    );
    if (!graphAnchorEntityId) return null;
    return clusterHandoffs.find((handoff) =>
      handoff.anchorEntityIds.includes(graphAnchorEntityId),
    ) ?? null;
  }, [clusterHandoffs, documents, normalizedQuery, query]);

  function updateQuery(value: string) {
    setQuery(value);
    const url = new URL(window.location.href);
    if (value.trim()) url.searchParams.set("q", value.trim());
    else url.searchParams.delete("q");
    window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
  }

  const waitingForIndex = Boolean(normalizedQuery || type)
    && documents.length === 0
    && (loadState === "idle" || loadState === "loading");

  useEffect(() => {
    if (!fullIndexLoaded || waitingForIndex || !normalizedQuery || results.length > 0) return;
    const eventKey = `${normalizedQuery}:${type || "all"}`;
    if (lastTrackedZeroQueryRef.current === eventKey) return;
    lastTrackedZeroQueryRef.current = eventKey;
    track("english_search_zero_results", {
      query: normalizedQuery.slice(0, 80),
      resourceType: type || "all",
    });
  }, [fullIndexLoaded, normalizedQuery, results.length, type, waitingForIndex]);

  const missingResourceHref = useMemo(() => {
    const params = new URLSearchParams({
      title: `Missing English search result: ${query.trim().slice(0, 80)}`,
      body: [
        "## Search query",
        query.trim(),
        "",
        "## Expected resource",
        "Describe the Screeps API, return code, symptom, or guide you expected to find.",
      ].join("\n"),
    });
    return `https://github.com/ubvsuid/linqingan-blog/issues/new?${params.toString()}`;
  }, [query]);

  return (
    <div className="english-site-search">
      <div className="english-search-toolbar">
        <label className="english-search-field">
          <span>Search the English section <small>Press <kbd>/</kbd> to focus</small></span>
          <div>
            <input
              ref={inputRef}
              type="search"
              value={query}
              onFocus={() => void loadSearchIndex()}
              onChange={(event) => updateQuery(event.target.value)}
              placeholder="Try: ERR_NOT_IN_RANGE, body calculator, CPU bucket"
            />
            {query ? <button type="button" onClick={() => updateQuery("")}>Clear</button> : null}
          </div>
        </label>
        <label className="english-search-type">
          <span>Resource type</span>
          <select value={type} onFocus={() => void loadSearchIndex()} onChange={(event) => setType(event.target.value)}>
            <option value="">All resources</option>
            <option value="Article">Articles</option>
            <option value="Tool">Tools</option>
            <option value="Reference">References</option>
            <option value="Page">Pages</option>
          </select>
        </label>
      </div>

      {!normalizedQuery ? (
        <div className="english-popular-searches" aria-label="Popular English searches">
          <span>Popular searches</span>
          {popularQueries.map((item) => <button type="button" key={item} onClick={() => { void loadSearchIndex(); updateQuery(item); }}>{item}</button>)}
        </div>
      ) : null}

      <p className="english-search-summary" aria-live="polite">
        {waitingForIndex
          ? "Loading the English search index…"
          : normalizedQuery
            ? `${results.length} matching result${results.length === 1 ? "" : "s"}`
            : "Recommended English resources"}
      </p>

      {normalizedQuery && activeClusterHandoff ? (
        <aside className="english-search-empty" aria-label="Knowledge Cluster handoff">
          <strong>Continue in the complete problem space: {activeClusterHandoff.title}</strong>
          <p>{activeClusterHandoff.description} This handoff is derived from the same high-confidence canonical entity anchor; it does not change search ranking.</p>
          <div><Link href={activeClusterHandoff.href} prefetch={false}>Open the Knowledge Cluster →</Link></div>
        </aside>
      ) : null}

      {loadState === "error" && (normalizedQuery || type) && documents.length === 0 ? (
        <div className="english-search-empty">
          <strong>The search index could not load.</strong>
          <p>Retry the index request, or continue with the roadmap, knowledge modules, references, and tools below.</p>
          <div><button type="button" onClick={() => { setLoadState("idle"); void loadSearchIndex(); }}>Retry search</button><Link href="/en/beginner" prefetch={false}>Beginner roadmap</Link><Link href="/en/knowledge" prefetch={false}>Knowledge modules</Link></div>
        </div>
      ) : waitingForIndex ? (
        <div className="english-search-loading" role="status">Preparing searchable guides, tools, references, and topic pages…</div>
      ) : results.length > 0 ? (
        <div className="english-search-results">
          {results.map((result) => (
            <article key={result.id}>
              <span>{result.type}</span>
              <h2><Link href={result.href} prefetch={false}><Highlight text={result.title} query={query} /></Link></h2>
              <p>{result.description}</p>
              <div>{result.keywords.slice(0, 5).map((keyword) => <small key={keyword}>{keyword}</small>)}</div>
            </article>
          ))}
        </div>
      ) : (
        <div className="english-search-empty">
          <strong>No resource matches “{query.trim()}”.</strong>
          <p>This zero-result query has been anonymously recorded. Try an API method, return code, object name, symptom, or broader knowledge topic.</p>
          <div><a href={missingResourceHref} target="_blank" rel="noreferrer">Request this guide ↗</a><Link href="/en/beginner" prefetch={false}>Beginner roadmap</Link><Link href="/en/knowledge" prefetch={false}>Knowledge modules</Link><Link href="/en/screeps-errors" prefetch={false}>Error codes</Link><Link href="/en/blog" prefetch={false}>All guides</Link></div>
        </div>
      )}
    </div>
  );
}
