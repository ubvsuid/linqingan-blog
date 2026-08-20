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

function text(value) { return String(value ?? "").trim(); }
function object(value) { return value && typeof value === "object" && !Array.isArray(value) ? value : {}; }
function unique(values) { return [...new Set((values ?? []).map(text).filter(Boolean))]; }

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

export function validateLifecycleTransition(fromStatus, toStatus) {
  const from = normalizeLifecycleStatus(fromStatus);
  const to = normalizeLifecycleStatus(toStatus);
  if (from === to) return { allowed: true, noop: true, from, to };
  if (!TRANSITIONS[from]?.has(to)) throw new Error(`Invalid action transition: ${from} -> ${to}`);
  return { allowed: true, noop: false, from, to };
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

export function renderLifecycleMarkdown({ actions = [], snapshotSummary = [], generatedAt = new Date().toISOString() } = {}) {
  const statusCounts = Object.fromEntries([...VALID_STATUSES].map((status) => [status, actions.filter((row) => row.status === status).length]));
  const due = actions.filter((row) => row.review_after && !row.result && new Date(row.review_after) <= new Date(generatedAt) && row.status === "done");
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
    `- Reviews due: ${due.length}`,
    "",
    "## Active actions",
    "",
    "| Priority | Status | Path | Category | Recommended action | Last seen |",
    "|---|---|---|---|---|---|",
    ...actions.filter((row) => ["open", "in_progress"].includes(row.status)).map((row) => `| ${row.priority} | ${row.status} | ${String(row.path ?? row.asset_id ?? "unmapped").replaceAll("|", "\\|")} | ${row.category} | ${String(row.recommended_action).replaceAll("|", "\\|")} | ${row.last_seen_at ?? "—"} |`),
    "",
    "## Reviews due",
    "",
    "| Action | Path | Review after | Result |",
    "|---|---|---|---|",
    ...due.map((row) => `| ${row.action_id} | ${row.path ?? row.asset_id ?? "unmapped"} | ${row.review_after} | ${row.result ?? "pending"} |`),
    "",
    "## Snapshot history",
    "",
    "| Type | Generated | Window |",
    "|---|---|---:|",
    ...snapshotSummary.map((row) => `| ${row.snapshot_type} | ${row.generated_at} | ${row.window_days ?? "—"} |`),
    "",
    "Lifecycle status is operational state, not an SEO score. Before metrics are captured when an action is first seen; after metrics and result are recorded only after an explicit review.",
    "",
  ];
  return lines.join("\n");
}
