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

## 🔌 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/sessions` | List all sessions |
| `POST` | `/api/sessions` | Create new session |
| `GET` | `/api/sessions/:deviceId` | Get session details |
| `GET` | `/api/sessions/:deviceId/qr` | Get QR code |
| `PUT` | `/api/sessions/:deviceId/api-key` | Set/update API key |
| `DELETE` | `/api/sessions/:deviceId` | Delete session |
| `POST` | `/api/messages/send` | Send message (requires Bearer auth) |

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