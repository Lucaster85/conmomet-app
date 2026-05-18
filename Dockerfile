# ── Dependencies stage ──
FROM node:22-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

# ── Build stage ──
FROM node:22-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Variables NEXT_PUBLIC_* se embeben en build-time (es la única forma en Next.js)
ARG NEXT_PUBLIC_API_BASE_URL
ENV NEXT_PUBLIC_API_BASE_URL=$NEXT_PUBLIC_API_BASE_URL

ARG NEXT_PUBLIC_GOOGLE_PLACES_API_KEY
ENV NEXT_PUBLIC_GOOGLE_PLACES_API_KEY=$NEXT_PUBLIC_GOOGLE_PLACES_API_KEY

RUN npm run build

# ── Production stage (imagen mínima) ──
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Copiar solo lo necesario del standalone output
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

EXPOSE 3000
CMD ["node", "server.js"]
