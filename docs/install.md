# Installation Guide

This package is self-hosted-first.
It does not currently promise `n8n` Cloud availability.

Installed package surfaces:

- `GonkaGate`
- `GonkaGate Chat Model`
- `GonkaGate API`

## Fastest Path To First Request

If your goal is speed, use this order:

1. install the package
2. create `GonkaGate API`
3. use the root node `GonkaGate`
4. run `Chat Completion`

Recommended links:

- [Quickstart](./quickstart.md)
- [Importable First Request Workflow](../examples/quickstart/gonkagate-first-request.workflow.json)

Do not start with `GonkaGate Chat Model` unless you already want an AI Agent or
another `AiLanguageModel` workflow.

## Development / Local Preview

Use this path when you are developing the package locally or testing it before
an npm release:

```bash
nvm use
npm install
npm run dev
```

`npm run dev` uses `n8n-node dev`, which starts a local `n8n` instance and
links the package into a custom nodes directory for development.

After `npm run dev`, the fastest validation path is still the same:

- import the first-request workflow
- create the credential
- pick a model
- run the root node

## GUI Install After npm Publish

Use this path only after the package has been published to npm.

- On a self-hosted `n8n` instance, open the Community Nodes UI.
- Install `@gonkagate/n8n-nodes-gonkagate`.
- Restart `n8n` if your deployment model requires it.

If the package has not been published yet, this path is not available yet.

After installation, go directly to [Quickstart](./quickstart.md) if you want
the shortest path to a working request.

## Manual Package Install

Use this path when you want to install an unpublished or locally built package
into a self-hosted `n8n` environment.

1. Build the package:

```bash
npm run build
```

2. Create a tarball if needed:

```bash
npm pack
```

3. On the host or container where `n8n` runs, create the community-node install
   directory and move into it:

```bash
mkdir -p ~/.n8n/nodes
cd ~/.n8n/nodes
```

If you use a custom `N8N_USER_FOLDER`, install into `$N8N_USER_FOLDER/nodes`
instead.

4. Install the package from npm or from a local tarball:

```bash
npm install @gonkagate/n8n-nodes-gonkagate
```

```bash
npm install /absolute/path/to/gonkagate-n8n-nodes-gonkagate-0.1.0.tgz
```

5. Restart `n8n`.

## Docker Install

For Docker-based deployments:

- bake the package into the image under `~/.n8n/nodes`, or
- install it into a persisted `~/.n8n/nodes` volume that survives container
  restarts

Then restart the `n8n` container with the same package version available.

## Queue Mode / Workers

If your self-hosted deployment uses queue mode or separate worker containers:

- install the same package version on the main `n8n` process
- install the same package version on every worker that can execute workflows
- use the same `~/.n8n/nodes` package contents, or the equivalent
  `$N8N_USER_FOLDER/nodes` path, on every runtime process
- restart all of those processes together

Do not mix package versions between main and worker processes.

## Credential Default

The hidden credential URL defaults to `https://api.gonkagate.com/v1`, which
matches the current public GonkaGate docs.

If you created a `GonkaGate API` credential before this default was wired in,
delete and recreate that credential once so it no longer stores the legacy
placeholder value.

## Which Surface Should You Start With?

| Start with...          | When                                                             |
| ---------------------- | ---------------------------------------------------------------- |
| `GonkaGate`            | First request, auth checks, model checks, direct chat completion |
| `GonkaGate Chat Model` | AI Agent or other `AiLanguageModel` workflow design              |

## Streaming Setup Notes

The package now exposes two different streaming postures:

- `GonkaGate` root node:
  `Chat Completion` still returns one final JSON response
- `GonkaGate Chat Model`:
  can participate in streaming-capable `n8n` AI workflows through
  `/v1/chat/completions`

Visible chunked streaming in `n8n` still depends on the surrounding workflow
shape.
For chat-style UX, prefer `AI Agent` plus `Chat Trigger` or another
streaming-capable response path.

## Rollback / Downgrade

If a newly installed package version causes trouble in a self-hosted
deployment:

1. Stop the main `n8n` process and every worker that can execute workflows.
2. Remove the current `@gonkagate/n8n-nodes-gonkagate` package version from the
   same Node/npm environment where `n8n` runs.
3. Reinstall the last known-good package version or tarball in that same
   environment.
4. Restart the main process and every worker together so all runtime processes
   see the same node package version.

If the failed install was the first attempted version, remove the package
entirely, restart `n8n`, and fall back to the documented stock OpenAI-compatible
paths until the next package release is ready.
