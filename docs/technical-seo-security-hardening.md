# Technical, SEO, and Security Hardening

## Performance

- Shared header and footer CSS is emitted as a cached stylesheet instead of repeated inline style blocks.
- The sticky header no longer uses a costly backdrop blur during the initial paint.
- Below-the-fold English sections and the footer use `content-visibility: auto` with intrinsic-size fallbacks.
- Lighthouse now runs three times per route.
- Performance below 85, Best Practices below 90, CLS above 0.1, or TBT above 300 ms fails CI.
- LCP is a hard, staged budget rather than a warning: stable lightweight routes are capped at 2500 ms, the general route set at 2750 ms, and the known long Chinese article fixture at 3000 ms.

The route tiers are based on repeated local measurements and prevent a permanently red quality gate while keeping 2500 ms as the site-wide target. They must only tighten after repeated CI and production field data support the change. These are laboratory regression budgets; they do not replace production p75 LCP, INP, and CLS measurements.

## SEO and crawling

- Requests to the bare domain are permanently redirected to the canonical `www` host.
- Language sitemaps now emit only `loc` and meaningful `lastmod` values.
- Static route revisions are explicit; aggregate pages use the later of the route revision and the content they actually display.
- Existing canonical, hreflang, robots, and separate Chinese/English sitemap behavior remains in place.

## Security

- Header and footer styles were removed from inline component markup.
- The theme bootstrap is now a cacheable external script loaded before hydration.
- CSP now blocks frames and child browsing contexts and reports through both legacy and Reporting API endpoints.
- A stricter report-only candidate removes script `'unsafe-inline'` and rejects inline style attributes on the low-volume `/en/verification` canary route, avoiding expected Next.js bootstrap reports on every page.
- Permissions Policy now disables additional unused browser capabilities.
- `X-Permitted-Cross-Domain-Policies` and `Origin-Agent-Cluster` are enabled.
- CSP reports are size-limited, URL-query redacted, and logged as a bounded structured summary.
- `/.well-known/security.txt` publishes the security contact and canonical policy location.

## Evidence boundary

These changes improve laboratory checks and HTTP policy. Google Search Console recrawl state, production Core Web Vitals, and real-device behavior still require field verification after deployment.
