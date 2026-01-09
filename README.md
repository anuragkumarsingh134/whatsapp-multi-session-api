# WhatsApp API - Multi-Session Management

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![Node](https://img.shields.io/badge/node-%3E%3D14.0.0-green)
![License](https://img.shields.io/badge/license-MIT-green)

A comprehensive Node.js WhatsApp API service using `@whiskeysockets/baileys` with multi-session support, SQLite database, and Bearer token authentication.

## 🚀 Quick Feature Summary

- 🔄 **Multi-Session**: Manage unlimited WhatsApp connections simultaneously
- 🔐 **Secure Auth**: Bearer token-based API authentication per session
- 💾 **SQLite Storage**: Persistent sessions and auth state
- 🎨 **Web Dashboard**: User-friendly session management interface
- 📱 **QR Authentication**: Real-time QR code display for linking
- 🔑 **API Keys**: Auto-generated or custom API keys per session
- 📨 **REST API**: Complete endpoints for session and message management
- 🔄 **Auto-Reconnect**: Automatic session recovery on disconnection

## Features

- 🔄 **Multi-Session Support**: Manage multiple WhatsApp connections simultaneously
- 🔐 **Secure Authentication**: Bearer token-based API authentication
- 💾 **Persistent Storage**: SQLite database for sessions and auth state
- 🎨 **Web Dashboard**: User-friendly interface for session management
- 📱 **QR Authentication**: Real-time QR code display for WhatsApp linking
- 🔑 **API Key Management**: Generate and manage API keys per session
- 📨 **Message Sending**: REST API for sending WhatsApp messages

## Installation

### Prerequisites
- Node.js v14 or higher
- npm or yarn

### Setup

1. **Clone or navigate to the project directory**
   ```bash
   cd WA-API
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the server**
   ```bash
   npm start
   ```

4. **Access the dashboard**
   Open your browser and go to: `http://localhost:3000`

## Environment Variables

Create a `.env` file (optional):

```env
PORT=3000
```

## Usage Guide

### 1. Dashboard Access

Navigate to `http://localhost:3000` to access the main dashboard.

### 2. Creating a Session

1. Click **"Create New Session"**
2. Enter a unique **Device ID** (e.g., `device-001`, `my-whatsapp`, etc.)
3. Click **"Create"**
4. You'll be redirected to the session detail page

### 3. QR Authentication

1. On the session detail page, a QR code will be displayed
2. Open WhatsApp on your phone
3. Go to **Settings → Linked Devices → Link a Device**
4. Scan the QR code
5. Once connected, the status will change to **"CONNECTED"**

### 4. Setting API Key

1. After connection, the **"API Key Management"** section appears
2. Click **"Set/Update API Key"**
3. Either:
   - Leave empty to auto-generate a secure key
   - Enter your custom API key
4. Click **"Save API Key"**
5. **IMPORTANT**: Copy and save the API key - it won't be shown again!

### 5. Sending Messages via Dashboard

1. In the **"Send Test Message"** section
2. Enter the phone number (with country code, e.g., `1234567890`)
3. Enter your message
4. Click **"Send Message"**
5. Enter your API key when prompted

## API Documentation

### Base URL
```
http://localhost:3000/api
```

### Authentication

All message sending requests require Bearer token authentication:

```
Authorization: Bearer <your-api-key>
```

---

### Session Management

#### List All Sessions
```http
GET /api/sessions
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
      "createdAt": "2026-01-09T10:00:00.000Z",
      "isActive": true
    }
  ]
}
```

---

#### Create New Session
```http
POST /api/sessions
Content-Type: application/json

{
  "deviceId": "device-001"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Session created",
  "deviceId": "device-001"
}
```

---

#### Get Session Details
```http
GET /api/sessions/:deviceId
```

**Response:**
```json
{
  "success": true,
  "session": {
    "deviceId": "device-001",
    "connectionState": "connected",
    "hasApiKey": true,
    "apiKeyMasked": "a1b2c3d4...",
    "phoneNumber": "1234567890",
    "createdAt": "2026-01-09T10:00:00.000Z"
  }
}
```

---

#### Get QR Code
```http
GET /api/sessions/:deviceId/qr
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

#### Set/Update API Key
```http
PUT /api/sessions/:deviceId/api-key
Content-Type: application/json

{
  "apiKey": "optional-custom-key"
}
```

**Response:**
```json
{
  "success": true,
  "message": "API key updated",
  "apiKey": "a1b2c3d4e5f6g7h8..."
}
```

**Note**: If `apiKey` is not provided, a secure random key will be generated.

---

#### Delete Session
```http
DELETE /api/sessions/:deviceId
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

#### Send Message
```http
POST /api/messages/send
Authorization: Bearer <your-api-key>
Content-Type: application/json

{
  "deviceId": "device-001",
  "number": "1234567890",
  "message": "Hello from WhatsApp API!"
}
```

**Response:**
```json
{
  "success": true,
  "status": "sent",
  "to": "1234567890@s.whatsapp.net",
  "message": "Hello from WhatsApp API!"
}
```

**Error Response:**
```json
{
  "success": false,
  "error": "Session not connected"
}
```

---

## API Usage Examples

### cURL

```bash
# Create a session
curl -X POST http://localhost:3000/api/sessions \
  -H "Content-Type: application/json" \
  -d '{"deviceId":"my-device"}'

# Get QR code
curl http://localhost:3000/api/sessions/my-device/qr

# Set API key
curl -X PUT http://localhost:3000/api/sessions/my-device/api-key \
  -H "Content-Type: application/json" \
  -d '{}'

# Send message
curl -X POST http://localhost:3000/api/messages/send \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "deviceId": "my-device",
    "number": "1234567890",
    "message": "Hello World"
  }'
```

### JavaScript (Node.js)

```javascript
const axios = require('axios');

const API_BASE = 'http://localhost:3000/api';
const API_KEY = 'your-api-key-here';
const DEVICE_ID = 'my-device';

// Send a message
async function sendMessage(phone, message) {
  try {
    const response = await axios.post(`${API_BASE}/messages/send`, {
      deviceId: DEVICE_ID,
      number: phone,
      message: message
    }, {
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Message sent:', response.data);
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

sendMessage('1234567890', 'Hello from Node.js!');
```

### Python

```python
import requests

API_BASE = 'http://localhost:3000/api'
API_KEY = 'your-api-key-here'
DEVICE_ID = 'my-device'

def send_message(phone, message):
    headers = {
        'Authorization': f'Bearer {API_KEY}',
        'Content-Type': 'application/json'
    }
    
    data = {
        'deviceId': DEVICE_ID,
        'number': phone,
        'message': message
    }
    
    response = requests.post(f'{API_BASE}/messages/send', 
                           json=data, 
                           headers=headers)
    
    print(response.json())

send_message('1234567890', 'Hello from Python!')
```

## Database Schema

### Sessions Table
```sql
CREATE TABLE sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    device_id TEXT UNIQUE NOT NULL,
    connection_state TEXT DEFAULT 'disconnected',
    api_key TEXT,
    phone_number TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### Auth State Table
```sql
CREATE TABLE auth_state (
    device_id TEXT NOT NULL,
    key_name TEXT NOT NULL,
    key_value TEXT NOT NULL,
    PRIMARY KEY (device_id, key_name),
    FOREIGN KEY (device_id) REFERENCES sessions(device_id) ON DELETE CASCADE
);
```

## Security Considerations

1. **API Key Storage**: Store API keys securely. Never commit them to version control.
2. **HTTPS**: Use HTTPS in production to encrypt API key transmission.
3. **Rate Limiting**: Implement rate limiting to prevent abuse.
4. **API Key Rotation**: Regularly rotate API keys for enhanced security.
5. **Access Control**: Restrict access to the dashboard and API endpoints.

## Troubleshooting

### QR Code Not Showing
- Ensure the session is in `waiting_qr` state
- Refresh the page
- Check server logs for errors

### Message Not Sending
- Verify the session is `connected`
- Check that the API key is correct
- Ensure the phone number format is correct (country code + number)
- Check server logs for detailed errors

### Session Disconnected
- WhatsApp may disconnect sessions after inactivity
- Simply scan the QR code again to reconnect
- Session data is preserved in the database

### Database Issues
- Delete `whatsapp.db` and restart to reset
- Backup the database regularly

## Project Structure

```
WA-API/
├── src/
│   ├── db/
│   │   ├── database.js       # Database schema and helpers
│   │   └── authState.js      # Baileys auth state handler
│   ├── middleware/
│   │   └── bearerAuth.js     # Bearer token authentication
│   ├── routes/
│   │   ├── sessions.js       # Session management routes
│   │   └── messages.js       # Message sending routes
│   ├── services/
│   │   └── sessionManager.js # WhatsApp session manager
│   └── server.js             # Express server
├── public/
│   ├── index.html            # Dashboard
│   └── session.html          # Session detail page
├── whatsapp.db               # SQLite database
├── package.json
└── README.md
```

## Contributing

Contributions are welcome! Please follow these guidelines:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License - feel free to use this project for personal or commercial purposes.

## Support

For issues, questions, or feature requests, please open an issue on GitHub.

---

**Built with ❤️ using Node.js, Express, and Baileys**
