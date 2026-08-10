# Google Search Console indexing runbook

This runbook covers work that cannot be safely inferred from the repository or Vercel deployment. Record the actual Search Console result instead of marking a URL indexed from site-side evidence alone.

## Priority URLs

Inspect these after a structural or discovery update:

1. `https://www.linqingan.com/`
2. `https://www.linqingan.com/blog`
3. `https://www.linqingan.com/knowledge`
4. `https://www.linqingan.com/tags`
5. `https://www.linqingan.com/screeps-api`
6. `https://www.linqingan.com/verified`
7. `https://www.linqingan.com/en/screeps-api`
8. `https://www.linqingan.com/en/verified`

## Sitemap action

Submit or re-submit the canonical sitemap index after the production deployment is confirmed healthy.

For each sitemap, record:

- submitted date
- last read date
- discovered URL count
- processing status
- any reported parsing or fetch errors

## URL Inspection action

For every priority URL, record:

- inspection date
- Google-selected canonical
- user-declared canonical
- last crawl date
- crawl allowed status
- indexing allowed status
- referring sitemap
- current index status

Use **Request indexing** only after the production URL returns the intended page, canonical, hreflang, robots behavior, and sitemap entry.

## Coverage review

Review these groups separately:

- Crawled - currently not indexed
- Discovered - currently not indexed
- Duplicate / alternate canonical cases
- Soft 404 or redirect cases
- Blocked by robots/noindex cases

Do not change titles, H1s, canonicals, or URL structure merely because a fresh deployment has not been recrawled yet. First compare Google's last crawl date with the deployment date.

## CTR and position work

Only create a title/description optimization task when Search Console has enough query/page data to identify a real opportunity.

Prioritize:

- pages with meaningful impressions and low CTR for their position
- pages ranking roughly 5-20 with clear query relevance
- pages whose Google-selected canonical differs from the intended canonical

Store the before/after query, impressions, clicks, CTR, average position, change date, and page URL so later changes can be evaluated instead of guessed.
