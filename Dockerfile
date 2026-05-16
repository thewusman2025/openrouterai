FROM node:20-alpine

WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev || npm install --omit=dev

COPY . .
RUN npm install --include=dev && npm run build && npm prune --omit=dev

ENV NODE_ENV=production

ENTRYPOINT ["node", "dist/index.js"]
