ARG NODE_VERSION=22
ARG N8N_VERSION=2.14.2

FROM node:${NODE_VERSION}-bookworm-slim AS builder

WORKDIR /workspace

COPY . .

RUN npm ci
RUN npm run build
RUN npm pack

FROM docker.n8n.io/n8nio/n8n:${N8N_VERSION}

LABEL org.opencontainers.image.title="GonkaGate for n8n"
LABEL org.opencontainers.image.description="Self-hosted n8n image with the GonkaGate community nodes preinstalled."
LABEL org.opencontainers.image.source="https://github.com/GonkaGate/n8n-nodes-gonkagate"
LABEL org.opencontainers.image.licenses="MIT"

COPY --from=builder /workspace/*.tgz /tmp/gonkagate-n8n-nodes-gonkagate.tgz

RUN mkdir -p /home/node/.n8n/nodes \
 && npm install --prefix /home/node/.n8n/nodes --omit=dev --no-audit --no-fund /tmp/gonkagate-n8n-nodes-gonkagate.tgz \
 && rm -f /tmp/gonkagate-n8n-nodes-gonkagate.tgz
