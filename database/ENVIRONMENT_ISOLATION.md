# Environment Isolation

This project treats production data as a separate trust boundary from development, Preview, CI, and local work.

## Environment matrix

| Runtime | Git / deploy context | Neon branch | Approved endpoint ID |
| --- | --- | --- | --- |
| Production | Vercel Production / `clean-blog-v1` | `main` | `ep-steep-hall-a6btsowh` |
| Non-production | local, tests, Vercel Preview/Development, `gpt-work` | `gpt-work-dev` | `ep-misty-cloud-a6ldmtis` |

The endpoint IDs are identifiers, not credentials. Never commit a complete database connection string or password.

## Fail-closed rules

1. Application database access goes through `src/db/client.ts`.
2. The application derives its runtime from `VERCEL_ENV`. Only `production` may use the production endpoint. Preview, Development, local builds, tests, and unknown runtimes are treated as non-production.
3. Operational Node scripts must use `scripts/lib/database-environment-isolation.mjs`. They default to non-production unless `DATABASE_RUNTIME=production` is explicitly supplied.
4. `DATABASE_RUNTIME=production` is not sufficient by itself: the database URL must also resolve to the approved production Neon endpoint.
5. A malformed URL, unknown Neon endpoint, production/non-production mismatch, or non-Neon host is rejected before a database client is created.
6. Error messages never print `DATABASE_URL`.

The canonical non-secret mapping is `database/environment-policy.json`.

## Vercel configuration

Configure environment variables so the deployment platform enforces the same boundary:

- **Production**: `DATABASE_URL` must point to Neon branch `main`.
- **Preview**: `DATABASE_URL` must point to Neon branch `gpt-work-dev`.
- **Development**: `DATABASE_URL` must point to Neon branch `gpt-work-dev`.

`VERCEL_ENV` is supplied by Vercel and is used by the application guard. Do not override it.

The repository's Vercel branch whitelist is a separate deployment boundary: development work on `gpt-work` must not create automatic Vercel deployments. Environment isolation remains mandatory even when a Preview is created manually or from another allowed Preview branch.

## Local development

Use only a `DATABASE_URL` for `gpt-work-dev`. Local and unknown runtimes deliberately resolve to non-production, so a production connection string fails closed.

Do not set `DATABASE_RUNTIME=production` in a shared `.env` file. That override exists only for explicit operational scripts that must work against production and still remains endpoint-checked.

## GitHub Actions and operational scripts

Any workflow that exposes `DATABASE_URL` to a database-enabled script must also declare the intended `DATABASE_RUNTIME` explicitly.

- Production-only maintenance/reporting: `DATABASE_RUNTIME: production`
- Non-production integration work: `DATABASE_RUNTIME: non-production`

A static integrity check in `scripts/check-environment-isolation.mjs` verifies the runtime/endpoint matrix, prevents new direct Neon access outside approved boundary files, and requires DB-enabled workflows to declare a runtime boundary.

Run it with:

```bash
node scripts/check-environment-isolation.mjs
```

## Destructive production operations

Environment isolation does not replace operation-specific confirmations. Destructive scripts such as platform retention keep their existing confirmation requirements in addition to the production endpoint/runtime checks.

## Endpoint rotation or Neon branch recreation

If Neon recreates an endpoint:

1. Create/confirm the intended Neon branch first.
2. Update `database/environment-policy.json` with the new non-secret endpoint ID.
3. Update the matching Vercel environment variable to the new branch connection string.
4. Run `node scripts/check-environment-isolation.mjs` and the normal type/build checks.
5. Do not delete the old endpoint or branch until the new environment is verified.

Never temporarily point Preview/local environments at `main` to work around an endpoint migration.

## Recovery from an isolation failure

If an application or script reports an environment-isolation mismatch:

1. Do not weaken or bypass the guard.
2. Identify the runtime (`VERCEL_ENV` or script `DATABASE_RUNTIME`).
3. Verify which Neon branch owns the configured endpoint.
4. Correct the environment's `DATABASE_URL`.
5. Re-run the isolation check before continuing.

The intended invariant is simple: **production runtime ↔ production endpoint; every other runtime ↔ non-production endpoint**.
