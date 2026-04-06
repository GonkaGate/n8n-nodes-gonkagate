# AGENTS.md

Repository operating contract for `n8n-nodes-gonkagate`.

This repo is the public open-source home for the GonkaGate `n8n` community
node package. It is not the GonkaGate backend itself.

## 1. What This Repository Is

`n8n-nodes-gonkagate` is intended to become the first-class `n8n` integration
for GonkaGate.

The current product direction is:

- package name: `@gonkagate/n8n-nodes-gonkagate`
- fallback package name: `n8n-nodes-gonkagate`
- durable root node name: `GonkaGate`
- additive AI model node name: `GonkaGate Chat Model`
- credential name: `GonkaGate API`
- root-node operations:
  - `Chat Completion`
  - `List Models`
- distribution:
  - public GitHub repo
  - public npm package
  - self-hosted `n8n` first

This repo currently contains:

- research artifacts
- PRD
- implementation plan
- development bootstrap
- implemented root-node runtime for `List Models` and non-streaming
  `Chat Completion`
- implemented additive AI model surface for `n8n` AI workflows

This repo now contains an implemented MVP runtime slice with the canonical
public GonkaGate base URL fixed in repository truth as
`https://api.gonkagate.com/v1`.

## 2. Core Product Identity

The package is provider-branded, not protocol-branded.

This means:

- the primary product identity is `GonkaGate`
- supporting docs may say `OpenAI-compatible`
- the primary node, credential, or package name must not lead with
  `OpenAI-compatible`
- do not rename the project around `chat`, `completions`, or `responses`
  unless there is an explicit product decision to do so

Why:

- GonkaGate is positioned as a gateway to Gonka Network
- the package should survive growth from `/v1/chat/completions` into
  `/v1/responses` and possibly broader provider surfaces

## 3. Current Product Invariants

These are current repo-level product decisions. Changing them is not a small
refactor; it is a product decision.

- The canonical user-facing node name is `GonkaGate`.
- The canonical credential name is `GonkaGate API`.
- The package remains a root/app-node-first product, not a `Chat Model`-only
  identity.
- `GonkaGate Chat Model` is now an implemented additive surface inside the same
  package.
- MVP is self-hosted-first.
- `n8n` Cloud is contingent on verified-node approval and must not be promised
  as if it were guaranteed.
- Manual `Model ID` entry remains part of the MVP contract.
- Live model discovery is a convenience, not a hard dependency.
- The package should remain ready to add `/v1/responses` later without
  renaming package or credential.
- Do not claim blanket support for all `n8n` versions.
- Publish a tested compatibility matrix instead of a vague support promise.

Current open product decisions that must not be silently assumed closed:

- how soon `/v1/responses` becomes implementation scope
- whether verified-node / `n8n` Cloud is a hard business goal or only a later
  opportunity

## 4. Scope Boundaries

This repo does:

- own the `n8n` package surface
- own `n8n` credentials and node UX
- own packaging, docs, CI, release automation, and npm publishing
- own compatibility guidance for supported `n8n` paths

This repo does not:

- own the GonkaGate backend
- change GonkaGate API contracts by itself
- own GonkaGate pricing, routing, or settlement behavior
- promise parity with all OpenAI/OpenRouter features in `n8n`

When in doubt, keep the package honest to the backend we actually have rather
than emulating broader provider behavior for appearance.

## 5. Source Of Truth Docs

Read these before making meaningful product or structural changes:

- [README.md](./README.md)
- [docs/specs/n8n-gonkagate-node-research/spec.md](./docs/specs/n8n-gonkagate-node-research/spec.md)
- [docs/specs/n8n-gonkagate-prd/spec.md](./docs/specs/n8n-gonkagate-prd/spec.md)
- [docs/plans/n8n-gonkagate-node-mvp-implementation-plan.md](./docs/plans/n8n-gonkagate-node-mvp-implementation-plan.md)

Document authority:

- `docs/specs/n8n-gonkagate-prd/spec.md` is the product/design source of truth
- `docs/plans/n8n-gonkagate-node-mvp-implementation-plan.md` is the phased
  implementation plan
- `README.md` is the public repository entrypoint

If implementation changes any of those truths, update the docs in the same
change.

## 6. Repository Structure

Current intended structure:

```text
.
├── .nvmrc
├── AGENTS.md
├── README.md
├── CHANGELOG.md
├── LICENSE
├── package.json
├── package-lock.json
├── tsconfig.json
├── eslint.config.mjs
├── .prettierrc.js
├── .github/
│   └── workflows/
├── credentials/
│   └── GonkaGateApi.credentials.ts
├── nodes/
│   ├── GonkaGate/
│   │   ├── GonkaGate.node.ts
│   │   ├── GonkaGate.node.json
│   │   ├── actions/
│   │   ├── transport/
│   │   ├── utils/
│   │   └── gonkagate.svg
│   └── LmChatGonkaGate/
│       ├── LmChatGonkaGate.node.ts
│       ├── LmChatGonkaGate.node.json
│       └── gonkagate.svg
├── scripts/
│   ├── check-bootstrap.mjs
│   └── check-publish-context.mjs
└── docs/
    ├── README.md
    ├── plans/
    └── specs/
```

Expected future implementation layout:

```text
credentials/
  GonkaGateApi.credentials.ts

nodes/
  GonkaGate/
    GonkaGate.node.ts
    GonkaGate.node.json
    actions/
    transport/
    utils/
  LmChatGonkaGate/
    LmChatGonkaGate.node.ts
    LmChatGonkaGate.node.json
```

