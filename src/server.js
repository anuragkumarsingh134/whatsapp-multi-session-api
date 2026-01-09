const express = require('express');
const cors = require('cors');
const path = require('path');
const sessionRoutes = require('./routes/sessions');
const messageRoutes = require('./routes/messages');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Serve static files (Dashboard)
app.use(express.static('public'));

// API Routes
app.use('/api/sessions', sessionRoutes);
app.use('/api/messages', messageRoutes);

// Session detail page route
app.get('/session/:deviceId', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/session.html'));
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
