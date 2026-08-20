import fs from "node:fs";
import { neon } from "@neondatabase/serverless";
import { normalizeLifecycleResult, validateLifecycleTransition } from "./lib/site-intelligence-lifecycle.mjs";

const args = process.argv.slice(2);
function argValue(name, fallback = null) { const i = args.indexOf(name); return i >= 0 ? args[i + 1] ?? fallback : fallback; }
function has(name) { return args.includes(name); }
function parseMetrics() {
  const inline = argValue("--metrics-json");
  const file = argValue("--metrics-file");
  if (inline && file) throw new Error("Use only one of --metrics-json or --metrics-file.");
  if (!inline && !file) return null;
  const value = JSON.parse(inline ?? fs.readFileSync(file, "utf8"));
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Metrics must be a JSON object.");
  return value;
}
function json(value) { return JSON.stringify(value ?? {}); }

const databaseUrl = process.env.DATABASE_URL?.trim();
if (!databaseUrl) throw new Error("DATABASE_URL is required.");
const actionId = argValue("--action-id");
if (!actionId) throw new Error("--action-id is required.");
const targetStatus = argValue("--status");
const note = argValue("--note");
const actionTaken = argValue("--action-taken");
const rejectionReason = argValue("--rejection-reason");
const reviewAfter = argValue("--review-after");
const result = normalizeLifecycleResult(argValue("--result"));
const metrics = parseMetrics();
if (!targetStatus && !note && !actionTaken && !reviewAfter && !result && !metrics && !rejectionReason) throw new Error("No lifecycle update was requested.");

const sql = neon(databaseUrl);
const [current] = await sql`SELECT * FROM site_intelligence_actions WHERE action_id = ${actionId};`;
if (!current) throw new Error(`Unknown action_id: ${actionId}`);
let transition = { from: current.status, to: current.status, noop: true };
if (targetStatus) transition = validateLifecycleTransition(current.status, targetStatus);
if (transition.to === "done" && !actionTaken && !current.action_taken) throw new Error("Completing an action requires --action-taken so the change is auditable.");
if (transition.to === "rejected" && !rejectionReason && !note && !current.rejection_reason) throw new Error("Rejecting an action requires --rejection-reason or --note.");
if (result && transition.to !== "done") throw new Error("--result can only be recorded while the action is done.");
if (result && !metrics) throw new Error("--result requires --metrics-json or --metrics-file for after metrics.");

const nextActionTaken = actionTaken ?? current.action_taken;
const nextRejectionReason = rejectionReason ?? (transition.to === "rejected" ? note : current.rejection_reason);
const nextReviewAfter = reviewAfter ?? current.review_after;
const reopening = transition.from === "done" && transition.to !== "done";
const nextAfterMetrics = metrics && transition.to === "done" ? metrics : (reopening ? {} : current.after_metrics);
const nextResult = result ?? (transition.to === "done" ? current.result : null);
const startedAt = transition.to === "in_progress" ? (current.started_at ?? new Date().toISOString()) : current.started_at;
const completedAt = transition.to === "done" ? (current.completed_at ?? new Date().toISOString()) : (transition.from === "done" && transition.to !== "done" ? null : current.completed_at);

await sql`
  UPDATE site_intelligence_actions
  SET status = ${transition.to},
      started_at = ${startedAt},
      completed_at = ${completedAt},
      review_after = ${nextReviewAfter},
      action_taken = ${nextActionTaken},
      rejection_reason = ${nextRejectionReason},
      after_metrics = ${json(nextAfterMetrics)}::jsonb,
      result = ${nextResult},
      updated_at = now()
  WHERE action_id = ${actionId};
`;

let eventsWritten = 0;
if (!transition.noop) {
  await sql`
    INSERT INTO site_intelligence_action_events
      (action_id, event_type, from_status, to_status, note, metrics, metadata)
    VALUES
      (${actionId}, 'status_change', ${transition.from}, ${transition.to}, ${note}, '{}'::jsonb,
       ${json({ actionTaken: actionTaken ?? null, rejectionReason: rejectionReason ?? null, reviewAfter: reviewAfter ?? null })}::jsonb);
  `;
  eventsWritten += 1;
}
if (metrics && transition.to === "done") {
  await sql`
    INSERT INTO site_intelligence_action_events
      (action_id, event_type, from_status, to_status, note, metrics, metadata)
    VALUES
      (${actionId}, ${result ? "review" : "after_snapshot"}, ${transition.from}, ${transition.to}, ${note}, ${json(metrics)}::jsonb,
       ${json({ result, reviewAfter: reviewAfter ?? null })}::jsonb);
  `;
  eventsWritten += 1;
}
if (eventsWritten === 0 && (note || actionTaken || reviewAfter || rejectionReason)) {
  await sql`
    INSERT INTO site_intelligence_action_events
      (action_id, event_type, from_status, to_status, note, metrics, metadata)
    VALUES
      (${actionId}, 'note', ${transition.from}, ${transition.to}, ${note}, '{}'::jsonb,
       ${json({ actionTaken: actionTaken ?? null, rejectionReason: rejectionReason ?? null, reviewAfter: reviewAfter ?? null })}::jsonb);
  `;
}

console.log(`Updated ${actionId}: ${transition.from} -> ${transition.to}`);
if (reviewAfter) console.log(`Review after: ${reviewAfter}`);
if (result) console.log(`Review result: ${result}`);
