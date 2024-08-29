const express = require('express');
const http = require('http');
const cors = require('cors');
const mongoose = require('mongoose');
const router = require('./routes/userRoutes');
const { initializeSocket } = require('./sockets/sockets'); // Import the socket initialization
require('dotenv').config();

const app = express();
const server = http.createServer(app);

// Initialize Socket.io
const io = initializeSocket(server); // Pass the server to the socket initialization function

app.use(cors());
app.use(express.json());

// MongoDB connection
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
    .then(() => console.log('MongoDB connected successfully'))
    .catch((err) => console.log('MongoDB connection error:', err));

// Middleware to attach io to req
app.use((req, res, next) => {
    req.io = io;
    next();
});

// Use the routes
app.use('/api/users', router);

// Add logging for route requests
app.use('/api/users', (req, res, next) => {
    console.log(`Incoming request to /api/users: ${req.method} ${req.url}`);
    next();
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
