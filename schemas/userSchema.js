const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        minlength: 4,
        maxlength: 20,
    },
    password: {
        type: String,
        required: true,
        minlength: 4,
        maxlength: 100,
    },
    photo: {
        type: String,
        default: 'default_photo_url',
    },
});

module.exports = mongoose.model('user', userSchema);
