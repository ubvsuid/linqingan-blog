# Site audit remediation checklist

## Implemented in code

- [x] Run Lighthouse against Chinese and English production routes with the mobile profile.
- [x] Add an independent Lighthouse pull-request workflow.
- [x] Enforce Content Security Policy and remove `unsafe-eval`.
- [x] Add a bounded CSP report endpoint.
- [x] Derive Sitemap dates from meaningful content changes.
- [x] Keep English topic counts and metadata synchronized.
- [x] Strengthen the English homepage value proposition and primary action.
- [x] Move key English homepage, article, search, about, knowledge, and tool styles out of inline markup.
- [x] Show English article author and meaningful update dates.
- [x] Add English article feedback, prefilled issue reports, RSS, and changelog follow-up.
- [x] Track zero-result English searches and provide a guide-request path.
- [x] Add related-guide recommendations after English tools.
- [x] Strengthen the English author entity, editorial policy, and evidence boundaries.
- [x] Publish a 12-guide live-evidence backlog and validate it during builds.
- [x] Add structured live-evidence and accessibility review issue forms.
- [x] Add a repeatable Google Search Console opportunity report command.
- [x] Expand the quarterly content review workflow.
- [x] Add eight indexable English knowledge pillar pages.
- [x] Add evidence and knowledge pillars to the English Sitemap.

## Requires real external evidence or private data

These items cannot be truthfully completed by source-code changes alone. The repository now provides a defined workflow and acceptance criteria for each one.

- [ ] Attach accepted Console output, screenshots, and multi-tick observations to the 12 priority guides.
- [ ] Import a current Google Search Console CSV and review the generated opportunity report.
- [ ] Review Vercel Speed Insights field data after production traffic reaches the changed routes.
- [ ] Complete keyboard, screen-reader, touch, and 200% zoom reviews on real devices.
- [ ] Earn and document legitimate community references or external links.
- [ ] Publish case studies only after the underlying live-room evidence exists.

Do not mark these items complete by inference, generated screenshots, or synthetic claims.
