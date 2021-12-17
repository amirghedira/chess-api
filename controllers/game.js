

const Game = require('../models/Game')
const User = require('../models/User')
const socket = require('socket.io-client')(process.env.HOST)
exports.getGame = async (req, res) => {
    try {
        const game = await Game.findOne({ _id: gameId })
        res.status(200).json({ game })
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}

exports.updateGameMoves = async (req, res) => {
    try {
        await Game.updateOne({ _id: req.params.gameId }, { $push: { gameMoves: req.body.move } })
        res.status(200).json({ message: 'game successfully updated' })
    } catch (error) {
        console.log(error)
        res.status(500).json({ message: error.message })
    }
}
exports.updateGame = async (req, res) => {
    try {
        await Game.updateOne({ _id: req.params.gameId }, { $set: { ...req.body.game } })
        res.status(200).json({ message: 'game successfully updated' })
    } catch (error) {
        console.log(error)
        res.status(500).json({ message: error.message })
    }
}
exports.getUserGames = async (req, res) => {
    try {
        const games = await Game.find({
            $or: [
                { 'oponent.white': req.user._id },
                { 'oponent.black': req.user._id },
            ]
        })
        res.status(200).json({ games })
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}
exports.createNewGame = async (req, res) => {
    try {
        const availableUser = await User.findOne({ _id: { $nin: req.user._id }, isOnline: true })
        const currentUser = await User.findOne({ _id: req.user._id })
        const iscurrentUserWhite = Math.round(Math.random()) === 1
        if (!availableUser)
            return res.status(404).json({ message: 'oponent not found' })

        let createdGame = null
        if (iscurrentUserWhite) {
            createdGame = await Game.create({
                date: new Date().toISOString(),
                gameMoves: [req.body.board],
                oponents: {
                    white: req.user._id,
                    black: availableUser._id
                },
            })
        }
        createdGame = await Game.create({
            date: new Date().toISOString(),
            gameMoves: [req.body.board],
            oponents: {
                white: availableUser._id,
                black: req.user._id
            },
        })
        socket.emit('start-game', { userId: availableUser._id, oponent: currentUser, game: createdGame })
        res.status(200).json({ game: createdGame })
    } catch (error) {
        console.log(error)
        res.status(500).json({ message: error.message })
    }
}