# Technical, SEO, and Security Hardening

## Performance

- Shared header and footer CSS is emitted as a cached stylesheet instead of repeated inline style blocks.
- The sticky header no longer uses a costly backdrop blur during the initial paint.
- Below-the-fold English sections and the footer use `content-visibility: auto` with intrinsic-size fallbacks.
- Lighthouse now runs three times per route.
- Performance below 80, Best Practices below 90, CLS above 0.1, or LCP above 2750 ms fails CI.

The 2750 ms LCP gate is the first enforced budget. The next target is 2500 ms after production field data confirms the updated shell is stable.

## SEO and crawling

- Requests to the bare domain are permanently redirected to the canonical `www` host.
- Language sitemaps now emit only `loc` and meaningful `lastmod` values.
- Existing canonical, hreflang, robots, and separate Chinese/English sitemap behavior remains in place.

## Security

- Header and footer styles were removed from inline component markup.
- CSP now blocks frames and child browsing contexts and reports through both legacy and Reporting API endpoints.
- A stricter report-only candidate blocks inline style attributes for migration telemetry.
- Permissions Policy now disables additional unused browser capabilities.
- `X-Permitted-Cross-Domain-Policies` and `Origin-Agent-Cluster` are enabled.
- CSP reports are size-limited, URL-query redacted, and logged as a bounded structured summary.
- `/.well-known/security.txt` publishes the security contact and canonical policy location.

## Evidence boundary

These changes improve laboratory checks and HTTP policy. Google Search Console recrawl state, production Core Web Vitals, and real-device behavior still require field verification after deployment.
