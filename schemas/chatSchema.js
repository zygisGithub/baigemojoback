// schemas/chatSchema.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const chatSchema = new Schema({
    participants: [{ type: {}, required: true }],
    name: { type: String, required: false },
    participantsNames: [String],
    creatorId: { type: Schema.Types.ObjectId, ref: 'User', required: true }
});


const Chat = mongoose.models.Chat || mongoose.model('Chat', chatSchema);

module.exports = Chat;
