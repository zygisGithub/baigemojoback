const jwt = require('jsonwebtoken');
require('dotenv').config();

const middleware = {
    loginAuth: (req, res, next) => {
        const token = req.headers.authorization?.split(' ')[1]; // Extract token from Authorization header

        if (!token) {
            return res.status(401).json({ message: 'No token provided' });
        }

        jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
            if (err) {
                return res.status(403).json({ message: 'Failed to authenticate token' });
            }
            req.user = decoded; // Save decoded token data to req.user
            next();
        });
    },
};

module.exports = middleware;
