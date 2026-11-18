FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
# Registry downloads from inside Docker Desktop often reset. Keep the npm
# cache across attempts and retry the install instead of failing the build.
RUN --mount=type=cache,target=/root/.npm \
    npm ci --cache /root/.npm --prefer-offline --fetch-retries=5 --fetch-retry-mintimeout=20000 --fetch-retry-maxtimeout=120000 --maxsockets=3 \
    || npm ci --cache /root/.npm --prefer-offline --fetch-retries=5 --fetch-retry-mintimeout=20000 --fetch-retry-maxtimeout=120000 --maxsockets=3 \
    || npm ci --cache /root/.npm --prefer-offline --fetch-retries=5 --fetch-retry-mintimeout=20000 --fetch-retry-maxtimeout=120000 --maxsockets=3

FROM node:22-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3010
ENV HOSTNAME=0.0.0.0
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
EXPOSE 3010
CMD ["node", "server.js"]
