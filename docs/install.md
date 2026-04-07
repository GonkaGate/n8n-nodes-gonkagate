# Installation Guide

This package is self-hosted-first.
It does not currently promise `n8n` Cloud availability.

Production-ready open-source `n8n` nodes are usually:

1. published as npm packages
2. installed into a self-hosted `n8n` instance from npm
3. version-pinned in production

This repository now also publishes a ready-to-run Docker image for users who
want the GonkaGate package preinstalled in self-hosted `n8n`.

Installed package surfaces:

- `GonkaGate`
- `GonkaGate Chat Model`
- `GonkaGate API`

Published Docker image:

```text
ghcr.io/gonkagate/n8n-nodes-gonkagate
```

## Choose Your Install Path

| If you run...                          | Use this path                               | Why                                                                   |
| -------------------------------------- | ------------------------------------------- | --------------------------------------------------------------------- |
| Single self-hosted `n8n`               | Community Nodes UI                          | Preferred default path for most users already familiar with `n8n`     |
| Local `n8n` on macOS for a smoke test  | Local macOS global npm install              | Fastest way to walk the end-user install path on a Mac without Docker |
| Single self-hosted `n8n` without GUI   | Manual npm install                          | Direct shell control on the server or container                       |
| Docker                                 | Published Docker image                      | No repo clone, no in-container npm install, one `docker run` command  |
| Docker Compose                         | Published Docker image plus Compose         | Same public image, but easier to keep in a repeatable deployment file |
| Docker production in an existing stack | Custom Docker image from this repo          | Lets you own the build, base image pinning, and rollout process       |
| Queue mode / workers / webhook runners | Same exact package version on every runtime | Required so every runtime process can execute the same workflows      |
| Pre-release, staging, or private QA    | Tarball install with `npm pack`             | Lets you test an unpublished build                                    |
| Local development in this repository   | `npm run dev`                               | Best feedback loop for contributors, not the normal user install      |

## Before You Install

1. Use self-hosted `n8n`.
   Unverified community nodes are not available in `n8n` Cloud.
2. Pick an exact package version for production.
   Prefer exact npm versions or exact Docker tags over an unpinned latest.
3. If you run more than one `n8n` process, use the same package version or the
   same exact Docker image tag everywhere.
4. Keep your `n8n` user data directory persistent.
   In Docker, that usually means persisting `/home/node/.n8n`.

## Method 1: Community Nodes UI

Use this when:

- the package is already published to npm
- you run a normal self-hosted `n8n` instance
- you want the preferred default path for users who already know `n8n`

Steps:

1. Open your self-hosted `n8n` instance.
2. Log in as an Owner or Admin.
3. Open `Settings`.
4. Open `Community Nodes`.
5. Click `Install`.
6. In the package field, enter one of these:

```text
@gonkagate/n8n-nodes-gonkagate
```

```text
@gonkagate/n8n-nodes-gonkagate@<version>
```

7. Confirm the community-node risk prompt if `n8n` shows it.
8. Wait for installation to finish.
9. Restart `n8n` if your deployment model requires a restart.
10. Open the node picker and search for `GonkaGate`.

Use this path only after the package is published to npm.
If the package is not published yet, use tarball install instead.

## Method 2: Local macOS Smoke Test With Global npm Install

Use this when:

- you want to walk the same install path as a real self-hosted user
- you are testing locally on a MacBook or other macOS machine
- you want to run `n8n` directly from your terminal instead of Docker

This is a local smoke-test path, not the recommended production deployment.

### 2A. Switch To A Supported Node.js Version

The official `n8n` npm install flow requires a supported Node.js runtime.
If your shell is currently on Node `25`, switch to a supported version first.

Example with `nvm`:

```bash
nvm use 24.14.1
```

If that version is not installed yet:

```bash
nvm install 24.14.1
nvm use 24.14.1
```

### 2B. Install And Start `n8n` Locally

