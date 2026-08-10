const baseUrl = process.env.BASE_URL || "http://127.0.0.1:3000";
const failures = [];

async function readSearch(query) {
  const pathname = `/api/search?q=${encodeURIComponent(query)}&limit=40`;
  const response = await fetch(`${baseUrl}${pathname}`);

  if (response.status !== 200) {
    failures.push(`${pathname}: expected 200, received ${response.status}`);
    return null;
  }

  if (response.headers.get("x-search-version") !== "2") {
    failures.push(`${pathname}: missing X-Search-Version: 2`);
  }

  const source = response.headers.get("x-search-source");
  if (source !== "static" && source !== "database") {
    failures.push(`${pathname}: invalid X-Search-Source ${source ?? "<missing>"}`);
  }

  let payload;
  try {
    payload = await response.json();
  } catch {
    failures.push(`${pathname}: response is not valid JSON`);
    return null;
  }

  if (!payload || !Array.isArray(payload.results)) {
    failures.push(`${pathname}: payload.results must be an array`);
    return null;
  }

  if (payload.results.length > 40) {
    failures.push(`${pathname}: returned ${payload.results.length} results, exceeding the 40-result window`);
  }

  if (payload.total !== payload.results.length) {
    failures.push(`${pathname}: payload.total does not match results.length`);
  }

  if (payload.source !== source) {
    failures.push(`${pathname}: body source ${payload.source} does not match response header ${source}`);
  }

  for (const result of payload.results) {
    for (const field of ["id", "type", "title", "description", "href"]) {
      if (typeof result?.[field] !== "string") {
        failures.push(`${pathname}: every result must expose string field ${field}`);
        break;
      }
    }
  }

  return payload;
}

const controller = await readSearch("controller");
const errorCode = await readSearch("ERR_NOT_IN_RANGE");
const chinese = await readSearch("控制器");

if (controller && controller.results.length === 0) {
  failures.push("Search V2: controller should return at least one result");
}
if (errorCode && !errorCode.results.some((result) => result.title.includes("ERR_NOT_IN_RANGE"))) {
  failures.push("Search V2: ERR_NOT_IN_RANGE should surface a matching result");
}
if (chinese && chinese.results.length === 0) {
  failures.push("Search V2: Chinese synonym query 控制器 should return at least one result");
}

const legacyIndex = await fetch(`${baseUrl}/api/search-index`);
if (legacyIndex.status !== 200) {
  failures.push(`/api/search-index: rollback index must remain available, received ${legacyIndex.status}`);
}

if (failures.length > 0) {
  for (const failure of failures) console.error(`ERROR: ${failure}`);
  console.error(`Search V2 smoke test failed: ${failures.length} issue(s).`);
  process.exit(1);
}

console.log("Search V2 smoke test passed: version/source headers, response contract, bounded result window, representative English/Chinese queries, and legacy fallback index are healthy.");
