# CSP inline compatibility boundary

The theme initializer is a fixed 175-byte inline script shared by both root layouts through `THEME_BOOT_SCRIPT`. Its SHA-256 hash is listed in `script-src`, so the stricter Report-Only policy can authorize this site-owned script without restoring `'unsafe-inline'`.

The script reads only the local `theme` preference and the browser color-scheme preference, then sets `data-theme` before visible content. It does not make a network request, read account data, or collect analytics.

## Enforced policy

The enforced `script-src` and `style-src` still include `'unsafe-inline'`. Removing either token immediately is not safe while the current static Next.js output includes framework bootstrap scripts, JSON-LD script elements, component style elements, and React style attributes.

Maintained route styles remain in CSS files at source level instead of using a global experimental CSS inlining mode. A three-run Lighthouse experiment showed that global CSS inlining removed stylesheet requests but increased HTML and main-thread work on several routes, especially search pages. The experiment was therefore removed rather than kept solely to satisfy a synthetic score.

A nonce-based Next.js policy would require generating a nonce per request and would force otherwise static routes into dynamic rendering. That performance and caching trade-off is not introduced without production evidence.

## Report-Only canaries

The Report-Only policy removes `'unsafe-inline'` from `script-src` and sets
`style-src-attr 'none'`. It intentionally measures remaining
framework/data-script dependencies and inline style attributes without
blocking visitors. Because Next.js bootstrap/RSC scripts are expected to
violate this candidate, the header is scoped to the bilingual verification
routes, `/verification` and `/en/verification`, instead of every route. This
keeps the sample bounded while comparing both application shells.

The `/api/csp-report` endpoint accepts only CSP report content types, rejects
payloads above 16 KB, removes query strings and fragments from logged URLs,
limits arrays to ten entries, and applies a best-effort per-instance rate limit
of 60 requests per minute for each forwarded client address. The rate limit
protects an individual serverless instance; it is not a substitute for a
platform-level firewall or globally consistent rate-limit store.

Before changing the enforced policy:

1. collect and group CSP reports from both canaries by directive;
2. separate framework bootstrap reports from site-owned scripts and JSON-LD;
3. migrate remaining site-owned inline styles;
4. test production analytics, Speed Insights, structured data, theme selection, and hydration;
5. widen the canary only with a bounded reporting window and platform-level request controls;
6. enforce only after the report volume reaches an understood, acceptable baseline.

The report endpoint and policy telemetry do not prove that the stricter policy is safe by themselves.
