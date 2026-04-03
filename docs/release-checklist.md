# Release Checklist

Use this checklist before tagging a cautious self-hosted `v0.x` release.

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

4. Produce a release tarball and verify the package contents:

```bash
npm pack --dry-run
```

5. Confirm onboarding docs still match the current node behavior:

- [README.md](../README.md)
- [Quickstart](./quickstart.md)
- [Installation Guide](./install.md)
- [Importable First Request Workflow](../examples/quickstart/gonkagate-first-request.workflow.json)

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

## Release Surface

Before tagging:

1. Confirm the changelog matches the shipped support surface.
2. Confirm install and rollback guidance still matches `~/.n8n/nodes`.
3. Confirm package docs still state:
   - root node remains durable
   - `GonkaGate Chat Model` is additive
   - `/v1/responses` is not claimed
   - `n8n` Cloud is not claimed
4. Confirm the quickstart workflow still imports and reaches the same setup
   steps described in the docs.
5. Confirm the compatibility matrix does not overclaim beyond the tested
   versions and live proof actually collected.
6. Do not describe the package as verified-node-ready while the current AI node
   SDK remains preview-only for verification.
