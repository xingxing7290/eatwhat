const express = require('express');
const auth = require('../middleware/auth');
const controller = require('../controllers/mealImageIssueController');
const router = express.Router();
router.use(auth());
router.get('/', controller.list);
router.post('/', controller.create);
router.patch('/:id', controller.update);
module.exports = router;
