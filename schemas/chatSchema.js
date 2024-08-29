// models/chatSchema.js
const mongoose = require('mongoose');

const chatSchema = new mongoose.Schema({
    participants: [mongoose.Schema.Types.ObjectId], // List of user IDs participating in this chat
    messages: [
        {
            senderId: mongoose.Schema.Types.ObjectId,
            content: String,
            timestamp: { type: Date, default: Date.now }
        }
    ],
    name: { type: String, default: '' } // Optional: chat room name
});

module.exports = mongoose.model('Chat', chatSchema);
