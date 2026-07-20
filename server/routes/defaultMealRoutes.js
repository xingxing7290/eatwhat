const express = require('express');
const auth = require('../middleware/auth');
const controller = require('../controllers/defaultMealController');
const router = express.Router();
router.use(auth());
router.get('/status', controller.status);
router.post('/import-missing', controller.importMissing);
router.post('/restore-images', controller.restoreImages);
module.exports = router;