## 7. Package And Build Rules

Default build/release posture:

- use `npm`
- use `@n8n/node-cli`
- keep a single public npm package
- keep a standalone public repository
- publish only built artifacts that belong in the package

Do not introduce lightly:

- custom bundlers such as `vite` or `tsup`
- monorepo-first publishing complexity
- mirrored release pipelines
- provider SDK runtime dependencies

Preferred implementation posture:

- direct HTTP integration over provider SDK dependency
- keep runtime additions minimal and justified
- the official `n8n` AI Node SDK is allowed only when needed for the additive
  `GonkaGate Chat Model` surface
- keep package metadata aligned with actual package contents

## 8. CI And Release Rules

Current CI is intentionally split into two layers.

### Default development-safe CI

Current default CI runs:

- formatting check
- bootstrap file checks
- TypeScript typecheck
- `n8n` package build
- focused helper tests where added

This is intentional because the repo now has a minimal package scaffold but not
the broader post-MVP surface yet.

### Stricter n8n package checks

These commands already exist:

- `npm run lint:n8n`
- `npm run build`

`npm run build` is part of default CI now that the first real node and
credential files exist.

`npm run lint:n8n` remains a stricter verification-oriented check until the
license decision is closed.

Do not claim the repo is verification-ready for `n8n` package validation until
`npm run lint:n8n` passes, and do not treat that lint result as a replacement
for live self-hosted runtime validation.

### Release Safety

Do not run these without explicit user intent:

- `npm run release`
- any workflow-dispatch or tag push meant to publish to npm
- any license change
- any package rename

### Commit Message Rules

This repository uses `release-please`, so commit messages must follow the
Conventional Commits style.

Use this default shape:

- `<type>(<scope>): <short imperative summary>`

Examples:

- `feat(docker): publish a ready-to-run GHCR image`
- `fix(models): handle empty model catalog responses`
- `docs(install): clarify Docker self-hosted path`

Commit typing rules:

- use `feat` for user-visible additions that should trigger a minor release
- use `fix` for user-visible bug fixes that should trigger a patch release
- use `docs`, `test`, `ci`, `build`, `refactor`, or `chore` only when you do
  not intend the commit itself to drive a release bump
- if a change is release-relevant, do not hide it under `chore`
- if one commit contains mixed work, choose the highest-signal release type

Release Please behavior:

- `release-please` opens a release PR only from releasable commit types such as
  `feat` and `fix`
- merges into `main` that contain only `docs`, `chore`, `ci`, `test`, or other
  non-releasable commit types will not create a new version by themselves
- non-conventional subjects such as `Add Docker flow` are treated as
  non-releasable for release automation purposes
- if you expect a new package version, make sure the commit subject itself is a
  releasable Conventional Commit before merging to `main`

Message hygiene:

- keep the summary short, specific, and imperative
- do not end the summary with a period
- avoid vague subjects such as `update stuff` or `misc fixes`

## 9. UX And Naming Guardrails

Do:

- keep GonkaGate branding primary
- keep setup simple
- prefer honest capability names over ambitious parity names
- reserve `Chat Model` wording for a surface that truly deserves that label
- keep credentials simple and user-oriented

Do not:

- name the package, node, or credential with `OpenAI` in the primary title
- imply “drop-in replacement for all OpenAI nodes” unless proven
- make model discovery mandatory when manual `Model ID` is still the reliable
  path
- overfit the MVP to current `n8n` AI-agent fashion if it makes the package
  identity brittle

## 10. Verified-Node-Friendly Guardrails

If the project may later pursue verified-node listing, preserve that path by
default:

- prefer MIT-compatible decisions when business/legal allows
- keep UI/docs in English
- do not rely on env access in node runtime
- do not rely on filesystem access in node runtime
- avoid runtime dependencies unless truly necessary
- keep GitHub Actions provenance publishing intact

Current reality:

- the repo now ships an `MIT` license file
- the additive `GonkaGate Chat Model` surface uses `n8n`'s preview AI Node SDK
- current official SDK guidance says AI nodes are not yet accepted for
  verification

So:

- do not silently assume verified-node eligibility is already solved
- do not describe this package as verified-node-ready while the AI model node
  remains part of the package

## 11. Documentation Rules

When you change:

- package identity
- node or credential naming
- MVP scope
- install flow
- support matrix
- release behavior

you must update the relevant docs in the same change.

Minimum docs to keep aligned:

- `README.md`
- `docs/README.md`
- PRD
- implementation plan if sequencing changed
- compatibility guidance once implementation begins

## 12. Practical Working Rules

Safe everyday commands:

- `rg`
- `git status`
- `git diff`
- `npm install`
- `npm run ci`
- `npm run format:write`

Be careful with:

- `npm run lint:n8n`
- `npm run build:n8n`

These are expected to fail until real node files exist.

Never:

- delete docs because they feel “temporary”
- publish a package version without checking the release workflows and metadata
- replace a product decision with a guessed implementation shortcut

## 13. Success Standard

A good change in this repo does all of the following:

- keeps the GonkaGate identity durable
- makes the package more honestly aligned with real GonkaGate capabilities
- reduces future migration pain toward `/v1/responses`
- keeps docs and package metadata in sync
- preserves or improves the future verified-node path rather than accidentally
  blocking it
