const baseUrl = process.env.BASE_URL || "http://127.0.0.1:3000";
const failures = [];

async function readPage(pathname) {
  const response = await fetch(`${baseUrl}${pathname}`);
  if (response.status !== 200) {
    failures.push(`${pathname}: expected 200, received ${response.status}`);
    return "";
  }
  return response.text();
}

function expectIncludes(html, value, label) {
  if (!html.includes(value)) failures.push(`${label}: missing ${value}`);
}

function expectExcludes(html, value, label) {
  if (html.includes(value)) failures.push(`${label}: unexpectedly contained ${value}`);
}

async function postTelemetry(body) {
  return fetch(`${baseUrl}/api/search-v3/event`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Platform-Smoke-Test": "1",
    },
    body: JSON.stringify(body),
  });
}

const chineseMovement = await readPage(`/search?q=${encodeURIComponent("Creep 不动")}`);
expectIncludes(chineseMovement, 'data-search-route-v1="symptom"', "Chinese symptom route");
expectIncludes(chineseMovement, "/resolver?doctor=creep-not-moving#screeps-doctor", "Chinese Doctor action");
expectIncludes(chineseMovement, "/resolver?flow=creep-not-moving#problem-resolver-zh", "Chinese Resolver action");
expectIncludes(chineseMovement, "site-search-results", "Chinese Search V2 preservation");

const englishController = await readPage(`/en/search?q=${encodeURIComponent("controller about to downgrade")}`);
expectIncludes(englishController, 'data-search-route-v1="symptom"', "English resolver symptom route");
expectIncludes(englishController, "/en/resolver?flow=creep-not-upgrading#problem-resolver-en", "English Resolver action");
expectIncludes(englishController, "english-search-results", "English Search V2 preservation");

const englishError = await readPage(`/en/search?q=${encodeURIComponent("ERR_NOT_IN_RANGE")}`);
expectIncludes(englishError, 'data-search-route-v1="error"', "English return-code route");
expectIncludes(englishError, "/en/screeps-errors#err_not_in_range", "English return-code action");
expectExcludes(englishError, "?doctor=", "Standalone return code Doctor boundary");

const compoundSpawn = await readPage(`/en/search?q=${encodeURIComponent("spawn returns -6")}`);
expectIncludes(compoundSpawn, 'data-search-route-entity="symptom:spawn-not-spawning"', "Compound Spawn symptom route");
expectIncludes(compoundSpawn, "/en/resolver?doctor=spawn-not-working#screeps-doctor", "Compound Spawn Doctor action");

const arena = await readPage(`/en/search?q=${encodeURIComponent("Screeps Arena spawnCreep")}`);
expectIncludes(arena, 'data-search-route-v1="api"', "Arena API route");
expectIncludes(arena, "/en/blog/screeps-arena-spawn-creep", "Arena canonical owner");
expectIncludes(arena, "spawnCreep(body)", "Arena signature");

const world = await readPage(`/en/search?q=${encodeURIComponent("Screeps World spawnCreep")}`);
expectIncludes(world, 'data-search-route-entity="api:spawn-spawn-creep"', "World API route");
expectIncludes(world, "spawnCreep(body, name, opts)", "World signature");

const ambiguous = await readPage(`/en/search?q=${encodeURIComponent("spawnCreep")}`);
expectExcludes(ambiguous, "data-search-route-v1=", "Bare spawnCreep fail-open");
expectIncludes(ambiguous, "english-search-results", "Bare spawnCreep Search V2 preservation");

const unknown = await readPage(`/en/search?q=${encodeURIComponent("unknown random query")}`);
expectExcludes(unknown, "data-search-route-v1=", "Unknown query fail-open");


const validTelemetry = await postTelemetry({
  eventName: "search_v3_route_shown",
  routeVersion: 1,
  locale: "en",
  intentKind: "symptom",
  intentId: "symptom:creep-not-moving",
  source: "route_card",
});
if (validTelemetry.status !== 202) {
  failures.push(`Search V3 telemetry smoke: expected 202, received ${validTelemetry.status}`);
}

const forbiddenTelemetry = await postTelemetry({
  eventName: "search_v3_route_shown",
  routeVersion: 1,
  locale: "en",
  intentKind: "symptom",
  intentId: "symptom:creep-not-moving",
  source: "route_card",
  query: "creep not moving",
});
if (forbiddenTelemetry.status !== 400) {
  failures.push(`Search V3 telemetry privacy gate: expected 400, received ${forbiddenTelemetry.status}`);
}

if (failures.length > 0) {
  for (const failure of failures) console.error(`ERROR: ${failure}`);
  console.error(`Search V3 smoke test failed: ${failures.length} issue(s).`);
  process.exit(1);
}

console.log("Search V3 smoke test passed: bilingual answer routing, strict Doctor/Resolver actions, privacy-bounded product telemetry, World/Arena boundaries, and Search V2 fallback are healthy.");
