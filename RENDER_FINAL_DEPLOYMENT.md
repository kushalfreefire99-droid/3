# 🚀 Final Render Deployment Guide

## ✅ Everything You Need to Deploy

Your app is ready! Follow these steps to deploy with Maven support.

---

## 📋 Step-by-Step Deployment

### Step 1: Push All Files to GitHub ✅

```bash
cd ../coderslab-deploy
git add .
git commit -m "Ready for Render deployment with Docker and Maven"
git push origin main
```

**Files included:**
- ✅ `Dockerfile` - Maven + Java pre-installed
- ✅ `.dockerignore` - Optimized Docker build
- ✅ Fixed `package.json` files - All build deps in dependencies
- ✅ Fixed `tsconfig.json` files - No test dependencies

---

### Step 2: Configure Render Service

#### 2.1 Create Service (if not done)
1. Go to https://render.com
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub repository
4. Click **"Connect"**

#### 2.2 Service Settings
- **Name:** `coderslab` (or your choice)
- **Region:** Choose closest to you
- **Branch:** `main`
- **Environment:** **Docker** ⚠️ (IMPORTANT!)
- **Instance Type:** Free

#### 2.3 Build Settings
- **Build Command:** Leave empty (Docker handles it)
- **Start Command:** Leave empty (Docker handles it)

---

### Step 3: Add Environment Variables

Click **"Environment"** tab and add these 17 variables:

```
NODE_ENV=production
PORT=3001
GROQ_API_KEY=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
HUGGINGFACE_API_KEY=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
GEMINI_API_KEY=AIzaSyCN4UHMHqhjUipvD2uWlzfnTnL-q058eNg
DATABASE_PATH=./data/coderslab.db
ADMIN_USERNAME=seazon
ADMIN_PASSWORD=seazonpanel
JWT_SECRET=CHANGE-THIS-TO-RANDOM-STRING
DISCORD_BOT_TOKEN=MTQ2MTcxMjQ0MzEyNTUzNDg0MA.GE0F5A.xB9GHkahRQt4ezRXFkw7Hwy1HcnvSNnd2783wY
DISCORD_PLUGIN_CHANNEL_ID=1461697520387493969
DISCORD_SKRIPT_CHANNEL_ID=1461694766168146104
DISCORD_CONFIG_CHANNEL_ID=1461697552184381583
DISCORD_CLIENT_ID=1461712443125534840
DISCORD_CLIENT_SECRET=COs0NiOrifsDDgbICZvflpa5PzNHAL2u
DISCORD_REDIRECT_URI=https://YOUR-APP-NAME.onrender.com/auth/callback
DISCORD_GUILD_ID=1461682689881935968
```

⚠️ **Important:** 
- Change `JWT_SECRET` to a random 32-character string
- Update `DISCORD_REDIRECT_URI` with your actual Render URL after deployment

---

### Step 4: Deploy!

1. Click **"Create Web Service"**
2. Render will start building (5-7 minutes first time)
3. Watch the logs for progress

---

## 📊 Build Process

```
1. ✅ Clone repository
2. ✅ Build Docker image (install Maven + Java)
3. ✅ Install npm dependencies
4. ✅ Build frontend (Vite + TypeScript)
5. ✅ Build backend (TypeScript)
6. ✅ Start server
7. ✅ Live! 🎉
```

**Expected time:** 5-7 minutes

---

## ✅ Verify Deployment

### Check Build Logs
Look for these success messages:

```
✅ Maven installed: Apache Maven 3.x.x
✅ Java installed: OpenJDK 17.x.x
✅ Frontend built: 312.43 kB
✅ Backend compiled successfully
✅ Server running on port 3001
```

### Test Your App
1. Visit your Render URL
2. Homepage should load
3. Try generating a plugin
4. Test Discord login
5. Go to `/admin` and login with `seazon` / `seazonpanel`

---

## 🔄 Update Discord OAuth

After deployment:

1. Copy your Render URL (e.g., `https://coderslab-xxxx.onrender.com`)
2. Update `DISCORD_REDIRECT_URI` in Render environment variables
3. Update Discord Developer Portal:
   - Go to https://discord.com/developers/applications
   - Your application → OAuth2 → Redirects
   - Add: `https://YOUR-RENDER-URL.onrender.com/auth/callback`
   - Save changes

---

## 🔥 Keep App Awake 24/7

Render free tier sleeps after 15 minutes. Use UptimeRobot:

1. Go to https://uptimerobot.com
2. Sign up (free)
3. Add New Monitor:
   - Type: HTTP(s)
   - URL: Your Render URL
   - Interval: 5 minutes
4. Done! App stays awake 24/7 ✅

---

## 📚 Documentation Files

- `RENDER_DOCKER_SETUP.md` - Docker setup details
- `RENDER_DEPLOYMENT_GUIDE.md` - Complete deployment guide
- `RENDER_ENV_VARIABLES.txt` - All environment variables
- `MAVEN_INSTALL_RENDER.md` - Maven installation guide
- `BUILD_FIX_FOR_RENDER.md` - Build fixes applied

---

## 🎯 What Your App Can Do

- ✅ Generate Minecraft plugins (Spigot/Paper)
- ✅ Generate Skript scripts
- ✅ Generate config files (YAML)
- ✅ Build plugins with Maven
- ✅ Create JAR files
- ✅ Send builds to Discord
- ✅ Discord authentication
- ✅ Admin panel for subscriptions
- ✅ Pro tier with 50 uses/day
- ✅ Free tier with 3 uses/day

---

## 🔍 Troubleshooting

### Build fails?
- Check logs for specific error
- Verify all environment variables are set
- Make sure Environment is set to "Docker"

### App not loading?
- Wait 30-60 seconds (cold start on free tier)
- Check logs for startup errors
- Verify PORT=3001 is set

### Discord login not working?
- Update DISCORD_REDIRECT_URI with actual Render URL
- Update Discord Developer Portal with same URL
- Check Discord credentials are correct

### Maven not found?
- Verify Environment is set to "Docker" (not "Node")
- Check build logs for Maven installation
- Dockerfile should show Maven being installed

---

## ✅ Deployment Checklist

- [ ] All files pushed to GitHub
- [ ] Render service created
- [ ] Environment set to **Docker**
- [ ] All 17 environment variables added
- [ ] JWT_SECRET changed to random string
- [ ] Service deployed successfully
- [ ] App loads in browser
- [ ] DISCORD_REDIRECT_URI updated
- [ ] Discord OAuth configured
- [ ] UptimeRobot monitoring set up
- [ ] Admin panel accessible
- [ ] Plugin generation works
- [ ] Maven builds work

---

## 🎉 Congratulations!

Your Minecraft Code Generator is now live on Render with:
- ✅ Full Maven support
- ✅ Java environment
- ✅ Discord integration
- ✅ Admin panel
- ✅ Pro subscriptions
- ✅ 24/7 uptime

**Your live URL:** `https://YOUR-APP.onrender.com`

---

**Made with ❤️ by Seazon | Proudly built in 🇳🇵 Nepal**

**Enjoy your free 24/7 Minecraft plugin generator! 🚀**
