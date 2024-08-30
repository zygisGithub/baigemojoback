// schemas/messageSchema.js
//Schema for all chat i cant use it anywhere else!!!!
const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    sender: {
        senderId: {type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true},
        senderUsername: {type: String, required: true},
        senderPhoto: {type: String, required: true}
    },
    content: { type: String, required: true },
    reacts: [{
        type: { type: String, enum: ['❤️', '😂', '👍', '😲', '😡'], required: true },
        users: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
    }],
    timestamp: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Message', messageSchema);

