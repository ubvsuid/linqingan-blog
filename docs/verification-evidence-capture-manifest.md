# Verification Evidence Capture Manifest

This document defines the internal capture identity that precedes every real Console or live multi-tick evidence record.

## Principle

A capture is the provenance record for one controlled Screeps runtime observation session. One capture may produce one or more `verification_evidence` rows, but every evidence row must point back to exactly one capture through `sourceRef`.

The capture manifest is internal maintenance material. It is not a public upload format and it does not create a public write API.

## Capture ID

Use this format:

```text
CAP-YYYYMMDD-LABEL
```

Examples:

```text
CAP-20260811-ERR-NIR-001
CAP-20260811-MOVETO-001
CAP-20260811-SPAWNCREEP-001
```

The corresponding evidence `sourceRef` must be:

```text
capture:CAP-20260811-ERR-NIR-001
```

The writer rejects free-form values such as `screenshot1`, `final-test`, `fixture:console`, or `test-0811`.

## Recommended manifest fields

Maintain the following information outside the public site before importing evidence:

```json
{
  "captureId": "CAP-YYYYMMDD-LABEL",
  "capturedAt": "REAL_ISO_TIMESTAMP",
  "environment": "official-mmo | private-server | other-real-runtime",
  "shard": "REAL_SHARD_OR_NULL",
  "roomName": "REAL_ROOM_OR_NULL",
  "codeRevision": "GIT_COMMIT_OR_INTERNAL_REVISION",
  "operator": "INTERNAL_OPERATOR_REFERENCE",
  "purpose": "WHAT_BEHAVIOR_THIS_CAPTURE_IS_TESTING",
  "rawArtifacts": [
    "INTERNAL_CONSOLE_LOG_REFERENCE",
    "INTERNAL_SCREENSHOT_REFERENCE",
    "INTERNAL_MULTI_TICK_LOG_REFERENCE"
  ],
  "notes": "OPTIONAL_INTERNAL_NOTES"
}
```

Do not commit secrets, Screeps tokens, database credentials, private account data, or sensitive raw files into the public repository.

## Capture to evidence flow

```text
Real Screeps runtime
        ↓
Capture manifest
        ↓
Raw observation / screenshot / log
        ↓
Evidence JSON
        ↓
validation + deterministic EV key
        ↓
status=captured
        ↓
review / accept / reject
        ↓
Markdown acceptance
        ↓
public /verified + article evidence card
```

## Evidence key

`evidenceKey` is not typed manually. The validator derives a stable key from the evidence identity:

- article slug
- verification type
- API/runtime surface
- capture source reference
- Game.time
- tick start
- tick end

The output uses:

```text
EV-<20 uppercase hexadecimal characters>
```

Re-importing the same identity generates the same key.

## Trust boundary

A capture manifest proves provenance, not correctness by itself. A captured row stays internal until reviewed. An accepted database row still does not make an article publicly verified until the Markdown verification state explicitly accepts the same Console/live level.
