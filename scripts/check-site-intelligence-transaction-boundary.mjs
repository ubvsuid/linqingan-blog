import assert from "node:assert/strict";
import fs from "node:fs";

for (const file of [
  "scripts/site-intelligence-lifecycle-sync.mjs",
  "scripts/site-intelligence-action-update.mjs",
]) {
  const source = fs.readFileSync(new URL(`../${file}`, import.meta.url), "utf8");
  assert.match(source, /await sql\.transaction\(queries\)/, `${file} must commit its write batch through sql.transaction`);
}

const sync = fs.readFileSync(new URL("./site-intelligence-lifecycle-sync.mjs", import.meta.url), "utf8");
assert.doesNotMatch(sync, /await persistSnapshot|await syncAction/, "sync must not fall back to sequential write helpers");
assert.match(sync, /Existing action status is preserved/, "sync must preserve human lifecycle state");

const update = fs.readFileSync(new URL("./site-intelligence-action-update.mjs", import.meta.url), "utf8");
assert.match(update, /event_type/, "action update must retain audit event persistence");
assert.match(update, /UPDATE site_intelligence_actions/, "action update must still mutate lifecycle state");

console.log("Transactional lifecycle source boundary passed.");
