# Documentation Index

## Product Truth

The repository now ships a two-surface package:

- durable root/app node: `GonkaGate`
- additive AI model node: `GonkaGate Chat Model`
- shared credential: `GonkaGate API`

The package remains provider-branded, self-hosted-first, and truthful about the
currently implemented backend surface:

- `GET /v1/models`
- `POST /v1/chat/completions`

## Specs

- [n8n GonkaGate Node Research](./specs/n8n-gonkagate-node-research/spec.md)
- [n8n GonkaGate PRD](./specs/n8n-gonkagate-prd/spec.md)

## Planning Notes

The detailed workflow-plan and implementation-plan artifacts are not currently
checked into this repository. Treat the PRD, install docs, compatibility
matrix, and release checklist as the maintained operational source of truth.

## Operational Guides

If you want to install this package on a real self-hosted `n8n` instance, start
with [Installation Guide](./install.md).
If the package is already installed and you want to verify it in the UI,
continue with [Quickstart](./quickstart.md).
If you are contributing locally from this repository, use the local-development
path documented in [Installation Guide](./install.md).

- [Quickstart](./quickstart.md)
- [Installation Guide](./install.md)
- [Compatibility Matrix](./compatibility.md)
- [Fallback OpenAI-Compatible Paths](./fallback-openai-paths.md)
- [Known Limitations](./known-limitations.md)
- [Release Checklist](./release-checklist.md)

## Examples

- [Importable First Request Workflow](../examples/quickstart/gonkagate-first-request.workflow.json)
- [Self-Hosted Docker Example](../examples/docker/self-hosted)

## Notes

- the source-of-truth product documents remain the PRD, research memo, and
  implementation plan
- the root [README.md](../README.md) remains the public entrypoint
- operational docs carry install, compatibility, fallback, and release guidance
- the canonical public GonkaGate base URL remains
  `https://api.gonkagate.com/v1`
- the additive AI model surface does not change the package's self-hosted-first
  posture
