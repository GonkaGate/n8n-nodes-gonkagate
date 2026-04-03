# Fallback OpenAI-Compatible Paths

These fallback paths are operational alternatives.
They are not the primary GonkaGate package story.

## Primary Package Story

This package now owns both of the recommended GonkaGate surfaces:

- `GonkaGate` for provider-root workflows and direct helper operations
- `GonkaGate Chat Model` for modern `n8n` AI-model workflows

Use the stock OpenAI-compatible paths only when the dedicated package can't be
installed or when you need an environment-specific fallback.

## Current Preferred Fallback

For current `n8n` releases, the documented fallback remains:

- `OpenAI Chat Model`
- custom GonkaGate base URL
- `Use Responses API = false`

This path is version-sensitive and should be treated as a convenience fallback,
not as the GonkaGate-owned integration surface.

## Older / Manual Fallback

If the current stock path is unavailable or brittle in a given environment,
fall back to one of these:

- legacy `OpenAI v1`
- plain `HTTP Request`

These fallbacks require more manual setup and are more sensitive to `n8n`
version drift.

## What The GonkaGate Package Does Better

The dedicated GonkaGate package now gives users:

- GonkaGate-first branding
- one shared `GonkaGate API` credential
- a durable root node with `List Models` and `Chat Completion`
- an additive provider-owned `GonkaGate Chat Model` surface
- shared live model discovery with manual ID fallback
- an honest chat-completions-based streaming story without pretending
  `/v1/responses` exists

## Limits Of The Fallback Story

Do not present the stock OpenAI-compatible paths as:

- proof that the GonkaGate package no longer matters
- proof of `/v1/responses` parity
- proof of blanket support across all `n8n` versions
- proof that a given `n8n` build still behaves the same without revalidation
