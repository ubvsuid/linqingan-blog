# Product Experience V1

Product Experience V1 combines three bounded changes without introducing a new database schema or a second search engine.

## Security Cleanup

- `nanoid` is pinned through the root package override to `3.3.18`.
- `package-lock.json` must resolve `node_modules/nanoid` to exactly `3.3.18`.
- The permanent Product Experience V1 CI gate runs `npm audit --audit-level=high`.
- This is a targeted security fix, not a broad dependency upgrade.

## Runtime Evidence Hub

- `/verified` and `/en/verified` present accepted Screeps Console and live multi-tick evidence as a user-facing Runtime Evidence Hub.
- Public evidence continues to require both the reviewed Evidence lifecycle state and the article Markdown verification boundary.
- Documentation review and offline simulation are not presented as live Runtime evidence.
- User-facing evidence detail includes verification type, API, return code when present, environment, runtime coordinates when present, verification time, and the recorded note.

## Search + Diagnostics V2

- Existing Search V2 remains the discovery engine; no parallel search engine is introduced.
- Search pages expose a problem-solving path into symptom diagnostics, API references, error codes, tools/guides, and Runtime Evidence.
- Diagnostics expose accepted evidence detail for related verified guides and link each symptom back into Search with the symptom as the query.

## Deployment boundary

- Development and PR validation should not require a Vercel Preview deployment.
- Production remains the only Git branch with automatic Vercel deployment enabled.
- Release requires the Product Experience V1 gate and existing infrastructure gates to pass.
