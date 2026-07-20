const express = require('express');
const auth = require('../middleware/auth');
const controller = require('../controllers/dashboardController');
const router = express.Router();
router.use(auth());
router.get('/summary', controller.summary);
module.exports = router;
