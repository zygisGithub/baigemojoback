// socket.js
const socketIo = require('socket.io');
let onlineUsers = new Map();

const initializeSocket = (server) => {
    const io = socketIo(server, {
        cors: {
            origin: "*",
            methods: ["GET", "POST"]
        }
    });

    io.on('connection', (socket) => {
        console.log('A user connected:', socket.id);

        // Handle user going online
        socket.on('userOnline', (userId) => {
            onlineUsers.set(userId, socket.id);
            io.emit('updateOnlineUsers', Array.from(onlineUsers.keys()));
        });

        // Handle user going offline
        socket.on('userOffline', (userId) => {
            if (onlineUsers.has(userId)) {
                onlineUsers.delete(userId);
                io.emit('updateOnlineUsers', Array.from(onlineUsers.keys()));
            }
        });

        // Handle notifications
        socket.on('sendNotification', (notification) => {
            const recipientSocketId = onlineUsers.get(notification.userId);
            if (recipientSocketId) {
                console.log(`Emitting notification to socket ID: ${recipientSocketId}`);
                io.to(recipientSocketId).emit('newNotification', notification);
            } else {
                console.log(`User with ID ${notification.userId} is not online.`);
            }
        });

        socket.on('disconnect', () => {
            console.log('A user disconnected:', socket.id);
            onlineUsers.forEach((socketId, userId) => {
                if (socketId === socket.id) {
                    onlineUsers.delete(userId);
                    io.emit('updateOnlineUsers', Array.from(onlineUsers.keys()));
                }
            });
        });
    });

    return io;
};

module.exports = { initializeSocket, onlineUsers };
