const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const session = require('express-session');
const userRoutes = require('./routes/userRoutes');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());


// MongoDB connection
mongoose.connect('mongodb+srv://admin:zygis1998@backenddb.nyim9vu.mongodb.net/?retryWrites=true&w=majority&appName=backendDB', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(() => console.log('Connected to MongoDB'))
    .catch(err => console.log('Failed to connect to MongoDB', err));

// Routes
app.use('/', userRoutes);

// Start the server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
