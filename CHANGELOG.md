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

## [0.3.0](https://github.com/GonkaGate/n8n-nodes-gonkagate/compare/v0.2.4...v0.3.0) (2026-04-29)


### Features

* **models:** default to Kimi K2.6 model ID ([aa9f12b](https://github.com/GonkaGate/n8n-nodes-gonkagate/commit/aa9f12bcf584ec9a1517b87e306c1ee3d395ec3a))
* **models:** default to Kimi K2.6 model ID ([a4be5d2](https://github.com/GonkaGate/n8n-nodes-gonkagate/commit/a4be5d24baedcaed72a599c083fc467087f76c5a))


### Bug Fixes

* **docker:** pin npm for source image builds ([94da7b9](https://github.com/GonkaGate/n8n-nodes-gonkagate/commit/94da7b900ad1baf18fd3b26ce0b4a5b3d34f6bfd))

## [0.2.4](https://github.com/GonkaGate/n8n-nodes-gonkagate/compare/v0.2.3...v0.2.4) (2026-04-08)


### Bug Fixes

* **verification:** prepare package for verified submission ([aa86160](https://github.com/GonkaGate/n8n-nodes-gonkagate/commit/aa86160b28b0bbfaf08010106591f6f3db689035))
* **verification:** prepare package for verified submission ([6f0fb4c](https://github.com/GonkaGate/n8n-nodes-gonkagate/commit/6f0fb4cfd0c56f58b0ae940078cd97ee752298fd))

## [0.2.3](https://github.com/GonkaGate/n8n-nodes-gonkagate/compare/v0.2.2...v0.2.3) (2026-04-07)


### Bug Fixes

* **docker:** make published n8n image load GonkaGate nodes ([e9f1c24](https://github.com/GonkaGate/n8n-nodes-gonkagate/commit/e9f1c24852def4fc92905bef68f636f506781a40))
* **docker:** make published n8n image load GonkaGate nodes ([9d8de7b](https://github.com/GonkaGate/n8n-nodes-gonkagate/commit/9d8de7b9d0df8a082169669eb2bd6abcdd4df85f))

## [0.2.2](https://github.com/GonkaGate/n8n-nodes-gonkagate/compare/v0.2.1...v0.2.2) (2026-04-06)


### Bug Fixes

* **release:** clarify releasable commit requirements ([301e777](https://github.com/GonkaGate/n8n-nodes-gonkagate/commit/301e7772b78f7a78291b9d8b8a95d9d9d5c83f4a))
* **release:** clarify releasable commit requirements ([ce0e8a9](https://github.com/GonkaGate/n8n-nodes-gonkagate/commit/ce0e8a94858f7a9ed2e6cdd90b7dcebc43d185f4))

## [0.2.1](https://github.com/GonkaGate/n8n-nodes-gonkagate/compare/v0.2.0...v0.2.1) (2026-04-06)


### Bug Fixes

* update Dockerfile to improve node module installation and symlink handling for ai-node-sdk and n8n-workflow ([79605e4](https://github.com/GonkaGate/n8n-nodes-gonkagate/commit/79605e424a53d8a4e3c1093df2e1bbf9bbbe3633))

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
