const jwt = require('jsonwebtoken');
require('dotenv').config();

const middleware = {
    chatCreateAuth: (req, res, next) => {
        const errors = [];
        const chatName = req.body

        if (chatName.length > 20 || chatName.length < 4) {
            errors.push('Username must be between 4 and 20 characters long');
        }
        if (errors.length > 0) {
            return res.status(400).json({ errors });
        }

        next()
    },
    loginAuth: (req, res, next) => {
        const errors = [];
        const { username, password } = req.body;

        if (!username) {
            errors.push('Username is required');
        }
        if (!password) {
            errors.push('Password is required');
        }

        if (errors.length > 0) {
            return res.status(400).json({ errors });
        }

        next();
    },

    registerAuth: (req, res, next) => {
        const errors = [];
        const { username, password, passwordRepeat } = req.body;
        const hasUppercase = /[A-Z]/.test(password);
        const hasSpecialSymbol = /[!@#$%^&*(),.?":{}|<>]/.test(password);

        if (username.length < 4 || username.length > 20) {
            errors.push('Username must be between 4 and 20 characters long');
        }
        if (password.length < 4 || password.length > 20) {
            errors.push('Password must be between 4 and 20 characters long');
        }
        if (!hasUppercase || !hasSpecialSymbol) {
            errors.push('Password must include at least 1 uppercase letter and 1 special symbol');
        }
        if (password !== passwordRepeat) {
            errors.push('Passwords must match');
        }

        if (errors.length > 0) {
            return res.status(400).json({ errors });
        }

        next();
    },

    userAuth: (req, res, next) => {
        const token = req.headers.authorization?.split(' ')[1];

        if (!token) {
            return res.status(401).json({ errors: ['No token provided'] });
        }

        jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
            if (err) {
                return res.status(403).json({ errors: ['Invalid token'] });
            }

            req.user = decoded;
            next();
        });
    },

    validateUsernameChange: (req, res, next) => {
        const errors = [];
        const { newUsername, oldUsername, oldPassword } = req.body;

        if (!newUsername || !oldPassword) {
            errors.push('All fields are required');
        }
        if (newUsername === oldUsername) {
            errors.push('New username must be different from the old one');
        }
        if (newUsername.length < 4 || newUsername.length > 30) {
            errors.push('Username must be between 4 and 20 characters long');
        }

        if (errors.length > 0) {
            return res.status(400).json({ errors });
        }

        next();
    },

    validatePasswordChange: (req, res, next) => {
        const errors = [];
        const { newPassword, oldPassword } = req.body;
        const hasUppercase = /[A-Z]/.test(newPassword);
        const hasSpecialSymbol = /[!@#$%^&*(),.?":{}|<>]/.test(newPassword);
        if (!newPassword || !oldPassword) {
            errors.push('All fields are required');
        }
        if (newPassword === oldPassword) {
            errors.push('New password cannot be the same as the old password');
        }
        if (newPassword.length < 8 || newPassword.length > 100) {
            errors.push('Password must be between 4 and 20 characters long');
        }
        if (!hasUppercase || !hasSpecialSymbol) {
            errors.push('Password must include at least 1 uppercase letter and 1 special symbol');
        }
        if (errors.length > 0) {
            return res.status(400).json({ errors });
        }

        next();
    },

    validatePhotoChange: (req, res, next) => {
        const errors = [];
        const { photoUrl } = req.body;

        const urlPattern = /^(https?:\/\/)?([\w-]+(\.[\w-]+)+)([\w.,@?^=%&:/~+#-]*[\w@?^=%&/~+#-])?$/;

        if (!photoUrl || !urlPattern.test(photoUrl)) {
            errors.push('Invalid photo URL');
        }

        if (errors.length > 0) {
            return res.status(400).json({ errors });
        }

        next();
    }
};

module.exports = middleware;
