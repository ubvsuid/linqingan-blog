# Real-user performance budget

Lighthouse remains the synthetic regression gate. Vercel Speed Insights / real-user measurements are the production decision source for field performance.

## Project targets

Review the 75th percentile for the canonical production host, separately for mobile and desktop when enough samples exist.

Project intervention targets:

- LCP: investigate when p75 is above 2.5 s
- INP: investigate when p75 is above 200 ms
- CLS: investigate when p75 is above 0.10

These are project operating thresholds. Do not fail a deployment from a tiny or statistically unstable field sample.

## Review cadence

Review after:

- a major homepage or layout change
- a new client-heavy tool or search feature
- a framework/runtime upgrade
- a sustained increase in field traffic
- a synthetic Lighthouse regression

## Triage order

1. Confirm the regression is visible on the canonical production host rather than preview traffic.
2. Split by route and device class.
3. Compare the deployment date with the metric window.
4. Identify whether the issue is LCP asset/server delivery, INP client work, or CLS layout movement.
5. Make the smallest route-specific correction.
6. Keep the Lighthouse gate and field metric separate so a synthetic improvement is not presented as real-user proof.

## Data to record

For every performance intervention, record:

- route
- deployment/commit
- sample window
- device class
- p75 LCP / INP / CLS
- suspected cause
- code change
- follow-up window and result
