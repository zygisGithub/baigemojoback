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

const corsOptions = {
    origin: 'https://helsword.org:3000',
    preflightContinue: false,
    optionsSuccessStatus: 204
};

app.use(cors(corsOptions));
app.use(express.json());

mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
    .then(() => console.log('MongoDB connected successfully'))
    .catch((err) => console.log('MongoDB connection error:', err));

app.use((req, res, next) => {
    req.io = io;
    next();
});

app.use('/api/users', router);

app.use('/api/users', (req, res, next) => {
    console.log(`Incoming request to /api/users: ${req.method} ${req.url}`);
    next();
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
});
