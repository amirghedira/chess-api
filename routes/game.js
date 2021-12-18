const express = require('express')
const
    {
        getGame,
        endGame,
        getUserGames,
        createNewGame,
        updateGameMoves,
        createNewGameWithPlayer
    } = require('../controllers/game')
const AuthGuard = require('../middleware/AuthGuard')
const router = express.Router()



router.post('/', AuthGuard, createNewGame)
router.post('/player/:userId', AuthGuard, createNewGameWithPlayer)

router.get('/', AuthGuard, getUserGames)
router.get('/:gameId', AuthGuard, getGame)
router.patch('/move/:gameId', AuthGuard, updateGameMoves)
router.patch('/:gameId', AuthGuard, endGame)



module.exports = router