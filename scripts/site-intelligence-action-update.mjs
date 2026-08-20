import fs from "node:fs";
import { neon } from "@neondatabase/serverless";
import { normalizeLifecycleResult, normalizeOptionalIsoDate, validateLifecycleTransition } from "./lib/site-intelligence-lifecycle.mjs";

const args = process.argv.slice(2);
function argValue(name, fallback = null) { const i = args.indexOf(name); return i >= 0 ? args[i + 1] ?? fallback : fallback; }
function flag(name) { return args.includes(name); }
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
const reopenReason = argValue("--reopen-reason");
const reviewAfter = argValue("--review-after");
const dueAtInput = argValue("--due-at");
const clearDueAt = flag("--clear-due-at");
const parentActionInput = argValue("--parent-action-id");
const clearParentAction = flag("--clear-parent-action");
const supersededByInput = argValue("--superseded-by-action-id");
const clearSupersededBy = flag("--clear-superseded-by");
const result = normalizeLifecycleResult(argValue("--result"));
const metrics = parseMetrics();
if (dueAtInput && clearDueAt) throw new Error("Use only one of --due-at or --clear-due-at.");
if (parentActionInput && clearParentAction) throw new Error("Use only one of --parent-action-id or --clear-parent-action.");
if (supersededByInput && clearSupersededBy) throw new Error("Use only one of --superseded-by-action-id or --clear-superseded-by.");
if (!targetStatus && !note && !actionTaken && !reviewAfter && !result && !metrics && !rejectionReason && !reopenReason && !dueAtInput && !clearDueAt && !parentActionInput && !clearParentAction && !supersededByInput && !clearSupersededBy) throw new Error("No lifecycle update was requested.");

const sql = neon(databaseUrl);
const [current] = await sql`SELECT * FROM site_intelligence_actions WHERE action_id = ${actionId};`;
if (!current) throw new Error(`Unknown action_id: ${actionId}`);
let transition = { from: current.status, to: current.status, noop: true };
if (targetStatus) transition = validateLifecycleTransition(current.status, targetStatus);
const reopening = ["done", "rejected", "superseded"].includes(transition.from) && ["open", "in_progress"].includes(transition.to) && !transition.noop;
if (reopening && !reopenReason) throw new Error("Reopening a completed/rejected/superseded action requires --reopen-reason.");
if (transition.to === "done" && !actionTaken && !current.action_taken) throw new Error("Completing an action requires --action-taken so the change is auditable.");
if (transition.to === "rejected" && !rejectionReason && !note && !current.rejection_reason) throw new Error("Rejecting an action requires --rejection-reason or --note.");
if (transition.to === "superseded" && !supersededByInput && !current.superseded_by_action_id) throw new Error("Superseding an action requires --superseded-by-action-id.");
if (result && transition.to !== "done") throw new Error("--result can only be recorded while the action is done.");
if (result && !metrics) throw new Error("--result requires --metrics-json or --metrics-file for after metrics.");

async function requireOtherAction(candidate, label) {
  if (!candidate) return null;
  if (candidate === actionId) throw new Error(`${label} cannot reference the same action.`);
  const [row] = await sql`SELECT action_id FROM site_intelligence_actions WHERE action_id = ${candidate};`;
  if (!row) throw new Error(`Unknown ${label}: ${candidate}`);
  return candidate;
}
const parentAction = parentActionInput ? await requireOtherAction(parentActionInput, "parent action") : (clearParentAction ? null : current.parent_action_id);
const supersededByAction = supersededByInput ? await requireOtherAction(supersededByInput, "superseded action") : (clearSupersededBy ? null : current.superseded_by_action_id);
const nextDueAt = clearDueAt ? null : (dueAtInput ? normalizeOptionalIsoDate(dueAtInput) : current.due_at);
const nextActionTaken = actionTaken ?? current.action_taken;
const nextRejectionReason = rejectionReason ?? (transition.to === "rejected" ? note : current.rejection_reason);
const nextReviewAfter = reviewAfter ? normalizeOptionalIsoDate(reviewAfter) : current.review_after;
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
      due_at = ${nextDueAt},
      parent_action_id = ${parentAction},
      superseded_by_action_id = ${supersededByAction},
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
      (${actionId}, ${reopening ? "reopened" : "status_change"}, ${transition.from}, ${transition.to}, ${reopening ? reopenReason : note}, '{}'::jsonb,
       ${json({ actionTaken: actionTaken ?? null, rejectionReason: rejectionReason ?? null, reviewAfter: reviewAfter ?? null, reopenReason: reopenReason ?? null, supersededByActionId: supersededByInput ?? null })}::jsonb);
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
const currentDueAt = current.due_at ? normalizeOptionalIsoDate(current.due_at) : null;
const dueChanged = currentDueAt !== nextDueAt;
if (dueChanged) {
  await sql`
    INSERT INTO site_intelligence_action_events
      (action_id, event_type, from_status, to_status, note, metrics, metadata)
    VALUES
      (${actionId}, 'due_date_change', ${transition.from}, ${transition.to}, ${note}, '{}'::jsonb,
       ${json({ from: currentDueAt, to: nextDueAt })}::jsonb);
  `;
  eventsWritten += 1;
}
const relationshipChanged = String(current.parent_action_id ?? "") !== String(parentAction ?? "") || String(current.superseded_by_action_id ?? "") !== String(supersededByAction ?? "");
if (relationshipChanged) {
  await sql`
    INSERT INTO site_intelligence_action_events
      (action_id, event_type, from_status, to_status, note, metrics, metadata)
    VALUES
      (${actionId}, 'relationship_change', ${transition.from}, ${transition.to}, ${note}, '{}'::jsonb,
       ${json({ parentActionId: parentAction, supersededByActionId: supersededByAction })}::jsonb);
  `;
  eventsWritten += 1;
}
if (eventsWritten === 0 && (note || actionTaken || reviewAfter || rejectionReason || reopenReason)) {
  await sql`
    INSERT INTO site_intelligence_action_events
      (action_id, event_type, from_status, to_status, note, metrics, metadata)
    VALUES
      (${actionId}, 'note', ${transition.from}, ${transition.to}, ${note ?? reopenReason}, '{}'::jsonb,
       ${json({ actionTaken: actionTaken ?? null, rejectionReason: rejectionReason ?? null, reviewAfter: reviewAfter ?? null })}::jsonb);
  `;
}

console.log(`Updated ${actionId}: ${transition.from} -> ${transition.to}`);
if (dueChanged) console.log(`Due at: ${nextDueAt ?? "cleared"}`);
if (reviewAfter) console.log(`Review after: ${nextReviewAfter}`);
if (result) console.log(`Review result: ${result}`);
