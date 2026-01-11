# Proxmox Ubuntu Container + Cloudflare Tunnel Deployment

Deploy your WhatsApp API on Proxmox with Cloudflare Tunnel - no port forwarding needed!

## Why Cloudflare Tunnel?

- ✅ **No port forwarding** - Works behind any router/NAT/CGNAT
- ✅ **Free SSL** - Automatic HTTPS with zero configuration
- ✅ **DDoS protection** - Built-in security
- ✅ **No public IP needed** - Perfect for home servers
- ✅ **Easy setup** - 20 minutes total
- ✅ **$0 cost** - Completely free!

---

## Prerequisites

- Proxmox server with Ubuntu LXC container
- Domain name (free from Freenom or paid)
- Cloudflare account (free)
- Domain added to Cloudflare

---

## Part 1: Prepare Ubuntu Container (10 minutes)

### Step 1: Access Container

```bash
# From Proxmox host, enter container
pct enter <container-id>

# OR SSH if preferred
ssh root@<container-ip>
```

### Step 2: Install Dependencies

```bash
# Update system
apt update && apt upgrade -y

# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# Install PM2 (process manager)
npm install -g pm2

# Install Git
apt install -y git
```

**Verify installation:**
```bash
node --version  # Should show v20.x.x
npm --version
pm2 --version
```

---

## Part 2: Deploy Application (5 minutes)

### Step 3: Clone & Setup

```bash
# Create app directory
mkdir -p /opt/whatsapp-api
cd /opt/whatsapp-api

# Clone repository
git clone https://github.com/anuragkumarsingh134/whatsapp-multi-session-api.git .

# Install dependencies
npm install --production
```

### Step 4: Configure Environment

**Create .env file:**
```bash
nano .env
```

**Paste this configuration:**
```env
PORT=3000
NODE_ENV=production

# Database
DB_PATH=./data/whatsapp.db

# Security - CHANGE THESE TO RANDOM STRINGS!
JWT_SECRET=CHANGE-ME-to-random-32-character-string-minimum
SESSION_SECRET=CHANGE-ME-to-another-random-32-character-string

# CORS (will update after domain setup)
CORS_ORIGIN=https://api.yourdomain.com

# Rate Limiting
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX=100
```

**Generate secure secrets:**
```bash
# Run these to generate random secrets
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Create required directories:**
```bash
mkdir -p data logs backups
```

### Step 5: Start Application

```bash
# Start with PM2
pm2 start src/server.js --name whatsapp-api

# Save PM2 process list
pm2 save

# Enable PM2 startup on boot
pm2 startup
# Run the command it outputs (copy-paste it)
```

**Verify app is running:**
```bash
pm2 status
curl http://localhost:3000/health
```

---

## Part 3: Setup Cloudflare Tunnel (5 minutes)

### Step 6: Install Cloudflared

```bash
# Download cloudflared (for x86_64 Ubuntu)
wget https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb

# Install
dpkg -i cloudflared-linux-amd64.deb

# Verify
cloudflared --version
```

### Step 7: Authenticate with Cloudflare

```bash
cloudflared tunnel login
```

- Opens browser window
- Login to Cloudflare
- Select your domain
- Authorize cloudflared

**Certificate saved to:** `/root/.cloudflared/cert.pem`

### Step 8: Create Tunnel

```bash
cloudflared tunnel create whatsapp-api
```

**Output will show:**
```
Tunnel credentials written to /root/.cloudflared/<TUNNEL-ID>.json
Created tunnel whatsapp-api with id <TUNNEL-ID>
```

**Note down your TUNNEL-ID!**

### Step 9: Configure Tunnel

**Create config file:**
```bash
mkdir -p ~/.cloudflared
nano ~/.cloudflared/config.yml
```

**Paste this (replace YOUR-TUNNEL-ID and yourdomain.com):**
```yaml
tunnel: YOUR-TUNNEL-ID
credentials-file: /root/.cloudflared/YOUR-TUNNEL-ID.json

ingress:
  - hostname: api.yourdomain.com
    service: http://localhost:3000
  - service: http_status:404
```

**Example:**
```yaml
tunnel: a1b2c3d4-e5f6-7890-abcd-ef1234567890
credentials-file: /root/.cloudflared/a1b2c3d4-e5f6-7890-abcd-ef1234567890.json

ingress:
  - hostname: api.example.com
    service: http://localhost:3000
  - service: http_status:404
