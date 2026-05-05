# Use the official Bun image
FROM oven/bun:latest AS base
WORKDIR /app

# Install dependencies
FROM base AS install
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

# Build the application
FROM install AS build
COPY . .
# Set environment variables for build time if needed
ENV SKIP_ENV_VALIDATION=1
# ENV NEXT_PUBLIC_API_URL=http://localhost:4790/api
RUN bun run build

# Production image
FROM base AS release
COPY --from=install /app/node_modules ./node_modules
COPY --from=build /app/.next ./.next
COPY --from=build /app/public ./public
COPY --from=build /app/package.json ./package.json

EXPOSE 3000
CMD ["bun", "run", "start"]
