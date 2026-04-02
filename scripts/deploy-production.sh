#!/bin/bash

# Production Deployment Script for Intentional Spending Tracker

echo "🚀 Starting Production Deployment..."

# Check if .env.production exists
if [ ! -f .env.production ]; then
    echo "❌ .env.production file not found. Please create it first."
    exit 1
fi

# Load production environment variables
export $(cat .env.production | xargs)

# Build and deploy frontend
echo "📦 Building Frontend..."
cd frontend
docker build -f Dockerfile.prod -t intentional-frontend:latest .
cd ..

# Build and deploy backend
echo "🔧 Building Backend..."
cd backend
docker build -t intentional-backend:latest .
cd ..

# Deploy with Docker Compose
echo "🌐 Deploying Services..."
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml up -d

# Wait for services to be healthy
echo "⏳ Waiting for services to be healthy..."
sleep 30

# Check service health
echo "🔍 Checking Service Health..."
docker-compose -f docker-compose.prod.yml ps

# Show logs
echo "📋 Showing Recent Logs..."
docker-compose -f docker-compose.prod.yml logs --tail=50

echo "✅ Production Deployment Complete!"
echo "🌐 Frontend: http://localhost"
echo "🔧 Backend: http://localhost:3001"
echo "💾 Database: localhost:5432"
echo "🔴 Redis: localhost:6379"
