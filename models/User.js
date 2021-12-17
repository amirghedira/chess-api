const mongoose = require('mongoose')

const userSchema = new mongoose.Schema({
    username: { type: String },
    password: { type: String },
    score: { type: Number, default: 800 },
    joined: { type: Date },
    profileImage: { type: String },
    isOnline: { type: Boolean, default: false },
    isCurrentlyPlaying: { type: Boolean, default: false }

})


module.exports = mongoose.model('User', userSchema)
