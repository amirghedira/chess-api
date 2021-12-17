const mongoose = require('mongoose')

const tokenSchema = new mongoose.Schema({
    date: { type: Date },
    oponents: {
        white: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        black: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
    },
    winnerTeam: { type: String, enum: ['none', 'white', 'black'] },
    result: { type: String },
    gameMoves: [{ type: String }]
})


module.exports = mongoose.model('Game', tokenSchema)