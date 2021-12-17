const express = require('express')
const
    {
        getGame,
        updateGame,
        getUserGames,
        createNewGame,
        updateGameMoves
    } = require('../controllers/game')
const AuthGuard = require('../middleware/AuthGuard')
const router = express.Router()



router.post('/', AuthGuard, createNewGame)
router.get('/', AuthGuard, getUserGames)
router.get('/:gameId', AuthGuard, getGame)
router.patch('/move/:gameId', AuthGuard, updateGameMoves)
router.patch('/:gameId', AuthGuard, updateGame)



module.exports = router