const Chat = require('../schemas/chatSchema');
const BasicMessage = require('../schemas/messageSchemaForChats');
const User = require('../schemas/userSchema');
const Notification = require('../schemas/notificationSchema');
const mongoose = require('mongoose');

const ChatController = {

    getMessagesByChatId: async (req, res) => {
        const { chatId } = req.params;

        try {
            const chat = await Chat.findById(chatId)
            const participants = chat.participants
            const messages = await BasicMessage.find({ chatId }).sort({ createdAt: 1 });
            res.status(200).json({ messages, participants});
        } catch (error) {
            console.error('Error fetching messages:', error);
            res.status(500).json({ message: 'Server error', error: error.message });
        }
    },

    getChats: async (req, res) => {
        const userId = req.user.id;
        try {
            const objectId = new mongoose.Types.ObjectId(userId);

            const chats = await Chat.find({
                participants: { $elemMatch: { userId: objectId } }
            });

            res.status(200).json({ chats });
        } catch (error) {
            console.error('Error fetching chats:', error);
            res.status(500).json({ message: 'Server error', error: error.message });
        }
    },

    createChat: async (req, res) => {
        const { participants, name } = req.body;

        try {
            const users = await User.find({ _id: { $in: participants } });
            if (users.length !== participants.length) {
                return res.status(400).json({ message: 'One or more users not found' });
            }

            const newChat = new Chat({ participants, name });
            await newChat.save();

            res.status(201).json({ message: 'Chat created successfully', chat: newChat });
        } catch (error) {
            console.error('Error creating chat:', error);
            res.status(500).json({ message: 'Server error', error: error.message });
        }
    },

    addParticipants:  async (req, res) => {
        const { chatId, newParticipant, user } = req.body;

        try {
            const chat = await Chat.findById(chatId);
            if (!chat) {
                return res.status(404).json({ message: 'Chat not found' });
            }

            const participant = await User.findById(newParticipant);

            // Ensure the newParticipant is in the correct format
            const newParticipantIdStr = newParticipant.toString();

            // Check if the participant is already in the chat
            const isAlreadyParticipant = chat.participants.some(
                (p) => p.userId.toString() === newParticipantIdStr
            );

            if (isAlreadyParticipant) {
                return res.status(400).json({ message: 'User is already in the chat' });
            }

            // Prepare new participant with full details
            const newParticipantDetails = {
                userId: participant._id,
                username: participant.username,
                photo: participant.photo
            };

            // Add new participant to chat
            chat.participants.push(newParticipantDetails);
            await chat.save();

            // Send notification
            const notificationContent = `You have been added to a chat by ${user.username}.`;
            const notification = await Notification.create({
                userId: newParticipant,
                type: 'startedChat',
                content: notificationContent,
                chatId: chatId
            });

            // Emit event to notify all connected clients about the new participant
            req.io.to(chatId).emit('addUser', chatId);

            res.status(200).json({ message: 'Participant added successfully', chat, notification });
        } catch (error) {
            console.error('Error adding participants:', error);
            res.status(500).json({ message: 'Server error', error: error.message });
        }
    },






    getChat: async (req, res) => {
        const { chatId } = req.params;

        try {
            const chat = await Chat.findById(chatId).populate('participants');
            if (!chat) {
                return res.status(404).json({ message: 'Chat not found' });
            }

            res.status(200).json({ message: 'Chat retrieved successfully', chat });
        } catch (error) {
            console.error('Error retrieving chat:', error);
            res.status(500).json({ message: 'Server error', error: error.message });
        }
    },

    sendMessage: async (req, res) => {
        const { chatId, senderId, content } = req.body;

        try {
            const chat = await Chat.findById(chatId);
            if (!chat) {
                return res.status(404).json({ message: 'Chat not found' });
            }

            const sender = await User.findById(senderId);
            if (!sender) {
                return res.status(404).json({ message: 'Sender not found' });
            }

            const newMessage = new BasicMessage({
                chatId,
                senderId,
                senderUsername: sender.username,
                senderPhoto: sender.photo,
                content
            });

            await newMessage.save();

            req.io.to(chatId).emit('newMessage', newMessage);

            const notifications = [];
            for (const user of chat.participants) {
                if (user.userId.toString() !== senderId.toString()) {
                    const notificationContent = `${sender.username} sent a message in chat.`;
                    const notification = await Notification.create({
                        userId: user.userId,
                        type: 'message',
                        content: notificationContent,
                        chatId: chatId
                    });
                    notifications.push(notification);
                }
            }
            res.status(201).json({ message: 'Message sent successfully', newMessage, notifications });
        } catch (error) {
            console.error('Error sending message:', error);
            res.status(500).json({ message: 'Server error', error: error.message });
        }
    },
};

module.exports = ChatController;
