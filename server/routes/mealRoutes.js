const express = require('express');
const mealController = require('../controllers/mealController');
const upload = require('../middleware/upload');
const auth = require('../middleware/auth');
const router = express.Router();

const mealUpload = upload.fields([
  { name: 'image', maxCount: 1 },
  { name: 'photos', maxCount: 12 },
  { name: 'stepImages', maxCount: 20 }
]);

router.use(auth());
router.get('/', mealController.getAllMeals);
router.get('/categories', mealController.getMealCategories);
router.get('/tags', mealController.getMealTags);
router.get('/stats', mealController.getMealStats);
router.get('/:id', mealController.getMealById);
router.post('/', mealUpload, mealController.validateMeal, mealController.createMeal);
router.put('/:id', mealUpload, mealController.validateMeal, mealController.updateMeal);
router.delete('/:id', mealController.deleteMeal);

module.exports = router;