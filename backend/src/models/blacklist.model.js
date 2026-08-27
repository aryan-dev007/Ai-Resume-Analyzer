const mongoose = require('mongoose');

const blacklistSchema = new mongoose.Schema({
    token: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    createdAt: {
        type: Date,
        default: Date.now,
        expires: 86400 // TTL of 24 hours (in seconds), auto-deletes expired tokens
    }
});

const Blacklist = mongoose.model('Blacklist', blacklistSchema);
module.exports = Blacklist;
