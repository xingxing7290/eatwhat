const express = require('express');
const auth = require('../middleware/auth');
const upload = require('../middleware/upload');
const controller = require('../controllers/anniversaryController');
const router = express.Router();

router.use(auth());
router.get('/', controller.list);
router.post('/', upload.array('photos', 12), controller.create);
router.put('/:id', upload.array('photos', 12), controller.update);
router.delete('/:id', controller.remove);

module.exports = router;