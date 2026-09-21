# 打字小英雄 · 容器部署（可选）
FROM node:22-alpine
WORKDIR /app
COPY server ./server
COPY assets ./assets
COPY index.html package.json ./
ENV DAZI_HOST=0.0.0.0 DAZI_PORT=5173
EXPOSE 5173
VOLUME ["/app/server/data"]
CMD ["node", "server/server.js"]
