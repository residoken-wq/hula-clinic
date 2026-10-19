# Stage 1: Base (Dependency)
FROM node:22-alpine AS base
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --legacy-peer-deps
COPY tsconfig.json nest-cli.json ./

# Stage 2: Development (Fast Start)
FROM base AS development
COPY . .
CMD ["npm", "run", "start:dev"]

# Stage 3: Build (Production Build)
FROM base AS build
COPY src/ ./src/
RUN npm run build

# Stage 4: Production (Run App)
FROM node:22-alpine AS production
WORKDIR /app
ENV NODE_ENV=production
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --legacy-peer-deps && npm cache clean --force
COPY --from=build /app/dist ./dist
RUN mkdir -p /app/uploads && chown -R node:node /app/uploads
USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --start-period=40s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3000/api/health || exit 1
CMD ["node", "dist/main"]
