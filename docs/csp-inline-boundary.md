# CSP inline compatibility boundary

The theme initializer is served from `/theme-init.js` and loaded with Next.js `beforeInteractive`. The layouts no longer inject that executable code with `dangerouslySetInnerHTML`.

## Enforced policy

The enforced `script-src` and `style-src` still include `'unsafe-inline'`. Removing either token immediately is not safe while the current static Next.js output includes framework bootstrap scripts, JSON-LD script elements, generated CSS style elements, and React style attributes.

Maintained route styles remain in CSS files at source level instead of component
`<style>` blocks or React style attributes. The production build enables
Next.js `experimental.inlineCss` because repeatable three-run Lighthouse data
showed the compact route stylesheets were the remaining LCP bottleneck: the
browser waited on two or three render-blocking CSS requests, with an estimated
first-load saving of roughly 300 ms when those requests are removed.

This setting deliberately favors first-time search visitors and slow or
high-latency connections. The trade-off is that generated CSS is repeated in
the initial HTML/RSC payload and cannot benefit from a separately cached
stylesheet on repeat visits. Keep the setting only while production field CWV,
HTML transfer size, cache behavior, and navigation measurements support it.
The feature is experimental, global, and must be revalidated after every
Next.js upgrade.

A nonce-based Next.js policy would require generating a nonce per request and would force otherwise static routes into dynamic rendering. That performance and caching trade-off is not introduced without production evidence.

## Report-Only canaries

The Report-Only policy removes `'unsafe-inline'` from `script-src` and sets
`style-src-attr 'none'`. It intentionally measures remaining
executable/data-script dependencies and inline style attributes without
blocking visitors. Because Next.js bootstrap/RSC scripts are expected to
violate this candidate, the header is scoped to the bilingual verification
routes, `/verification` and `/en/verification`, instead of every route. This
keeps the sample bounded while comparing both application shells. `style-src`
remains compatible with generated style elements while the remaining
site-owned style attributes are audited.

The `/api/csp-report` endpoint accepts only CSP report content types, rejects
payloads above 16 KB, removes query strings and fragments from logged URLs,
limits arrays to ten entries, and applies a best-effort per-instance rate limit
of 60 requests per minute for each forwarded client address. The rate limit
protects an individual serverless instance; it is not a substitute for a
platform-level firewall or globally consistent rate-limit store.

Before changing the enforced policy:

1. collect and group CSP reports from both canaries by directive;
2. separate framework bootstrap reports from site-owned scripts and JSON-LD;
3. migrate remaining site-owned inline style attributes;
4. test production analytics, Speed Insights, structured data, theme selection, hydration, and inlined CSS;
5. widen the canary only with a bounded reporting window and platform-level request controls;
6. enforce only after the report volume reaches an understood, acceptable baseline.

The report endpoint and policy telemetry do not prove that the stricter policy is safe by themselves.
