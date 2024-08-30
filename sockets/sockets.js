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
            console.log('notification',notification)
            if (notification && notification.userId) {
                const recipientSocketId = onlineUsers.get(notification.userId);
                if (recipientSocketId) {
                    console.log(`Emitting notification to socket ID: ${recipientSocketId}`);
                    io.to(recipientSocketId).emit('newNotification', notification);
                } else {
                    console.log(`User with ID ${notification.userId} is not online.`);
                }
            } else {
                console.error('Invalid notification object:', notification);
            }
        });


        socket.on('joinChat', (chatId) => {
            socket.join(chatId);
            console.log(`User with socket ID ${socket.id} joined chat ${chatId}`);
        });

        // Handle user leaving a chat room
        socket.on('leaveChat', (chatId) => {
            socket.leave(chatId);
            console.log(`User with socket ID ${socket.id} left chat ${chatId}`);
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
