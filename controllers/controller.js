const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../schemas/userSchema');
const Message = require('../schemas/messageSchema')
const Notification = require('../schemas/notificationSchema')
require('dotenv').config();

const UserController = {
    // controllers/userController.js
    getNotifications: async (req, res) => {
        try {
            const { userId } = req.params; // Retrieve userId from the request params
            const notifications = await Notification.find({ userId: userId }).sort({ createdAt: -1 });
            res.status(200).json({ message: 'Notifications retrieved successfully', notifications });
        } catch (error) {
            console.error('Error retrieving notifications:', error);
            res.status(500).json({ message: 'Server error', error: error.message });
        }
    },

    reactToMessage: async (req, res) => {
        const { messageId, userId, reactionType } = req.body;

        const validReactions = ['❤️', '👍', '😂', '🫶'];
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

            // Create a notification for the message owner
            if (messageOwner.toString() !== userId.toString()) {
                const notificationContent = `${user.username} reacted to your message ${reactionType}.`;
                await Notification.create({
                    userId: messageOwner,
                    type: 'reaction',
                    content: notificationContent
                });

                // Emit the notification event
                req.io.to(messageOwner).emit('newNotification', { userId: messageOwner, type: 'reaction', content: notificationContent });
            }

            req.io.emit('messageUpdated', message);
            res.status(200).json({ message: 'Reaction updated successfully', message });
        } catch (error) {
            console.error('Error reacting to message:', error);
            res.status(500).json({ message: 'Server error', error: error.message });
        }
    },

    // controllers/userController.js
    sendFriendRequest:  async (req, res) => {
        const { senderId, receiverId } = req.body;

        try {
            const receiver = await User.findById(receiverId);
            if (!receiver) {
                return res.status(404).json({ message: 'User not found' });
            }

            if (receiver.friendRequests.includes(senderId)) {
                return res.status(400).json({ message: 'Friend request already sent' });
            }

            receiver.friendRequests.push(senderId);
            await receiver.save();

            // Create a notification for the receiver
            const notificationContent = `${senderId} sent you a friend request.`;
            await Notification.create({
                userId: receiverId,
                type: 'friendRequest',
                content: notificationContent
            });

            // Emit the friend request notification to the receiver
            req.io.to(receiverId).emit('newNotification', { userId: receiverId, type: 'friendRequest', content: notificationContent });

            res.status(200).json({ message: 'Friend request sent' });
        } catch (error) {
            console.error('Error sending friend request:', error);
            res.status(500).json({ message: 'Server error', error: error.message });
        }
    },

    acceptFriendRequest: async (req, res) => {
        const { userId, friendId } = req.body;

        try {
            const user = await User.findById(userId);
            const friend = await User.findById(friendId);

            if (!user || !friend) {
                return res.status(404).json({ message: 'User not found' });
            }

            // Add each other to the friends list
            user.friends.push(friendId);
            friend.friends.push(userId);

            // Remove friend request
            user.friendRequests = user.friendRequests.filter(reqId => reqId.toString() !== friendId);
            await user.save();
            await friend.save();

            // Emit an event to notify the users about the new friendship
            req.io.to(userId).emit('friendRequestAccepted', { friendId });
            req.io.to(friendId).emit('friendRequestAccepted', { friendId: userId });

            res.status(200).json({ message: 'Friend request accepted' });
        } catch (error) {
            console.error('Error accepting friend request:', error);
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
            const users = await User.find();
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

            // Emit an event to all connected clients
            req.io.emit('newUser', newUser);

            res.status(201).json({ message: 'User registered successfully', user: newUser });
        } catch (error) {
            console.error('Error during registration:', error);  // Log the error
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
