# Release Checklist

Use this checklist before tagging a cautious self-hosted `v0.x` release.

## Release Automation

This repository publishes from `main`, not `master`.

The current release flow is:

1. Merge user-facing changes into `main`.
2. Let `Release Please` update or open the release PR from commits on `main`.
3. Merge that release PR into `main`.
4. Let `Release Please` create the `vX.Y.Z` tag and dispatch
   `.github/workflows/publish.yml` for npm.
5. Let `publish.yml` handle:
   - npm package verification and `npm publish --provenance --access public`
   - dispatching `.github/workflows/publish-docker.yml`
6. Let `publish-docker.yml` wait for the npm package version to exist, then
   build the GHCR image from that published package and attach an attestation.

Both publish workflows skip the actual publish step if the same released
version already exists.

You can also run:

- `publish.yml` in `check` mode to validate npm OIDC without publishing
- `publish-docker.yml` in `check` mode to build the image without pushing it

## External Preconditions

These are not stored in the git tree, so verify them in GitHub/npm settings:

1. The npm scope `@gonkagate` exists and the publishing account can publish the
   package.
2. npm Trusted Publisher is configured for this GitHub repository and workflow.
3. The GitHub Actions environment named `release` exists and allows the publish
   jobs to run.
4. GHCR package publishing is allowed for this repository.
5. The organization package settings allow public container packages. If the
   package visibility switch is disabled on the package page, ask an
   organization owner to enable public packages in GitHub organization package
   settings first.
6. After the first successful Docker publish, set the GHCR package visibility
   to `public` if GitHub created it as private.

## Repo Checks

1. Run the default repo checks:

```bash
npm run ci
```

2. Run the strict `n8n` package lint:

```bash
npm run lint:n8n
```

3. Run the focused helper tests:

```bash
npm run test:unit
```

4. Confirm the in-repo cloud-support posture is still strict and enabled:

```bash
npx n8n-node cloud-support
```

5. Produce a release tarball and verify the package contents:

```bash
npm pack --dry-run
```

6. Build the local source-based Docker image used by CI:

```bash
docker build -f Dockerfile.local -t gonkagate-n8n:local-check .
```

7. If the target package version is already published to npm, validate the
   release Dockerfile path and confirm the image actually registers the
   GonkaGate nodes:

```bash
docker build --build-arg GONKAGATE_NODE_VERSION=<published-version> -t gonkagate-n8n:release-check .
npm run check:docker-image-smoke -- --image gonkagate-n8n:release-check
```

8. Confirm onboarding docs still match the current node behavior:

- [README.md](../README.md)
- [Quickstart](./quickstart.md)
- [Installation Guide](./install.md)
- [Importable First Request Workflow](../examples/quickstart/gonkagate-first-request.workflow.json)
- [Self-Hosted Docker Example](../examples/docker/self-hosted/README.md)

## Self-Hosted Install Proof

Run the repeatable self-hosted smoke check on the concrete `n8n` versions that
back the published compatibility matrix:

```bash
npx -y node@24.14.1 scripts/check-self-hosted-smoke.mjs
```

This check proves:

- the package can be packed locally
- the package installs into `~/.n8n/nodes`
- `n8n`'s package loader resolves `gonkaGate`
- `n8n`'s package loader resolves `lmChatGonkaGate`
- `n8n`'s package loader resolves `gonkaGateApi`

It does not prove live GonkaGate execution.

## Live GonkaGate Proof

Before calling the package release-ready for real users, run both node surfaces
against a real GonkaGate backend with a working API key:

1. Create a fresh `GonkaGate API` credential.
2. Run the credential test.
3. Run `List Models` in the root `GonkaGate` node.
4. Run root-node `Chat Completion` with a known-good model and confirm the
   final JSON response shape.
5. Run `GonkaGate Chat Model` in at least one AI workflow.
6. If you plan to mention streaming, verify visible chunked output in a
   streaming-capable workflow path such as `AI Agent` plus `Chat Trigger`.
7. Save the concrete `n8n` and GonkaGate evidence in the compatibility docs.

If a maintainer completed those checks outside this workspace, record the exact
validation date and environment details before the verified submission handoff.

## Release Surface

Before tagging:

1. Confirm the changelog matches the shipped support surface.
2. Confirm install and rollback guidance still matches:
   - `~/.n8n/nodes` for npm-based installs
   - `ghcr.io/gonkagate/n8n-nodes-gonkagate` for the published Docker image
3. Confirm package docs still state:
   - root node remains durable
   - `GonkaGate Chat Model` is additive
   - `/v1/responses` is not claimed
   - `n8n` Cloud is not claimed
4. Confirm the published image still installs
   `@gonkagate/n8n-nodes-gonkagate@<released-version>` into the official `n8n`
   image and that a fresh container exports both `GonkaGate` and
   `GonkaGate Chat Model`.
5. Confirm the source-build path in `Dockerfile.local` still works for local
   smoke builds and unpublished package changes.
6. Confirm the Docker example still starts from the published image and pins
   the expected registry path.
7. Confirm the quickstart workflow still imports and reaches the same setup
   steps described in the docs.
8. Confirm the compatibility matrix does not overclaim beyond the tested
   versions and live proof actually collected.
9. Do not describe the package as already verified until `n8n` approves the
   Creator Portal submission.

## Verified Submission Handoff

Once the release version is published to npm:

1. Confirm the published package still passes the external package scan:

```bash
npx @n8n/scan-community-package @gonkagate/n8n-nodes-gonkagate
```

2. Confirm the version you plan to submit was published through
   `.github/workflows/publish.yml` with provenance enabled.
3. Confirm the maintainer live-validation notes are attached to the submission
   handoff.
4. Submit the package in the `n8n` Creator Portal.
5. Keep all public copy at "submission-ready" until `n8n` marks the package as
   verified.
