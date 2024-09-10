// schemas/notificationSchema.js
const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, required: true }, 
    content: { type: String, required: true },
    read: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
    chatId: String,
});

module.exports = mongoose.model('Notification', notificationSchema);
