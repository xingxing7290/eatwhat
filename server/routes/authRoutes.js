const express = require('express');
const router = express.Router();
const authCtl = require('../controllers/authController');
const auth = require('../middleware/auth');
const upload = require('../middleware/upload');

router.post('/register', authCtl.register);
router.post('/login', authCtl.login);
router.get('/me', auth(), authCtl.me);

router.put('/profile', auth(), authCtl.updateProfile);
router.post('/avatar', auth(), upload.single('avatar'), authCtl.uploadAvatar);

module.exports = router;