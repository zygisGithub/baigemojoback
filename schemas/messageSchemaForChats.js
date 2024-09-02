// schemas/basicMessageSchema.js
const mongoose = require('mongoose');

const basicMessageSchema = new mongoose.Schema({
    chatId: { type: mongoose.Schema.Types.ObjectId, ref: 'Chat', required: true },
    senderId: { type: mongoose.Schema.Types.ObjectId , ref: 'user', required: true },
    senderUsername: { type: String, required: true },
    senderPhoto: { type: String, required: true },
    content: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    reacts: [{
        type: { type: String, enum: ['❤️', '😂', '👍', '😲', '😡'], required: false },
        users: [{ type: mongoose.Schema.Types.ObjectId, ref: 'user' }]
    }],
});

module.exports = mongoose.model('BasicMessage', basicMessageSchema);
