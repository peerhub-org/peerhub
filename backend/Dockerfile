FROM node:26-bookworm-slim AS build

WORKDIR /app

COPY backend/package.json backend/package-lock.json ./
RUN npm ci

COPY backend/tsconfig.json backend/tsconfig.build.json ./
COPY backend/src ./src
RUN npm run build && npm prune --omit=dev

FROM node:26-bookworm-slim

ENV NODE_ENV=production

WORKDIR /app

COPY VERSION /VERSION
COPY --from=build /app/package.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist

USER node

EXPOSE 8000

CMD ["node", "--enable-source-maps", "dist/main.js"]
