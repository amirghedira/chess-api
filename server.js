if (process.env.NODE_ENV != 'production') {
    require('dotenv').config();
}
const http = require('http');
const app = require('./app');
const server = http.createServer(app);
const io = require('socket.io')(server, { cors: { origin: '*' } })
const jwt = require('jsonwebtoken')
const User = require('./models/User')

const ConnectedUsers = [];

server.listen(process.env.PORT || 5000, () => {
    io.on('connection', (socket) => {
        socket.on('connectuser', async (token) => {
            try {
                let user = jwt.decode(token, process.env.ACCESS_TOKEN_KEY)
                if (user) {
                    const userIndex = ConnectedUsers.findIndex(connecteduser => {
                        return connecteduser.userid === user._id
                    })
                    if (userIndex === -1) {
                        await User.updateOne({ _id: user._id }, { isOnline: true })
                        ConnectedUsers.push({ userid: user._id, socketIds: [socket.id] })

                    }
                    else {
                        if (!ConnectedUsers[userIndex].socketIds.includes(socket.id))
                            ConnectedUsers[userIndex].socketIds.push(socket.id)
                    }
                }
            } catch (error) {
                console.log(error)
            }
        })

        socket.on('disconnect', async () => {
            const userIndex = ConnectedUsers.findIndex(connecteduser => {
                return connecteduser.socketIds.includes(socket.id)
            })
            if (userIndex >= 0) {
                const socketIndex = ConnectedUsers[userIndex].socketIds.findIndex(socketId => socketId === socket.id)
                ConnectedUsers[userIndex].socketIds.splice(socketIndex, 1)
                if (ConnectedUsers[userIndex].socketIds.length === 0) {
                    await User.updateOne({ _id: ConnectedUsers[userIndex].userid }, { isOnline: false })
                    ConnectedUsers.splice(userIndex, 1)
                }

            }
        })
        socket.on('start-game', ({ userId, oponent, game }) => {
            const userIndex = ConnectedUsers.findIndex(connecteduser => {
                return connecteduser.userid === userId
            })

            if (userIndex >= 0)
                ConnectedUsers[userIndex].socketIds.forEach(socketId => {
                    socket.broadcast.to(socketId).emit('receive-invitation-game', { oponent, game })
                })
        })


        socket.on('accept-challenge', ({ userId, oponent }) => {
            const userIndex = ConnectedUsers.findIndex(connecteduser => {
                return connecteduser.userid === userId
            })

            if (userIndex >= 0)
                ConnectedUsers[userIndex].socketIds.forEach(socketId => {
                    socket.broadcast.to(socketId).emit('accepted-challenge', { oponent })
                })
        })

        socket.on('make-move', ({ userId, boardGame, lastMove }) => {

            const userIndex = ConnectedUsers.findIndex(connecteduser => {
                return connecteduser.userid === userId
            })
            if (userIndex >= 0)
                ConnectedUsers[userIndex].socketIds.forEach(socketId => {
                    socket.broadcast.to(socketId).emit('played-move', { boardGame, lastMove })
                })
        })
    })
})



