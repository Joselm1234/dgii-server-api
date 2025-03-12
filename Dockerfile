# syntax = docker/dockerfile:1

ARG NODE_VERSION=20.17.0
FROM node:${NODE_VERSION}-slim AS base

LABEL fly_launch_runtime="Node.js"

WORKDIR /app

ENV NODE_ENV="production"

# Install pnpm
ARG PNPM_VERSION=10.5.2
RUN npm install -g pnpm@$PNPM_VERSION

# Build stage
FROM base AS build

RUN apt-get update -qq && \
    apt-get install --no-install-recommends -y build-essential node-gyp pkg-config python-is-python3

COPY package.json pnpm-lock.yaml ./

# Install ONLY production dependencies
RUN pnpm install --frozen-lockfile

# Copy source code and compile
COPY . .
RUN pnpm run build:ts

# Final image
FROM base

# Copy the compiled application
COPY --from=build /app/dist /app/dist
COPY --from=build /app/node_modules /app/node_modules
COPY --from=build /app/package.json /app/package.json

# Expose the port
EXPOSE 3000

# Run the server
CMD ["node", "dist/app.js"]