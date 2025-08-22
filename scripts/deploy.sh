#!/bin/bash

# Poetry Slam Calculator Deployment Script
set -e

# Configuration
APP_NAME="poetry-slam-calculator"
VERSION=$(node -p "require('./package.json').version")
DOCKER_IMAGE="${APP_NAME}:${VERSION}"
DOCKER_CONTAINER="${APP_NAME}-prod"

echo "🚀 Deploying ${APP_NAME} v${VERSION}"

# Build the application
echo "📦 Building application..."
npm run build

# Build Docker image
echo "🐳 Building Docker image..."
docker build -t ${DOCKER_IMAGE} .

# Stop existing container
echo "🛑 Stopping existing container..."
docker stop ${DOCKER_CONTAINER} 2>/dev/null || true
docker rm ${DOCKER_CONTAINER} 2>/dev/null || true

# Start new container
echo "▶️ Starting new container..."
docker run -d \
  --name ${DOCKER_CONTAINER} \
  --restart unless-stopped \
  -p 80:80 \
  ${DOCKER_IMAGE}

# Health check
echo "🏥 Performing health check..."
sleep 10
if curl -f http://localhost/health > /dev/null 2>&1; then
  echo "✅ Deployment successful!"
  echo "🌐 Application available at: http://localhost"
else
  echo "❌ Health check failed!"
  docker logs ${DOCKER_CONTAINER}
  exit 1
fi

# Cleanup old images
echo "🧹 Cleaning up old images..."
docker image prune -f

echo "🎉 Deployment completed successfully!"
