# Compatibility Matrix

Status date: `2026-04-03`.

This project does not claim blanket compatibility across all `n8n` versions.
It publishes a narrow, evidence-backed posture instead.

| Surface                              | Status                         | Evidence                                                                                                                                                                                      | Last checked |
| ------------------------------------ | ------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------ |
| Package format and node registration | Verified in this repo          | `npm run ci`, `npm run build`, and `npm run lint:n8n` pass with `gonkaGate`, `lmChatGonkaGate`, and `gonkaGateApi` all registered in `package.json`                                           | `2026-04-03` |
| Root node `GonkaGate`                | Repo-verified                  | Typecheck, package build, and helper tests cover `List Models`, `Chat Completion`, shared credential reuse, and the hybrid model selector                                                     | `2026-04-03` |
| AI node `GonkaGate Chat Model`       | Repo-verified                  | Typecheck and strict `n8n` lint pass with `AiLanguageModel` output, shared model discovery, manual ID fallback, and explicit `useResponsesApi: false`                                         | `2026-04-03` |
| Shared model discovery               | Repo-verified                  | `/v1/models` is used through the same authenticated credential path for root-node discovery and AI-node model search, with empty-list/manual fallback behavior covered in `npm run test:unit` | `2026-04-03` |
| Self-hosted install and loading      | Narrow proof, version-specific | `npx -y node@24.14.1 scripts/check-self-hosted-smoke.mjs` passed for `n8n@2.13.4` and `n8n@2.14.2`, resolving `gonkaGate`, `lmChatGonkaGate`, and `gonkaGateApi` from the packed package      | `2026-04-03` |
| Provider-level streaming wiring      | Repo-verified                  | Root node stays non-streaming by design; `GonkaGate Chat Model` enables chat-completions streaming through the AI model surface with Responses mode disabled                                  | `2026-04-03` |
| Live GonkaGate execution             | Not yet live-verified          | No API-key-backed run was executed from this workspace                                                                                                                                        | `2026-04-03` |
| `n8n` Cloud / verified-node posture  | Not supported                  | Unverified community nodes remain self-hosted only, and `n8n`'s current AI Node SDK is still preview-only for verification                                                                    | `2026-04-03` |

## Verification Runbook

Local checks run in this workspace:

- `npm run build`
- `npm run lint:n8n`
- `npm run test:unit`

`scripts/check-self-hosted-smoke.mjs` still requires Node `>=22.16` and `<25`.
If your shell is on a newer Node version, run it explicitly under a compatible
runtime:

```bash
npx -y node@24.14.1 scripts/check-self-hosted-smoke.mjs
```

## Remaining Gaps Before A Cautious Self-Hosted Release

- No API-key-backed live GonkaGate execution run was executed from this
  workspace.
- The self-hosted install-and-load proof remains version-specific and should be
  rerun on the exact `n8n` versions published in the support matrix.
- Tool-calling-heavy AI Agent flows and visible streamed chat UX still need live
  GonkaGate validation before they should be described as broadly proven.

## Verified-Node / Cloud-Only Gaps

- The package now includes an AI model node implemented on `n8n`'s preview AI
  Node SDK.
- Official SDK guidance currently says AI nodes are not yet accepted for
  verification.
- This means the package should remain self-hosted-first even though the root
  node still follows most verification-friendly packaging rules.