Install `n8n` globally, then start it:

```bash
npm install -g n8n
n8n start
```

Leave that terminal window running while you perform the install and UI check.

### 2C. Install The GonkaGate Package

Open a second terminal window and run:

```bash
mkdir -p ~/.n8n/nodes
cd ~/.n8n/nodes
npm install @gonkagate/n8n-nodes-gonkagate@<version>
```

### 2D. Restart Local `n8n`

If `n8n` was already running before you installed the package:

1. Go back to the terminal where `n8n` is running.
2. Press `Ctrl+C`.
3. Start it again:

```bash
n8n start
```

### 2E. Verify In The UI

1. Open `http://localhost:5678`.
2. Create a blank workflow.
3. Add `Manual Trigger`.
4. Add the `GonkaGate` node.
5. Create `GonkaGate API`.
6. Run `List Models` first.
7. Then switch to `Chat Completion`.

## Method 3: Manual npm Install On A Server Or Container

Use this when:

- you want direct shell control
- your instance does not support GUI installation
- you want a quick operator-managed install without rebuilding an image

### 3A. Manual Install On A Host-Based `n8n`

1. SSH into the machine where `n8n` runs.
2. Create the community-node directory if needed:

```bash
mkdir -p ~/.n8n/nodes
cd ~/.n8n/nodes
```

If you use a custom `N8N_USER_FOLDER`, use `$N8N_USER_FOLDER/nodes` instead.

3. Install the package:

```bash
npm install @gonkagate/n8n-nodes-gonkagate@<version>
```

4. Restart `n8n`.

Examples:

```bash
sudo systemctl restart n8n
```

```bash
pm2 restart n8n
```

5. Open the node picker and search for `GonkaGate`.

### 3B. Manual Install Inside A Docker Container

Use this for a quick install into an existing container.
For long-lived production, a published or custom Docker image is cleaner.

1. Open a shell in the running `n8n` container:

```bash
docker exec -it n8n sh
```

2. Create the install directory and move into it:

```bash
mkdir -p /home/node/.n8n/nodes
cd /home/node/.n8n/nodes
```

3. Install the package:

```bash
npm install @gonkagate/n8n-nodes-gonkagate@<version>
```

4. Exit the container shell:

```bash
exit
```

5. Restart the container:

```bash
docker restart n8n
```

6. Open the node picker and search for `GonkaGate`.

## Method 4: Published Docker Image

Use this when:

- you want the lightest Docker install path
- you are starting with a single self-hosted `n8n` container
- you do not want to clone this repository just to install GonkaGate

Published image:

```text
ghcr.io/gonkagate/n8n-nodes-gonkagate
```

Recommended tags:

- `latest` for the newest stable image
- `0.1.0`-style exact tags for production pinning

### Step 1. Create A Persistent Volume

```bash
docker volume create n8n_data
```

### Step 2. Run The Published Image

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

For production, pin an exact tag instead of `latest`:

```text
ghcr.io/gonkagate/n8n-nodes-gonkagate:0.1.0
```

### Step 3. Check Logs

```bash
docker logs -f n8n
```

### Step 4. Verify

Open `http://localhost:5678`, then search for `GonkaGate`.

## Method 5: Docker Compose With The Published Image

Use this when:

- you prefer a repeatable Compose file
- you want the same public image path as Method 4
- you want an install path that users can copy into any deployment folder

This repository includes a ready example in
[examples/docker/self-hosted](../examples/docker/self-hosted), but you can copy
the same Compose file into any folder you control.

### Step 1. Create `compose.yml`

Example:

```yaml
services:
  n8n:
    image: ghcr.io/gonkagate/n8n-nodes-gonkagate:latest
    restart: unless-stopped
    ports:
      - '5678:5678'
    environment:
      - GENERIC_TIMEZONE=<YOUR_TIMEZONE>
      - TZ=<YOUR_TIMEZONE>
      - N8N_ENFORCE_SETTINGS_FILE_PERMISSIONS=true
    volumes:
      - n8n_data:/home/node/.n8n

volumes:
  n8n_data:
```

