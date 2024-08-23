// routes/userRoutes.js

const express = require('express');
const UserController = require('../controllers/controller'); // Adjusted import
const middleware = require('../middleware/middleware')
const router = express.Router();

router.post('/register', UserController.register);
router.post('/login',middleware.loginAuth ,UserController.login);
router.get('/:username', UserController.getUserProfile);
router.put('/update', UserController.updateProfile);

module.exports = router;
