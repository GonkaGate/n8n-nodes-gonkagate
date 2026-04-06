# Changelog

## Unreleased

- Adopt the `MIT` license for the package and repository metadata so strict
  `n8n` community-package lint can pass and the verified-node path stays open.
- Add a repeatable self-hosted install-and-load smoke script plus a dedicated
  release checklist for cautious `v0.x` preparation.
- Add the additive `GonkaGate Chat Model` node in the same package while
  preserving the durable root `GonkaGate` node and shared `GonkaGate API`
  credential.
- Upgrade model selection to a shared live-list-plus-manual-ID pattern across
  both node surfaces.
- Add a quickstart path, importable first-request workflow, clearer
  root-vs-chat-model guidance, and lightweight troubleshooting to reduce
  time-to-first-request.
- Keep the root node non-streaming while wiring the chat-model surface for
  chat-completions-based AI workflow streaming with Responses mode disabled.
- Refresh the README, specs, compatibility docs, fallback guidance, and release
  docs to the new two-surface package truth.

## [0.2.0](https://github.com/GonkaGate/n8n-nodes-gonkagate/compare/v0.1.0...v0.2.0) (2026-04-06)

### Features

- add docker install and release automation ([18a7ad2](https://github.com/GonkaGate/n8n-nodes-gonkagate/commit/18a7ad2acdfcbb38a30fa5063a26a0ca823d27ee))
- add docker install and release automation ([7d0ef07](https://github.com/GonkaGate/n8n-nodes-gonkagate/commit/7d0ef07c2267c7311110a666edcb5af235c07fa1))

## 0.1.0

- Initial repository bootstrap with docs, package metadata, CI, and release
  automation.
- Implement the `GonkaGate` MVP runtime for `List Models` and non-streaming
  `Chat Completion`.
- Centralize auth and transport ownership in the `GonkaGate API` credential and
  shared request helper.
- Add explicit node-facing error normalization for auth, network, and upstream
  API failures.
- Adopt the `MIT` license for the package and repository metadata.
- Fix the hidden credential default to the published canonical GonkaGate API
  base URL: `https://api.gonkagate.com/v1`.
- Add dedicated install, compatibility, fallback, and limitations docs for the
  implemented MVP surface.
- Add rollback and downgrade guidance for self-hosted installs.
- Wire the default build path to `n8n-node build`.
- Fix GitHub Actions publishing so CI can publish without bypassing local
  safeguards.
