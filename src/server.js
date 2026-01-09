const express = require('express');
const cors = require('cors');
const path = require('path');
const sessionRoutes = require('./routes/sessions');
const messageRoutes = require('./routes/messages');
const authRoutes = require('./routes/auth');
const { initializeSessions } = require('./services/sessionManager');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Serve static files (Dashboard)
app.use(express.static('public'));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/messages', messageRoutes);

// Auth pages
app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/login.html'));
});

app.get('/signup', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/signup.html'));
});

// Session detail page route
app.get('/session/:deviceId', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/session.html'));
});

// API Documentation page route
app.get('/session/:deviceId/docs', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/docs.html'));
});

app.listen(PORT, async () => {
    console.log(`Server is running on port ${PORT}`);

    // Initialize sessions from database
    console.log('Initializing sessions from database...');
    await initializeSessions();
    console.log('Session initialization complete');
});
