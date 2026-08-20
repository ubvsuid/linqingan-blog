import crypto from "node:crypto";

const VALID_STATUSES = new Set(["open", "in_progress", "done", "rejected", "superseded"]);
const VALID_RESULTS = new Set(["improved", "neutral", "declined", "mixed"]);
const TRANSITIONS = {
  open: new Set(["in_progress", "rejected", "superseded"]),
  in_progress: new Set(["open", "done", "rejected", "superseded"]),
  done: new Set(["in_progress"]),
  rejected: new Set(["open", "in_progress"]),
  superseded: new Set(["open", "in_progress"]),
};

export const ACTION_AGING_POLICY_DAYS = Object.freeze({ P0: 7, P1: 21, P2: 45 });

function text(value) { return String(value ?? "").trim(); }
function object(value) { return value && typeof value === "object" && !Array.isArray(value) ? value : {}; }
function unique(values) { return [...new Set((values ?? []).map(text).filter(Boolean))]; }
function dateOrNull(value) {
  if (value === null || value === undefined || text(value) === "") return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) throw new Error(`Invalid date: ${value}`);
  return date;
}

export function normalizeLifecycleStatus(value) {
  const status = text(value);
  if (!VALID_STATUSES.has(status)) throw new Error(`Invalid action status: ${status || "<empty>"}`);
  return status;
}

export function normalizeLifecycleResult(value) {
  if (value === null || value === undefined || text(value) === "") return null;
  const result = text(value);
  if (!VALID_RESULTS.has(result)) throw new Error(`Invalid action result: ${result}`);
  return result;
}

export function normalizeOptionalIsoDate(value) {
  const date = dateOrNull(value);
  return date ? date.toISOString() : null;
}

export function validateLifecycleTransition(fromStatus, toStatus) {
  const from = normalizeLifecycleStatus(fromStatus);
  const to = normalizeLifecycleStatus(toStatus);
  if (from === to) return { allowed: true, noop: true, from, to };
  if (!TRANSITIONS[from]?.has(to)) throw new Error(`Invalid action transition: ${from} -> ${to}`);
  return { allowed: true, noop: false, from, to };
}

export function actionTiming(action, { now = new Date() } = {}) {
  const current = now instanceof Date ? now : new Date(now);
  if (Number.isNaN(current.getTime())) throw new Error("Invalid current time.");
  const status = normalizeLifecycleStatus(action.status);
  const priority = ["P0", "P1", "P2"].includes(text(action.priority)) ? text(action.priority) : "P2";
  const firstSeen = dateOrNull(action.first_seen_at ?? action.firstSeenAt) ?? current;
  const dueAt = dateOrNull(action.due_at ?? action.dueAt);
  const reviewAfter = dateOrNull(action.review_after ?? action.reviewAfter);
  const agingDays = Math.max(0, Math.floor((current.getTime() - firstSeen.getTime()) / 86_400_000));
  const policyDays = ACTION_AGING_POLICY_DAYS[priority];
  const policyTargetAt = new Date(firstSeen.getTime() + policyDays * 86_400_000);
  const active = status === "open" || status === "in_progress";
  let agingState = "closed";
  if (active) {
    if (dueAt && dueAt < current) agingState = "overdue";
    else if (dueAt) agingState = "scheduled";
    else if (current >= policyTargetAt) agingState = "aging";
    else agingState = "on_track";
  }
  return {
    agingDays,
    agingState,
    dueAt: dueAt?.toISOString() ?? null,
    policyDays,
    policyTargetAt: policyTargetAt.toISOString(),
    reviewDue: status === "done" && !action.result && Boolean(reviewAfter && reviewAfter <= current),
  };
}

function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.keys(value).sort().map((key) => [key, stable(value[key])]));
  }
  return value;
}

export function fingerprintSnapshot(value) {
  return crypto.createHash("sha256").update(JSON.stringify(stable(value))).digest("hex");
}

export function makeSnapshotId(type, generatedAt, fingerprint) {
  const stamp = new Date(generatedAt).toISOString().replace(/[-:.TZ]/g, "").slice(0, 14);
  return `${type}:${stamp}:${text(fingerprint).slice(0, 12)}`;
}

