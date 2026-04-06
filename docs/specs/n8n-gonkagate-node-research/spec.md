# GonkaGate `n8n` Integration Research Memo

## Purpose

This memo captures the baseline ecosystem constraints that shaped the public
bootstrap of `@gonkagate/n8n-nodes-gonkagate`.
It is intentionally narrower than the PRD: this document records what the team
learned from the `n8n` community-node ecosystem and what those findings imply
for packaging, installation, and release posture.

## Ecosystem Findings

### Community nodes are npm-first

- `n8n` community nodes are distributed as npm packages.
- Self-hosted users can install them either through the Community Nodes UI or
  by installing the package directly into the `n8n` user folder.
- Queue-mode and private-package setups still rely on the npm package shape,
  even when the GUI path is unavailable.

### Self-hosted remains the honest default

- Unverified community nodes are a self-hosted path.
- `n8n` Cloud must not be promised for this package while it remains an
  unverified community node.
- The additive AI model surface does not change that self-hosted-first
  reality.

### Docker installs follow a repeatable pattern

- The common Docker pattern is to install the community package into
  `/home/node/.n8n/nodes` during image build.
- The `n8n` user folder should remain on a persistent volume so credentials,
  encryption material, and package files survive restarts.
- For operator-managed installs, a custom Docker image is cleaner than
  mutating a running container.

### Similar community-node repos keep the install story simple

- Common README structure:
  - Community Nodes UI for the easiest path
  - manual npm install for operator-managed setups
  - custom Docker image guidance for queue mode or production Docker
- Mature repos avoid promising broad parity with the entire `n8n` ecosystem and
  instead document the concrete installation and support posture they have
  actually tested.

## GonkaGate Product Conclusions

### Durable provider identity matters

- The package should stay branded around `GonkaGate`, not around `OpenAI`,
  `chat`, or `responses`.
- The root/app node must remain durable even as AI-model-specific surfaces are
  added.
- `GonkaGate Chat Model` should stay additive rather than replacing the root
  node identity.

### Current backend truth must drive the package

- The implemented public base URL is `https://api.gonkagate.com/v1`.
- The grounded repo surface is:
  - `GET /v1/models`
  - `POST /v1/chat/completions`
- `/v1/models` can be empty, so manual `Model ID` entry must remain part of the
  product contract.
- `/v1/responses` must stay explicitly out of scope until it is implemented and
  validated.

## Packaging And Release Conclusions

- Publish one public npm package:
  `@gonkagate/n8n-nodes-gonkagate`.
- Keep one shared GonkaGate credential across the root node and the additive AI
  model node.
- Prefer GitHub Actions + npm Trusted Publisher OIDC over long-lived npm
  tokens.
- Keep README, install docs, compatibility guidance, and release checklist
  aligned with the actual shipped package surface.

## Operational Consequences For This Repository

1. The easiest real-user install path should be the Community Nodes UI after
   npm publish.
2. The repository should also ship a copyable Docker path for users who run
   self-hosted `n8n` in containers.
3. Release automation should publish from `main`, validate the package in CI,
   and publish the public scoped package with provenance.
4. Documentation must stay honest about self-hosted-first support, manual model
   fallback, and the absence of `/v1/responses`.