For production, pin an exact image tag such as `0.1.0`.

### Step 2. Start The Stack

```bash
docker compose up -d
```

### Step 3. Check Logs

```bash
docker compose logs -f n8n
```

### Step 4. Verify

Open the node picker and search for `GonkaGate`.

## Method 6: Custom Docker Image From This Repository

Use this when:

- you run `n8n` in Docker in production
- you want an immutable image that you build yourself
- you want predictable rollbacks and upgrades under your own control

### Step 1. Reuse The Repository Dockerfile

This repository includes two Dockerfile paths:

- [Dockerfile](../Dockerfile):
  release-style image that installs the already-published npm package
- [Dockerfile.local](../Dockerfile.local):
  source-build image for local or unpublished builds

For custom builds from this repository, use
[Dockerfile.local](../Dockerfile.local).
This source-build path does not depend on npm publish timing.

### Step 2. Build The Image

From the repository root:

```bash
docker build -f Dockerfile.local -t your-registry/n8n-gonkagate:<image-tag> .
```

You can also override the base `n8n` image version:

```bash
docker build --file Dockerfile.local --build-arg N8N_VERSION=2.14.2 -t your-registry/n8n-gonkagate:<image-tag> .
```

### Step 3. Run The Image

```bash
docker volume create n8n_data
```

```bash
docker run -d \
  --name n8n \
  -p 5678:5678 \
  -e GENERIC_TIMEZONE="<YOUR_TIMEZONE>" \
  -e TZ="<YOUR_TIMEZONE>" \
  -e N8N_ENFORCE_SETTINGS_FILE_PERMISSIONS=true \
  -v n8n_data:/home/node/.n8n \
  your-registry/n8n-gonkagate:<image-tag>
```

Add your own database, Redis, reverse-proxy, and secrets settings as needed.

### Step 4. Verify

Open `http://localhost:5678`, then search for `GonkaGate`.

## Method 7: Docker Compose In An Existing Stack

Use this when:

- you already run `n8n` through Docker Compose
- you want a repeatable operator workflow with `pull`, `build`, and `up -d`

### Step 1. Pick The Image Strategy

Use either:

- the published image from Method 4 or Method 5
- your own custom image from Method 6

### Step 2. Update `docker-compose.yml`

Example with the published image:

```yaml
services:
  n8n:
    image: ghcr.io/gonkagate/n8n-nodes-gonkagate:latest
    ports:
      - '5678:5678'
    environment:
      - GENERIC_TIMEZONE=<YOUR_TIMEZONE>
      - TZ=<YOUR_TIMEZONE>
      - N8N_ENFORCE_SETTINGS_FILE_PERMISSIONS=true
    volumes:
      - n8n_data:/home/node/.n8n

volumes:
  n8n_data:
```

If you already use Postgres, Redis, or a reverse proxy, keep those service
definitions and only switch the `n8n` service to your published or custom
image.

### Step 3. Build Or Pull

With the published image:

```bash
docker compose pull
```

With a custom build:

```bash
docker compose build
```

### Step 4. Start

```bash
docker compose up -d
```

### Step 5. Verify

Open the node picker and search for `GonkaGate`.

## Method 8: Queue Mode / Workers / Webhook Runtimes

Use this when:

- your deployment runs `n8n` in queue mode
- you have separate main, worker, or webhook processes

Important rule:

Every runtime process that can execute workflows must have the same exact
package version installed.

The safest way is to use one shared image everywhere:

- the published GHCR image
- or the same exact custom image tag built from this repository

### Step 1. Use One Shared Image

Example Compose shape:

