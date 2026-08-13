import { neon } from "@neondatabase/serverless";

const DATABASE_URL = process.env.DATABASE_URL;
const APPLY = process.argv.includes("--apply");
const CONFIRMATION = "DELETE_EXPIRED_PLATFORM_EVENTS";

if (!DATABASE_URL) {
  throw new Error("DATABASE_URL is required.");
}

if (APPLY && process.env.PLATFORM_RETENTION_CONFIRM !== CONFIRMATION) {
  throw new Error(
    `Refusing to delete data. Set PLATFORM_RETENTION_CONFIRM=${CONFIRMATION} and retry with --apply.`,
  );
}

const sql = neon(DATABASE_URL);
const DAY_MS = 24 * 60 * 60 * 1000;
const RUN_STARTED_AT = Date.now();

const policies = [
  { key: "search_clicks", days: 180 },
  { key: "search_queries", days: 180 },
  { key: "tool_events", days: 180 },
  { key: "article_feedback", days: 365 },
];

function cutoffIso(days) {
  return new Date(RUN_STARTED_AT - days * DAY_MS).toISOString();
}

async function countExpired(key, cutoff) {
  if (key === "search_clicks") {
    const [row] = await sql`
      SELECT count(*)::int AS count
      FROM public.search_clicks
      WHERE created_at < ${cutoff}
    `;
    return Number(row?.count ?? 0);
  }

  if (key === "search_queries") {
    const [row] = await sql`
      SELECT count(*)::int AS count
      FROM public.search_queries
      WHERE created_at < ${cutoff}
    `;
    return Number(row?.count ?? 0);
  }

  if (key === "tool_events") {
    const [row] = await sql`
      SELECT count(*)::int AS count
      FROM public.tool_events
      WHERE created_at < ${cutoff}
    `;
    return Number(row?.count ?? 0);
  }

  if (key === "article_feedback") {
    const [row] = await sql`
      SELECT count(*)::int AS count
      FROM public.article_feedback
      WHERE created_at < ${cutoff}
    `;
    return Number(row?.count ?? 0);
  }

  throw new Error(`Unsupported retention target: ${key}`);
}

async function deleteExpired(key, cutoff) {
  if (key === "search_clicks") {
    const [row] = await sql`
      WITH deleted AS (
        DELETE FROM public.search_clicks
        WHERE created_at < ${cutoff}
        RETURNING 1
      )
      SELECT count(*)::int AS count FROM deleted
    `;
    return Number(row?.count ?? 0);
  }

  if (key === "search_queries") {
    const [row] = await sql`
      WITH deleted AS (
        DELETE FROM public.search_queries
        WHERE created_at < ${cutoff}
        RETURNING 1
      )
      SELECT count(*)::int AS count FROM deleted
    `;
    return Number(row?.count ?? 0);
  }

  if (key === "tool_events") {
    const [row] = await sql`
      WITH deleted AS (
        DELETE FROM public.tool_events
        WHERE created_at < ${cutoff}
        RETURNING 1
      )
      SELECT count(*)::int AS count FROM deleted
    `;
    return Number(row?.count ?? 0);
  }

  if (key === "article_feedback") {
    const [row] = await sql`
      WITH deleted AS (
        DELETE FROM public.article_feedback
        WHERE created_at < ${cutoff}
        RETURNING 1
      )
      SELECT count(*)::int AS count FROM deleted
    `;
    return Number(row?.count ?? 0);
  }

  throw new Error(`Unsupported retention target: ${key}`);
}

const report = [];

for (const policy of policies) {
  const cutoff = cutoffIso(policy.days);
  const expiredBefore = await countExpired(policy.key, cutoff);
  let deleted = 0;

  if (APPLY && expiredBefore > 0) {
    deleted = await deleteExpired(policy.key, cutoff);
  }

  report.push({
    table: policy.key,
    retentionDays: policy.days,
    cutoff,
    expiredBefore,
    deleted,
  });
}

console.log(
  JSON.stringify(
    {
      mode: APPLY ? "apply" : "report-only",
      policy: {
        searchDocuments: "sync-managed; no time-based deletion",
        verificationEvidence: "retained; no automatic time-based deletion",
      },
      report,
    },
    null,
    2,
  ),
);
