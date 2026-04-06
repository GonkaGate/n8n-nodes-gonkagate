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

RUN N8N_NODE_MODULES="$(npm root -g)/n8n/node_modules" \
 && AI_NODE_SDK_PATH="$N8N_NODE_MODULES/ai-node-sdk" \
 && N8N_WORKFLOW_PATH="$N8N_NODE_MODULES/n8n-workflow" \
 && if [ ! -d "$AI_NODE_SDK_PATH" ]; then AI_NODE_SDK_PATH="$N8N_NODE_MODULES/@n8n/ai-node-sdk"; fi \
 && if [ ! -d "$N8N_WORKFLOW_PATH" ]; then N8N_WORKFLOW_PATH="$(npm root -g)/n8n-workflow"; fi \
 && test -d "$N8N_NODE_MODULES" \
 && test -d "$AI_NODE_SDK_PATH" \
 && test -d "$N8N_WORKFLOW_PATH" \
 && mkdir -p /home/node/.n8n/nodes/node_modules \
 && npm install --prefix /home/node/.n8n/nodes --omit=dev --legacy-peer-deps --no-audit --no-fund /tmp/gonkagate-n8n-nodes-gonkagate.tgz \
 && ln -sfn "$AI_NODE_SDK_PATH" /home/node/.n8n/nodes/node_modules/ai-node-sdk \
 && ln -sfn "$N8N_WORKFLOW_PATH" /home/node/.n8n/nodes/node_modules/n8n-workflow \
 && test -e /home/node/.n8n/nodes/node_modules/ai-node-sdk \
 && test -e /home/node/.n8n/nodes/node_modules/n8n-workflow \
 && rm -f /tmp/gonkagate-n8n-nodes-gonkagate.tgz
