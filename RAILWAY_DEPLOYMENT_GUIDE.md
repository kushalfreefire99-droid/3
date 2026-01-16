# 🚂 Railway Deployment Guide for CodersLab

This guide will help you deploy your CodersLab application to Railway.app for free.

## 📋 Prerequisites

1. A GitHub account
2. A Railway account (sign up at https://railway.app)
3. Your API keys ready:
   - Groq API Key
   - Hugging Face API Key
   - Gemini API Key
   - Discord Bot Token
   - Discord OAuth2 credentials

## 🚀 Step-by-Step Deployment

### Step 1: Push Code to GitHub

1. Initialize git repository (if not already done):
```bash
git init
git add .
git commit -m "Initial commit - Ready for Railway deployment"
```

2. Create a new repository on GitHub (https://github.com/new)
   - Name it: `coderslab` or any name you prefer
   - Make it **Private** (recommended since it contains sensitive config)
   - Don't initialize with README (you already have one)

3. Push your code:
```bash
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
git branch -M main
git push -u origin main
```

### Step 2: Deploy to Railway

1. Go to https://railway.app and sign in
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Authorize Railway to access your GitHub account
5. Select your `coderslab` repository
6. Railway will automatically detect your project and start deploying

### Step 3: Configure Environment Variables

Once deployed, you need to add environment variables:

1. In your Railway project, click on your service
2. Go to the "Variables" tab
3. Add the following environment variables:

#### Required Variables:

```
NODE_ENV=production
PORT=3001

# API Keys
GROQ_API_KEY=your_groq_api_key_here
HUGGINGFACE_API_KEY=your_huggingface_api_key_here
GEMINI_API_KEY=your_gemini_api_key_here

# Admin Credentials
ADMIN_USERNAME=seazon
ADMIN_PASSWORD=seazonpanel

# JWT Secret (IMPORTANT: Change this to a random string!)
JWT_SECRET=your-super-secret-random-string-change-this

# Discord Bot
DISCORD_BOT_TOKEN=your_discord_bot_token
DISCORD_PLUGIN_CHANNEL_ID=your_plugin_channel_id
DISCORD_SKRIPT_CHANNEL_ID=your_skript_channel_id
DISCORD_CONFIG_CHANNEL_ID=your_config_channel_id

# Discord OAuth2
DISCORD_CLIENT_ID=your_discord_client_id
DISCORD_CLIENT_SECRET=your_discord_client_secret
DISCORD_REDIRECT_URI=https://YOUR_APP_NAME.up.railway.app/auth/callback
DISCORD_GUILD_ID=your_discord_server_id

# Database
DATABASE_PATH=./data/coderslab.db
```

#### Important Notes:

- **JWT_SECRET**: Generate a random string (at least 32 characters). You can use: `openssl rand -base64 32`
- **DISCORD_REDIRECT_URI**: Replace `YOUR_APP_NAME` with your actual Railway app URL
- Railway will provide you with a URL like: `https://your-app-name.up.railway.app`

### Step 4: Update Discord OAuth2 Settings

1. Go to Discord Developer Portal: https://discord.com/developers/applications
2. Select your application
3. Go to "OAuth2" → "General"
4. Add your Railway URL to "Redirects":
   ```
   https://YOUR_APP_NAME.up.railway.app/auth/callback
   ```
5. Save changes

### Step 5: Enable Persistent Storage (Optional but Recommended)

Railway's free tier doesn't include persistent volumes by default, but you can add one:

1. In your Railway project, click "New" → "Volume"
2. Name it: `coderslab-data`
3. Mount path: `/app/data`
4. This will persist your SQLite database across deployments

### Step 6: Verify Deployment

1. Wait for Railway to finish building (usually 2-5 minutes)
2. Click on your service to see the deployment URL
3. Visit your app: `https://YOUR_APP_NAME.up.railway.app`
4. Test the following:
   - ✅ Homepage loads
   - ✅ Discord OAuth login works
   - ✅ Code generation works
   - ✅ Admin panel login works (username: seazon, password: seazonpanel)
   - ✅ Plugin build works

## 🔧 Troubleshooting

### Build Fails

**Problem**: Build fails with "Module not found" errors
**Solution**: Make sure all dependencies are in `package.json`. Run `npm install` locally first.

### Discord OAuth Not Working

**Problem**: "Invalid redirect_uri" error
**Solution**: 
1. Check that `DISCORD_REDIRECT_URI` in Railway matches your Discord app settings
2. Make sure it's the full URL: `https://your-app.up.railway.app/auth/callback`

### Database Resets on Deploy

**Problem**: User data disappears after redeployment
**Solution**: Add a persistent volume (see Step 5 above)

### API Keys Not Working

**Problem**: "API key invalid" errors
**Solution**: 
1. Double-check all API keys are correctly copied
2. No extra spaces or quotes around the keys
3. Redeploy after adding/changing environment variables

### App Sleeps/Slow Cold Starts

**Problem**: First request takes 10-20 seconds
**Solution**: Railway's free tier may have cold starts. Consider:
1. Upgrading to Railway's paid tier ($5/month)
2. Using a service like UptimeRobot to ping your app every 5 minutes

## 📊 Monitoring

Railway provides built-in monitoring:

1. **Logs**: Click "Deployments" → Select deployment → View logs
2. **Metrics**: See CPU, Memory, and Network usage
3. **Usage**: Track your $5 monthly credit usage

## 💰 Cost Management

Railway free tier includes:
- $5 credit per month
- ~500 hours of runtime
- 100GB outbound bandwidth

Tips to stay within free tier:
- Your app should easily fit within the free tier for development/testing
- Monitor usage in Railway dashboard
- Consider upgrading if you get significant traffic

## 🔄 Updating Your App

To deploy updates:

```bash
git add .
git commit -m "Your update message"
git push origin main
```

Railway will automatically detect the push and redeploy!

## 🎉 Success!

Your CodersLab app is now live on Railway! Share your URL with users and start generating Minecraft code!

**Your App URL**: `https://YOUR_APP_NAME.up.railway.app`

## 📞 Support

If you encounter issues:
1. Check Railway logs for errors
2. Check Discord Developer Portal for OAuth issues
3. Verify all environment variables are set correctly
4. Check that API keys are valid and have quota remaining

---

**Made with ❤️ by Seazon | Proudly built in 🇳🇵 Nepal**
