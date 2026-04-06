ARG N8N_VERSION=2.14.2
ARG GONKAGATE_NODE_VERSION=latest

FROM docker.n8n.io/n8nio/n8n:${N8N_VERSION}

ARG N8N_VERSION
ARG GONKAGATE_NODE_VERSION

LABEL io.n8n.version.base="${N8N_VERSION}"
LABEL org.opencontainers.image.title="GonkaGate for n8n"
LABEL org.opencontainers.image.description="Self-hosted n8n image with the GonkaGate community nodes preinstalled."
LABEL org.opencontainers.image.source="https://github.com/GonkaGate/n8n-nodes-gonkagate"
LABEL org.opencontainers.image.licenses="MIT"

USER node
WORKDIR /home/node/.n8n/nodes

RUN mkdir -p /home/node/.n8n/nodes \
 && npm install @gonkagate/n8n-nodes-gonkagate@${GONKAGATE_NODE_VERSION} --omit=dev --legacy-peer-deps --no-audit --no-fund

WORKDIR /home/node
