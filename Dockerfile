FROM node:20-bookworm-slim AS base

WORKDIR /usr/src/app

ENV npm_config_fund=false \
    npm_config_update_notifier=false \
    NEXT_TELEMETRY_DISABLED=1

FROM base AS deps

RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    g++ \
    make \
    ghostscript \
    graphicsmagick \
    && rm -rf /var/lib/apt/lists/*

COPY package*.json ./

RUN npm i --legacy-peer-deps

FROM base AS build

COPY --from=deps /usr/src/app/node_modules ./node_modules
COPY . .

RUN npm run build \
    && npm cache clean --force

FROM node:20-bookworm-slim AS runtime

WORKDIR /usr/src/app

ENV NODE_ENV=production \
    PORT=3000 \
    npm_config_fund=false \
    npm_config_update_notifier=false \
    NEXT_TELEMETRY_DISABLED=1

RUN apt-get update && apt-get install -y --no-install-recommends \
    ghostscript \
    graphicsmagick \
    && rm -rf /var/lib/apt/lists/*

COPY --from=build --chown=node:node /usr/src/app/public ./public
COPY --from=build --chown=node:node /usr/src/app/.next/standalone ./
COPY --from=build --chown=node:node /usr/src/app/.next/static ./.next/static

USER node

EXPOSE 3000

CMD ["node", "server.js"]
