# CSP inline compatibility boundary

The theme initializer is served from `/theme-init.js` and loaded with Next.js `beforeInteractive`. The layouts no longer inject that executable code with `dangerouslySetInnerHTML`.

## Enforced policy

The enforced `script-src` and `style-src` still include `'unsafe-inline'`. Removing either token immediately is not safe while the current static Next.js output includes framework bootstrap scripts, JSON-LD script elements, component style elements, and React style attributes.

Maintained route styles remain in CSS files instead of component `<style>`
blocks or React style attributes. The production build is not configured to
experimentally inline those styles, preserving browser/CDN reuse and avoiding
an additional deliberate dependency on inline CSS. Framework-emitted styles
and the remaining explicitly audited React style attributes still require the
current enforced compatibility boundary.

A nonce-based Next.js policy would require generating a nonce per request and would force otherwise static routes into dynamic rendering. That performance and caching trade-off is not introduced without production evidence.

## Report-Only canaries

The Report-Only policy removes `'unsafe-inline'` from `script-src` and sets
`style-src-attr 'none'`. It intentionally measures remaining
executable/data-script dependencies and inline style attributes without
blocking visitors. Because Next.js bootstrap/RSC scripts are expected to
violate this candidate, the header is scoped to the bilingual verification
routes, `/verification` and `/en/verification`, instead of every route. This
keeps the sample bounded while comparing both application shells. `style-src`
remains compatible with framework and component style elements while the
remaining migrations are audited.

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
