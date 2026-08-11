# Verification Evidence Review

Use `scripts/verification-evidence-review.mjs` when an explicit intermediate review state is useful. The command is optional because `verification-evidence-accept.mjs` can accept a valid captured row directly while recording review metadata.

A reviewed row remains internal and is never returned by public evidence readers until it becomes `accepted` and the matching Markdown verification flag is also approved.
