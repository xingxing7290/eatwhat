const test = require('node:test');
const assert = require('node:assert/strict');
const {
  buildOrderSummary,
  createCapabilityToken,
  effectiveSessionStatus,
  normalizeGuestName,
  normalizeOrderItems,
  shareUrl
} = require('../utils/guestOrders');
const {
  safeRequestBody,
  safeRequestHeaders,
  safeRequestUrl
} = require('../utils/requestLog');

function meal(id, name, extra = {}) {
  return {
    _id: id,
    name,
    defaultKey: extra.defaultKey || '',
    imageUrl: extra.imageUrl || ''
  };
}

test('capability tokens are URL safe and have enough entropy', () => {
  const first = createCapabilityToken();
  const second = createCapabilityToken();
  assert.match(first, /^[A-Za-z0-9_-]{40,}$/);
  assert.notEqual(first, second);
});

test('effective session status treats only expired open sessions as expired', () => {
  const now = new Date('2026-07-21T12:00:00.000Z');
  assert.equal(effectiveSessionStatus({ status: 'open', expiresAt: '2026-07-21T11:00:00.000Z' }, now), 'expired');
  assert.equal(effectiveSessionStatus({ status: 'open', expiresAt: '2026-07-22T11:00:00.000Z' }, now), 'open');
  assert.equal(effectiveSessionStatus({ status: 'locked', expiresAt: '2026-07-21T11:00:00.000Z' }, now), 'locked');
});

test('guest name is required and normalized', () => {
  assert.equal(normalizeGuestName('  小   王  '), '小 王');
  assert.throws(() => normalizeGuestName('   '), /请先填写称呼/);
});

test('order items are validated, merged and snapshotted from household meals', () => {
  const meals = new Map([
    ['meal-a', meal('meal-a', '红烧肉', { defaultKey: 'hong-shao-rou', imageUrl: '/a.jpg' })],
    ['meal-b', meal('meal-b', '清蒸鲈鱼')]
  ]);
  const items = normalizeOrderItems([
    { mealId: 'meal-a', quantity: 1, note: ' 少糖 ' },
    { mealId: 'meal-a', quantity: 2 },
    { mealId: 'meal-b', quantity: 1 }
  ], meals);
  assert.equal(items.length, 2);
  assert.deepEqual(items[0], {
    mealId: 'meal-a',
    defaultKey: 'hong-shao-rou',
    name: '红烧肉',
    imageUrl: '/a.jpg',
    quantity: 3,
    note: '少糖'
  });
  assert.throws(() => normalizeOrderItems([], meals), /至少选择一道菜/);
  assert.throws(() => normalizeOrderItems([{ mealId: 'missing', quantity: 1 }], meals), /不存在的菜品/);
  assert.throws(() => normalizeOrderItems([{ mealId: 'meal-a', quantity: 21 }], meals), /1 至 20/);
});

test('order summary aggregates quantities, guests and item notes', () => {
  const summary = buildOrderSummary([
    { guestName: '小王', items: [{ mealId: 'a', name: '红烧肉', quantity: 2, note: '少糖' }] },
    { guestName: '小李', items: [
      { mealId: 'a', name: '红烧肉', quantity: 1 },
      { mealId: 'b', name: '清蒸鲈鱼', quantity: 1, note: '不要葱' }
    ] }
  ]);
  assert.equal(summary.guestCount, 2);
  assert.equal(summary.dishCount, 2);
  assert.equal(summary.totalQuantity, 4);
  assert.equal(summary.dishes[0].name, '红烧肉');
  assert.equal(summary.dishes[0].quantity, 3);
  assert.deepEqual(summary.dishes[0].guestNames, ['小王', '小李']);
  assert.deepEqual(summary.dishes[1].notes, ['小李：不要葱']);
});

test('share URL prefers configured public base and otherwise uses forwarding headers', () => {
  const original = process.env.PUBLIC_BASE_URL;
  try {
    process.env.PUBLIC_BASE_URL = 'https://eat.example.com/';
    assert.equal(shareUrl({ headers: {}, protocol: 'http', get: () => 'localhost:3000' }, 'abc'), 'https://eat.example.com/guest-order/abc');
    delete process.env.PUBLIC_BASE_URL;
    assert.equal(shareUrl({
      headers: { 'x-forwarded-proto': 'https', 'x-forwarded-host': 'food.example.com' },
      protocol: 'http',
      get: () => 'localhost:3000'
    }, 'a/b'), 'https://food.example.com/guest-order/a%2Fb');
  } finally {
    if (original === undefined) delete process.env.PUBLIC_BASE_URL;
    else process.env.PUBLIC_BASE_URL = original;
  }
});

test('request logging redacts capability tokens and private guest fields', () => {
  assert.equal(
    safeRequestUrl('/guest-orders/public/share-secret/orders/order-secret'),
    '/guest-orders/public/[share-token]/orders/[order-token]'
  );
  assert.deepEqual(safeRequestHeaders({ authorization: 'Bearer secret', host: 'example.test' }), {
    authorization: '[redacted]',
    host: 'example.test'
  });
  assert.deepEqual(safeRequestBody({
    originalUrl: '/guest-orders/public/share-secret/orders',
    body: {
      guestName: 'Guest',
      note: 'Private note',
      items: [{ mealId: '1', quantity: 2, note: 'No spice' }],
      revision: 3
    }
  }), {
    guestName: '[redacted]',
    itemCount: 1,
    hasNote: true,
    revision: 3
  });
});
