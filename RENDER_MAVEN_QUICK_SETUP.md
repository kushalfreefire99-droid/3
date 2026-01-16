# ⚡ Maven Setup for Render - USE DOCKER!

## ⚠️ Important Notice

Render's free tier has a **read-only filesystem** during builds. You **cannot** use `apt-get` to install Maven.

**Solution:** Use Docker! 🐳

---

## 🐳 Docker Setup (5 minutes)

### Step 1: Push Docker Files to GitHub

```bash
cd ../coderslab-deploy
git add Dockerfile .dockerignore
git commit -m "Add Dockerfile with Maven and Java"
git push origin main
```

### Step 2: Switch to Docker in Render

1. Go to your Render dashboard
2. Click on your service
3. Click **"Settings"** (left sidebar)
4. Find **"Environment"** section
5. Change from **"Node"** to **"Docker"**
6. Click **"Save Changes"**
7. Done! Render will redeploy with Maven ✅

---

## ✅ What This Gives You

- ✅ Maven pre-installed
- ✅ Java pre-installed
- ✅ Full plugin building capability
- ✅ No permission issues
- ✅ Consistent builds

---

## 🔍 Verify It Works

After deployment, check your Render logs. You should see:

```
Step 2/10 : RUN apt-get install -y maven default-jdk
Apache Maven 3.x.x
Java version: 17.x.x
✅ Maven and Java installed!
```

---

## 📊 Build Time

- First build: 5-7 minutes (building Docker image)
- Subsequent builds: 3-4 minutes (cached layers)

---

## 🎉 That's It!

Your app can now build Minecraft plugins and create JAR files!

For detailed Docker setup, see `RENDER_DOCKER_SETUP.md`

---

**Made with ❤️ by Seazon**
