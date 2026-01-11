# Deployment Guide

This guide covers deploying the WhatsApp Multi-Session API on a VPS (Ubuntu/Debian) or using Docker.

## 📋 System Requirements
- **OS**: Ubuntu 20.04+ / Debian 11+
- **Resources**: 1 vCPU, 1GB RAM minimum
- **Port**: 3000 (default)

---

## ☁️ Option 1: VPS Deployment (Recommended)

### 1. Initial Setup
```bash
# Update system & install Node.js 18+
sudo apt update && sudo apt upgrade -y
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs build-essential python3

# Clone Repo
git clone https://github.com/anuragkumarsingh134/whatsapp-multi-session-api.git
cd whatsapp-multi-session-api

# Install Dependencies
npm install
```

### 2. Configure Environment (Optional)
Create a `.env` file if you want to change the port or environment:
```bash
echo "PORT=3000" > .env
```

### 3. Start with PM2 (Process Manager)
We use PM2 to keep the app running in the background.

```bash
# Install PM2
sudo npm install -g pm2

# Start the app
pm2 start src/server.js --name whatsapp-api

# Save configuration to start on boot
pm2 save
pm2 startup
```

### 4. Updating the App
To update to a newer version:

```bash
# 1. Stop app
pm2 stop whatsapp-api

# 2. Get updates
git pull origin main
npm install

# 3. Restart
pm2 restart whatsapp-api
```

---

## 🐳 Option 2: Docker Deployment

### 1. Run with Docker Compose
Ensures you have `docker` and `docker-compose` installed.

```bash
# Clone Repo
git clone https://github.com/anuragkumarsingh134/whatsapp-multi-session-api.git
cd whatsapp-multi-session-api

# Start Container
docker-compose up -d
```

### 2. Management Commands
```bash
# View Logs
docker-compose logs -f

# Restart
docker-compose restart

# Stop
docker-compose down
```

### 3. Updating Docker Container
```bash
# 1. Get updates
git pull origin main

# 2. Rebuild and restart
docker-compose up -d --build
```

---

## 🛡️ Production Tips

1.  **Reverse Proxy**: Use Nginx to serve the app on port 80/443 and handle SSL.
    *   Proxy command: `proxy_pass http://localhost:3000;`
2.  **Firewall**: Allow port 3000 (`sudo ufw allow 3000`) only if testing. In production, only allow Nginx (port 80/443).
3.  **Backups**: Periodically back up your `whatsapp.db` file, which stores session data.
