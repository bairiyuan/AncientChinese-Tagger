#!/bin/bash
set -e

echo "🚀 开始部署 AncientChinese-Tagger..."

# 检查环境变量文件
if [ ! -f "secrets/db_password.txt" ]; then
    echo "❌ 错误: secrets/db_password.txt 不存在"
    exit 1
fi

# 拉取最新镜像
echo "📥 拉取最新镜像..."
docker compose -f compose.prod.yaml pull

# 重新构建（如果本地有更改）并启动
echo "🏗️ 启动服务..."
docker compose -f compose.prod.yaml up -d --build

# 等待健康检查
echo "⏳ 等待服务就绪..."
for i in {1..10}; do
    if [ "$(docker compose -f compose.prod.yaml ps | grep -c "healthy")" -ge 3 ]; then
        echo "✅ 所有服务已就绪"
        break
    fi
    echo "..."
    sleep 5
done

# 显示服务状态
docker compose -f compose.prod.yaml ps

echo "✅ 部署完成"
