# linqingan.com Codex Runtime Bootstrap

This repository is part of the `linqingan.com` project.

This file is a **runtime adapter**, not a second project-memory or rule store.

## Canonical sources

- Current project state: Google Drive `linqingan.com/PROJECT_MEMORY`.
- Canonical orchestration: Google Drive `linqingan.com/AgentSystem`.
- Formal project rules: Google Drive `linqingan.com/规则` plus the active ChatGPT Project Instructions where applicable.
- Verified current repository / runtime / Production reality outranks cached pointers.

Do not copy PROJECT_MEMORY, Growth state, Production truth, Runtime Evidence truth, or full AgentSystem business contracts into this repository just to make them easier to read.

## Project-task bootstrap

For linqingan.com project work:

1. Read `.agent-system/canonical-manifest.yaml` and `.agent-system/runtime-profile.yaml`.
2. Resolve canonical `PROJECT_MEMORY` through an available project connector/MCP capability when the task depends on project state.
3. Use canonical AgentSystem `Context -> Authority -> Router`.
4. After routing, resolve runtime capabilities with `Core/RuntimeResolver`.
5. Use `DataSourceResolver` only when external data capability is required.
6. Load only the rules + Module/Workflow needed by the selected workline.
7. Run fresh `Preflight` before any L1/L2/L3 mutation or permission escalation.
8. Validate and stop according to the canonical Workflow.

If canonical project state is unavailable and the task depends on it, report `LOCAL_ONLY` / `DEGRADED_CONTEXT` and **do not perform project mutation**. Do not guess from stale repo notes.

## Permission boundaries

The same levels apply in every runtime:

- `L0 READ_ONLY`: inspect, analyze, compare, plan.
- `L1 DRIVE_WRITE`: canonical project documentation/state sync only after Preflight.
- `L2 DEVELOPMENT_WRITE`: bounded development writes on fixed `gpt-work` only.
- `L3 PRODUCTION_WRITE`: controlled Preview/Production/Production-data/Evidence lifecycle operations only with explicit current authorization and fresh Preflight.

Tool availability never grants permission.
A handoff packet carries context and `requested_permission`; it never carries `authorized_permission`.

## Development safety

For L2 development:

- use the fixed `gpt-work` branch; do not create ordinary feature/test/release branches;
- before every write transaction, fresh-read current branch/HEAD and reconcile concurrent changes;
- never force-push, reset, roll back, or overwrite another workline;
- lock exact scope and protected surfaces before mutation;
- if implementation needs a genuinely new file/path outside locked scope, stop and re-Preflight/re-scope first;
- required validation and push CI must pass before `DEVELOPMENT_COMPLETE`;
- `DEVELOPMENT_COMPLETE` always stops and never implies Preview or Production.

## Release safety

Production release exists only after an explicit current user Production instruction creates `RELEASE_REQUEST` and fresh L3 Preflight passes.

Never infer release permission from `继续`, `完成`, Development Complete, an old authorization, a handoff packet, or the presence of deployment tools.

Release must use canonical `Workflows/Release`: fresh Production ancestry, isolated exact-file scope, no whole-`gpt-work` merge/copy, no force/reset, and no automatic rollback/corrective Production commit.

## Scoped AGENTS.md files

Before touching a file, inspect any more-specific `AGENTS.md` / `AGENTS.override.md` that applies to its directory tree. More-specific repo instructions may tighten implementation/testing guidance, but they cannot raise project permission or bypass canonical AgentSystem safety. A material conflict -> HOLD / INVESTIGATE.

## Skills / MCP

Skills and MCP servers are optional capability providers. They may package reusable steps or external access, but they do not own Router, Preflight, current project state, formal rules, or permission.

## Cross-runtime handoff

When receiving a GPT/Codex handoff, use canonical `Runtime/Contracts/02_HANDOFF_CONTRACT`: re-resolve current project state, current repo reality, runtime capabilities, Authority, exact scope, and fresh Preflight before mutation.
