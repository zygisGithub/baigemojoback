const express = require('express');
const UserController = require('../controllers/controller');
const middleware = require('../middleware/middleware');
const ChatController = require('../controllers/chatController')

const router = express.Router();



// Routes
router.post('/register', middleware.registerAuth,UserController.register);
router.post('/login', middleware.loginAuth, UserController.login);
router.get('/getUsers', UserController.getAllUsers);
router.post('/sendMessage',middleware.userAuth ,UserController.sendMessage);
router.get('/getMessages', UserController.getMessages);
router.post('/reactToMessage',middleware.userAuth ,UserController.reactToMessage);
router.post('/notifications/:userId', UserController.getNotifications);
router.post('/notificationsMarkRead/:userId', UserController.markNotificationsAsRead);
router.post('/changeUsername',middleware.userAuth, middleware.validateUsernameChange ,UserController.changeUsername);
router.post('/changePassword',middleware.userAuth, middleware.validatePasswordChange ,UserController.changePassword);
router.post('/changePhoto',middleware.userAuth, middleware.validatePhotoChange ,UserController.changePhoto);
router.get('/getUserByUsername/:username', UserController.getUserByUsername);
router.post('/create', ChatController.createChat);
router.post('/addParticipants', ChatController.addParticipants);
router.get('/:chatId', ChatController.getChat);
router.post('/sendMessageChat',middleware.userAuth, ChatController.sendMessage);
router.post('/startChat', middleware.userAuth,middleware.chatCreateAuth,UserController.startChatWithUser)
router.post('/chats', middleware.userAuth, ChatController.getChats)
router.get('/messages/:chatId', ChatController.getMessagesByChatId);
router.post('/addParticipants',middleware.userAuth, ChatController.addParticipants)
router.post('/reactToMessageConversation',middleware.userAuth, ChatController.addReaction)
router.post('/leaveChat', ChatController.leaveChat)
router.post('/deleteChat', ChatController.deleteChat)


module.exports = router;
