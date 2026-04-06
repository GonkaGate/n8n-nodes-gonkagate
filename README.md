# GonkaGate for n8n

`@gonkagate/n8n-nodes-gonkagate` is the GonkaGate community node package for
self-hosted `n8n`.

Use it if you want a GonkaGate-first integration instead of wiring stock
OpenAI-compatible nodes by hand. The package gives you:

- the root node `GonkaGate`
- the additive AI model node `GonkaGate Chat Model`
- the shared credential `GonkaGate API`

Today the package targets GonkaGate's OpenAI-compatible
`GET /v1/models` and `POST /v1/chat/completions` surface, with the canonical
base URL fixed to `https://api.gonkagate.com/v1`.

## Install

This package is for self-hosted `n8n`.
The easiest install path for most users is the Community Nodes UI inside `n8n`.

### Easiest Install

1. Open your self-hosted `n8n` instance.
2. Open `Settings`.
3. Open `Community Nodes`.
4. Click `Install`.
5. Enter:

```text
@gonkagate/n8n-nodes-gonkagate
```

6. Confirm the community-node prompt if `n8n` shows it.
7. Wait for installation to finish.
8. Restart `n8n` if your deployment model requires it.

If you use Docker, you can run the published image directly:

```bash
docker run -d \
  --name n8n \
  -p 5678:5678 \
  -e GENERIC_TIMEZONE="<YOUR_TIMEZONE>" \
  -e TZ="<YOUR_TIMEZONE>" \
  -e N8N_ENFORCE_SETTINGS_FILE_PERMISSIONS=true \
  -v n8n_data:/home/node/.n8n \
  ghcr.io/gonkagate/n8n-nodes-gonkagate:latest
```

For production, pin an exact image tag such as
`ghcr.io/gonkagate/n8n-nodes-gonkagate:0.1.0`.
If you prefer Docker Compose, use the ready example in
[examples/docker/self-hosted](./examples/docker/self-hosted).

If you use queue mode, want to merge this into an existing Docker stack, or
need an unpublished build, use the [Installation Guide](./docs/install.md).

## First Check

After installation:

1. Open your `n8n` UI.
2. Click `Start from scratch`.
3. Add `Manual Trigger`.
4. Click `+` to add the next node.
5. Search for `gonka` or `GonkaGate`.
6. If `n8n` opens the `AI Nodes` picker first, check `Results in other
categories`.
7. Choose the plain `GonkaGate` node.
8. Ignore `GonkaGate Tool` and `GonkaGate Chat Model` for the first check.
9. Set `Operation` to `List Models`.
10. Create `GonkaGate API`, paste your API key, and save.
11. Click `Execute step` or `Execute workflow`.

If that works, change the same node to `Chat Completion`, choose a model, and
run one short test message.

For the full click-by-click flow, continue with
[Quickstart](./docs/quickstart.md).

## Other Install Paths

Use the [Installation Guide](./docs/install.md) if you need one of these:

- manual `npm install` on a server
- public Docker image via `docker run` or Docker Compose
- advanced Docker install with your own custom image
- queue mode or worker-based deployments
- tarball install for staging or unpublished builds

## Which Node Should You Use?

| Start with...          | Use it when...                                                     |
| ---------------------- | ------------------------------------------------------------------ |
| `GonkaGate`            | You want the fastest first request, `List Models`, or easier setup |
| `GonkaGate Chat Model` | You are building `AI Agent` or other `AiLanguageModel` workflows   |

## What Works Today

- `GonkaGate` with `List Models`
- `GonkaGate` with non-streaming `Chat Completion`
- `GonkaGate Chat Model` for `n8n` AI workflows
- shared `GonkaGate API` credential across both node surfaces
- live model discovery from `GET /v1/models`
- manual `Model ID` fallback when the live list is empty or unavailable

## Current Limits

- no `/v1/responses` support
- no blanket `n8n` version support claim
- self-hosted first only, with no `n8n` Cloud promise
- no verified-node eligibility claim
- root-node `Chat Completion` returns one final JSON response instead of visible
  live streaming
- `GonkaGate Chat Model` is the better fit for streaming-capable AI workflows,
  but not every workflow shape has been live-validated yet

For the exact support posture, see the
[Compatibility Matrix](./docs/compatibility.md) and
[Known Limitations](./docs/known-limitations.md).

## Docs

- [Installation Guide](./docs/install.md)
- [Quickstart](./docs/quickstart.md)
- [Compatibility Matrix](./docs/compatibility.md)
- [Known Limitations](./docs/known-limitations.md)
- [Self-Hosted Docker Example](./examples/docker/self-hosted)
