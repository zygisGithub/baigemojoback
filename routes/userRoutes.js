const express = require('express');
const UserController = require('../controllers/controller');
const middleware = require('../middleware/middleware')
const router = express.Router();

router.post('/register', UserController.register);
router.post('/login',middleware.loginAuth ,UserController.login);
router.get('/:username', UserController.getUserProfile);
router.put('/update', UserController.updateProfile);
router.get('/getUsers', UserController.getAllUsers)
router.post('/sendMessage', UserController.sendMessage);
router.post('/getMessages', UserController.getMessages);
router.post('/sendFriendRequest', UserController.sendFriendRequest)
router.post('/acceptFriendRequest', UserController.acceptFriendRequest)
router.post('/reactToMessage', UserController.reactToMessage);
router.get('/notifications/:userId', UserController.getNotifications);

module.exports = router;
