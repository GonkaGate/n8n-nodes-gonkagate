# Known Limitations

Current package limitations:

- no `/v1/responses` support
- no blanket compatibility claim across all `n8n` versions
- the root `GonkaGate` node still uses non-streaming `Chat Completion`
- the additive `GonkaGate Chat Model` node targets `/v1/chat/completions`, not
  `/v1/responses`
- live model discovery is helpful, not authoritative
- manual `Model ID` fallback remains part of the contract because `/v1/models`
  can return an empty set
- capability-aware model filtering is conservative and metadata-limited; the
  picker does not claim a perfect feature matrix
- AI Agent / tool-calling-heavy paths do not yet have broad, versioned public
  evidence beyond maintainer validation
- self-hosted-first posture only; `n8n` Cloud is not promised until verified
  submission is approved
- verified status is not approved yet; Creator Portal review remains external
  to this repository
- credentials created with the legacy placeholder base URL must be recreated

Current repo-level caveats that still affect verified approval:

- self-hosted compatibility proof remains narrow and version-specific until the
  documented smoke matrix is rerun after packaging changes
- exact live-validation environment details should be recorded in public docs if
  you want a versioned audit trail for the verified submission
- final approved verified status still depends on `n8n` review after
  submission
