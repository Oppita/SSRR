# =========================
# BUILD
# =========================
FROM node:22-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install --legacy-peer-deps

COPY . .

COPY .env.production .env.production

RUN npm run build

# =========================
# PRODUCTION
# =========================
FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --omit=dev --legacy-peer-deps

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server.ts ./server.ts

ENV NODE_ENV=production

EXPOSE 10000

CMD ["npx", "tsx", "server.ts"]
