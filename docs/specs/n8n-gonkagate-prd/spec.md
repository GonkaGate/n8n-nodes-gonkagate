# GonkaGate `n8n` Integration PRD

## Problem

GonkaGate needs a first-class `n8n` integration that:

- keeps a durable provider-owned root node
- also supports modern `n8n` AI-model workflows
- stays truthful about GonkaGate's currently shipped backend surface

The original MVP solved the root-node problem but not the modern AI-model-node
problem.
This PRD now defines the intended shipped package shape after the additive
chat-model decision.

## Desired Behavior

A user installs one GonkaGate package, creates one GonkaGate credential, and
can then choose between two GonkaGate-owned surfaces:

- `GonkaGate` for provider-root workflows and direct helper operations
- `GonkaGate Chat Model` for modern AI workflow connections

The package must remain GonkaGate-branded, self-hosted-first, and honest about
current `/v1` capabilities.

## Users

Primary installer:

- self-hosted `n8n` instance owner / admin

Primary builder:

- workflow builder using GonkaGate through the root/app node

Secondary builder:

- AI-oriented workflow builder using GonkaGate in AI-agent or AI-chain style
  flows

## In Scope

- one public npm package
- one public repository
- one shared GonkaGate credential
- durable root node `GonkaGate`
- additive AI model node `GonkaGate Chat Model`
- model discovery UX, manual fallback, docs, compatibility posture, and release
  guidance

## Out Of Scope

- GonkaGate backend changes
- `/v1/responses` implementation
- broad OpenAI parity promises beyond current evidence
- `n8n` Cloud promises
- verified-node promises

## Constraints

### GonkaGate constraints

- canonical base URL: `https://api.gonkagate.com/v1`
- current repo-grounded backend surfaces:
  - `GET /v1/models`
  - `POST /v1/chat/completions`
- `/v1/chat/completions` supports JSON and SSE
- `/v1/models` may return an empty set

### `n8n` constraints

- community nodes are npm packages
- community packages can expose AI-language-model nodes
- current `n8n` AI Node SDK is preview-only
- official SDK guidance says AI nodes are not yet accepted for verification

### Product constraints

- package identity remains provider-branded around GonkaGate
- root-node identity remains durable
- manual `Model ID` fallback remains available
- live discovery cannot become a hard runtime dependency
- package remains self-hosted-first

## Decisions

### Package Identity

- primary package identity: `GonkaGate`
- supporting copy may say `OpenAI-compatible`
- do not rebrand the package around `OpenAI`, `Chat`, `Completions`, or
  `Responses`

### Package Name

Preferred:

- `@gonkagate/n8n-nodes-gonkagate`

Fallback:

- `n8n-nodes-gonkagate`

### Node And Credential Names

- durable root node: `GonkaGate`
- additive AI model node: `GonkaGate Chat Model`
- credential: `GonkaGate API`

### Package Shape

Ship one package with two node surfaces:

1. `GonkaGate`
2. `GonkaGate Chat Model`

The second surface is additive.
It does not replace or demote the root node.

### Root Node Contract

`GonkaGate` must keep:

- `List Models`
- `Chat Completion`
- shared credential reuse
- hybrid model selection:
  - live list from `/v1/models`
  - manual `ID` mode fallback

`GonkaGate` root-node `Chat Completion` remains a non-streaming JSON operation.

### AI Model Node Contract

`GonkaGate Chat Model` must:

- be provider-branded
- connect through `AiLanguageModel`
- reuse `GonkaGate API`
- load models from `/v1/models`
- preserve manual `Model ID` fallback
- explicitly keep Responses mode off
- target `/v1/chat/completions`

### Streaming Contract

The package must distinguish:

- provider SSE support
- root-node execution behavior
- visible `n8n` live streaming behavior

Current truthful claim:

- provider SSE exists
- the AI model node can participate in streaming-capable `n8n` AI workflows
- the root node remains non-streaming

Not claimed:

- `/v1/responses`
- full visible streaming parity across all `n8n` workflow shapes

### Support Posture

- self-hosted first
- publish a narrow compatibility matrix
- do not promise blanket `n8n` version support
- do not promise `n8n` Cloud
- do not promise verified-node eligibility

## Functional Requirements

1. Users must be able to authenticate once with `GonkaGate API`.
2. Users must be able to use `GonkaGate` root-node `List Models`.
3. Users must be able to use `GonkaGate` root-node `Chat Completion`.
4. Users must be able to use `GonkaGate Chat Model` in `n8n` AI workflows.
5. Both surfaces must be able to use live model discovery through the shared
   credential/auth path.
6. Both surfaces must preserve manual `Model ID` fallback.
7. The package must not enable or imply `/v1/responses`.
8. The package must keep a path open to add `/v1/responses` later without
   renaming the package or credential.

## Non-Functional Requirements

1. Keep runtime additions minimal and justified.
2. Keep docs and package metadata aligned with actual node surfaces.
3. Preserve upstream request identifiers and meaningful error messages where
   possible.
4. Keep the package self-hosted-first while `n8n`'s AI SDK remains preview-only
   for verification.
5. Keep the compatibility posture evidence-based rather than aspirational.

## Current Shipped Shape

- package: `@gonkagate/n8n-nodes-gonkagate`
- credential: `GonkaGate API`
- root node:
  - `GonkaGate`
  - `List Models`
  - non-streaming `Chat Completion`
  - hybrid model selector
- additive AI model node:
  - `GonkaGate Chat Model`
  - `AiLanguageModel` output
  - `/v1/chat/completions` with Responses mode off
  - optional streaming flag

## Deferred Work

- `/v1/responses`
- broader GonkaGate-specific advanced controls in node UI
- authoritative capability matrices for every model
- broader live validation across AI-agent-specific behaviors
- verified-node submission / Cloud work

## Risks

- If the package overclaims `/v1/responses`, it will mislead users about the
  current GonkaGate backend.
- If the chat-model node is treated as a replacement for the root node, the
  durable provider-owned identity will get weaker.
- If live model discovery is treated as authoritative, the UX will degrade when
  GonkaGate returns an empty model list.
- If the package is described as verification-ready while the AI SDK is still
  preview-only, repository truth will drift from platform reality.

## Product Summary

The correct product shape is now:

- one GonkaGate-branded package
- one shared credential
- one durable root node
- one additive GonkaGate-owned chat-model node

That is the package truth all docs and implementation should preserve.
