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
- AI Agent / tool-calling-heavy paths are not yet live-validated from this
  workspace against a real GonkaGate key
- self-hosted-first posture only; `n8n` Cloud is not promised
- the current `n8n` AI Node SDK is preview-only and AI nodes are not yet
  accepted for verification
- credentials created with the legacy placeholder base URL must be recreated

Current repo-level blockers that still affect release readiness:

- no API-key-backed live GonkaGate validation run was executed from this
  workspace
- self-hosted compatibility proof remains narrow and version-specific until the
  documented smoke matrix is rerun after packaging changes
