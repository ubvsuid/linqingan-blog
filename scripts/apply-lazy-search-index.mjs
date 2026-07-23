import fs from "node:fs";

const filePath = "src/components/site-search.tsx";
let source = fs.readFileSync(filePath, "utf8");

if (!source.includes("fullIndexRequested")) {
  source = source.replace(
    '  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1);',
    `  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1);
  const [expandedDocuments, setExpandedDocuments] = useState<SearchDocument[] | null>(null);
  const [isLoadingFullIndex, setIsLoadingFullIndex] = useState(false);
  const fullIndexRequested = useRef(false);`,
  );

  source = source.replace(
    `  const inputRef = useRef<HTMLInputElement>(null);
  const normalizedQuery = normalize(query);`,
    `  const inputRef = useRef<HTMLInputElement>(null);
  const normalizedQuery = normalize(query);
  const searchableDocuments = expandedDocuments ?? documents;`,
  );

  source = source.replace(
    '    if (!normalizedQuery) return documents;',
    '    if (!normalizedQuery) return searchableDocuments;',
  );
  source = source.replace(
    '    return documents\n      .map((document)',
    '    return searchableDocuments\n      .map((document)',
  );
  source = source.replace(
    '  }, [documents, normalizedQuery]);',
    '  }, [normalizedQuery, searchableDocuments]);',
  );

  source = source.replace(
    `  useEffect(() => {
    if (!normalizedQuery) return;
    const timeout = window.setTimeout(() => {`,
    `  useEffect(() => {
    if (!normalizedQuery || fullIndexRequested.current) return;
    const controller = new AbortController();
    const timeout = window.setTimeout(() => {
      fullIndexRequested.current = true;
      setIsLoadingFullIndex(true);
      fetch("/api/search-index", { signal: controller.signal })
        .then((response) => {
          if (!response.ok) throw new Error(\`Search index request failed: \${response.status}\`);
          return response.json();
        })
        .then((payload) => {
          if (Array.isArray(payload)) setExpandedDocuments(payload);
        })
        .catch(() => {
          fullIndexRequested.current = false;
        })
        .finally(() => setIsLoadingFullIndex(false));
    }, 220);
    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [normalizedQuery]);

  useEffect(() => {
    if (!normalizedQuery) return;
    const timeout = window.setTimeout(() => {`,
  );

  source = source.replace(
    `      </label>

      <div className="site-search-filters"`,
    `      </label>

      <p className="search-index-status" aria-live="polite">
        {isLoadingFullIndex ? "正在加载文章正文索引…" : normalizedQuery && expandedDocuments ? "已启用全文搜索" : ""}
      </p>

      <div className="site-search-filters"`,
  );

  source = source.replace(
    `        .site-search-filters {`,
    `        .search-index-status { min-height: 20px; margin: -8px 0 12px; color: var(--muted); font-size: 12px; }
        .site-search-filters {`,
  );
}

fs.writeFileSync(filePath, source);
console.log("Delayed full-text search index loading applied.");
