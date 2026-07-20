const express = require('express');
const auth = require('../middleware/auth');
const controller = require('../controllers/anniversaryTemplateController');
const router = express.Router();
router.use(auth());
router.get('/', controller.list);
module.exports = router;
