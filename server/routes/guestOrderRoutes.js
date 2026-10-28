const express = require('express');
const auth = require('../middleware/auth');
const controller = require('../controllers/guestOrderController');

const router = express.Router();

router.use((_req, res, next) => { res.set('Cache-Control', 'private, no-store'); next(); });
router.get('/public/:shareToken', controller.publicDetail);
router.post('/public/:shareToken/orders/idempotent', controller.createPublicOrderIdempotent);
router.post('/public/:shareToken/orders', controller.createPublicOrder);
router.get('/public/:shareToken/orders/:accessToken', controller.publicOrder);
router.put('/public/:shareToken/orders/:accessToken', controller.updatePublicOrder);

router.use(auth());
router.get('/capabilities', controller.capabilities);
router.get('/', controller.list);
router.post('/', controller.create);
router.post('/idempotent', controller.createIdempotent);
router.get('/:id', controller.detail);
router.patch('/:id', controller.update);
router.post('/:id/rotate-link', controller.rotateLink);

module.exports = router;
