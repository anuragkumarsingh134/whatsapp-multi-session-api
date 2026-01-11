# WhatsApp Multi-Session API

![Version](https://img.shields.io/badge/version-1.6.3-blue)
![Node](https://img.shields.io/badge/node-%3E%3D14.0.0-green)
![License](https://img.shields.io/badge/license-MIT-green)

A production-ready WhatsApp API with multi-session support, built with Node.js and Baileys. Manage multiple WhatsApp numbers, send messages/files, and control sessions via a modern web interface or REST API.

## ✨ Features

- **🔄 Multi-Session**: Manage specific, isolated WhatsApp sessions for different numbers.
- **🖥️ Modern Dashboard**: Clean, two-column UI to manage connections, view status, and test APIs.
- **📄 Send Files/PDFs**: Native support for sending documents via URL (POST & GET).
- **📝 REST API**: Full programmatic control for messages, sessions, and groups.
- **🔐 Secure**: Bearer Token (API Key) authentication for all endpoints.
- **📱 QR Authentication**: Real-time, auto-refreshing QR codes for easy linking.

## 🚀 Quick Start

### Local Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/anuragkumarsingh134/whatsapp-multi-session-api.git
   cd whatsapp-multi-session-api
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the server**
   ```bash
   npm start
   ```
   Access the dashboard at `http://localhost:3000`.

### Docker Setup

```bash
docker-compose up -d
```

## 📖 Usage Guide

### 1. Connect a Device
- Go to `http://localhost:3000`.
- Click **"Create New Session"**.
- Enter a unique **Device ID** (e.g., `marketing-phone`).
- Scan the QR code with WhatsApp (Linked Devices).

### 2. Get Your API Key
- On the session detail page (`/sessions/marketing-phone`), look for the **API Key Management** card.
- Click **"Set/Update API Key"** to generate a secure 32-char key.
- Save this key! You'll need it for all API requests.

### 3. Send a Message

**Method A: Simple GET Request (Browser/Zapier)**
```
http://localhost:3000/api/messages/send?deviceId=marketing-phone&number=1234567890&message=Hello&apiKey=YOUR_KEY
```

**Method B: POST Request (Code/cURL)**
```bash
curl -X POST http://localhost:3000/api/messages/send \
  -H "Authorization: Bearer YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "deviceId": "marketing-phone",
    "number": "1234567890",
    "message": "Hello from API!"
  }'
```

### 4. Send a PDF/File

**GET Request:**
```
http://localhost:3000/api/messages/send-file?deviceId=marketing-phone&number=1234567890&type=document&url=https://example.com/invoice.pdf&caption=Here%20is%20your%20invoice&apiKey=YOUR_KEY
```

**POST Request:**
```json
POST /api/messages/send
{
  "deviceId": "marketing-phone",
  "number": "1234567890",
  "type": "document",
  "url": "https://example.com/invoice.pdf",
  "caption": "Your Invoice"
}
```

## 🔌 API Reference
> Full documentation available at `http://localhost:3000/docs`

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/sessions` | List all active sessions |
| `POST` | `/api/sessions` | Create/Start a new session |
| `DELETE` | `/api/sessions/:id` | Logout and delete session |
| `GET` | `/api/sessions/:id/qr` | Get raw QR code data |
| `POST` | `/api/messages/send` | Send text or media (JSON) |
| `GET` | `/api/messages/send` | Send text (Query Param) |
| `GET` | `/api/messages/send-file` | Send file (Query Param) |

## 🔄 How to Update

To update your installation to the latest version:

### Standard/PM2
```bash
# 1. Stop the service
pm2 stop whatsapp-api

# 2. Get latest code
git pull origin main

# 3. Update dependencies
npm install

# 4. Restart
pm2 restart whatsapp-api
```

### Docker
```bash
# 1. Get latest code
git pull origin main

# 2. Rebuild and restart
docker-compose up -d --build
```

## 🔧 Deployment
See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed VPS and production configuration.

---
**Made with ❤️ by [Anurag Kumar Singh](https://github.com/anuragkumarsingh134)**