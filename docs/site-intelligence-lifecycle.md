# Site Intelligence Action Lifecycle

This layer closes the operating loop above Site Asset Master, Site Intelligence Signals, and Action Queue V1.

Operational state lives in Neon so changing an Action from Open to In Progress or Done does not require a Git commit and does not trigger a Vercel deployment.

## Lifecycle and timing

Supported statuses:

`open -> in_progress -> done`

Actions may also be explicitly rejected or superseded. Reopening a done, rejected, or superseded Action requires an explicit reopen reason. Unsafe jumps such as `open -> done` remain rejected.

An Action may have an explicit `due_at`. If no Due Date is supplied, the operating report uses a reminder policy based on first-seen age:

- P0: 7 days
- P1: 21 days
- P2: 45 days

These thresholds never change priority or status automatically. They only classify active work as `on_track`, `aging`, `scheduled`, or `overdue`.

## Action relationships

Each Action may point to:

- `parent_action_id`: a broader Action it belongs under;
- `superseded_by_action_id`: the replacement Action when a task is explicitly superseded.

Many-to-many Action links are stored in `site_intelligence_action_links` using `related`, `blocks`, `duplicate_of`, or `follow_up`.

Relationship changes and reopen events are appended to Action history instead of overwriting historical context.

## Before and after metrics

When a queue Action is first synced, its current Action Queue metrics are captured as `before_metrics` and preserved. After metrics and a result (`improved`, `neutral`, `declined`, `mixed`) are recorded only through explicit lifecycle review.

A result is an internal operating classification, not a Google score or ranking guarantee.

## Update an Action

Start work:

```bash
DATABASE_URL=... node scripts/site-intelligence-action-update.mjs \
  --action-id '<action-id>' \
  --status in_progress \
  --due-at '2026-08-27T00:00:00Z' \
  --note 'Started review'
```

Complete work:

```bash
DATABASE_URL=... node scripts/site-intelligence-action-update.mjs \
  --action-id '<action-id>' \
  --status done \
  --action-taken 'Clarified Owner intent and adjusted internal links' \
  --review-after '2026-09-17T00:00:00Z'
```

Reopen work:

```bash
DATABASE_URL=... node scripts/site-intelligence-action-update.mjs \
  --action-id '<action-id>' \
  --status in_progress \
  --reopen-reason 'New GSC evidence changed the conclusion'
```

Supersede work:

```bash
DATABASE_URL=... node scripts/site-intelligence-action-update.mjs \
  --action-id '<old-action-id>' \
  --status superseded \
  --superseded-by-action-id '<replacement-action-id>'
```

Link Actions:

```bash
DATABASE_URL=... node scripts/site-intelligence-action-link.mjs \
  --from-action-id '<action-a>' \
  --to-action-id '<action-b>' \
  --type related
```

## Reports

```bash
DATABASE_URL=... node scripts/site-intelligence-lifecycle-report.mjs
```

The report shows active Actions, age/timing state, overdue work, reviews due, and snapshot history.

Lifecycle writes happen in Neon. Git/Vercel is used only when lifecycle rules or code change.
