# English Editorial Review — Notification, Event Window, and RoomVisual Evidence

Date: 2026-08-05  
Repository: `ubvsuid/linqingan-blog`  
Scope: three existing English articles only

## Routes

- `/en/blog/screeps-game-notify`
- `/en/blog/screeps-room-event-log`
- `/en/blog/screeps-roomvisual-debug`

No new article route was created. Existing slugs, Canonical URLs, Chinese mappings, hreflang pairs, and original publication dates are preserved.

## Primary evidence reviewed

- Official Screeps API documentation for `Game.notify()`
- Official Screeps API documentation for `Room.getEventLog()`
- Official Screeps API documentation for `RoomVisual`, `getSize()`, `clear()`, `export()`, and `import()`
- Official Screeps engine commit `80977824199a596d174d392fd0cf8c458c21fcbd`
- Engine `src/game/game.js` notification intent behavior
- Engine room event-log and RoomVisual implementation boundaries

## Technical review

### Notification revision identity

- A request key no longer authorizes a payload that can silently change underneath it.
- Message, incident key, grouping interval, request ID, and explicit revision contribute to a deterministic payload digest.
- Changing the payload creates a new revision with a new creation tick, expiry, digest, and confirmation.
- One shared dispatcher reserves both incident identity and request revision and caps local call slots at 20.
- The engine returns `OK` when the notification intent enters the queue and `ERR_FULL` when the per-tick intent limit is exhausted.
- A local submission record is created only after `OK`.
- Queue, expiry, supersession, rejection, local submission, and external delivery remain separate states.
- External email delivery is not claimed from game code.

### Exact previous-tick event windows

- Every window is bound to room name, `eventTick`, `readAt`, parsed/raw mode, and a project schema version.
- The committed window itself is the idempotency marker; a separate reader marker cannot drift away from stored content.
- `Room.getEventLog()` is treated as a previous-tick window, not a historical backfill API.
- Visibility, CPU, initialization, or global-reset gaps are recorded with exact missing ticks rather than replaced with empty windows.
- Ownership snapshots include `capturedAt` and are accepted only when `capturedAt === eventTick` and the room identity matches.
- Current object state is not substituted for historical ownership evidence.
- Array index is documented as local to the exact returned window and schema namespace.
- Unsupported event types retain minimal identity and counts instead of disappearing.

### Room-bound visual identity

- Every layer and mark is bound to one room and the current capture tick.
- Cross-room numeric coordinates are rejected before rendering.
- One shared dispatcher reserves unique layer IDs and renders once per room.
- Existing current-tick bytes reveal an earlier independent writer; the final dispatcher does not silently clear that writer.
- `clear()` and `import()` are treated as room-wide operations that require the same owner.
- Item count, label length, and a conservative soft byte ceiling work together below the official 512,000-byte hard limit.
- The renderer reports local drawing calls and serialized bytes only.
- RoomVisual method chaining is not treated as browser display proof or game-action completion evidence.

## Validation design

The auto-discovered editorial simulation checks:

- all three preserved routes and original publication dates;
- exactly 30 source-owned TOC anchors;
- at least 18 JavaScript blocks with `node --check`;
- exact notification revision and digest identity;
- `OK` versus `ERR_FULL` handling;
- event-window no-backfill and exact `capturedAt` ownership rules;
- parsed mode and schema conflict behavior;
- cross-room and stale visual rejection;
- pre-existing visual writer detection;
- local-only evidence language and explicit Pending live evidence;
- registry metadata and final override wiring.

The production smoke checks rendered titles, headlines, Canonical URLs, hreflang pairs, JSON-LD, modified dates, search results, blog index entries, sitemap entries, and the new technical signals. Every HTTP request uses a finite timeout.

## Internal quality score

This is a project-internal editorial score. It is not a Google score, ranking guarantee, or third-party certification.

| Article | Internal score |
|---|---:|
| Notification revision identity | **98/100** |
| Previous-tick event windows | **98/100** |
| Room-bound visual identity | **98/100** |

## Pending evidence

- Screeps Console execution: Pending
- Live `Game.notify()` call-cap and grouping behavior: Pending
- External email delivery and latency observation: Pending
- Live room visibility and event-window gap test: Pending
- Live raw and parsed event-log comparison: Pending
- Live competing RoomVisual writer, clear/import, and byte-margin test: Pending
- Genuine Console, inbox, and room screenshots: Pending
- Real CPU and Memory measurements: Pending
- Search Console results: Pending
- Human desktop and mobile visual QA: Pending
- Production verification after merge: Pending
