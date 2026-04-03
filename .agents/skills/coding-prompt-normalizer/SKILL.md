---
name: coding-prompt-normalizer
description: 'Turn rough, mixed-language, speech-to-text-like, or partially specified coding requests into strong prompts for agents working inside n8n-nodes-gonkagate. Use when the user asks to rewrite, normalize, package, or clarify a task for Codex or Claude in this repository, even if the input is messy, repetitive, nonlinear, or only partly grounded; the job is intent reconstruction plus repo-aware prompt composition, not literal translation.'
---

# Coding Prompt Normalizer

## Purpose

Turn noisy user task descriptions into clean prompts that help a coding agent
start in the right place in `n8n-nodes-gonkagate`.

Reconstruct intent, strip filler, preserve exact technical literals, choose the
right task mode, and inject only the repository context that materially changes
execution.

Be honest about the current state of the repository:

- this repo is a public OSS `n8n` community-node package
- the repo currently contains docs, PRD, implementation planning, CI/release
  setup, and a minimal `GonkaGate` node plus `GonkaGate API` credential
  scaffold
- current implementation entrypoints already exist at
  `nodes/GonkaGate/GonkaGate.node.ts`,
  `nodes/GonkaGate/GonkaGate.node.json`, and
  `credentials/GonkaGateApi.credentials.ts`
- the node and credential surfaces are wired into the package, but the MVP
  runtime operations are not implemented yet
- `README.md`, `AGENTS.md`, `docs/`, `package.json`,
  `.github/workflows/`, `.claude/skills/`, and `.agents/skills/` are the
  main current contract surfaces
- the current intended public identity is:
  - package: `@gonkagate/n8n-nodes-gonkagate`
  - node: `GonkaGate`
  - credential: `GonkaGate API`
- unresolved product-contract items such as the canonical production base URL
  and MIT-vs-Apache licensing must stay explicit when they matter

Do not normalize a prompt into a fake implementation brief for files or runtime
paths that do not exist unless the user is explicitly asking to create them.
Do not normalize away an explicit blocker by pretending an unresolved product
decision is already settled.

## Use This Skill For

- rough notes, pasted chat fragments, or dictated transcripts
- mixed-language coding requests
- requests like "turn this into a normal prompt", "package this for Codex", or
  "rewrite this for an agent"
- repetitive, nonlinear, partially explained tasks where the downstream agent
  still needs a strong starting prompt

## Do Not Use It For

- generic translation with no repository work
- writing the code, spec, or review itself; this skill prepares the prompt
- inventing files, behaviors, or product decisions that the repo does not
  support

## Relationship To Neighbor Skills

- Use this skill first when the main problem is poor task phrasing.
- After the prompt is reconstructed, downstream work may use repo skills such
  as `typescript-coder`, `technical-design-review`,
  `verification-before-completion`, or `spec-first-brainstorming`.
- Do not turn this skill into a replacement for those domain skills. Its job is
  to create a better starting prompt, not to own the whole workflow.

## Workflow

1. Normalize the raw input.
   - Load `references/input-normalization.md`.
   - Remove filler, loops, false starts, and duplicated fragments.
   - Keep code-like literals verbatim.
2. Infer the task mode.
   - Choose one primary mode:
     `implementation`, `bug-investigation`, `review-read-only`, `refactor`,
     `planning-spec`, `architecture-analysis`, `docs-and-messaging`, or
     `tooling-prompting`.
   - If two modes are present, choose the one that changes the downstream
     agent's first action.
3. Decide whether the request is ready for direct execution.
   - Use a direct coding prompt only when the requested change, likely target
     surface, and success criteria are sufficiently inferable, and the work
     looks like a bounded local change.
   - Default to `bug-investigation` when symptoms are clear but the fix is not.
   - Default to `planning-spec` or `architecture-analysis` when the request is
     too ambiguous for safe coding.
   - Default to `planning-spec` for non-trivial or hard-to-reverse work such as
     package naming changes, license changes, verified-node path changes,
     package metadata changes, provider-surface changes, credential UX changes,
     support-matrix changes, or broad repository-wide refactors.
   - Keep still-open product decisions such as the canonical production base
     URL, MIT-vs-Apache, or support-matrix wording explicit instead of
     silently deciding them inside the prompt.
   - Review requests stay read-only.
4. Select repository context.
   - Load `references/repo-context-routing.md`.
   - Include only the repo facts, docs, constraints, and code areas that
     materially affect this task.
   - Prefer `2-5` targeted points over a project summary.
5. Compose the prompt.
   - Do not mention the source language unless the user explicitly asks.
   - Default the output prompt to English because the repo docs, code, and
     agent instructions are English-first.
   - If the user explicitly requests another output language, honor that.
   - Write for an agent that already has repo access and knows how to inspect
     files, edit code, and navigate the workspace.
   - Keep the prompt dense and action-oriented.
6. Run a final quality gate.
   - No hallucinated files, requirements, or product decisions.
   - No generic stack dump.
   - Exact literals preserved.
   - Assumptions and open questions explicit where certainty is weak.

## Literal Preservation Rules

- Preserve exact file paths, CLI commands, env vars, code identifiers, config
  keys, package names, node names, model ids, field names, and domain terms
  verbatim.
