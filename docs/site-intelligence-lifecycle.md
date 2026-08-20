# Site Intelligence Action Lifecycle

Operational state is stored in Neon so Action work does not require a Git/Vercel deployment.

Supported statuses remain `open`, `in_progress`, `done`, `rejected`, and `superseded`; unsafe transitions remain rejected. Aging reminders remain P0=7d, P1=21d, P2=45d when no explicit Due Date exists.

## Atomicity

Lifecycle Sync persists Signals/Action Queue snapshots and all machine-owned Action/Event changes in one transaction. Existing human status is never overwritten and missing Actions are never auto-closed.

Action Update commits the Action mutation and all corresponding audit Events in one transaction. A failed Event write cannot leave an unaudited status change behind.

Before metrics are captured on first sighting. After metrics and result are recorded only through explicit review. Results are internal operating classifications, not Google scores.
