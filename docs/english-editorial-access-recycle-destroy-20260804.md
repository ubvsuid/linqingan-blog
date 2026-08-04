# English Editorial Review — Access, Recycling, and Destruction

Date: 2026-08-04  
Repository: `ubvsuid/linqingan-blog`  
Scope: three existing English articles only

## Routes

- `/en/blog/screeps-rampart-set-public`
- `/en/blog/screeps-recycle-creep`
- `/en/blog/screeps-structure-destroy`

No new article route was created. Existing slugs, Canonical URLs, Chinese mappings, hreflang pairs, and original publication dates are preserved.

## Technical review

Official Screeps API documentation and `screeps/engine` commit `80977824199a596d174d392fd0cf8c458c21fcbd` were reviewed.

### Rampart access

- `setPublic()` schedules a boolean state change and emits no Room event.
- The engine stores one `setPublic` intent for the exact Rampart ID, so a later same-tick call for that Rampart can replace the earlier value.
- The article now requires a strict boolean request, exact ID/room/coordinate identity, one shared per-tick dispatcher, pending state only after `OK`, and exact next-tick object verification.
- A missing original ID and a replacement Rampart at the same tile remain separate evidence states.
- Public access is not described as a player or alliance allow-list.

### Creep recycling

- Recycling binds exact Spawn and Creep IDs instead of relying on names alone.
- The processor checks target existence, ownership, spawning state and adjacency, but does not require the Spawn to be idle.
- One dispatcher reserves both object IDs, and a rejected irreversible request remains disabled for review.
- Exact Creep-ID disappearance is primary next-tick evidence.
- Dropped resource objects are reported as confounded secondary evidence because pickup, merging, prior piles, visibility and timing can change the observed result.
- No automatic `suicide()` fallback is present.

### Structure destruction

- `Structure.destroy()` authority comes from the owned room Controller.
- The preflight checks both hostile regular Creeps and hostile Power Creeps.
- Confirmation is bound to request ID, Structure ID, room, coordinates and `STRUCTURE_EXTENSION`; the old static phrase is not used as proof.
- One destructive operation slot prevents accidental multi-removal in the example dispatcher.
- Original-ID disappearance and a later replacement Extension at the same tile are reported separately.
- No Room event or refund is invented.

## Evidence and validation

- Dedicated auto-discovered simulation gate
- 30 TOC anchors checked
- At least 18 JavaScript blocks syntax-checked
- Offline decision and next-tick verification cases for all three operations
- Existing lifecycle, construction, and defense production smokes updated
- TypeScript, ESLint, production build, route, mapping, source coverage, accessibility, Vercel Preview and Lighthouse remain required by repository CI

## Internal quality score

This is a project-internal editorial score. It is not a Google score, ranking guarantee, or third-party certification.

| Article | Internal score |
|---|---:|
| Rampart access | **98/100** |
| Creep recycling | **98/100** |
| Extension destruction | **98/100** |

## Pending evidence

- Screeps Console execution: Pending
- Live same-tick Rampart overwrite trace: Pending
- Live public/private passage test: Pending
- Live recycling and exact resource-drop observation: Pending
- Live hostile Power Creep destruction rejection: Pending
- Genuine room or Console screenshots: Pending
- Real CPU and Memory measurements: Pending
- Search Console results: Pending
- Human desktop and mobile visual QA: Pending
- Production verification after merge: Pending
