const Chat = require('../schemas/chatSchema');
const BasicMessage = require('../schemas/messageSchemaForChats');
const User = require('../schemas/userSchema');
const Notification = require('../schemas/notificationSchema');
const mongoose = require('mongoose');

const ChatController = {
    deleteChat: async (req, res) => {
        const { chatId, userId } = req.body;

        try {
            const chat = await Chat.findById(chatId);
            if (!chat) {
                return res.status(404).json({ message: 'Chat not found' });
            }

            // Ensure the user is the creator
            if (chat.creatorId.toString() !== userId.toString()) {
                return res.status(403).json({ message: 'Unauthorized to delete this chat' });
            }

            // Delete the chat
            await Chat.deleteOne({ _id: chatId });

            // Emit the chatDeleted event with chatId only
            req.io.emit('chatDeleted', chatId);

            res.status(200).json({ message: 'Chat deleted', redirectTo: '/conversations' });
        } catch (error) {
            console.error('Error deleting chat:', error);
            res.status(500).json({ message: 'Server error', error: error.message });
        }
    },


    leaveChat: async (req, res) => {
        const { chatId, userId } = req.body;

        try {
            const chat = await Chat.findById(chatId);
            if (!chat) {
                return res.status(404).json({ message: 'Chat not found' });
            }

            // Remove the user from the participants list
            chat.participants = chat.participants.filter(p => p.userId.toString() !== userId.toString());

            // Check if the chat has no more participants
            if (chat.participants.length === 0) {
                // Optionally: delete the chat if no participants are left
                await Chat.deleteOne({ _id: chatId });
                req.io.emit('chatDeleted', chatId);
                return res.status(200).json({ message: 'Chat deleted and user removed', redirectTo: '/conversations' });
            } else {
                // Update the chat without deleting it
                await chat.save();
                req.io.to(chatId).emit('userLeft', { chatId, userId });
                res.status(200).json({ message: 'User left the chat', redirectTo: '/conversations' });
            }

        } catch (error) {
            console.error('Error leaving chat:', error);
            res.status(500).json({ message: 'Server error', error: error.message });
        }
    },

    addReaction: async (req, res) => {
        const { messageId, userId, reaction, username, conversationId } = req.body;
        const validReactions = ['❤️', '😂', '👍', '😲', '😡'];
        if (reaction && !validReactions.includes(reaction)) {
            return res.status(400).json({ message: 'Invalid reaction type' });
        }

        try {
            // Find the message by ID
            const message = await BasicMessage.findById(messageId);
            if (!message) {
                return res.status(404).json({ message: 'Message not found', messageId });
            }

            // Find existing reaction by the user
            let existingReaction = message.reacts.find(r => r.users.includes(userId));

            if (existingReaction) {
                // User is updating their reaction
                if (reaction === null) {
                    // User is removing their reaction
                    existingReaction.users = existingReaction.users.filter(id => !id.equals(userId));
                    if (existingReaction.users.length === 0) {
                        message.reacts = message.reacts.filter(r => !r.users.includes(userId));
                    }
                } else {
                    // User is changing their reaction
                    existingReaction.type = reaction;
                    if (!existingReaction.users.includes(userId)) {
                        existingReaction.users.push(userId);
                    }
                }
            } else {
                // User is adding a new reaction
                if (reaction !== null) {
                    let newReaction = message.reacts.find(r => r.type === reaction);
                    if (newReaction) {
                        if (!newReaction.users.includes(userId)) {
                            newReaction.users.push(userId);
                        }
                    } else {
                        message.reacts.push({ type: reaction, users: [userId] });
                    }
                }
            }

            // Save the updated message
            await message.save();

            // Populate the message reacts with user data for broadcasting
            const updatedMessage = await BasicMessage.findById(messageId).populate('reacts.users');
            req.io.emit('reactionUpdated', updatedMessage);

            const chat = await Chat.findById(conversationId)
            // Create and send notification if needed
            if (message.senderId.toString() !== userId.toString()) {
                const senderNotification = {
                    userId: message.senderId,
                    type: 'reaction',
                    content: `${username} reacted to your message with "${reaction} in ${chat.name}`,
                    chatId: conversationId
                };

                await Notification.create(senderNotification);

                res.status(200).json({ message: updatedMessage, notification: senderNotification });
            }

        } catch (error) {
            console.error('Error adding reaction:', error);
            res.status(500).json({ message: 'Server error', error: error.message });
        }
    },


    getMessagesByChatId: async (req, res) => {
        const { chatId } = req.params;

        try {
            const chat = await Chat.findById(chatId)
            const participants = chat.participants
            const messages = await BasicMessage.find({ chatId }).sort({ createdAt: 1 });
            const creatorId = chat.creatorId
            res.status(200).json({ messages, participants , creatorId: creatorId});
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

    addParticipants: async (req, res) => {
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

            req.io.to(chatId).emit('userAdded', { chatId, newParticipant: newParticipantDetails });
            const newPartString = newParticipant.toString()
            req.io.emit('youHaveBeenAdded', { newPartString })


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
                    const notificationContent = `${sender.username} sent a message in ${chat.name}.`;
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
