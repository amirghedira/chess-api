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
const socketNumClients = {};
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

        socket.on('accept-challenge', ({ userId, oponent, game }) => {
            const userIndex = ConnectedUsers.findIndex(connecteduser => {
                return connecteduser.userid === userId
            })
            const currentUserIndex = ConnectedUsers.findIndex(connecteduser => {
                return connecteduser.socketIds.includes(socket.id)
            })
            let currentUserSocketIds = ConnectedUsers[currentUserIndex].socketIds
            const currentSocketIdIndex = currentUserSocketIds.findIndex(s => s === socket.id)
            currentUserSocketIds.splice(currentSocketIdIndex, 1)
            socket.broadcast.to(currentUserSocketIds).emit('has-been-accepted-challenge', { oponent, game })
            if (userIndex >= 0)
                ConnectedUsers[userIndex].socketIds.forEach(socketId => {
                    socket.broadcast.to(socketId).emit('accepted-challenge', { oponent, game })
                })
        })

        socket.on('send-invitation-game', ({ userId, oponent, game }) => {
            const userIndex = ConnectedUsers.findIndex(connecteduser => {
                return connecteduser.userid === userId
            })

            if (userIndex >= 0)
                ConnectedUsers[userIndex].socketIds.forEach(socketId => {
                    socket.broadcast.to(socketId).emit('receive-invitation-game', { oponent, game })
                })
        })
        socket.on('reject-challenge', ({ userId, oponent }) => {
            const userIndex = ConnectedUsers.findIndex(connecteduser => {
                return connecteduser.userid === userId
            })

            if (userIndex >= 0)
                ConnectedUsers[userIndex].socketIds.forEach(socketId => {
                    socket.broadcast.to(socketId).emit('rejected-challenge', { oponent })
                })

        })


        socket.on('join-game', ({ game, team }) => {
            const roomId = game._id
            console.log(team)
            if (socketNumClients[roomId])
                if (socketNumClients[roomId][team])
                    socketNumClients[roomId][team] += 1
                else
                    socketNumClients[roomId][team] = 1
            else
                socketNumClients[roomId] = { [team]: 1 }
            console.log(socketNumClients[roomId])
            socket.join(roomId)
            socket.on('abandant-game', ({ oponent }) => {
                socket.to(roomId).emit('abandaned-game', { oponent })

            })
            socket.on('make-move', ({ eatedPiece, boardGame, lastMove }) => {
                socket.to(roomId).emit('played-move', { boardGame, eatedPiece, lastMove })
            })
            socket.on('disconnect', () => {
                console.log(socketNumClients[roomId])
            })
        })
    })
})



