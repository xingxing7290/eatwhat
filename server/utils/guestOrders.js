const crypto = require('crypto');

function httpError(message, status = 400) {
  const error = new Error(message);
  error.status = status;
  return error;
}

function cleanText(value, maxLength) {
  return String(value || '').trim().replace(/\s+/g, ' ').slice(0, maxLength);
}

function createCapabilityToken(bytes = 32) {
  return crypto.randomBytes(bytes).toString('base64url');
}

function effectiveSessionStatus(session, now = new Date()) {
  const status = String(session?.status || 'open');
  const expiresAt = session?.expiresAt ? new Date(session.expiresAt) : null;
  if (status === 'open' && expiresAt && expiresAt.getTime() <= now.getTime()) {
    return 'expired';
  }
  return status;
}

function isSessionOpen(session, now = new Date()) {
  return effectiveSessionStatus(session, now) === 'open';
}

function normalizeGuestName(value) {
  const name = cleanText(value, 30);
  if (!name) throw httpError('请先填写称呼');
  return name;
}

function normalizeOrderItems(rawItems, mealsById) {
  if (!Array.isArray(rawItems) || rawItems.length === 0) {
    throw httpError('请至少选择一道菜');
  }
  if (rawItems.length > 50) {
    throw httpError('单次最多选择 50 道菜');
  }

  const merged = new Map();
  for (const raw of rawItems) {
    const mealId = cleanText(raw?.mealId || raw?._id || raw?.id, 64);
    const meal = mealsById.get(mealId);
    if (!meal) throw httpError('订单中包含不存在的菜品');
    const parsedQuantity = Number(raw?.quantity ?? 1);
    if (!Number.isInteger(parsedQuantity) || parsedQuantity < 1 || parsedQuantity > 20) {
      throw httpError('每道菜的数量需为 1 至 20');
    }
    const previous = merged.get(mealId);
    const quantity = (previous?.quantity || 0) + parsedQuantity;
    if (quantity > 20) throw httpError('同一道菜最多选择 20 份');
    merged.set(mealId, {
      mealId: meal._id,
      defaultKey: cleanText(meal.defaultKey, 100),
      name: cleanText(meal.name, 100),
      imageUrl: cleanText(meal.imageUrl, 500),
      quantity,
      note: cleanText(raw?.note || previous?.note, 120)
    });
  }
  return [...merged.values()];
}

function buildOrderSummary(orders) {
  const dishes = new Map();
  let totalQuantity = 0;
  for (const order of orders || []) {
    const guestName = cleanText(order?.guestName, 30) || '客人';
    for (const item of order?.items || []) {
      const mealId = String(item?.mealId?._id || item?.mealId || '');
      const key = mealId || cleanText(item?.name, 100);
      if (!key) continue;
      const quantity = Math.max(0, Number(item?.quantity || 0));
      totalQuantity += quantity;
      const current = dishes.get(key) || {
        mealId,
        defaultKey: cleanText(item?.defaultKey, 100),
        name: cleanText(item?.name, 100),
        imageUrl: cleanText(item?.imageUrl, 500),
        quantity: 0,
        guestNames: [],
        notes: []
      };
      current.quantity += quantity;
      if (!current.guestNames.includes(guestName)) current.guestNames.push(guestName);
      const note = cleanText(item?.note, 120);
      if (note) current.notes.push(`${guestName}：${note}`);
      dishes.set(key, current);
    }
  }
  const dishList = [...dishes.values()].sort((a, b) => {
    const quantityDiff = b.quantity - a.quantity;
    return quantityDiff || a.name.localeCompare(b.name, 'zh-CN');
  });
  return {
    guestCount: (orders || []).length,
    orderCount: (orders || []).length,
    dishCount: dishList.length,
    totalQuantity,
    dishes: dishList
  };
}

function requestOrigin(req) {
  const configured = cleanText(process.env.PUBLIC_BASE_URL, 500).replace(/\/$/, '');
  if (configured) return configured;
  const forwardedProto = cleanText(req.headers['x-forwarded-proto'], 30).split(',')[0];
  const protocol = forwardedProto || req.protocol || 'http';
  const forwardedHost = cleanText(req.headers['x-forwarded-host'], 300).split(',')[0];
  const host = forwardedHost || req.get('host');
  return `${protocol}://${host}`;
}

function shareUrl(req, token) {
  return `${requestOrigin(req)}/guest-order/${encodeURIComponent(token)}`;
}

module.exports = {
  buildOrderSummary,
  cleanText,
  createCapabilityToken,
  effectiveSessionStatus,
  httpError,
  isSessionOpen,
  normalizeGuestName,
  normalizeOrderItems,
  requestOrigin,
  shareUrl
};
