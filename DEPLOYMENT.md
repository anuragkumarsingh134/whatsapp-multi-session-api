# Deployment Guide

Complete guide for deploying WhatsApp Multi-Session API on VPS or containers.

## Table of Contents
- [System Requirements](#system-requirements)
- [VPS Deployment (Ubuntu/Debian)](#vps-deployment-ubuntudebian)
- [Docker Deployment](#docker-deployment)
- [Production Considerations](#production-considerations)
- [Troubleshooting](#troubleshooting)

---

## System Requirements

### Minimum Requirements
- **OS**: Ubuntu 20.04+ / Debian 11+ / CentOS 8+ / Docker
- **CPU**: 1 vCPU (2+ recommended for multiple sessions)
- **RAM**: 512MB (1GB+ recommended)
- **Storage**: 1GB free space
- **Node.js**: v14.0.0 or higher
- **npm**: v6.0.0 or higher

### Network Requirements
- Open port: `3000` (or your configured PORT)
- Outbound HTTPS access for WhatsApp servers
- (Optional) Domain name for HTTPS/SSL

---

## VPS Deployment (Ubuntu/Debian)

### Step 1: Update System
```bash
sudo apt update && sudo apt upgrade -y
```

### Step 2: Install Node.js
```bash
# Install Node.js 18.x (LTS)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Verify installation
node -v  # Should show v18.x.x
npm -v   # Should show v9.x.x
```

### Step 3: Install Build Tools
```bash
# Required for better-sqlite3 compilation
sudo apt install -y build-essential python3
```

### Step 4: Clone Repository
```bash
# Navigate to your preferred directory
cd /opt

# Clone the repository
git clone https://github.com/YOUR_USERNAME/whatsapp-multi-session-api.git
cd whatsapp-multi-session-api
```

### Step 5: Install Dependencies
```bash
npm install
```

### Step 6: Configure Environment (Optional)
```bash
# Create .env file
nano .env
```

Add:
```env
PORT=3000
NODE_ENV=production
```

### Step 7: Test Run
```bash
npm start
```

Visit `http://YOUR_SERVER_IP:3000` to verify it's working.

### Step 8: Setup Process Manager (PM2)

```bash
# Install PM2 globally
sudo npm install -g pm2

# Start application with PM2
pm2 start src/server.js --name whatsapp-api

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
# Follow the command output instructions

# View logs
pm2 logs whatsapp-api

# Other useful PM2 commands
pm2 status              # Check status
pm2 restart whatsapp-api  # Restart
pm2 stop whatsapp-api     # Stop
pm2 delete whatsapp-api   # Remove
```

### Step 9: Setup Firewall
```bash
# Allow port 3000
sudo ufw allow 3000/tcp

# Enable firewall
sudo ufw enable
```

### Step 10: (Optional) Setup Nginx Reverse Proxy

```bash
# Install Nginx
sudo apt install -y nginx

# Create Nginx configuration
sudo nano /etc/nginx/sites-available/whatsapp-api
```

Add:
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/whatsapp-api /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

### Step 11: (Optional) Setup SSL with Let's Encrypt

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Obtain SSL certificate
sudo certbot --nginx -d your-domain.com

# Auto-renewal is configured automatically
```

---

## Docker Deployment

### Step 1: Create Dockerfile

Create `Dockerfile` in project root:

```dockerfile
FROM node:18-alpine

# Install build dependencies for better-sqlite3
RUN apk add --no-cache python3 make g++

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application files
COPY . .

# Expose port
EXPOSE 3000

# Start application
CMD ["npm", "start"]
```

### Step 2: Create Docker Compose (Optional)

Create `docker-compose.yml`:

```yaml
version: '3.8'

services:
  whatsapp-api:
    build: .
    container_name: whatsapp-api
    restart: unless-stopped
    ports:
      - "3000:3000"
    volumes:
      - ./whatsapp.db:/app/whatsapp.db
    environment:
      - NODE_ENV=production
      - PORT=3000
```

### Step 3: Build and Run

**Using Docker:**
```bash
# Build image
docker build -t whatsapp-api .

# Run container
docker run -d \
  --name whatsapp-api \
  -p 3000:3000 \
  -v $(pwd)/whatsapp.db:/app/whatsapp.db \
  --restart unless-stopped \
  whatsapp-api
```

**Using Docker Compose:**
```bash
# Start services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Step 4: Docker Management Commands

```bash
# View logs
docker logs -f whatsapp-api

# Restart container
docker restart whatsapp-api

# Stop container
docker stop whatsapp-api

# Remove container
docker rm whatsapp-api

# Access container shell
docker exec -it whatsapp-api sh
```

---

## Production Considerations

### 1. Database Backup

```bash
# Create backup script
nano /opt/backup-whatsapp-db.sh
```

Add:
```bash
#!/bin/bash
BACKUP_DIR="/opt/backups"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR
cp /opt/whatsapp-multi-session-api/whatsapp.db $BACKUP_DIR/whatsapp_$DATE.db
# Keep only last 7 days
find $BACKUP_DIR -name "whatsapp_*.db" -mtime +7 -delete
```

```bash
# Make executable
chmod +x /opt/backup-whatsapp-db.sh

# Add to crontab (daily at 2 AM)
crontab -e
# Add: 0 2 * * * /opt/backup-whatsapp-db.sh
```

### 2. Security Best Practices

```bash
# Create dedicated user
sudo useradd -r -s /bin/false whatsapp

# Set ownership
sudo chown -R whatsapp:whatsapp /opt/whatsapp-multi-session-api

# Run with PM2 as whatsapp user
pm2 start src/server.js --name whatsapp-api --user whatsapp
```

### 3. Environment Variables

Never commit `.env` to git. Use environment variables for:
- `PORT` - Server port (default: 3000)
- `NODE_ENV` - Environment (production/development)

### 4. Rate Limiting

Consider adding rate limiting middleware:
```bash
npm install express-rate-limit
```

### 5. Monitoring

```bash
# Monitor with PM2
pm2 monit

# Or install monitoring tools
pm2 install pm2-logrotate
```

---

## Troubleshooting

### Issue: Port Already in Use

```bash
# Find process using port 3000
sudo lsof -i :3000

# Kill process
sudo kill -9 <PID>
```

### Issue: SQLite Compilation Errors

```bash
# Rebuild better-sqlite3
npm rebuild better-sqlite3
```

### Issue: Permission Denied

```bash
# Fix permissions
sudo chown -R $USER:$USER /opt/whatsapp-multi-session-api
```

### Issue: WhatsApp Connection Fails

- Check firewall allows outbound HTTPS
- Verify system time is correct: `date`
- Check logs: `pm2 logs whatsapp-api`

### Issue: Database Locked

```bash
# Stop all instances
pm2 stop whatsapp-api

# Remove lock files
rm whatsapp.db-shm whatsapp.db-wal

# Restart
pm2 start whatsapp-api
```

---

## Quick Start Commands Summary

### VPS (Ubuntu/Debian)
```bash
# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs build-essential python3

# Clone and setup
git clone https://github.com/YOUR_USERNAME/whatsapp-multi-session-api.git
cd whatsapp-multi-session-api
npm install

# Install PM2 and start
sudo npm install -g pm2
pm2 start src/server.js --name whatsapp-api
pm2 save
pm2 startup
```

### Docker
```bash
# Clone repository
git clone https://github.com/YOUR_USERNAME/whatsapp-multi-session-api.git
cd whatsapp-multi-session-api

# Build and run
docker build -t whatsapp-api .
docker run -d --name whatsapp-api -p 3000:3000 -v $(pwd)/whatsapp.db:/app/whatsapp.db --restart unless-stopped whatsapp-api
```

---

## Support

For issues and questions:
- Check logs: `pm2 logs whatsapp-api` or `docker logs whatsapp-api`
- Review [README.md](README.md) for API documentation
- Open an issue on GitHub

---

**Last Updated**: January 9, 2026
