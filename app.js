const express = require('express');
const http = require('http');
const cors = require('cors');
const mongoose = require('mongoose');
const router = require('./routes/userRoutes');
const { initializeSocket } = require('./sockets/sockets');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = initializeSocket(server);

// CORS configuration
const corsOptions = {
    origin: '*', // Change this to a specific origin in production for security
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization'],
};

// Use CORS middleware
app.use(cors(corsOptions));

// Handle preflight requests
app.options('*', cors(corsOptions));

// Middleware to parse JSON
app.use(express.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
    .then(() => console.log('MongoDB connected successfully'))
    .catch((err) => console.log('MongoDB connection error:', err));

// Middleware to attach socket.io instance
app.use((req, res, next) => {
    req.io = io;
    next();
});

// Use API routes
app.use('/api/users', router);

// Logging incoming requests
app.use('/api/users', (req, res, next) => {
    console.log(`Incoming request to /api/users: ${req.method} ${req.url}`);
    next();
});

// Start server
const PORT = process.env.PORT || 443;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
});
