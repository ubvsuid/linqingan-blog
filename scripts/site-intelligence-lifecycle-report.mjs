import fs from "node:fs";
import path from "node:path";

import { createIsolatedNeon } from "./lib/database-environment-isolation.mjs";
import { renderLifecycleMarkdown } from "./lib/site-intelligence-lifecycle.mjs";

const args = process.argv.slice(2);
function argValue(name, fallback = null) { const i = args.indexOf(name); return i >= 0 ? args[i + 1] ?? fallback : fallback; }
const databaseUrl = process.env.DATABASE_URL?.trim();
if (!databaseUrl) throw new Error("DATABASE_URL is required.");
const sql = createIsolatedNeon(databaseUrl);
const actions = await sql`
  SELECT action_id, asset_id, path, category, recommended_action, priority, status,
         first_seen_at, last_seen_at, started_at, completed_at, review_after, due_at,
         parent_action_id, superseded_by_action_id, action_taken, result,
         before_metrics, after_metrics, updated_at
  FROM site_intelligence_action_operating_view
  ORDER BY CASE priority WHEN 'P0' THEN 0 WHEN 'P1' THEN 1 ELSE 2 END,
           CASE aging_state WHEN 'overdue' THEN 0 WHEN 'aging' THEN 1 WHEN 'scheduled' THEN 2 ELSE 3 END,
           CASE status WHEN 'in_progress' THEN 0 WHEN 'open' THEN 1 WHEN 'done' THEN 2 ELSE 3 END,
           last_seen_at DESC;
`;
const snapshotSummary = await sql`
  SELECT snapshot_type, generated_at, window_days
  FROM site_intelligence_snapshots
  ORDER BY generated_at DESC
  LIMIT 20;
`;
const eventSummary = await sql`
  SELECT event_type, count(*)::int AS events
  FROM site_intelligence_action_events
  GROUP BY event_type
  ORDER BY event_type;
`;
const linkSummary = await sql`
  SELECT relationship_type, count(*)::int AS links
  FROM site_intelligence_action_links
  GROUP BY relationship_type
  ORDER BY relationship_type;
`;
const generatedAt = new Date().toISOString();
const output = { generatedAt, actions, snapshotSummary, eventSummary, linkSummary };
const jsonOutput = path.resolve(argValue("--json", "reports/site-intelligence-lifecycle.json"));
const markdownOutput = path.resolve(argValue("--markdown", "reports/site-intelligence-lifecycle.md"));
fs.mkdirSync(path.dirname(jsonOutput), { recursive: true });
fs.mkdirSync(path.dirname(markdownOutput), { recursive: true });
fs.writeFileSync(jsonOutput, `${JSON.stringify(output, null, 2)}\n`, "utf8");
fs.writeFileSync(markdownOutput, renderLifecycleMarkdown(output), "utf8");
console.log("Site Intelligence lifecycle report generated.");
console.log(`Actions tracked: ${actions.length}`);
console.log(`Open: ${actions.filter((row) => row.status === "open").length}`);
console.log(`In progress: ${actions.filter((row) => row.status === "in_progress").length}`);
console.log(`Overdue: ${actions.filter((row) => row.aging_state === "overdue").length}`);
console.log(`JSON: ${jsonOutput}`);
console.log(`Markdown: ${markdownOutput}`);