- Wrap preserved literals in backticks inside the final prompt.
- Do not "improve" or rename tokens like
  `@gonkagate/n8n-nodes-gonkagate`, `n8n-nodes-gonkagate`,
  `GonkaGate`, `GonkaGate API`, `credentials/GonkaGateApi.credentials.ts`,
  `nodes/GonkaGate/GonkaGate.node.ts`, `n8n-community-node-package`,
  `n8nNodesApiVersion`, `/v1/chat/completions`, `/v1/models`,
  `/v1/responses`, `Use Responses API = false`, `npm run ci`,
  `npm run lint:n8n`, or `npm run build:n8n`.
- If transcript noise makes a literal uncertain, keep that uncertainty explicit.
  Use a phrase like `Possible original literal:` rather than silently
  normalizing it.
- Preserve user constraints exactly when they change execution:
  `read-only`, `do not edit files`, `no refactor`, `investigate first`,
  `do not touch docs`, `do not change package name`, or
  `keep .claude and .agents in sync`.

## Readiness Rules

Emit an `implementation` or `refactor` prompt only when all are true:

- the requested change is understandable
- the likely code area is narrow enough to inspect first
- ambiguity does not materially change the execution path
- the work does not appear to change fixed product invariants or other
  hard-to-reverse behavior
- no unresolved product-contract blocker needs to be guessed to perform the
  change
- the target surface already exists, or the user is explicitly asking to create
  that new surface

Emit a `bug-investigation` prompt when any are true:

- the text is symptom-first or regression-first
- the root cause is unclear
- multiple ownership seams could explain the behavior
- the task may involve mismatch between docs, runtime behavior, and repository
  contract

Emit a `review-read-only` prompt when the user asks to inspect, review, audit,
or explicitly avoid edits.

Emit a `planning-spec` or `architecture-analysis` prompt when:

- the task is exploratory or cross-cutting
- requirements are incomplete
- the user asks for a plan, spec, or design direction
- the user says to "implement the PRD" or otherwise implies a whole feature
  set or phase without narrowing the slice
- the request touches package naming, licensing, publish flow, credential UX,
  provider surface, verified-node constraints, or broader product-contract
  decisions
- the request depends on still-open decisions such as canonical base URL,
  license, or support posture
- the repo does not yet contain the implementation surface the request assumes
- resolving ambiguity is more important than coding immediately

Emit a `docs-and-messaging` prompt when the task is mainly about `README.md`,
`docs/`, other public contract docs, or keeping the public package contract
truthful.

Emit a `tooling-prompting` prompt when the task is about local skills, prompt
rewriting, agent instructions, mirrored `.claude` and `.agents` assets, or
repo-local workflow surfaces.

When ambiguity remains high, keep `Assumptions` and `Open questions` short but
explicit. Do not hide uncertainty behind polished wording.

## Output Template

Adapt the sections to the mode. Default order:

- `Objective`
- `Relevant repository context`
- `Likely relevant code areas / files`
- `Problem statement` or `Requested change`
- `Constraints / preferences / non-goals`
- `Acceptance criteria` or `Expected outcome`
- `Validation / verification`
- `Assumptions / open questions`

Mode-specific adjustments:

- `review-read-only`
  - say the task is read-only
  - ask for findings first
  - replace implementation acceptance criteria with review deliverable
    expectations
- `bug-investigation`
  - ask the agent to confirm the symptom path and identify root cause before
    coding
  - describe the expected evidence, likely seams, and what should be verified
- `planning-spec` and `architecture-analysis`
  - emphasize boundaries, risks, missing information, and candidate decisions
    rather than edits
- `docs-and-messaging`
  - emphasize user-visible truthfulness and keeping `README.md`, `docs/`, and
    other public contract docs aligned when behavior changes
- `tooling-prompting`
  - keep repo context focused on local skills, prompts, mirrored workflow
    assets, and agent-facing support material

Keep the prompt compact. Do not force all sections when `1-2` focused
paragraphs do the job better.

## Prompt Composition Rules

- Start with the real objective, not with "rewrite this prompt".
- When the request is anchored in
  `docs/specs/n8n-gonkagate-prd/spec.md` or
  `docs/plans/n8n-gonkagate-node-mvp-implementation-plan.md`, map it to the
  smallest concrete implementation slice the repo is ready to execute; if the
  slice is still too broad, keep the prompt in planning mode.
- Prefer concrete repo surfaces when they are grounded by the input or the
  repository.
- Turn vague references like "here", "this config", or "that flow" into
  hypotheses only when the repo strongly supports one interpretation.
- Separate grounded repo facts from assumptions.
- Mention the first files or docs to inspect when that is reasonably inferable.
- Prefer existing scaffold files like `credentials/GonkaGateApi.credentials.ts`,
  `nodes/GonkaGate/GonkaGate.node.ts`, and
  `nodes/GonkaGate/GonkaGate.node.json` over imaginary `src/` paths.
- Keep validation realistic: focused checks such as `npm run ci`,
  `npm run lint:n8n`, `npm run build:n8n`, targeted doc sync, or package-metadata
  review. Do not default to broad verification unless the change is broad.
- Do not repeat repo-wide instructions unless they materially affect this task.
- Use the existing repo surfaces when they are materially relevant. Do not
  invent implemented node runtime files that are absent or still scaffold-only.
- When the task touches a mirrored local skill, prefer keeping the `.claude`
  and `.agents` copies aligned unless the request says otherwise.
- If a current file only provides scaffold behavior, say that plainly instead
  of describing it as already implemented.
- Do not propose product changes like `OpenAI-compatible` branding as the main
  package identity or broad `Chat Model` parity unless the user explicitly asks
  for a product-contract change and the prompt frames it as such.
