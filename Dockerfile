FROM node:20-alpine AS builder

  WORKDIR /app

  COPY package.json package-lock.json ./
  RUN npm ci

  COPY . .
  RUN npm run build

  FROM node:20-alpine AS runner

  WORKDIR /app

  COPY package.json package-lock.json ./
  RUN npm ci

  COPY --from=builder /app/dist ./dist
  COPY drizzle.config.ts ./
  COPY shared/ ./shared/
  COPY entrypoint.sh ./
  RUN chmod +x entrypoint.sh

  ENV NODE_ENV=production
  EXPOSE 3002

  CMD ["./entrypoint.sh"]
  