```yaml
services:
  n8n-main:
    image: ghcr.io/gonkagate/n8n-nodes-gonkagate:0.1.0
    command: start
  n8n-worker:
    image: ghcr.io/gonkagate/n8n-nodes-gonkagate:0.1.0
    command: worker
  n8n-webhook:
    image: ghcr.io/gonkagate/n8n-nodes-gonkagate:0.1.0
    command: webhook
```

### Step 2. Keep Runtime Configuration Consistent

Make sure all runtime processes share the same:

- `N8N_ENCRYPTION_KEY`
- database
- Redis
- `EXECUTIONS_MODE=queue`
- exact Docker image tag

### Step 3. Deploy Or Restart Everything Together

Do not update only the main UI process while workers still run the old image.

### Step 4. Verify From The UI

Once the main UI is up, search for `GonkaGate` and run the normal post-install
verification flow.

## Method 9: Tarball Install For Staging Or Unpublished Builds

Use this when:

- the package is not published yet
- you want to test a release candidate
- you want to install a known build artifact directly

### Step 1. Build And Pack The Package

From this repository:

```bash
nvm install 22
nvm use
npm install
npm run build
npm pack
```

This creates a tarball such as:

```text
gonkagate-n8n-nodes-gonkagate-0.1.0.tgz
```

### Step 2. Copy The Tarball To The Target Server

Any normal transfer method is fine:

- `scp`
- CI artifact
- object storage
- shared volume

### Step 3. Install The Tarball On The Target `n8n`

On the host or container where `n8n` runs:

```bash
mkdir -p ~/.n8n/nodes
cd ~/.n8n/nodes
npm install /absolute/path/to/gonkagate-n8n-nodes-gonkagate-0.1.0.tgz
```

If the target is a container, use `/home/node/.n8n/nodes` inside the container.

### Step 4. Restart `n8n`

Restart the main process and any workers that execute workflows.

### Step 5. Verify

Search for `GonkaGate` in the node picker.

## Method 10: Local Development In This Repository

Use this when:

- you are contributing to the package
- you want hot reload
- you are testing local code changes before packaging

Steps:

```bash
nvm install 22
nvm use
npm install
npm run dev
```

`npm run dev` uses `n8n-node dev`, starts a local `n8n`, links the package for
development, and rebuilds on file changes.

This repository expects Node `22`.
If `nvm use` says that version is missing, run `nvm install 22` once first.
Do not use Node `25` for this setup path.

On the first launch, `n8n` may take a few minutes to download and initialize.
During that time, `http://localhost:5678` can still show
`ERR_CONNECTION_REFUSED`.
Keep the terminal running and refresh after the first install settles down.

## Verify Any Installation

After any install method:

1. Open your `n8n` UI.
2. Click `Start from scratch`.
3. Add `Manual Trigger`.
4. Click `+` to add the next node.
5. Search for `gonka` or `GonkaGate`.
6. If the picker opens in `AI Nodes`, check `Results in other categories`.
7. Choose the plain `GonkaGate` node for the first check.
8. Ignore `GonkaGate Tool` and `GonkaGate Chat Model` for the first check.
9. Set `Operation` to `List Models`.
10. Create `GonkaGate API`.
11. Paste your API key and save the credential.
12. Click `Execute step` or `Execute workflow`.

If that works, run one more check:

1. Change `Operation` to `Chat Completion`.
2. Pick a model from the live list.
3. If the list is empty, switch to manual `ID` mode.
4. Leave one short test message.
5. Run the node again.

If you want the full click-by-click verification flow, continue to
[Quickstart](./quickstart.md).

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
2. Roll back by the same mechanism you used to install:
   - npm install an older package version
   - pull an older GHCR image tag
   - redeploy an older custom image tag
3. Restart the main process and every worker together so all runtime processes
   see the same package or image version.

If the failed install was the first attempted version, remove the package or
switch back to a stock `n8n` image, restart `n8n`, and fall back to the
documented stock OpenAI-compatible paths until the next package release is
ready.
