const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../schemas/userSchema');
require('dotenv').config(); // For accessing environment variables

const UserController = {
    register: async (req, res) => {
        const data = req.body;
        try {
            const existingUser = await User.findOne({ username: data.username });

            if (existingUser) {
                return res.status(400).json({ message: 'Username already exists' });
            }

            const hashedPassword = await bcrypt.hash(data.password, 10);

            const newUser = new User({
                username: data.username,
                password: hashedPassword
            });

            await newUser.save();

            res.status(201).json({ message: 'User registered successfully', user: newUser });
        } catch (error) {
            res.status(500).json({ message: 'Server error', error });
        }
    },

    login: async (req, res) => {
        try {
            const { username, password } = req.body;
            const user = await User.findOne({ username: username });

            if (!user || !(await bcrypt.compare(password, user.password))) {
                return res.status(400).json({ message: 'Invalid credentials' });
            }

            // Generate a JWT token
            const token = jwt.sign(
                { id: user._id, username: user.username },
                process.env.JWT_SECRET,
                { expiresIn: '1h' } // Token expires in 1 hour
            );

            res.status(200).json({ message: 'Logged in successfully', token, user });
        } catch (error) {
            res.status(500).json({ message: 'Server error', error });
        }
    },


    getUserProfile: async (req, res) => {
        // Implement the logic for fetching user profile
    },

    updateProfile: async (req, res) => {
        // Implement the logic for updating the user profile
    },
};

module.exports = UserController;
