const express = require('express');
const UserController = require('../controllers/controller');
const middleware = require('../middleware/middleware');
const ChatController = require('../controllers/chatController')

const router = express.Router();



// Routes
router.post('/register', UserController.register);
router.post('/login', middleware.loginAuth, UserController.login);
router.put('/update', UserController.updateProfile);
router.get('/getUsers', UserController.getAllUsers);
router.post('/sendMessage', UserController.sendMessage);
router.get('/getMessages', UserController.getMessages);
router.post('/sendFriendRequest', UserController.sendFriendRequest);
router.post('/acceptFriendRequest', UserController.acceptFriendRequest);
router.post('/reactToMessage', UserController.reactToMessage);
router.post('/notifications/:userId', UserController.getNotifications);
router.post('/notificationsMarkRead/:userId', UserController.markNotificationsAsRead);
router.put('/updateProfile', UserController.updateProfile);
router.post('/changePhoto', UserController.changePhoto);
router.get('/getUserByUsername/:username', UserController.getUserByUsername);
router.post('/create', ChatController.createChat);
router.post('/addParticipants', ChatController.addParticipants);
router.get('/:chatId', ChatController.getChat);
router.post('/sendMessageChat', ChatController.sendMessage);
router.post('/startChat', middleware.userAuth,UserController.startChatWithUser)
router.post('/chats', middleware.userAuth, ChatController.getChats)
router.get('/messages/:chatId', ChatController.getMessagesByChatId);
router.post('/addParticipants', ChatController.addParticipants)




module.exports = router;
