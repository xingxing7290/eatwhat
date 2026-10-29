const test = require('node:test');
const assert = require('node:assert/strict');
const { _balanceHintsForDay: hints } = require('../controllers/weeklyPlanController');

const schedule = (...meals) => ({ meals: { breakfast: [], lunch: meals.map(meal => ({ meal })), dinner: [] } });

test('missing or zero cooking time does not imply a quick recipe', () => {
  for (const cookTime of [undefined, null, 0, 16]) assert.equal(hints(schedule({ name: '红烧肉', cookTime })).includes('包含快手菜'), false);
  assert.equal(hints(schedule({ name: '炒鸡蛋', cookTime: 15 })).includes('包含快手菜'), true);
  assert.equal(hints(schedule({ name: '炒鸡蛋', healthTags: ['快手'] })).includes('包含快手菜'), true);
});

test('vegetable hints use ingredient evidence and acknowledge heuristic uncertainty', () => {
  assert.ok(hints(schedule({ name: '梅菜扣肉' })).includes('未识别到蔬菜，请核对食材'));
  assert.equal(hints(schedule({ name: '家常炒肉', ingredients: [{ name: '西兰花' }] })).includes('未识别到蔬菜，请核对食材'), false);
  assert.deepEqual(hints(schedule()), []);
  assert.ok(hints(schedule({ name: '菜一', spiceLevel: 4 }, { name: '菜二', spiceLevel: 4 })).includes('口味可能偏重，请自行核对'));
});
