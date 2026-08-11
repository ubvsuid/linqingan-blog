# Safety Notes

The hardening phase intentionally preserves the existing trust boundary:

1. Database evidence is internal until accepted.
2. Accepted database evidence still does not make an article public by itself.
3. Markdown `consoleTested` / `liveTested` remains the public acceptance source of truth.
4. Revoked or rejected evidence is never returned by the public evidence reader.
5. Raw state and internal `source_ref` are not rendered publicly.
6. No public write endpoint is introduced.
7. No real runtime evidence is created by CI, smoke tests, fixtures, or migration scripts.
