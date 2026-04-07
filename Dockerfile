ARG NODE_VERSION=24
ARG N8N_VERSION=2.14.2
ARG GONKAGATE_NODE_VERSION=latest

FROM node:${NODE_VERSION}-bookworm-slim AS package-installer

ARG GONKAGATE_NODE_VERSION

WORKDIR /addon

RUN apt-get update \
 && apt-get install -y --no-install-recommends python3 make g++ \
 && rm -rf /var/lib/apt/lists/*

RUN npm init -y >/dev/null \
 && npm install --omit=dev --no-audit --no-fund @gonkagate/n8n-nodes-gonkagate@${GONKAGATE_NODE_VERSION}

FROM docker.n8n.io/n8nio/n8n:${N8N_VERSION}

ARG N8N_VERSION

LABEL io.n8n.version.base="${N8N_VERSION}"
LABEL org.opencontainers.image.title="GonkaGate for n8n"
LABEL org.opencontainers.image.description="Self-hosted n8n image with the GonkaGate community nodes preinstalled."
LABEL org.opencontainers.image.source="https://github.com/GonkaGate/n8n-nodes-gonkagate"
LABEL org.opencontainers.image.licenses="MIT"

COPY --chown=node:node --from=package-installer /addon/node_modules /home/node/.n8n/nodes/node_modules
COPY --chown=node:node --from=package-installer /addon/package.json /home/node/.n8n/nodes/package.json
COPY --chown=node:node --from=package-installer /addon/package-lock.json /home/node/.n8n/nodes/package-lock.json

USER node
WORKDIR /home/node
