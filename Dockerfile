FROM node:24-bookworm-slim AS build
WORKDIR /app
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile
COPY . .
ARG BASE_URL=/%C3%B6vers%C3%A4ttarlexikon/
ENV NUXT_APP_BASE_URL=$BASE_URL
RUN yarn build

FROM node:24-bookworm-slim
WORKDIR /app
COPY --from=build /app/.output ./.output
ENV NODE_ENV=production HOST=0.0.0.0 PORT=3000
ENV NUXT_APP_BASE_URL=/översättarlexikon/
USER node
EXPOSE 3000
CMD ["node", ".output/server/index.mjs"]
