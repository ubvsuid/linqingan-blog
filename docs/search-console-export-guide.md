# Google Search Console export workflow

1. Open Performance > Search results in Google Search Console.
2. Select a meaningful date range, then export Pages or Queries as CSV.
3. Keep Clicks, Impressions, CTR, and Position columns in the export.
4. Run:

```bash
npm run searchconsole:report -- path/to/export.csv
```

5. Review `reports/search-console-opportunities.md`.
6. Confirm intent, device, country, and date-range context before changing a page.

The report does not connect to Google Search Console and does not contain private data unless a maintainer explicitly supplies an export.
