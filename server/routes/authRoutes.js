const express = require('express');
const router = express.Router();
const authCtl = require('../controllers/authController');
const auth = require('../middleware/auth');

router.post('/register', authCtl.register);
router.post('/login', authCtl.login);
router.get('/me', auth(), authCtl.me);

module.exports = router; 