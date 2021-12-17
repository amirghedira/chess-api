const express = require('express')
const
    {
        userLogin,
        userLogout,
        createUser,
        updateUserInfo,
        getConnectedUser,
        updateAccessToken,
        updateUserPassword,
        verifyUser,

    } = require('../controllers/user')
const AuthGuard = require('../middleware/AuthGuard')
const router = express.Router()



router.post('/login', userLogin)
router.post('/', createUser)
router.post('/token', updateAccessToken)



router.get('/verify/:token', verifyUser)
router.get('/connected-user', AuthGuard, getConnectedUser)


router.patch('/logout', AuthGuard, userLogout)
router.patch('/', AuthGuard, updateUserInfo)
router.patch('/update-password', AuthGuard, updateUserPassword)

module.exports = router