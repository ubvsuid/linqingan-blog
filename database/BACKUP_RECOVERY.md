# Backup / Recovery V1

This runbook defines the recovery boundary for the production Neon database used by `linqingan.com`. It complements Environment Isolation; it does not weaken or bypass it.

## Current recovery boundary

Canonical non-secret settings live in `database/recovery-policy.json`.

- Neon project: `linqingan-platform` (`rough-smoke-93579849`)
- Production branch: `main` (`br-orange-wildflower-a619tssr`)
- Production endpoint: `ep-steep-hall-a6btsowh`
- Development branch: `gpt-work-dev` (`br-bold-sunset-a6tkdlek`)
- Current Neon plan: `free_v3`
- Verified history retention: **21,600 seconds (6 hours)**

The six-hour value is the actual project setting verified through the Neon control plane on 2026-08-27. Re-check the control plane before a real recovery because plan or retention changes can make this document stale.

## What Backup / Recovery V1 guarantees

V1 establishes an operational recovery path, not an unlimited archival backup system.

1. Production and development remain physically separated.
2. A production incident detected inside the Neon history-retention window can use Point-in-Time Restore (PITR) / Time Travel Assist.
3. Risky production data or schema operations require a short-lived recovery checkpoint branch before the operation begins.
4. Recovery drills are isolated and read-only against production.
5. No recovery drill may point Vercel Preview at a recovery branch.
6. No automated workflow may restore production. Production restore always requires an explicit operator decision.
7. A recovery branch is an incident workspace, not a replacement development environment.

## Known boundary on the Free plan

The current project retains six hours of history. If an incident is discovered after that window and no pre-operation recovery checkpoint exists, **V1 does not guarantee recovery**.

Do not describe the current setup as a seven-day or thirty-day backup. Longer retention, scheduled Neon snapshots, or an off-platform logical backup are future layers and may require a paid plan or a separate secure storage destination.

## Before a risky production data/schema operation

A risky production operation includes destructive retention, broad updates/deletes, schema migrations that can rewrite or drop data, bulk imports, and one-off repair scripts.

Before executing it:

1. Confirm the intended runtime is production and the endpoint is the approved `main` endpoint.
2. Create a temporary Neon child branch from the current `main` state named `recovery-checkpoint-YYYYMMDD-HHmm`.
3. Record the checkpoint branch ID and the UTC creation time in the operation notes.
4. Do **not** connect Vercel Preview or Development to the checkpoint.
5. Execute the production operation only after the checkpoint exists.
6. Validate production after the operation.
7. Keep the checkpoint until the validation window has passed; then delete it to avoid branch clutter.

The checkpoint is a rollback reference. It is not a place for ordinary feature development.

## Incident path A — full rollback is acceptable

Use this when a bad migration, broad delete/update, or corrupted import should be completely undone and post-incident writes may be discarded.

1. Stop the destructive job or code path first so corruption does not continue.
2. Record the incident time in UTC, the active `clean-blog-v1` commit, and the Vercel Production deployment ID.
3. In Neon **Backup & Restore / Restore**, select production `main`.
4. Use Time Travel Assist to query a timestamp before the incident. Validate at least the affected table plus one independent control table.
5. Confirm the selected timestamp is inside the current retention window.
6. Only after explicit operator confirmation, execute the Neon restore.
7. Expect a brief database reconnect while Neon switches the branch state; do not change `DATABASE_URL` merely to work around the restore.
8. Verify the production endpoint still matches `database/environment-policy.json` and run application smoke checks.
9. Re-enable paused jobs only after data validation succeeds.

Never perform a production PITR merely as a routine test.

## Incident path B — preserve post-incident writes

Use this when only part of the data was damaged and valid writes after the incident must be retained.

1. Do not rewind production immediately.
2. Create or restore an isolated branch from a timestamp just before the incident using Neon Time Travel / PITR tooling.
3. Query the recovered branch to identify the exact rows or objects needed.
4. Compare schema with current production if a migration was involved.
5. Prepare a minimal, auditable repair for production. Treat that repair as a separate production data operation with its own confirmation and checkpoint.
6. Delete the investigation branch after recovery is complete.

This path favors selective repair over destructive rewind.

## Incident path C — outside the six-hour window

If the required point is older than the current history-retention window:

1. Check whether a pre-operation `recovery-checkpoint-*` branch exists and predates the incident.
2. If a checkpoint exists, inspect it in isolation and use it as the recovery source.
3. If no checkpoint exists, the current Free-plan V1 has no guaranteed historical source. Do not invent one or silently use `gpt-work-dev` as a backup.
4. Escalate to the next recovery layer: longer Neon retention/snapshots or an off-platform logical backup maintained in secure storage.

`gpt-work-dev` is a development database, not a backup of production.

## Recovery drill

Recommended cadence: roughly every 30 days and after material recovery-policy changes.

A safe drill validates the branch-based recovery path without modifying production:

1. Create `recovery-drill-YYYYMMDD` from current `main`.
2. Run SELECT-only checks against production and the drill branch.
3. Compare schema and a small set of representative row counts.
4. Confirm no Vercel deployment references the drill branch.
5. Delete the drill branch after validation.

The 2026-08-27 V1 acceptance drill used this method. It verified schema equality and representative row counts, then deleted the branch. It did **not** destructively exercise production PITR, so PITR itself remains an operator-controlled incident action.

## Representative validation queries

Use read-only checks that are cheap and meaningful for the current schema. Examples include row counts for:

- `search_documents`
- `verification_evidence`
- `article_feedback`
- `site_intelligence_actions`

For a real incident, add table-specific invariants rather than relying only on counts.

## Recovery safety rules

- Never print or commit `DATABASE_URL`, passwords, API keys, or restored data dumps.
- Never wire a recovery/checkpoint branch into Vercel Preview as a testing shortcut.
- Never restore production automatically from CI.
- Never use `gpt-work-dev` as the source of truth for recovering production.
- Never delete a checkpoint until the production validation window has passed.
- Never bypass Environment Isolation during recovery.
- If Neon recreates the production endpoint, update both `database/environment-policy.json` and `database/recovery-policy.json`, then update the matching Vercel secret.

## Deterministic repository gate

Run:

```bash
node scripts/check-backup-recovery.mjs
```

The checker validates that the recovery policy, Environment Isolation mapping, runbook, and recovery CI remain internally consistent. It does not call Neon and therefore cannot prove the live retention value; live control-plane facts must be re-verified before a real restore.