```

### Step 10: Create DNS Record

```bash
cloudflared tunnel route dns whatsapp-api api.yourdomain.com
```

**This automatically creates CNAME record in Cloudflare DNS pointing to your tunnel.**

### Step 11: Run Tunnel as Service

```bash
# Install as system service
cloudflared service install

# Enable auto-start
systemctl enable cloudflared

# Start tunnel
systemctl start cloudflared

# Check status
systemctl status cloudflared
```

**You should see:** `Active: active (running)`

---

## Part 4: Finalize Setup (2 minutes)

### Step 12: Update CORS Setting

**Edit .env:**
```bash
nano /opt/whatsapp-api/.env
```

**Update CORS_ORIGIN with your actual domain:**
```env
CORS_ORIGIN=https://api.yourdomain.com
```

**Restart app:**
```bash
pm2 restart whatsapp-api
```

### Step 13: Test Deployment

**Visit your domain:**
```
https://api.yourdomain.com
```

You should see the login page! 🎉

**Test health endpoint:**
```
https://api.yourdomain.com/health
```

---

## Security Hardening

### Configure Firewall (UFW)

```bash
# Install UFW
apt install -y ufw

# Allow SSH (important!)
ufw allow 22/tcp

# Block external access to app (Cloudflare handles all traffic)
ufw allow from 127.0.0.1 to any port 3000

# Enable firewall
ufw enable

# Check status
ufw status
```

### Install Fail2ban (SSH Protection)

```bash
apt install -y fail2ban
systemctl enable fail2ban
systemctl start fail2ban
```

---

## Automatic Backups

### Create Backup Script

```bash
nano /opt/whatsapp-api/backup.sh
```

**Paste:**
```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/opt/whatsapp-api/backups"
DB_PATH="/opt/whatsapp-api/data/whatsapp.db"

# Create backup
mkdir -p $BACKUP_DIR
cp $DB_PATH $BACKUP_DIR/whatsapp_$DATE.db

# Keep only last 7 backups
cd $BACKUP_DIR
ls -t | tail -n +8 | xargs rm -f

echo "Backup completed: whatsapp_$DATE.db"
```

**Make executable:**
```bash
chmod +x /opt/whatsapp-api/backup.sh
```

### Schedule Daily Backups

```bash
crontab -e
```

**Add this line (daily at 2 AM):**
```
0 2 * * * /opt/whatsapp-api/backup.sh >> /opt/whatsapp-api/logs/backup.log 2>&1
```

---

## Monitoring & Logs

### PM2 Log Rotation

```bash
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
```

### View Logs

**Application logs:**
```bash
pm2 logs whatsapp-api
pm2 logs whatsapp-api --lines 100
```

**Cloudflare tunnel logs:**
```bash
journalctl -u cloudflared -f
journalctl -u cloudflared -n 50
```

---

## Maintenance Commands

### Application Updates

```bash
# Go to app directory
cd /opt/whatsapp-api

# Pull latest code
git pull

# Install dependencies
npm install --production

# Restart app
pm2 restart whatsapp-api
```

### Application Management

```bash
# Restart app
pm2 restart whatsapp-api

# Stop app
pm2 stop whatsapp-api

# View status
pm2 status

# View logs
pm2 logs whatsapp-api

# Monitor resources
pm2 monit
```

### Cloudflare Tunnel

```bash
# Check status
systemctl status cloudflared

# Restart tunnel
systemctl restart cloudflared

# View logs
journalctl -u cloudflared -n 100
```

---

## Troubleshooting

### App Not Accessible

**1. Check app is running:**
```bash
pm2 status
curl http://localhost:3000/health
```

**2. Check Cloudflare tunnel:**
```bash
systemctl status cloudflared
journalctl -u cloudflared -n 50
```

**3. Check DNS:**
```bash
dig api.yourdomain.com
# Should show CNAME to tunnel
```

### Tunnel Not Working

**Check config file:**
```bash
cat ~/.cloudflared/config.yml
```

**Verify tunnel ID matches credentials file:**
```bash
ls ~/.cloudflared/
# Should see: cert.pem, config.yml, <TUNNEL-ID>.json
```

**Restart tunnel:**
```bash
systemctl restart cloudflared
systemctl status cloudflared
```

---

## Cost Breakdown

| Item | Cost |
|------|------|
| Proxmox Server | Your existing hardware |
| Ubuntu Container | Free |
| Cloudflare Tunnel | Free |
| SSL Certificate | Free |
| **Total** | **$0/month** |

---

**Your app is now production-ready at:** `https://api.yourdomain.com` 🚀
