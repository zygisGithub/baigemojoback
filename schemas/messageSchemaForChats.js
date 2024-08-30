const mongoose = require('mongoose');
const { Schema } = mongoose;

const reactionSchema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: ['like', 'dislike'], required: true } // Define the types of reactions you support
}, { timestamps: true });

const messageSchema = new Schema({
    chatId: { type: Schema.Types.ObjectId, ref: 'Chat', required: true },
    senderId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    senderUsername: { type: String, required: true },
    senderPhoto: { type: String, required: true },
    content: { type: String, required: true },
    reactions: [reactionSchema] // Add reactions array
}, { timestamps: true });

module.exports = mongoose.model('BasicMessage', messageSchema);
