#!/bin/bash
set -e

echo "🔧 Starting Render build process..."

echo "📦 Installing Maven..."
apt-get update
apt-get install -y maven

echo "✅ Maven installed! Version:"
mvn -version

echo "📦 Installing npm dependencies..."
npm install

echo "🔨 Building application..."
npm run build

echo "✅ Build complete! Ready to deploy 🚀"
