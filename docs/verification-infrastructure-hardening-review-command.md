# Evidence Review Command

An optional explicit review step is available for teams that want the full lifecycle before acceptance:

```bash
node scripts/verification-evidence-review.mjs EV-XXXXXXXXXXXXXXXXXXXX --note="what was checked"
```

The command defaults to dry-run. Add `--commit` only after reviewing the evidence. It moves only `captured` or already `reviewed` rows to `reviewed`; it cannot reopen accepted, rejected, or revoked evidence.

The normal acceptance command may still accept a valid captured row directly while recording review metadata, so this explicit review step is optional rather than mandatory.
