// schemas/messageSchema.js
const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    sender: {
        senderId: {type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true},
        senderUsername: {type: String, required: true},
        senderPhoto: {type: String, required: true}
    },
    content: { type: String, required: true },
    reacts: [{
        type: { type: String, enum: ['❤️', '👍', '😂', '🫶'], required: true },
        users: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
    }],
    timestamp: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Message', messageSchema);

