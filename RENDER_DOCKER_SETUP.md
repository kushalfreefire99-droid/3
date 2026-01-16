# 🐳 Switch to Docker on Render (For Maven Support)

Render's free tier has a read-only filesystem, so we can't install Maven during build. The solution is to use Docker, which gives us full control.

---

## ✅ Benefits of Docker

- ✅ Maven pre-installed
- ✅ Java pre-installed
- ✅ Full control over environment
- ✅ Consistent builds
- ✅ No permission issues

---

## 🚀 Step-by-Step Setup

### Step 1: Push Docker Files to GitHub

The `Dockerfile` and `.dockerignore` are already in your deployment folder.

```bash
cd ../coderslab-deploy
git add Dockerfile .dockerignore
git commit -m "Add Dockerfile with Maven and Java support"
git push origin main
```

### Step 2: Change Render to Docker Mode

1. Go to your Render dashboard
2. Click on your service
3. Click **"Settings"** (left sidebar)
4. Scroll to **"Environment"** section
5. Change from **"Node"** to **"Docker"**
6. Click **"Save Changes"**

### Step 3: Update Build Settings (Optional)

Render will automatically detect your Dockerfile. But if needed:

**Build Command:** Leave empty (Docker handles it)  
**Start Command:** Leave empty (Docker handles it)

### Step 4: Redeploy

1. Render will automatically start redeploying
2. Or click **"Manual Deploy"** → **"Deploy latest commit"**

---

## 📊 What Happens During Build

```
1. Render pulls your code
2. Builds Docker image (installs Maven + Java)
3. Installs npm dependencies
4. Builds your app
5. Starts the server
```

**Build time:** 5-7 minutes (first time)  
**Subsequent builds:** 3-4 minutes (cached)

---

## ✅ Verify Maven is Installed

After deployment, check the build logs. You should see:

```
Step 2/10 : RUN apt-get update && apt-get install -y maven default-jdk
 ---> Running in ...
Apache Maven 3.x.x
Java version: 17.x.x
✅ Maven and Java installed!
```

---

## 🎯 Build Command Changes

### Before (Node mode):
```bash
npm install && npm run build
```

### After (Docker mode):
```
Dockerfile handles everything automatically!
```

---

## 🔍 Troubleshooting

### Build fails with "Dockerfile not found"?
Make sure you pushed the Dockerfile to GitHub:
```bash
git add Dockerfile
git commit -m "Add Dockerfile"
git push origin main
```

### Port issues?
The Dockerfile exposes port 3001. Make sure your `PORT` environment variable is set to `3001` in Render.

### Build takes too long?
First build takes 5-7 minutes. Subsequent builds are faster due to Docker layer caching.

---

## 📋 Environment Variables

Make sure these are still set in Render:

- `NODE_ENV=production`
- `PORT=3001`
- All your API keys and Discord credentials
- (See `RENDER_ENV_VARIABLES.txt` for complete list)

---

## 🎉 After Docker Setup

Your app will have:
- ✅ Maven installed
- ✅ Java installed
- ✅ Full plugin building capability
- ✅ No permission issues
- ✅ Consistent environment

---

## 💡 Why Docker?

**Render's free tier limitations:**
- Read-only filesystem during build
- Can't install system packages with `apt-get`
- Limited permissions

**Docker solution:**
- Full control over the build environment
- Pre-install Maven and Java in the image
- No permission issues
- Industry standard approach

---

## 🔄 Reverting to Node Mode

If you need to go back:

1. Go to Render Settings
2. Change Environment from "Docker" to "Node"
3. Set Build Command back to: `npm install && npm run build`
4. Remove Dockerfile from your repo

---

**Made with ❤️ by Seazon | Proudly built in 🇳🇵 Nepal**

**Your app is now ready with Maven support! 🚀**
