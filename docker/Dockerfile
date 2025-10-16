FROM node:22-alpine AS builder

WORKDIR /app
COPY front/package*.json ./
RUN npm i
COPY front/tsconfig.json ./
COPY front/tsconfig.app.json ./
COPY front/tsconfig.node.json ./
COPY docker/vite.config.ts ./
COPY back/src/config.ts ./
COPY front/index.html ./
COPY front/public public
COPY front/src src
RUN npx vite build

FROM node:22-alpine

ENV TZ=Asia/Tokyo

RUN apk add --no-cache tini

WORKDIR /node
COPY --from=builder /app/dist dist
COPY back/package*.json ./
RUN chown -R node:node .
USER node
RUN npm i

COPY back/tsconfig.json ./
COPY --chown=node:node back/src src
RUN npm run build

ENTRYPOINT ["/sbin/tini", "-e", "143", "--"]
CMD ["node", "js/index.js"]

