# =========================
# BUILD
# =========================
FROM node:22-alpine AS builder

WORKDIR /app

# Instalar dependencias PRIMERO (mejor caché)
COPY package*.json ./
RUN npm install --legacy-peer-deps

# ⚠️ CRÍTICO: Recibir variables de entorno de Render en build time
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY
ARG VITE_APP_URL

ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY
ENV VITE_APP_URL=$VITE_APP_URL

# Verificar que las variables llegaron
RUN echo "BUILD VITE_SUPABASE_URL=$VITE_SUPABASE_URL" && \
    echo "BUILD VITE_SUPABASE_ANON_KEY_LENGTH=${#VITE_SUPABASE_ANON_KEY}"

# Copiar código FUENTE (no todo, solo lo necesario)
COPY src ./src
COPY index.html ./
COPY vite.config.ts ./
COPY tsconfig*.json ./
COPY tailwind.config.* ./
COPY postcss.config.* ./

# ⚠️ CRÍTICO: Aumentar memoria disponible para Node
ENV NODE_OPTIONS="--max-old-space-size=4096"

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
