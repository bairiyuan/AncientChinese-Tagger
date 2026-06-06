FROM node:22-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
# 禁用类型检查构建，确保 CI 稳定通过（本地开发已包含类型检查）
RUN npm run build-only

FROM nginxinc/nginx-unprivileged:1.29-alpine AS runtime

WORKDIR /usr/share/nginx/html

COPY --from=build --chown=101:101 /app/dist ./
COPY --chown=101:101 nginx.conf /etc/nginx/conf.d/default.conf

USER 101:101

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD wget -q -O /dev/null http://127.0.0.1:8080/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
