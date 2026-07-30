# Sitemap `lastmod` policy

`lastmod` must describe a meaningful change to the page a visitor receives. It is not a deployment timestamp.

## Static routes

Every index, reference, tool, policy, and landing page in the language sitemaps has an explicit revision in `src/data/static-page-revisions.json`.

Update that date only when the route changes materially, for example:

- the visible copy, navigation, or task flow changes;
- a tool gains or changes behavior;
- structured reference data shown on the route changes;
- the page's indexing or canonical intent changes.

Do not update it for formatting-only commits, dependency updates, rebuilds, or unrelated shared-shell changes.

## Aggregate routes

Article indexes, learning routes, knowledge hubs, tag indexes, the homepage, and changelogs use the later of:

1. the explicit static route revision; and
2. the latest meaningful date of content displayed by that route.

Individual articles and dynamic knowledge pages continue to use their own content dates. Tag pages use only dates from articles assigned to that tag.

## Release check

Run `node scripts/check-sitemap-revisions.mjs`. The check rejects missing routes, invalid or future dates, and obsolete sitemap priority/frequency fields.
