# Låst på version och digest (multi-arch-index): 24.22.1+ har eMudhra-
# lagningen, och en låst bas ger samma Node i varje bygge. Byt båda raderna.
FROM node:24.22.2-bookworm-slim@sha256:c86ecead9e55a5210ac1727de38a4ca840bf03dcaf34dc9749addbf383b1920c AS build
WORKDIR /app
RUN corepack enable
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .
ARG BASE_URL=/%C3%B6vers%C3%A4ttarlexikon/
ENV NUXT_APP_BASE_URL=$BASE_URL
RUN pnpm build

FROM node:24.22.2-bookworm-slim@sha256:c86ecead9e55a5210ac1727de38a4ca840bf03dcaf34dc9749addbf383b1920c
WORKDIR /app
COPY --from=build /app/.output ./.output
ENV NODE_ENV=production HOST=0.0.0.0 PORT=3000
ENV NUXT_APP_BASE_URL=/översättarlexikon/
USER node
EXPOSE 3000
CMD ["node", ".output/server/index.mjs"]
