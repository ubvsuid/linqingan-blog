import fs from "node:fs";
import path from "node:path";
import { neon } from "@neondatabase/serverless";
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
const sql = neon(databaseUrl);
const signalSnapshot = snapshotSeed("signals", signals.data, { windowDays });
const queueSnapshot = snapshotSeed("action_queue", queue.data, { windowDays });

async function persistSnapshot(seed) {
  await sql`
    INSERT INTO site_intelligence_snapshots
      (snapshot_id, snapshot_type, generated_at, source_generated_at, window_days, summary, payload, input_fingerprint)
    VALUES
      (${seed.snapshotId}, ${seed.snapshotType}, ${seed.generatedAt}, ${seed.sourceGeneratedAt}, ${seed.windowDays}, ${json(seed.summary)}::jsonb, ${json(seed.payload)}::jsonb, ${seed.inputFingerprint})
    ON CONFLICT (snapshot_id) DO NOTHING;
  `;
}

async function syncAction(action) {
  const seed = actionSeed(action);
  const [existing] = await sql`SELECT action_id FROM site_intelligence_actions WHERE action_id = ${seed.actionId};`;
  const snapshotMeta = { snapshotId: queueSnapshot.snapshotId, sourceGeneratedAt: queue.data.sourceGeneratedAt ?? null };
  if (!existing) {
    await sql`
      INSERT INTO site_intelligence_actions
        (action_id, asset_id, path, category, recommended_action, priority, before_metrics, source_signal_ids, metadata)
      VALUES
        (${seed.actionId}, ${seed.assetId}, ${seed.path}, ${seed.category}, ${seed.recommendedAction}, ${seed.priority}, ${json(seed.beforeMetrics)}::jsonb, ${json(seed.sourceSignalIds)}::jsonb, ${json(seed.metadata)}::jsonb);
    `;
    await sql`
      INSERT INTO site_intelligence_action_events (action_id, event_type, metrics, metadata)
      VALUES (${seed.actionId}, 'created', ${json(seed.beforeMetrics)}::jsonb, ${json(snapshotMeta)}::jsonb);
    `;
    return "created";
  }

  await sql`
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
  `;
  await sql`
    INSERT INTO site_intelligence_action_events (action_id, event_type, metrics, metadata)
    SELECT ${seed.actionId}, 'seen', ${json(seed.beforeMetrics)}::jsonb, ${json(snapshotMeta)}::jsonb
    WHERE NOT EXISTS (
      SELECT 1 FROM site_intelligence_action_events
      WHERE action_id = ${seed.actionId}
        AND event_type = 'seen'
        AND metadata ->> 'snapshotId' = ${queueSnapshot.snapshotId}
    );
  `;
  return "seen";
}

await persistSnapshot(signalSnapshot);
await persistSnapshot(queueSnapshot);
let created = 0, seen = 0;
for (const action of queue.data.actions ?? []) {
  const result = await syncAction(action);
  if (result === "created") created += 1; else seen += 1;
}

console.log("Site Intelligence lifecycle sync completed.");
console.log(`Queue actions: ${(queue.data.actions ?? []).length}`);
console.log(`Created actions: ${created}`);
console.log(`Previously known actions seen again: ${seen}`);
console.log(`Signals snapshot: ${signalSnapshot.snapshotId}`);
console.log(`Action Queue snapshot: ${queueSnapshot.snapshotId}`);
console.log("Existing action status is preserved; missing actions are not auto-closed or auto-superseded.");
