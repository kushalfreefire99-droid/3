# 🔧 Installing Maven on Render

Your app needs Maven to build Minecraft plugins. **Render's free tier has a read-only filesystem**, so we need to use Docker.

---

## ⚠️ Important: Use Docker (Recommended)

Render's free tier doesn't allow installing packages with `apt-get` during build. The solution is to use Docker.

**See `RENDER_DOCKER_SETUP.md` for complete Docker setup guide.**

---

## 🐳 Quick Docker Setup (5 minutes)

### Step 1: Push Docker Files
```bash
cd ../coderslab-deploy
git add Dockerfile .dockerignore
git commit -m "Add Dockerfile with Maven support"
git push origin main
```

### Step 2: Switch to Docker in Render
1. Go to Render dashboard → Your service → **Settings**
2. Change **"Environment"** from **"Node"** to **"Docker"**
3. Click **"Save Changes"**
4. Render will automatically redeploy with Maven! ✅

---

## ✅ What You Get with Docker

- ✅ Maven pre-installed
- ✅ Java pre-installed  
- ✅ No permission issues
- ✅ Consistent builds
- ✅ Full plugin building capability

---

## 📋 Option 2: Use Build Script (Alternative)

If Option 1 doesn't work, use a build script:

### Step 1: Create `render-build.sh` in your project root

```bash
#!/bin/bash
set -e

echo "📦 Installing Maven..."

# Install Maven
apt-get update
apt-get install -y maven

# Verify Maven installation
mvn -version

echo "✅ Maven installed!"

echo "📦 Installing npm dependencies..."
npm install

echo "🔨 Building application..."
npm run build

echo "✅ Build complete!"
```

### Step 2: Make it executable
```bash
chmod +x render-build.sh
```

### Step 3: Update Render Build Command
In Render settings, set build command to:
```bash
bash render-build.sh
```

### Step 4: Push to GitHub
```bash
git add render-build.sh
git commit -m "Add Maven installation script for Render"
git push origin main
```

---

## 📋 Option 3: Use Dockerfile (Most Reliable)

If you need more control, use a Dockerfile:

### Step 1: Create `Dockerfile` in project root

```dockerfile
FROM node:22-slim

# Install Maven
RUN apt-get update && \
    apt-get install -y maven && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY frontend/package*.json ./frontend/
COPY backend/package*.json ./backend/

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Build application
RUN npm run build

# Expose port
EXPOSE 3001

# Start application
CMD ["npm", "run", "start:production"]
```

### Step 2: Create `.dockerignore`

```
node_modules
dist
builds
.git
.env
*.md
```

### Step 3: Update Render Settings
1. Go to Render dashboard
2. Click **"Settings"**
3. Change **"Environment"** from **"Node"** to **"Docker"**
4. Render will automatically detect and use your Dockerfile

### Step 4: Push to GitHub
```bash
git add Dockerfile .dockerignore
git commit -m "Add Dockerfile with Maven support"
git push origin main
```

---

## ✅ Verify Maven Installation

After deployment, check the build logs in Render. You should see:

```
Apache Maven 3.x.x
Maven home: /usr/share/maven
Java version: ...
```

---

## 🎯 Recommended Approach

**For simplicity:** Use **Option 1** (update build command)

**For reliability:** Use **Option 3** (Dockerfile)

---

## 🔍 Troubleshooting

### Maven not found after installation?
Add Maven to PATH in your build command:
```bash
apt-get update && apt-get install -y maven && export PATH=/usr/share/maven/bin:$PATH && npm install && npm run build
```

### Permission denied?
Render's free tier has limited permissions. Use the Dockerfile approach (Option 3) for better control.

### Build timeout?
Maven installation adds ~30 seconds to build time. This is normal.

---

## 📊 Build Time Comparison

**Without Maven:** 3-4 minutes  
**With Maven:** 4-5 minutes  

The extra minute is worth it for plugin building functionality! 🚀

---

## 🎉 After Maven is Installed

Your app will be able to:
- ✅ Build Minecraft plugins
- ✅ Compile Java code
- ✅ Create JAR files
- ✅ Send builds to Discord

---

**Made with ❤️ by Seazon | Proudly built in 🇳🇵 Nepal**
