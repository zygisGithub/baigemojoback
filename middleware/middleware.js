const jwt = require('jsonwebtoken');
require('dotenv').config();

const middleware = {
    loginAuth: (req, res, next) => {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ message: 'Username and password are required' });
        }

        // Proceed to the next middleware or route handler
        next();
    },
    userAuth: (req, res, next) => {
        const token = req.headers.authorization?.split(' ')[1]; // Extract the token from Authorization header

        if (!token) {
            return res.status(401).json({ message: 'No token provided' });
        }

        jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
            if (err) {
                return res.status(403).json({ message: 'Invalid token' }); // Use generic message for security
            }

            req.user = decoded; // Attach the decoded payload to req.user
            next();
        });
    },
};

module.exports = middleware;
