FROM node:22-alpine AS base
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM base AS development
COPY . .
EXPOSE 5173
CMD ["npm", "run", "dev", "--", "--host"]

FROM base AS build
COPY . .
ENV NODE_OPTIONS="--max-old-space-size=4096"
# Public key dung cho transport encryption giua Frontend va Backend (gia tri public, duoc nhung vao bundle JS build)
ARG VITE_API_ENCRYPTION_KEY=""
ENV VITE_API_ENCRYPTION_KEY=$VITE_API_ENCRYPTION_KEY
RUN npm run build

FROM nginx:1.27-alpine AS production
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://127.0.0.1/ || exit 1
CMD ["nginx", "-g", "daemon off;"]
