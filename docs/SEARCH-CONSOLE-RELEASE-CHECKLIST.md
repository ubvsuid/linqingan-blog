# Search Console release checklist

Use this after a successful production deployment.

1. Confirm the production deployment commit SHA matches the default branch HEAD.
2. Open `/sitemap.xml` and verify all listed URLs return HTTP 200.
3. Resubmit the sitemap in Google Search Console.
4. Inspect the homepage, `/beginner`, `/knowledge`, `/search` and five priority articles.
5. Request indexing only for materially changed priority URLs.
6. Record the crawl date and indexing result in the release notes.
7. Do not repeatedly submit the same URL; wait for Google to recrawl it.
