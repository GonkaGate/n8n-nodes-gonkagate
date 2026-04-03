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

## Start Here

1. Install the package in self-hosted `n8n`.
2. Create the `GonkaGate API` credential and paste your API key.
3. Add the `GonkaGate` node, choose `Chat Completion`, pick a model, and run
   the node.
4. If you want the shortest path, import the
   [first request workflow](./examples/quickstart/gonkagate-first-request.workflow.json)
   and follow the [Quickstart](./docs/quickstart.md).

Install the published package from the Community Nodes UI in self-hosted `n8n`.
For local builds, Docker, manual install, or queue mode, use the
[Installation Guide](./docs/install.md).

If you only want the fastest first request, start with `GonkaGate`, not
`GonkaGate Chat Model`.

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

- [Quickstart](./docs/quickstart.md)
- [Installation Guide](./docs/install.md)
- [Compatibility Matrix](./docs/compatibility.md)
- [Known Limitations](./docs/known-limitations.md)
