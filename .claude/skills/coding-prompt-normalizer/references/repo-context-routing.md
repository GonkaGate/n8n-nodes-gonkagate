# Repo Context Routing

Use this file to choose only the repository context that materially changes the
generated prompt.

Do not dump the whole repo summary into the output. Pull only the relevant
points.

## Always-True Defaults

- The downstream agent already works inside this repository.
- Do not explain how to inspect files, edit code, create folders, or run
  ordinary repo commands.
- `n8n-nodes-gonkagate` is a public OSS `n8n` community-node package.
- The repo currently contains docs, PRD, implementation planning, CI/release
  setup, and a minimal node/credential scaffold under `nodes/GonkaGate/` and
  `credentials/`.
- Canonical current surfaces are `README.md`, `AGENTS.md`, `docs/`,
  `package.json`, `.github/workflows/`, `.claude/skills/`, and
  `.agents/skills/`.
- Avoid generic tool instructions like "inspect the repo" unless the request
  explicitly needs them.

## Use Repo Constraints Selectively

Include a repository constraint only when it changes the task:

- preferred package name is `@gonkagate/n8n-nodes-gonkagate`
- fallback package name is `n8n-nodes-gonkagate`
- current MVP node name is `GonkaGate`
- current credential name is `GonkaGate API`
- current MVP operations are `Chat Completion` and `List Models`
- self-hosted `n8n` is the MVP distribution target
- `n8n` Cloud is contingent on later verified-node approval
- manual `Model ID` is part of the MVP contract
- current scaffold files already exist at `nodes/GonkaGate/GonkaGate.node.ts`,
  `nodes/GonkaGate/GonkaGate.node.json`, and
  `credentials/GonkaGateApi.credentials.ts`
- the MVP runtime operations are not implemented yet
- the credential currently exposes the `API Key` field only
- the canonical production base URL remains an open product decision
- `n8n-node` strict package checks are available via `npm run lint:n8n` and
  `npm run build:n8n`
- `npm run build` is part of default CI now that the scaffold exists
- if public behavior changes, `README.md`, `docs/README.md`, the PRD, the
  implementation plan, and possibly `AGENTS.md` may need updates to stay
  truthful

## Routing By Task Signal

### Package, Release, Public UX

Use when the request mentions package identity, npm publishing, release
automation, package metadata, install flow, or user-facing onboarding.

Useful context:

- `package.json`
- `.github/workflows/ci.yml`
- `.github/workflows/release-please.yml`
- `.github/workflows/publish.yml`
- `README.md`
- `docs/README.md`
- `AGENTS.md`

### Node And Credential Surface

Use when the request mentions `n8n` nodes, credentials, base URL behavior,
supported operations, `n8nNodesApiVersion`, or future `/v1/responses` support.

Useful context:

- `docs/specs/n8n-gonkagate-prd/spec.md`
- `docs/plans/n8n-gonkagate-node-mvp-implementation-plan.md`
- `credentials/`
- `nodes/`
- `package.json`

Relevant reminders:

- current implementation starts from the existing scaffold, not from empty
  placeholders
- `nodes/GonkaGate/GonkaGate.node.ts` already exposes the MVP operations but
  currently throws a scaffold `NodeOperationError`
- `credentials/GonkaGateApi.credentials.ts` currently stores only `API Key`
- prompts should not invent a `src/` runtime when the real package surface
  lives under `nodes/` and `credentials/`
- the canonical production base URL is still unresolved unless explicitly fixed
  elsewhere in the repo
- broad PRD implementation requests should usually be narrowed to a concrete
  phase or bounded file set before emitting a direct coding prompt
- MVP should stay aligned with the current documented package surface

### Docs, Product Messaging, Truthfulness

Use when the task is mainly about repo documentation, product positioning,
support claims, or changelog accuracy.

Useful context:

- `README.md`
- `docs/README.md`
- `docs/specs/n8n-gonkagate-node-research/spec.md`
- `docs/specs/n8n-gonkagate-prd/spec.md`
- `AGENTS.md`

Relevant reminders:

- docs should distinguish current repository reality from planned future state
- `OpenAI-compatible` is supporting copy, not the primary identity
- product-surface changes are not just copy edits; they may imply architecture
  or implementation work

### Tests, Tooling, Contract Integrity

Use when the request mentions CI, formatting, package quality, bootstrap state,
or when to promote stricter `n8n` package checks into default CI.

Useful context:

- `scripts/check-bootstrap.mjs`
- `package.json`
- `.github/workflows/ci.yml`
- `.github/workflows/publish.yml`
- `tsconfig.json`
- `eslint.config.mjs`

Relevant reminders:

- `npm run ci` is the current primary local verification command
- `npm run build` is already part of default CI because the scaffolded node and
  credential are real package surfaces
- `npm run lint:n8n` remains the stricter verification-oriented check, and
  unresolved license or product-contract decisions can still affect that path

### Skills, Prompts, Agent Workflow

Use when the request is about local skills, prompt rewriting, agent
instructions, or repo-local workflow assets.

Useful context:

- `.claude/skills/`
- `.agents/skills/`
- `AGENTS.md`
- the specific local skill folder touched by the request

Relevant reminders:

- skill assets are mirrored under both `.claude` and `.agents`
- prompt assets should stay aligned with the actual current repo state
- if a skill is repo-specific, examples and literals should point to current
  package surfaces, not to the source repo the skill originally came from

## Output Discipline

When you include repo context in the final prompt:

- prefer short bullets or short paragraphs
- name the most relevant docs or code areas first
- keep background only if it changes the downstream agent's first decisions
- avoid repeating repo facts unless they change the downstream agent's first
  decisions
