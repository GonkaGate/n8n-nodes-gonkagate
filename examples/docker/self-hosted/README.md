# Self-Hosted Docker Example

This folder gives you the lightest public-image path for running self-hosted
`n8n` with GonkaGate already installed.

## Quick Start

1. Copy `.env.example` to `.env`.
2. Set `GENERIC_TIMEZONE` and `TZ` for your deployment.
3. Optionally change `GONKAGATE_IMAGE_TAG` from `latest` to an exact release
   tag such as `0.1.0`.
4. Run:

```bash
docker compose up -d
```

5. Open `http://localhost:5678` unless you changed `N8N_PORT`.
6. Search for `GonkaGate` in the node picker and continue with
   [Quickstart](../../../docs/quickstart.md).

The published image path is:

```text
ghcr.io/gonkagate/n8n-nodes-gonkagate
```

The `n8n_data` volume keeps the normal `n8n` user folder persistent.

If you do not want to clone this repository, copy the `compose.yml` snippet into
your own deployment folder and use the same image reference directly.
