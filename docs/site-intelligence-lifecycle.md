# Site Intelligence Action Lifecycle

This layer closes the operating loop above Site Asset Master, Site Intelligence Signals, and Action Queue V1.

It stores operational state in Neon so changing an action from Open to In Progress or Done does not require a Git commit and does not trigger a Vercel deployment.

## Production schema

Migration `4083947e-3fe5-4402-8c73-c2d1f61c03ea` introduced three persistent stores:

- `site_intelligence_actions`: current operational state for each stable Action Queue `actionId`.
- `site_intelligence_action_events`: append-only action history such as created, seen, status changes, notes, after snapshots, and reviews.
- `site_intelligence_snapshots`: historical Signals and Action Queue snapshots used for weekly/monthly comparison.

GitHub remains the source of truth for rules and asset identity. Neon is the source of truth for action state, history, snapshots, and before/after outcomes.

## Lifecycle

Supported action statuses:

`open -> in_progress -> done`

Actions may also be explicitly rejected or superseded. Completed, rejected, or superseded actions can be reopened through an explicit transition. The lifecycle helper rejects unsafe jumps such as `open -> done`.

Completing an action requires an `action_taken` description so the system never records a successful-looking Done state without knowing what was actually changed.

## Before and after metrics

When a queue action is first synced, its current Action Queue metrics are captured as `before_metrics` and then preserved.

After metrics are recorded only by an explicit lifecycle update. A result (`improved`, `neutral`, `declined`, or `mixed`) requires after metrics.

A result is an internal operating classification, not a Google score or ranking guarantee.

## Sync a generated queue

Generate Signals and Action Queue JSON first, then persist them:

```bash
DATABASE_URL=... node scripts/site-intelligence-lifecycle-sync.mjs \
  --signals reports/site-intelligence-signals.json \
  --queue reports/site-intelligence-action-queue.json \
  --window-days 30
```

Sync behavior is conservative:

- new Action IDs are created as `open`;
- known Action IDs keep their existing status;
- `last_seen_at`, recommendation text, priority, and source evidence are refreshed;
- the same queue snapshot does not create duplicate `seen` events;
- actions missing from a later snapshot are not automatically closed or superseded.

The last rule prevents incomplete GSC or behavior inputs from silently closing real work.

## Update an action

Start work:

```bash
DATABASE_URL=... node scripts/site-intelligence-action-update.mjs \
  --action-id '<action-id>' \
  --status in_progress \
  --note 'Started content overlap review'
```

Complete work:

```bash
DATABASE_URL=... node scripts/site-intelligence-action-update.mjs \
  --action-id '<action-id>' \
  --status done \
  --action-taken 'Clarified Owner intent and adjusted internal links' \
  --review-after '2026-09-17T00:00:00Z'
```

Record the later review:

```bash
DATABASE_URL=... node scripts/site-intelligence-action-update.mjs \
  --action-id '<action-id>' \
  --result improved \
  --metrics-json '{"impressions":180,"position":5.9}' \
  --note '28-day GSC review'
```

Rejecting an action requires a rejection reason or note.

## Lifecycle report

```bash
DATABASE_URL=... node scripts/site-intelligence-lifecycle-report.mjs
```

The report shows current actions, active work, reviews due, recent snapshot history, and event summary.

## Vercel budget boundary

Lifecycle writes happen in Neon and do not require a site deployment. Git/Vercel is only used when lifecycle rules or code change. Ordinary operations such as starting, completing, rejecting, or reviewing an action should never create a Vercel Preview.
