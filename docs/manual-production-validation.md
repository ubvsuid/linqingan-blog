# Manual production validation

After deployment, verify the following with real production URLs:

- English and Chinese HTML language attributes.
- Canonical and hreflang output on paired routes.
- English Sitemap includes eight knowledge pillars and the evidence backlog.
- CSP reports no required resource blocked.
- Vercel Speed Insights collects LCP, INP, and CLS for English routes.
- Article feedback events appear without collecting credentials.
- Zero-result search events contain only a bounded query and resource type.
- Keyboard navigation, visible focus, screen-reader landmarks, touch targets, and 200% zoom.
- GitHub issue templates prefill the affected guide without exposing private information.

Synthetic Lighthouse results are a release gate, not a substitute for field data or manual assistive-technology checks.
