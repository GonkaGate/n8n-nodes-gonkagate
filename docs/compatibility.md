# Compatibility Matrix

Status date: `2026-04-08`.

This project does not claim blanket compatibility across all `n8n` versions.
It publishes a narrow, evidence-backed posture instead.

| Surface                                   | Status                               | Evidence                                                                                                                                                                                                                                             | Last checked |
| ----------------------------------------- | ------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------ |
| Package format and node registration      | Repo-verified                        | `npm run ci`, `npm run lint:n8n`, `npm pack --dry-run`, and `npx @n8n/scan-community-package @gonkagate/n8n-nodes-gonkagate` pass with `gonkaGate`, `lmChatGonkaGate`, and `gonkaGateApi` correctly registered                                       | `2026-04-08` |
| Root node `GonkaGate`                     | Repo-verified                        | Typecheck, package build, strict `n8n` lint, and helper tests cover `List Models`, `Chat Completion`, shared credential reuse, and the hybrid model selector                                                                                         | `2026-04-08` |
| AI node `GonkaGate Chat Model`            | Repo-verified                        | Strict `n8n` lint, helper tests, and the published package scan all accept the `AiLanguageModel` surface, shared model discovery, manual ID fallback, and explicit `useResponsesApi: false`                                                          | `2026-04-08` |
| Shared model discovery                    | Repo-verified                        | `/v1/models` is used through the same authenticated credential path for root-node discovery and AI-node model search, with empty-list/manual fallback behavior covered in `npm run test:unit`                                                        | `2026-04-08` |
| Self-hosted install and loading           | Narrow proof, version-specific       | `npx -y node@24.14.1 scripts/check-self-hosted-smoke.mjs` passed for `n8n@2.13.4` and `n8n@2.14.2`, resolving `gonkaGate`, `lmChatGonkaGate`, and `gonkaGateApi` from the packed package                                                             | `2026-04-08` |
| Provider-level streaming wiring           | Repo-verified                        | Root node stays non-streaming by design; `GonkaGate Chat Model` enables chat-completions streaming through the AI model surface with Responses mode disabled                                                                                         | `2026-04-08` |
| Live GonkaGate execution                  | Maintainer-confirmed                 | A maintainer confirmed credential test, `List Models`, root-node `Chat Completion`, and `GonkaGate Chat Model` against a live GonkaGate backend on `2026-04-08`. This workspace did not replay those runs.                                           | `2026-04-08` |
| `n8n` Cloud / verified submission posture | Submission candidate, review pending | Cloud support remains enabled, strict `n8n` lint now passes in-repo, the published package passes `@n8n/scan-community-package`, and npm publish uses GitHub Actions provenance. Final verified status still depends on `n8n` Creator Portal review. | `2026-04-08` |

## Verification Runbook

Local checks run in this workspace:

- `npm run ci`
- `npm run build`
- `npm run lint:n8n`
- `npm run test:unit`
- `npm pack --dry-run`
- `npx @n8n/scan-community-package @gonkagate/n8n-nodes-gonkagate`

`scripts/check-self-hosted-smoke.mjs` still requires Node `>=22.16` and `<25`.
If your shell is on a newer Node version, run it explicitly under a compatible
runtime:

```bash
npx -y node@24.14.1 scripts/check-self-hosted-smoke.mjs
```

## Remaining Gaps Before Submission

- The self-hosted install-and-load proof remains version-specific and should be
  rerun on the exact `n8n` versions published in the support matrix.
- If you want the public docs to be fully audit-friendly, record the exact live
  validation environment details collected by the maintainer, such as the
  concrete `n8n` version, tested model IDs, and the verification date.
- Final verified-node availability still depends on `n8n` Creator Portal review
  after submission.

## Verified Submission Notes

- Current published `n8n` docs require GitHub Actions provenance publishing,
  MIT licensing, English docs/UI, no runtime env/filesystem access, and
  passing automated checks for verified community nodes.
- This repository now satisfies those repo-controlled checks.
- Until `n8n` approves the package in the Creator Portal, keep all public copy
  phrased as submission-ready rather than already verified.
