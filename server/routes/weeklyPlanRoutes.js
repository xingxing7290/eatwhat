const express = require('express');
const auth = require('../middleware/auth');
const controller = require('../controllers/weeklyPlanController');
const router = express.Router();
router.use(auth());
router.get('/', controller.list);
router.post('/generate', controller.generate);
router.post('/apply', controller.apply);
module.exports = router;
