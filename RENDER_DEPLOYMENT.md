# Render Deployment Guide - Cloud Whatsapp API

## Prerequisites
- GitHub account (you already have this ✅)
- Code pushed to GitHub (done ✅)
- Credit card (for Render - they have a free tier but need card for verification)

---

## Step-by-Step Render Deployment (15 minutes)

### Step 1: Sign Up for Render
1. Go to **https://render.com**
2. Click "Get Started" or "Sign Up"
3. **Sign up with GitHub** (easiest option)
4. Authorize Render to access your GitHub account

### Step 2: Create a New Web Service
1. Click **"New +"** button (top right)
2. Select **"Web Service"**
3. Click **"Connect a repository"**
4. Find and select **`whatsapp-multi-session-api`**
5. Click **"Connect"**

### Step 3: Configure the Service

**Basic Settings:**
- **Name:** `whatsapp-api` (or your preferred name)
- **Region:** Choose **Singapore** (best for India) or **Frankfurt**
- **Branch:** `main`
- **Root Directory:** Leave blank
- **Runtime:** Automatically detects **Node**

**Build & Deploy:**
- **Build Command:** `npm install`
- **Start Command:** `npm start`

**Instance Type:**
- Select **"Starter"** ($7/month)
  - 512MB RAM
  - Includes persistent disk (important for WhatsApp sessions!)

### Step 4: Add Environment Variables

Click **"Advanced"** then scroll to **"Environment Variables"**

Add these variables one by one:

```
PORT = 3000
NODE_ENV = production
DB_PATH = /data/whatsapp.db
JWT_SECRET = [Generate a random 32+ character string]
SESSION_SECRET = [Generate another random 32+ character string]
RATE_LIMIT_WINDOW = 15
RATE_LIMIT_MAX = 100
```

**To generate secure secrets:**
- Option 1: Use https://www.random.org/strings/ (32 characters, alphanumeric)
- Option 2: Run in terminal: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`

**Important:** Leave `CORS_ORIGIN` empty for now - we'll add it after deployment

### Step 5: Add Persistent Disk (CRITICAL for WhatsApp)

1. Scroll down to **"Disks"**
2. Click **"Add Disk"**
3. Configure:
   - **Name:** `data`
   - **Mount Path:** `/data`
   - **Size:** 1 GB (sufficient to start)
4. Click **"Save"**

### Step 6: Deploy!

1. Click **"Create Web Service"** button at the bottom
2. Render will:
   - Clone your repository
   - Install dependencies
   - Start your application
3. **Wait 3-5 minutes** for deployment
4. You'll see build logs in real-time

### Step 7: Get Your URL

Once deployed, you'll see:
- ✅ **Live** status badge (green)
- Your URL: `https://whatsapp-api-xxxx.onrender.com`

### Step 8: Update CORS Setting

1. Copy your Render URL
2. Go to **"Environment"** tab
3. Add new variable:
   ```
   CORS_ORIGIN = https://your-app-name.onrender.com
   ```
4. Click **"Save Changes"**
5. Render will automatically redeploy

### Step 9: Test Your Deployment

1. Visit your URL: `https://your-app-name.onrender.com`
2. You should see the login page
3. Test the health endpoint: `https://your-app-name.onrender.com/health`

---

## Post-Deployment Configuration

### Set Up Custom Domain (Optional)

1. Go to **"Settings"** tab
2. Scroll to **"Custom Domain"**
3. Click **"Add Custom Domain"**
4. Enter your domain (e.g., `api.yourdomain.com`)
5. Update your DNS with the CNAME record Render provides
6. SSL certificate auto-generates (free!)

### Update CORS for Custom Domain

If using custom domain, update `CORS_ORIGIN`:
```
CORS_ORIGIN = https://api.yourdomain.com
```

---

## Important: Database Persistence

**YOUR DATA IS SAVED** on the persistent disk at `/data`

**To verify:**
1. Create a test session
2. Check it persists after restart
3. Go to "Manual Deploy" > "Clear build cache & deploy"
4. Session should still be there ✅

---

## Monitoring & Logs

### View Logs
1. Go to **"Logs"** tab
2. See real-time application logs
3. Debug any issues

### Metrics
1. Go to **"Metrics"** tab
2. View CPU, Memory, Network usage
3. Monitor performance

### Manual Deploy
- Go to **"Manual Deploy"** tab
- Click **"Deploy latest commit"** for manual updates

---

## Automatic Deployments

**Already configured!** ✅

Every time you push to `main` branch:
1. Render detects the change
2. Automatically deploys
3. No manual action needed

**To disable auto-deploy:**
- Go to Settings > Auto-Deploy > Toggle off

---

## Cost Summary

**Starter Plan: $7/month includes:**
- 512MB RAM
- Persistent SSD storage
- Free SSL certificate
- Custom domain support
- Automatic deployments
- DDoS protection

**Free tier available but:**
- ⚠️ Spins down after 15 min of inactivity
- ⚠️ Cold starts (slow response)
- ❌ Not suitable for WhatsApp (sessions disconnect)

---

## Troubleshooting

### Build Fails
**Error:** `npm install` fails
- Check `package.json` is committed
- Ensure all dependencies are listed
- Check build logs for specific error

### Application Won't Start
**Error:** Application crash on start
- Check **Environment Variables** are set
- Verify `Start Command` is `npm start`
- Check logs for error messages

### WhatsApp Sessions Not Persisting
- Verify persistent disk is mounted at `/data`
- Check `DB_PATH` environment variable = `/data/whatsapp.db`
- Ensure `auth_info` directory referenced in code

### Slow Performance
- Upgrade to higher tier (more RAM)
- Check if too many concurrent sessions
- Monitor metrics tab

---

## Updating Your Application

### Option 1: Git Push (Automatic)
```bash
git add .
git commit -m "your changes"
git push origin main
# Render auto-deploys!
```

### Option 2: Manual Deploy
1. Go to Render dashboard
2. Click "Manual Deploy"
3. Click "Deploy latest commit"

---

## Security Checklist

After deployment, verify:
- [ ] Strong JWT_SECRET set (32+ characters)
- [ ] Strong SESSION_SECRET set (32+ characters)  
- [ ] HTTPS enabled (automatic)
- [ ] CORS_ORIGIN set to your domain
- [ ] Environment variables not exposed in code
- [ ] `.env` file not committed to GitHub

---

## Next Steps After Deployment

1. **Test thoroughly:**
   - Create session
   - Scan QR code
   - Send messages
   - Check API endpoints

2. **Set up monitoring:**
   - Enable Render alerts
   - Check logs regularly

3. **Plan for growth:**
   - Monitor disk usage
   - Upgrade plan if needed
   - Consider multiple instances

---

## Useful Render Commands

### In the Web Shell (optional)
1. Go to "Shell" tab
2. Access your application container
3. Run commands like:
   ```bash
   ls -la /data
   npm run backup
   ```

---

## Support & Resources

- **Render Docs:** https://render.com/docs
- **Status Page:** https://status.render.com
- **Your GitHub Repo:** https://github.com/anuragkumarsingh134/whatsapp-multi-session-api

---

## Estimated Timeline

- Account setup: **2 minutes**
- Service configuration: **5 minutes**
- Deployment wait: **3-5 minutes**
- Testing: **5 minutes**
- **Total: ~15 minutes**

---

## What Happens Next?

Once deployed:
1. ✅ Your app is live 24/7
2. ✅ Auto-updates on git push
3. ✅ Free SSL/HTTPS
4. ✅ Persistent WhatsApp sessions
5. ✅ Ready for production use!

**Let's get started! Go to https://render.com and sign up with GitHub!** 🚀
