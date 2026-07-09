const express = require('express');
const auth = require('../middleware/auth');
const controller = require('../controllers/reviewController');
const router = express.Router();

router.use(auth());
router.get('/monthly', controller.monthly);
router.get('/yearly', controller.yearly);

module.exports = router;
