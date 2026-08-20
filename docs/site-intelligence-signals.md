# Site Intelligence Signals V2

Signals normalizes GSC, first-party behavior, and Runtime Evidence onto Site Asset Master V2 without calculating a composite score.

## Identity and language

Signal IDs are semantic hashes and do not include input row position. Reordering the same observations therefore keeps the same IDs.

Owner lookup is language-scoped. A cross-language expected Owner is discarded and same-language Owner resolution is attempted instead. If no same-language Owner exists, the row becomes a language mapping review and cannot create a cannibalization P0.

## GSC sources

Historical Warehouse is the preferred operational source. The Signals report can read:

- `--gsc-source warehouse` (latest period, a selected period, or `--gsc-import-id`);
- `--gsc-source file --gsc <compatibility-json>` for preview/backward compatibility;
- `--gsc-source none`.

CTR is a ratio internally (0–1).

## Behavioral gates

Internal Search requires both source-level maturity and row/query-level maturity. The current minimum remains 20 observations. Tool Usage and Article Feedback retain their existing source gates.

Runtime Evidence is direct technical evidence, not popularity, and does not independently create SEO P0.

Unmapped observations remain visible in `unmappedSignals`.
