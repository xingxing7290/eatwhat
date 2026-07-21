const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const GuestOrderSession = require('../models/guestOrderSessionModel');
const GuestOrder = require('../models/guestOrderModel');

const baseUrl = String(process.env.SMOKE_BASE_URL || `http://127.0.0.1:${process.env.PORT || 3000}`).replace(/\/$/, '');
const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/whateat';
const jwtSecret = process.env.JWT_SECRET || 'dev_secret_change_me';

let createdSessionId = null;

async function request(path, options = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers: {
      Accept: 'application/json, text/html',
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...(options.headers || {})
    }
  });
  const text = await response.text();
  let body = text;
  try { body = text ? JSON.parse(text) : {}; } catch (_) {}
  return { response, body, text };
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function main() {
  await mongoose.connect(mongoUri);
  const user = await User.findOne({ householdId: { $ne: null } }).select('_id username householdId').lean();
  assert(user, '没有可用于冒烟测试的家庭用户');
  const authToken = jwt.sign({ uid: String(user._id), username: user.username || 'smoke' }, jwtSecret, { expiresIn: '10m' });
  const authHeaders = { Authorization: `Bearer ${authToken}` };

  const created = await request('/guest-orders', {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({ title: '自动验收家宴' })
  });
  assert(created.response.status === 201, `创建宴请失败: ${created.response.status} ${created.text}`);
  const session = created.body.session;
  createdSessionId = session.id;
  assert(session.status === 'open', '新宴请不是开放状态');
  assert(session.shareUrl, '创建宴请未返回分享链接');
  const sharePath = new URL(session.shareUrl).pathname;
  const shareToken = decodeURIComponent(sharePath.split('/').filter(Boolean).pop());

  const page = await request(`/guest-order/${encodeURIComponent(shareToken)}`);
  assert(page.response.status === 200 && page.text.includes('客人点菜'), '访客点菜网页不可访问');

  const publicMenu = await request(`/guest-orders/public/${encodeURIComponent(shareToken)}`);
  assert(publicMenu.response.status === 200, `访客菜单失败: ${publicMenu.response.status}`);
  assert(publicMenu.body.session?.canOrder === true, '访客菜单没有开放点菜');
  assert(Array.isArray(publicMenu.body.meals) && publicMenu.body.meals.length >= 407, '访客菜单没有返回完整家庭菜谱');
  const [firstMeal, secondMeal] = publicMenu.body.meals;

  const submitted = await request(`/guest-orders/public/${encodeURIComponent(shareToken)}/orders`, {
    method: 'POST',
    body: JSON.stringify({
      guestName: '自动验收客人',
      note: '整体少辣',
      items: [
        { mealId: firstMeal._id, quantity: 2, note: '少糖' },
        { mealId: secondMeal._id, quantity: 1 }
      ]
    })
  });
  assert(submitted.response.status === 201, `提交点菜单失败: ${submitted.response.status} ${submitted.text}`);
  assert(submitted.body.accessToken, '提交后没有返回改单令牌');
  assert(submitted.body.order?.revision === 1, '新订单版本号不正确');

  const hostDetail = await request(`/guest-orders/${createdSessionId}`, { headers: authHeaders });
  assert(hostDetail.response.status === 200, '主人无法读取宴请桌单');
  assert(hostDetail.body.session?.guestCount === 1, '主人端客人数汇总错误');
  assert(hostDetail.body.session?.dishCount === 2, '主人端菜品数汇总错误');
  assert(hostDetail.body.session?.totalQuantity === 3, '主人端份数汇总错误');

  const updated = await request(`/guest-orders/public/${encodeURIComponent(shareToken)}/orders/${encodeURIComponent(submitted.body.accessToken)}`, {
    method: 'PUT',
    body: JSON.stringify({
      guestName: '自动验收客人',
      note: '改成七点到',
      revision: 1,
      items: [{ mealId: firstMeal._id, quantity: 1 }]
    })
  });
  assert(updated.response.status === 200 && updated.body.order?.revision === 2, '访客改单失败');

  const locked = await request(`/guest-orders/${createdSessionId}`, {
    method: 'PATCH',
    headers: authHeaders,
    body: JSON.stringify({ status: 'locked' })
  });
  assert(locked.response.status === 200 && locked.body.session?.status === 'locked', '主人锁单失败');

  const blockedUpdate = await request(`/guest-orders/public/${encodeURIComponent(shareToken)}/orders/${encodeURIComponent(submitted.body.accessToken)}`, {
    method: 'PUT',
    body: JSON.stringify({
      guestName: '自动验收客人',
      revision: 2,
      items: [{ mealId: firstMeal._id, quantity: 2 }]
    })
  });
  assert(blockedUpdate.response.status === 409, '锁单后仍能修改订单');

  console.log(JSON.stringify({
    passed: true,
    menuMeals: publicMenu.body.meals.length,
    guestCount: hostDetail.body.session.guestCount,
    dishCount: hostDetail.body.session.dishCount,
    totalQuantity: hostDetail.body.session.totalQuantity,
    updateRevision: updated.body.order.revision,
    lockedUpdateStatus: blockedUpdate.response.status
  }, null, 2));
}

main()
  .catch(error => {
    console.error(error.message || error);
    process.exitCode = 1;
  })
  .finally(async () => {
    if (createdSessionId) {
      await GuestOrder.deleteMany({ sessionId: createdSessionId });
      await GuestOrderSession.deleteOne({ _id: createdSessionId });
    }
    await mongoose.disconnect();
  });
