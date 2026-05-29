const express = require('express');
const auth = require('../middleware/auth');
const controller = require('../controllers/wishlistController');
const router = express.Router();

router.use(auth());
router.get('/', controller.list);
router.post('/', controller.create);
router.post('/:id/vote', controller.vote);
router.patch('/:id/status', controller.updateStatus);
router.delete('/:id', controller.remove);

module.exports = router;