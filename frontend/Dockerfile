FROM node:24-bookworm-slim
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY server.js ./
COPY public/ ./public/
ENV NODE_ENV=production
USER node
EXPOSE 8080
CMD ["node", "server.js"]