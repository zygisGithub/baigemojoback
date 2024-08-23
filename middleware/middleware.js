const jwt = require('jsonwebtoken');
require('dotenv').config();

const middleware = {
    loginAuth: (req, res, next) => {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ message: 'Username and password are required' });
        }

        next()
    },
    userAuth: (req, res, next) => {
        const token = req.headers.authorization?.split(' ')[1]

        if (!token) {
            return res.status(401).json({ message: 'No token provided' })
        }

        jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
            if (err) {
                return res.status(403).json({ message: 'Failed to authenticate token' })
            }
            req.user = decoded
            next()
        })
    },
};

module.exports = middleware;
