import fs from "node:fs";

const filePath = "src/components/site-search.tsx";
let source = fs.readFileSync(filePath, "utf8");

source = source.replace(
  `  useEffect(() => {
    setActiveSuggestionIndex(-1);
  }, [normalizedQuery]);

`,
  "",
);

source = source.replace(
  `  function updateQuery(value: string) {
    setQuery(value);`,
  `  function updateQuery(value: string) {
    setActiveSuggestionIndex(-1);
    setQuery(value);`,
);

source = source.replace(
  `(normalizedQuery ? suggestions : popularSearches).map((item) => {`,
  `(normalizedQuery ? suggestions : popularSearches).map((item, itemIndex) => {`,
);

source = source.replace(
  'id={`search-suggestion-${typeof item === "string" ? 0 : suggestions.indexOf(item)}`}',
  'id={`search-suggestion-${itemIndex}`}',
);

fs.writeFileSync(filePath, source);
console.log("Final search interaction corrections applied.");
