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
        socket.on('userOnline', (userId) => {
            onlineUsers.set(userId, socket.id);
            io.emit('updateOnlineUsers', Array.from(onlineUsers.keys()));
        });

        socket.on('userOffline', (userId) => {
            if (onlineUsers.has(userId)) {
                onlineUsers.delete(userId);
                io.emit('updateOnlineUsers', Array.from(onlineUsers.keys()));
            }
        });

        socket.on('sendNotification', (notification) => {
            if (notification && notification.userId) {
                const recipientSocketId = onlineUsers.get(notification.userId);
                if (recipientSocketId) {
                    io.to(recipientSocketId).emit('newNotification', notification);
                } else {
                }
            } else {
                console.error('Invalid notification object:', notification);
            }
        });


        socket.on('joinChat', (chatId) => {
            socket.join(chatId);
        });

        socket.on('leaveChat', (chatId) => {
            socket.leave(chatId);
        });

        socket.on('disconnect', () => {
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
