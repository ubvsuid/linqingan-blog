# Live Screeps evidence acceptance

A guide may be marked Console-tested or live-tested only when the submitted evidence includes:

1. The affected guide and exact test objective.
2. Server or shard, room state, RCL, relevant objects, and tick range.
3. Exact code or action used.
4. Starting state and relevant return code.
5. One or more later-tick observations for stateful behavior.
6. Console output, screenshots, or logs with sensitive data removed.
7. Limitations explaining what the evidence does not prove.

Documentation review, syntax checks, generated examples, and offline simulations do not qualify as live-room evidence.

## Status lifecycle

- `needed`: the guide still needs a reproducible live observation.
- `submitted`: a contributor supplied evidence, but it has not been reviewed.
- `under-review`: the submission is being checked for reproducibility, scope, privacy, and limitations.
- `accepted`: the evidence passed review and may support only the claims demonstrated in the recorded environment.

A submitted or under-review item must link to its public repository issue. An accepted item must record the observation and acceptance dates, test environment, tick range, stable evidence links, and limitations. The public status file is available at `/en/evidence/status.json`.

Changing a backlog status does not automatically change an article's verification record. Article verification must be updated separately after accepted evidence has been checked against the guide.
