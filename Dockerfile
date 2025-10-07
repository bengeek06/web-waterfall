# --- deps stage: installe toutes les deps (incluant dev) ---
FROM node:24.9.0-slim AS deps
WORKDIR /app
COPY package*.json ./
# Remplace npm ci (qui échoue si lock désynchronisé)
RUN npm install --no-audit --no-fund

# --- builder stage: build Next.js (next.config.ts nécessite typescript présent) ---
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Production build (prend en compte NODE_ENV=production pour l'output)
ENV NODE_ENV=production
RUN npm run build
# Supprime les devDependencies pour réduire l'image finale
RUN npm prune --omit=dev

# --- runner stage: runtime minimal ---
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
# Copier uniquement ce qui est nécessaire à l'exécution
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
# (Optionnel) si vous avez un next.config.* qui doit être présent à runtime:
COPY --from=builder /app/next.config.* ./ 
EXPOSE 3000
# Démarre le serveur Next.js
CMD ["node","node_modules/next/dist/bin/next","start","-p","3000"]
