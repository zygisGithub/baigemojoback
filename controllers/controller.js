const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../schemas/userSchema');
const Message = require('../schemas/messageSchema')
const MessageForConversations = require('../schemas/messageSchemaForChats')
const Notification = require('../schemas/notificationSchema')
const Chat = require('../schemas/chatSchema')
const mongoose = require('mongoose')
require('dotenv').config();



const UserController = {
    startChatWithUser: async (req, res) => {
        const { userId, chatName } = req.body;
        const currentUserId = req.user.id;

        try {
            // Check if a chat already exists between these users
            let chat = await Chat.findOne({
                participants: { $all: [currentUserId, userId] }
            });
            const senderUser = await User.findById(currentUserId).select('-password')
            const recieverUser = await User.findById(userId).select('-password')
            const senderUserData = {
                userId: senderUser._id,
                username: senderUser.username,
                photo: senderUser.photo
            }
            const receiverUserData = {
                userId: recieverUser._id,
                username: recieverUser.username,
                photo: recieverUser.photo
            }
            if (!chat) {
                // Create a new chat if it doesn't exist
                chat = new Chat({
                    participants: [senderUserData, receiverUserData],
                    name: chatName,
                    creatorId: currentUserId
                });

                await chat.save();
            }
            const notificationContent = `${senderUser.username} started chat with you.`;

            if (senderUser) {
                await Notification.create({
                    userId: userId,
                    type: 'startedChat',
                    content: notificationContent,
                    chatId: chat._id
                })
            }
            let notification = {
                userId: userId,
                type: 'startedChat',
                content: notificationContent,
                chatId: chat._id
            }

            req.io.emit('newChat', { chat, userId: currentUserId });

            res.status(200).json({ message: 'Chat started successfully', chat , notification });
        } catch (error) {
            console.error('Error starting chat:', error);
            res.status(500).json({ message: 'Server error', error: error.message });
        }
    },
    getUserByUsername: async (req, res) => {
        try {
            const username = req.params.username;
            const user = await User.findOne({ username }).select('-password');

            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }

            res.status(200).json(user);
        } catch (error) {
            res.status(500).json({ message: 'Server error', error: error.message });
        }
    },
    changePassword: async (req, res) => {
        const { userId, oldPassword, newPassword } = req.body;

        try {
            const user = await User.findById(userId);
            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }

            // Validate old password
            const isMatch = await bcrypt.compare(oldPassword, user.password);
            if (!isMatch) {
                return res.status(400).json({ errors: ['Invalid password',''] });
            }

            // Hash new password and save
            user.password = await bcrypt.hash(newPassword, 10);
            await user.save();

            res.status(200).json({ message: 'Password updated successfully' });
        } catch (error) {
            console.error('Error changing password:', error);
            res.status(500).json({ message: 'Server error', error: error.message });
        }
    },
    changeUsername: async (req, res) => {
        const { userId, newUsername, oldPassword } = req.body;

        try {
            const user = await User.findById(userId);
            if (!user) {
                return res.status(404).json({ errors: 'User not found' });
            }

            const isMatch = await bcrypt.compare(oldPassword, user.password);
            if (!isMatch) {
                return res.status(400).json({ errors: ['Invalid password',''] });
            }

            const existingUser = await User.findOne({ username: newUsername });
            if (existingUser && existingUser._id.toString() !== userId.toString()) {
                return res.status(400).json({ message: 'Username already taken' });
            }

            user.username = newUsername;
            await user.save();

            const objectIdUserId = new mongoose.Types.ObjectId(userId);

            const updateResultChat = await Chat.updateMany(
                { "participants.userId": objectIdUserId },
                { $set: { "participants.$[elem].username": newUsername } },
                { arrayFilters: [{ "elem.userId": objectIdUserId }] }
            );

            const updateResultMessage = await MessageForConversations.updateMany(
                { "senderId": userId },
                { $set: { "senderUsername": newUsername } }
            );
            const updateResultAllChat = await Message.updateMany(
                { "sender.senderId": userId },
                { $set: { "sender.senderUsername": newUsername } }
            );

            req.io.emit('profileUsernameChanged', { userId, newUsername });

            res.status(200).json({ message: 'Username updated successfully', user });
        } catch (error) {
            console.error('Error updating username:', error);
            res.status(500).json({ message: 'Server error', error: error.message });
        }
    },




    changePhoto: async (req, res) => {
        const { userId, photoUrl } = req.body;

        try {
            const user = await User.findById(userId);
            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }

            user.photo = photoUrl;
            await user.save();

            const objectIdUserId = new mongoose.Types.ObjectId(userId);


            const updateResultChat = await Chat.updateMany(
                { "participants.userId": objectIdUserId },
                { $set: { "participants.$[elem].photo": photoUrl } },
                { arrayFilters: [{ "elem.userId": objectIdUserId }] }
            );

            const updateResultMessage = await MessageForConversations.updateMany(
                { "senderId": userId },
                { $set: { "senderPhoto": photoUrl } }
            );
            const updateResultAllChat = await Message.updateMany(
                { "sender.senderId": userId },
                { $set: { "sender.senderPhoto": photoUrl } }
            );

            req.io.emit('profilePhotoChanged', { userId, photoUrl });

            res.status(200).json({ message: 'Profile photo updated successfully', photoUrl });
        } catch (error) {
            console.error('Error changing profile photo:', error);
            res.status(500).json({ message: 'Server error', error: error.message });
        }
    },



    markNotificationsAsRead: async (req, res) => {
        const { userId } = req.params;

        try {
            const result = await Notification.updateMany(
                { userId, read: false },
                { $set: { read: true } }
            );

            res.status(200).json({ message: 'Notifications marked as read', result });
        } catch (error) {
            console.error('Error marking notifications as read:', error);
            res.status(500).json({ message: 'Server error', error: error.message });
        }
    },
    getNotifications: async (req, res) => {
        try {
            const { userId } = req.params;
            const { read } = req.query; // e.g., ?read=false to get unread notifications

            const query = { userId };
            if (read !== undefined) {
                query.read = read === 'true'; // Convert to boolean
            }

            const notifications = await Notification.find(query).sort({ createdAt: -1 });
            res.status(200).json({ message: 'Notifications retrieved successfully', notifications });
        } catch (error) {
            console.error('Error retrieving notifications:', error);
            res.status(500).json({ message: 'Server error', error: error.message });
        }
    },

    // controllers/userController.js
    // controllers/userController.js

    reactToMessage: async (req, res) => {
        const { messageId, userId, reactionType } = req.body;

        const validReactions = ['❤️', '😂', '👍', '😲', '😡'];
        if (!validReactions.includes(reactionType)) {
            return res.status(400).json({ message: 'Invalid reaction type' });
        }

        try {
            const message = await Message.findById(messageId).populate('sender');
            if (!message) {
                return res.status(404).json({ message: 'Message not found' });
            }

            const messageOwner = message.sender.senderId;
            const user = await User.findById(userId);
            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }

            let existingReaction = message.reacts.find(r => r.users.some(id => id.equals(userId)));

            if (existingReaction) {
                // User is unreacting or changing their reaction
                existingReaction.users = existingReaction.users.filter(id => !id.equals(userId));

                if (existingReaction.users.length === 0) {
                    message.reacts = message.reacts.filter(r => r.type !== existingReaction.type);
                }
            }

            let newReaction = message.reacts.find(r => r.type === reactionType);
            if (newReaction) {
                if (!newReaction.users.some(id => id.equals(userId))) {
                    newReaction.users.push(userId);
                }
            } else {
                message.reacts.push({ type: reactionType, users: [userId] });
            }

            await message.save();

            if (messageOwner.toString() !== userId.toString()) {
                const notificationContent = `${user.username} reacted to your message ${reactionType} in all chat.`;
                await Notification.create({
                    userId: messageOwner,
                    type: 'reaction',
                    content: notificationContent
                });
            }

            let notification = {
                userId: messageOwner,
                type: 'reaction',
                content: `${user.username} reacted to your message ${reactionType} in all chat.`
            }

            req.io.emit('messageUpdated', message);
            res.status(200).json({ message: 'Reaction updated successfully', message, notification: notification });
        } catch (error) {
            console.error('Error reacting to message:', error);
            res.status(500).json({ message: 'Server error', error: error.message });
        }
    },



    sendMessage: async (req, res) => {
        const { senderId,senderUsername, senderPhoto, content } = req.body;

        try {
            const newMessage = new Message({
                sender:
                    {
                        senderId: senderId,
                        senderUsername: senderUsername,
                        senderPhoto: senderPhoto
                    },
                content: content
            });

            await newMessage.save();

            // Emit the message to all connected clients
            req.io.emit('newMessage', newMessage);

            res.status(201).json({ message: 'Message sent successfully', newMessage });
        } catch (error) {
            console.error('Error sending message:', error);
            res.status(500).json({ message: 'Server error', error: error.message });
        }
    },

    getMessages: async (req, res) => {
        try {
            const messages = await Message.find().populate('sender');
            res.status(200).json({ message: 'Messages retrieved successfully', messages });
        } catch (error) {
            console.error('Error retrieving messages:', error);
            res.status(500).json({ message: 'Server error', error: error.message });
        }
    },
    getAllUsers: async (req, res) => {
        try {
            const users = await User.find().select('-password'); // Exclude password
            res.status(200).json({ message: 'Get users success', users: users });
        } catch (error) {
            res.status(500).json({ message: 'Server error', error });
        }
    },

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

            const userResponse = await User.findById(newUser._id).select('-password'); // Exclude password

            req.io.emit('newUser', userResponse);

            res.status(201).json({ message: 'User registered successfully', user: userResponse });
        } catch (error) {
            console.error('Error during registration:', error);
            res.status(500).json({ message: 'Server error', error: error.message });
        }
    },





    login: async (req, res) => {
        try {
            const { username, password } = req.body;
            const user = await User.findOne({ username: username });

            if (!user || !(await bcrypt.compare(password, user.password))) {
                return res.status(400).json({ message: 'Invalid credentials' });
            }

            const token = jwt.sign(
                { id: user._id, username: user.username },
                process.env.JWT_SECRET,
                { expiresIn: '1h' }
            );

            const userResponse = await User.findById(user._id).select('-password'); // Exclude password

            res.status(200).json({ message: 'Logged in successfully', token, user: userResponse });
        } catch (error) {
            res.status(500).json({ message: 'Server error', error });
        }
    },



};

module.exports = UserController;
