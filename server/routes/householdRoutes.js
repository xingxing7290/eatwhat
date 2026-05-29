const express = require('express');
const auth = require('../middleware/auth');
const controller = require('../controllers/householdController');
const router = express.Router();

router.use(auth());
router.get('/me', controller.me);
router.put('/me', controller.update);
router.post('/invite/refresh', controller.refreshInvite);
router.post('/join', controller.join);

module.exports = router;