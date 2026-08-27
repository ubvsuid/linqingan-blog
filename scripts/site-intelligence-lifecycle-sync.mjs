import fs from "node:fs";
import path from "node:path";

import { createIsolatedNeon } from "./lib/database-environment-isolation.mjs";
import { actionSeed, snapshotSeed } from "./lib/site-intelligence-lifecycle.mjs";

const args = process.argv.slice(2);
function argValue(name, fallback = null) { const i = args.indexOf(name); return i >= 0 ? args[i + 1] ?? fallback : fallback; }
function readJson(name) { const file = argValue(name); if (!file) throw new Error(`${name} is required.`); return { file: path.resolve(file), data: JSON.parse(fs.readFileSync(path.resolve(file), "utf8")) }; }
function json(value) { return JSON.stringify(value ?? {}); }

const databaseUrl = process.env.DATABASE_URL?.trim();
if (!databaseUrl) throw new Error("DATABASE_URL is required to persist Site Intelligence lifecycle data.");
const signals = readJson("--signals");
const queue = readJson("--queue");
const windowDays = Math.max(1, Math.min(365, Number.parseInt(argValue("--window-days", "30"), 10) || 30));
const sql = createIsolatedNeon(databaseUrl);
const signalSnapshot = snapshotSeed("signals", signals.data, { windowDays });
const queueSnapshot = snapshotSeed("action_queue", queue.data, { windowDays });
const actionSeeds = (queue.data.actions ?? []).map(actionSeed);

const existingRows = actionSeeds.length
  ? await sql`SELECT action_id FROM site_intelligence_actions WHERE action_id = ANY(${actionSeeds.map((seed) => seed.actionId)}::text[]);`
  : [];
const existingIds = new Set(existingRows.map((row) => row.action_id));
const snapshotMeta = { snapshotId: queueSnapshot.snapshotId, sourceGeneratedAt: queue.data.sourceGeneratedAt ?? null };
const queries = [];

function snapshotQuery(seed) {
  return sql`
    INSERT INTO site_intelligence_snapshots
      (snapshot_id, snapshot_type, generated_at, source_generated_at, window_days, summary, payload, input_fingerprint)
    VALUES
      (${seed.snapshotId}, ${seed.snapshotType}, ${seed.generatedAt}, ${seed.sourceGeneratedAt}, ${seed.windowDays}, ${json(seed.summary)}::jsonb, ${json(seed.payload)}::jsonb, ${seed.inputFingerprint})
    ON CONFLICT (snapshot_id) DO NOTHING;
  `;
}

queries.push(snapshotQuery(signalSnapshot), snapshotQuery(queueSnapshot));
let created = 0;
let seen = 0;

for (const seed of actionSeeds) {
  if (!existingIds.has(seed.actionId)) {
    queries.push(sql`
      INSERT INTO site_intelligence_actions
        (action_id, asset_id, path, category, recommended_action, priority, before_metrics, source_signal_ids, metadata)
      VALUES
        (${seed.actionId}, ${seed.assetId}, ${seed.path}, ${seed.category}, ${seed.recommendedAction}, ${seed.priority}, ${json(seed.beforeMetrics)}::jsonb, ${json(seed.sourceSignalIds)}::jsonb, ${json(seed.metadata)}::jsonb);
    `);
    queries.push(sql`
      INSERT INTO site_intelligence_action_events (action_id, event_type, metrics, metadata)
      VALUES (${seed.actionId}, 'created', ${json(seed.beforeMetrics)}::jsonb, ${json(snapshotMeta)}::jsonb);
    `);
    created += 1;
    continue;
  }

  queries.push(sql`
    UPDATE site_intelligence_actions
    SET asset_id = ${seed.assetId},
        path = ${seed.path},
        category = ${seed.category},
        recommended_action = ${seed.recommendedAction},
        priority = ${seed.priority},
        last_seen_at = now(),
        source_signal_ids = ${json(seed.sourceSignalIds)}::jsonb,
        metadata = ${json(seed.metadata)}::jsonb,
        updated_at = now()
    WHERE action_id = ${seed.actionId};
  `);
  queries.push(sql`
    INSERT INTO site_intelligence_action_events (action_id, event_type, metrics, metadata)
    SELECT ${seed.actionId}, 'seen', ${json(seed.beforeMetrics)}::jsonb, ${json(snapshotMeta)}::jsonb
    WHERE NOT EXISTS (
      SELECT 1 FROM site_intelligence_action_events
      WHERE action_id = ${seed.actionId}
        AND event_type = 'seen'
        AND metadata ->> 'snapshotId' = ${queueSnapshot.snapshotId}
    );
  `);
  seen += 1;
}

// Snapshot persistence and every machine-owned Action/Event write are one atomic unit.
// If any statement fails, Neon rolls the full sync back and no partial snapshot/action state remains.
await sql.transaction(queries);

console.log("Site Intelligence lifecycle sync completed atomically.");
console.log(`Queue actions: ${actionSeeds.length}`);
console.log(`Created actions: ${created}`);
console.log(`Previously known actions seen again: ${seen}`);
console.log(`Signals snapshot: ${signalSnapshot.snapshotId}`);
console.log(`Action Queue snapshot: ${queueSnapshot.snapshotId}`);
console.log("Existing action status is preserved; missing actions are not auto-closed or auto-superseded.");
