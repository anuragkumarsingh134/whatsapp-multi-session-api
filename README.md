# WhatsApp Multi-Session API

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![Node](https://img.shields.io/badge/node-%3E%3D14.0.0-green)
![License](https://img.shields.io/badge/license-MIT-green)

Production-ready WhatsApp API with multi-session support, built with Node.js and Baileys.

## ✨ Features

- 🔄 **Multi-Session** - Manage unlimited WhatsApp connections
- 🔐 **Bearer Auth** - Secure API key authentication per session
- 💾 **SQLite** - Persistent storage for sessions and auth state
- 🎨 **Web Dashboard** - Easy session management interface
- 📱 **QR Auth** - Real-time QR code for device linking
- 📨 **REST API** - Complete CRUD operations
- 🔄 **Auto-Reconnect** - Automatic session recovery

## 🚀 Quick Start

### Local Development

```bash
# Clone repository
git clone https://github.com/anuragkumarsingh134/whatsapp-multi-session-api.git
cd whatsapp-multi-session-api

# Install dependencies
npm install

# Start server
npm start
```

Open `http://localhost:3000` in your browser.

### Docker

```bash
docker-compose up -d
```

## 📖 Usage

### 1. Create Session

Open dashboard → Click "Create New Session" → Enter Device ID → Scan QR code

### 2. Get API Key

Once connected → Click "Set/Update API Key" → Save the generated key

### 3. Send Message

**Using POST:**
```bash
curl -X POST http://localhost:3000/api/messages/send \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "deviceId": "device-001",
    "number": "1234567890",
    "message": "Hello from API!"
  }'
```

**Using GET (easier for browser/URL):**
```
http://localhost:3000/api/messages/send?deviceId=device-001&number=1234567890&message=Hello&apiKey=YOUR_API_KEY
```

## 🔌 API Reference

### Base URL
```
http://localhost:3000/api
```

### Session Management

#### 1. List All Sessions
```bash
GET /api/sessions
```

**Example:**
```
http://localhost:3000/api/sessions
```

**Response:**
```json
{
  "success": true,
  "sessions": [
    {
      "deviceId": "device-001",
      "connectionState": "connected",
      "hasApiKey": true,
      "phoneNumber": "1234567890",
      "isActive": true
    }
  ]
}
```

---

#### 2. Create New Session
```bash
POST /api/sessions
Content-Type: application/json

{
  "deviceId": "my-device"
}
```

**Example with cURL:**
```bash
curl -X POST http://localhost:3000/api/sessions \
  -H "Content-Type: application/json" \
  -d '{"deviceId":"my-device"}'
```

**Response:**
```json
{
  "success": true,
  "message": "Session created",
  "deviceId": "my-device"
}
```

---

#### 3. Get Session Details
```bash
GET /api/sessions/:deviceId
```

**Example:**
```
http://localhost:3000/api/sessions/my-device
```

**Response:**
```json
{
  "success": true,
  "session": {
    "deviceId": "my-device",
    "connectionState": "connected",
    "hasApiKey": true,
    "apiKeyMasked": "a1b2c3d4...",
    "phoneNumber": "1234567890"
  }
}
```

---

#### 4. Get QR Code
```bash
GET /api/sessions/:deviceId/qr
```

**Example:**
```
http://localhost:3000/api/sessions/my-device/qr
```

**Response:**
```json
{
  "success": true,
  "qrCode": "2@...",
  "qrImage": "data:image/png;base64,..."
}
```

---

#### 5. Set/Update API Key
```bash
PUT /api/sessions/:deviceId/api-key
Content-Type: application/json

{
  "apiKey": "optional-custom-key"
}
```

**Example with cURL (auto-generate key):**
```bash
curl -X PUT http://localhost:3000/api/sessions/my-device/api-key \
  -H "Content-Type: application/json" \
  -d '{}'
```

**Response:**
```json
{
  "success": true,
  "message": "API key updated",
  "apiKey": "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6"
}
```

---

#### 6. Delete Session
```bash
DELETE /api/sessions/:deviceId
```

**Example with cURL:**
```bash
curl -X DELETE http://localhost:3000/api/sessions/my-device
```

**Response:**
```json
{
  "success": true,
  "message": "Session deleted"
}
```

---

### Messaging

#### Send Message (POST)
```bash
POST /api/messages/send
Authorization: Bearer YOUR_API_KEY
Content-Type: application/json

{
  "deviceId": "my-device",
  "number": "1234567890",
  "message": "Hello World"
}
```

**Example with cURL:**
```bash
curl -X POST http://localhost:3000/api/messages/send \
  -H "Authorization: Bearer a1b2c3d4e5f6g7h8" \
  -H "Content-Type: application/json" \
  -d '{
    "deviceId": "my-device",
    "number": "1234567890",
    "message": "Hello from API!"
  }'
```

**Response:**
```json
{
  "success": true,
  "status": "sent",
  "to": "1234567890@s.whatsapp.net",
  "message": "Hello from API!"
}
```

---

#### Send Message (GET)
```bash
GET /api/messages/send?deviceId=DEVICE&number=NUMBER&message=TEXT&apiKey=KEY
```

**Example (paste in browser):**
```
http://localhost:3000/api/messages/send?deviceId=my-device&number=1234567890&message=Hello%20World&apiKey=a1b2c3d4e5f6g7h8
```

**Example with cURL:**
```bash
curl "http://localhost:3000/api/messages/send?deviceId=my-device&number=1234567890&message=Hello&apiKey=a1b2c3d4e5f6g7h8"
```

**Response:**
```json
{
  "success": true,
  "status": "sent",
  "to": "1234567890@s.whatsapp.net",
  "message": "Hello"
}
```

---

## 📋 Quick API Endpoints Summary

| Method | Endpoint | Auth Required | Description |
|--------|----------|---------------|-------------|
| `GET` | `/api/sessions` | ❌ | List all sessions |
| `POST` | `/api/sessions` | ❌ | Create new session |
| `GET` | `/api/sessions/:deviceId` | ❌ | Get session details |
| `GET` | `/api/sessions/:deviceId/qr` | ❌ | Get QR code |
| `PUT` | `/api/sessions/:deviceId/api-key` | ❌ | Set/update API key |
| `DELETE` | `/api/sessions/:deviceId` | ❌ | Delete session |
| `POST` | `/api/messages/send` | ✅ Bearer | Send message (JSON) |
| `GET` | `/api/messages/send` | ✅ Query/Header | Send message (URL) |

## 📚 Documentation

- **[Deployment Guide](DEPLOYMENT.md)** - VPS and Docker deployment instructions
- **[Changelog](CHANGELOG.md)** - Version history and features

## 🔧 Configuration

Optional `.env` file:

```env
PORT=3000
NODE_ENV=production
```

## 📦 Tech Stack

- **Backend**: Node.js + Express
- **Database**: SQLite (better-sqlite3)
- **WhatsApp**: Baileys
- **Frontend**: Vanilla HTML/CSS/JS

## 🛠️ Development

```bash
# Install dependencies
npm install

# Start development server
npm start

# View logs (if using PM2)
pm2 logs whatsapp-api
```

## 🐳 Docker Deployment

```bash
# Build and run
docker build -t whatsapp-api .
docker run -d -p 3000:3000 --name whatsapp-api whatsapp-api

# Or use docker-compose
docker-compose up -d
```

## 📝 Example Code

### JavaScript/Node.js

```javascript
const axios = require('axios');

const API_URL = 'http://localhost:3000/api';
const API_KEY = 'your-api-key';

async function sendMessage(deviceId, phone, message) {
  const response = await axios.post(`${API_URL}/messages/send`, {
    deviceId,
    number: phone,
    message
  }, {
    headers: { 'Authorization': `Bearer ${API_KEY}` }
  });
  return response.data;
}

sendMessage('device-001', '1234567890', 'Hello!');
```

### Python

```python
import requests

API_URL = 'http://localhost:3000/api'
API_KEY = 'your-api-key'

def send_message(device_id, phone, message):
    response = requests.post(f'{API_URL}/messages/send',
        json={'deviceId': device_id, 'number': phone, 'message': message},
        headers={'Authorization': f'Bearer {API_KEY}'})
    return response.json()

send_message('device-001', '1234567890', 'Hello!')
```

## 🔒 Security

- Use HTTPS in production
- Keep API keys secure
- Regularly rotate API keys
- Use environment variables for sensitive data
- Implement rate limiting for production

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

MIT License - see [LICENSE](LICENSE) for details

## 🙏 Acknowledgments

Built with [Baileys](https://github.com/WhiskeySockets/Baileys) - WhatsApp Web API

---

**Made with ❤️ by [Anurag Kumar Singh](https://github.com/anuragkumarsingh134)**