export function actionSeed(action) {
  if (!text(action?.actionId)) throw new Error("Action Queue row is missing actionId.");
  return {
    actionId: text(action.actionId),
    assetId: text(action.assetId) || null,
    path: text(action.path) || null,
    category: text(action.category) || "research",
    recommendedAction: text(action.action) || "Review action",
    priority: ["P0", "P1", "P2"].includes(text(action.priority)) ? text(action.priority) : "P2",
    beforeMetrics: object(action.metrics),
    sourceSignalIds: unique(action.sourceSignalIds),
    metadata: {
      rationale: text(action.rationale) || null,
      sources: unique(action.sources),
      sampleBoundary: text(action.sampleBoundary) || null,
      corroboratedBy: unique(action.corroboratedBy),
      relatedAssetId: text(action.relatedAssetId) || null,
      title: text(action.title) || null,
    },
  };
}

export function snapshotSeed(type, payload, { windowDays = null } = {}) {
  if (!["signals", "action_queue"].includes(type)) throw new Error(`Invalid snapshot type: ${type}`);
  const generatedAt = payload?.generatedAt ?? new Date().toISOString();
  const fingerprint = fingerprintSnapshot(payload);
  return {
    snapshotId: makeSnapshotId(type, generatedAt, fingerprint),
    snapshotType: type,
    generatedAt,
    sourceGeneratedAt: payload?.sourceGeneratedAt ?? null,
    windowDays: windowDays === null ? null : Math.max(1, Math.min(365, Number(windowDays) || 30)),
    summary: object(payload?.summary ?? payload?.sourceSummary),
    payload,
    inputFingerprint: fingerprint,
  };
}

function esc(value) { return String(value ?? "").replaceAll("|", "\\|").replaceAll("\n", " "); }

export function renderLifecycleMarkdown({ actions = [], snapshotSummary = [], generatedAt = new Date().toISOString() } = {}) {
  const statusCounts = Object.fromEntries([...VALID_STATUSES].map((status) => [status, actions.filter((row) => row.status === status).length]));
  const decorated = actions.map((row) => ({ ...row, timing: actionTiming(row, { now: generatedAt }) }));
  const dueReviews = decorated.filter((row) => row.timing.reviewDue);
  const overdue = decorated.filter((row) => row.timing.agingState === "overdue");
  const aging = decorated.filter((row) => row.timing.agingState === "aging");
  const lines = [
    "# Site Intelligence Lifecycle",
    "",
    `Generated: ${generatedAt}`,
    "",
    "## Current status",
    "",
    `- Open: ${statusCounts.open}`,
    `- In progress: ${statusCounts.in_progress}`,
    `- Done: ${statusCounts.done}`,
    `- Rejected: ${statusCounts.rejected}`,
    `- Superseded: ${statusCounts.superseded}`,
    `- Overdue: ${overdue.length}`,
    `- Aging without explicit due date: ${aging.length}`,
    `- Reviews due: ${dueReviews.length}`,
    "",
    "## Active actions",
    "",
    "| Priority | Status | Path | Age | Timing | Due | Recommended action |",
    "|---|---|---|---:|---|---|---|",
    ...decorated.filter((row) => ["open", "in_progress"].includes(row.status)).map((row) => `| ${row.priority} | ${row.status} | ${esc(row.path ?? row.asset_id ?? "unmapped")} | ${row.timing.agingDays}d | ${row.timing.agingState} | ${row.timing.dueAt ?? "policy"} | ${esc(row.recommended_action)} |`),
    "",
    "## Reviews due",
    "",
    "| Action | Path | Review after | Result |",
    "|---|---|---|---|",
    ...dueReviews.map((row) => `| ${esc(row.action_id)} | ${esc(row.path ?? row.asset_id ?? "unmapped")} | ${row.review_after} | ${row.result ?? "pending"} |`),
    "",
    "## Snapshot history",
    "",
    "| Type | Generated | Window |",
    "|---|---|---:|",
    ...snapshotSummary.map((row) => `| ${row.snapshot_type} | ${row.generated_at} | ${row.window_days ?? "—"} |`),
    "",
    `Aging policy without an explicit due date: P0=${ACTION_AGING_POLICY_DAYS.P0}d, P1=${ACTION_AGING_POLICY_DAYS.P1}d, P2=${ACTION_AGING_POLICY_DAYS.P2}d. These are operating reminders only; they never change status automatically.`,
    "Lifecycle status is operational state, not an SEO score. Before metrics are captured when an action is first seen; after metrics and result are recorded only after an explicit review.",
    "",
  ];
  return lines.join("\n");
}
