# ✅ Railway Deployment Checklist

Use this checklist to ensure your deployment is successful.

## Before Deployment

- [ ] All code is committed to Git
- [ ] `.env` file is NOT committed (check `.gitignore`)
- [ ] All dependencies are in `package.json`
- [ ] Build scripts work locally (`npm run build`)
- [ ] Production start script works (`npm run start:production`)

## GitHub Setup

- [ ] Created GitHub repository
- [ ] Pushed code to GitHub
- [ ] Repository is set to Private (recommended)

## Railway Setup

- [ ] Created Railway account
- [ ] Connected GitHub repository
- [ ] Project is deploying

## Environment Variables (Railway)

Copy these to Railway's Variables tab:

### Essential Variables
- [ ] `NODE_ENV=production`
- [ ] `PORT=3001`
- [ ] `GROQ_API_KEY=your_key`
- [ ] `HUGGINGFACE_API_KEY=your_key`
- [ ] `GEMINI_API_KEY=your_key`

### Admin Credentials
- [ ] `ADMIN_USERNAME=seazon`
- [ ] `ADMIN_PASSWORD=seazonpanel`

### Security
- [ ] `JWT_SECRET=random_32_char_string` (CHANGE THIS!)

### Discord Bot
- [ ] `DISCORD_BOT_TOKEN=your_token`
- [ ] `DISCORD_PLUGIN_CHANNEL_ID=your_id`
- [ ] `DISCORD_SKRIPT_CHANNEL_ID=your_id`
- [ ] `DISCORD_CONFIG_CHANNEL_ID=your_id`

### Discord OAuth2
- [ ] `DISCORD_CLIENT_ID=your_id`
- [ ] `DISCORD_CLIENT_SECRET=your_secret`
- [ ] `DISCORD_REDIRECT_URI=https://YOUR_APP.up.railway.app/auth/callback`
- [ ] `DISCORD_GUILD_ID=your_server_id`

### Database
- [ ] `DATABASE_PATH=./data/coderslab.db`

## Discord Developer Portal

- [ ] Updated OAuth2 redirect URI to Railway URL
- [ ] Format: `https://YOUR_APP.up.railway.app/auth/callback`
- [ ] Saved changes in Discord Developer Portal

## Post-Deployment Testing

- [ ] App loads at Railway URL
- [ ] Homepage displays correctly
- [ ] Code generation works
- [ ] Discord OAuth login works
- [ ] Admin panel accessible
- [ ] Admin login works (seazon/seazonpanel)
- [ ] Plugin build feature works
- [ ] Discord bot posts to channels

## Optional Enhancements

- [ ] Added persistent volume for database
- [ ] Set up custom domain
- [ ] Configured monitoring/alerts
- [ ] Set up UptimeRobot for keep-alive

## Troubleshooting

If something doesn't work:

1. **Check Railway Logs**
   - Go to Deployments → Select deployment → View logs
   - Look for error messages

2. **Verify Environment Variables**
   - All variables are set correctly
   - No extra spaces or quotes
   - JWT_SECRET is changed from default

3. **Discord OAuth Issues**
   - Redirect URI matches exactly
   - Discord app has correct permissions
   - Guild ID is correct

4. **API Key Issues**
   - Keys are valid and active
   - Keys have remaining quota
   - No typos in keys

## Success! 🎉

Once all items are checked, your app is live!

**Your App URL**: `https://YOUR_APP_NAME.up.railway.app`

Share it with your users and start generating Minecraft code!

---

**Made with ❤️ by Seazon | Proudly built in 🇳🇵 Nepal**
