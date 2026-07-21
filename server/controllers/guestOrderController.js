const path = require('path');
const mongoose = require('mongoose');
const GuestOrderSession = require('../models/guestOrderSessionModel');
const GuestOrder = require('../models/guestOrderModel');
const Meal = require('../models/mealModel');
const Household = require('../models/householdModel');
const { ensureUserHousehold } = require('../utils/household');
const {
  buildOrderSummary,
  cleanText,
  createCapabilityToken,
  effectiveSessionStatus,
  httpError,
  isSessionOpen,
  normalizeGuestName,
  normalizeOrderItems,
  shareUrl
} = require('../utils/guestOrders');

const SESSION_LIMIT = 30;
const DEFAULT_EXPIRY_HOURS = 72;
const MAX_EXPIRY_DAYS = 30;

function objectId(value, label = '记录') {
  if (!mongoose.isValidObjectId(value)) throw httpError(`${label}不存在`, 404);
  return value;
}

function dateOrNull(value) {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) throw httpError('日期格式不正确');
  return parsed;
}

function expiresAtFrom(value) {
  const now = Date.now();
  const parsed = value ? dateOrNull(value) : new Date(now + DEFAULT_EXPIRY_HOURS * 60 * 60 * 1000);
  if (parsed.getTime() < now + 60 * 60 * 1000) {
    throw httpError('点菜链接至少需保留 1 小时');
  }
  if (parsed.getTime() > now + MAX_EXPIRY_DAYS * 24 * 60 * 60 * 1000) {
    throw httpError(`点菜链接最长可保留 ${MAX_EXPIRY_DAYS} 天`);
  }
  return parsed;
}

function orderPayload(order) {
  const source = order?.toObject ? order.toObject() : order;
  if (!source) return null;
  return {
    id: String(source._id || source.id || ''),
    guestName: source.guestName,
    items: source.items || [],
    note: source.note || '',
    revision: source.revision || 1,
    submittedAt: source.submittedAt,
    updatedAt: source.updatedAt,
    createdAt: source.createdAt
  };
}

function sessionPayload(req, session, extra = {}) {
  const source = session?.toObject ? session.toObject() : session;
  const token = source?.shareToken || session?.shareToken || '';
  return {
    id: String(source?._id || source?.id || ''),
    title: source?.title || '来家里吃饭',
    eventAt: source?.eventAt || null,
    status: effectiveSessionStatus(source),
    storedStatus: source?.status || 'open',
    expiresAt: source?.expiresAt,
    closedAt: source?.closedAt || null,
    createdAt: source?.createdAt,
    updatedAt: source?.updatedAt,
    shareUrl: token ? shareUrl(req, token) : '',
    ...extra
  };
}

async function hostContext(req) {
  return ensureUserHousehold(req.user.uid);
}

async function hostSession(req, { includeToken = false } = {}) {
  const { household } = await hostContext(req);
  let query = GuestOrderSession.findOne({
    _id: objectId(req.params.id, '宴请'),
    householdId: household._id
  });
  if (includeToken) query = query.select('+shareToken');
  const session = await query;
  if (!session) throw httpError('未找到宴请', 404);
  return { household, session };
}

async function publicSessionByToken(token) {
  const normalized = cleanText(token, 120);
  if (!normalized) throw httpError('点菜链接无效', 404);
  const session = await GuestOrderSession.findOne({ shareToken: normalized }).select('+shareToken');
  if (!session) throw httpError('点菜链接不存在或已失效', 404);
  return session;
}

async function mealMapForItems(session, rawItems) {
  const ids = [...new Set((Array.isArray(rawItems) ? rawItems : [])
    .map(item => cleanText(item?.mealId || item?._id || item?.id, 64))
    .filter(Boolean))];
  if (ids.some(id => !mongoose.isValidObjectId(id))) {
    throw httpError('订单中包含不存在的菜品');
  }
  const meals = ids.length
    ? await Meal.find({ _id: { $in: ids }, householdId: session.householdId })
      .select('_id defaultKey name imageUrl')
      .lean()
    : [];
  return new Map(meals.map(meal => [String(meal._id), meal]));
}

exports.page = (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'guest-order.html'));
};

exports.list = async (req, res, next) => {
  try {
    const { household } = await hostContext(req);
    const query = { householdId: household._id };
    if (req.query.status && ['open', 'locked', 'completed', 'cancelled'].includes(req.query.status)) {
      query.status = req.query.status;
    }
    const sessions = await GuestOrderSession.find(query)
      .select('+shareToken')
      .sort({ createdAt: -1 })
      .limit(SESSION_LIMIT)
      .lean();
    const ids = sessions.map(item => item._id);
    const counts = ids.length ? await GuestOrder.aggregate([
      { $match: { sessionId: { $in: ids } } },
      { $group: {
        _id: '$sessionId',
        guestCount: { $sum: 1 },
        totalQuantity: { $sum: { $sum: '$items.quantity' } }
      } }
    ]) : [];
    const countById = new Map(counts.map(item => [String(item._id), item]));
    res.json({
      sessions: sessions.map(session => {
        const count = countById.get(String(session._id)) || {};
        return sessionPayload(req, session, {
          guestCount: count.guestCount || 0,
          totalQuantity: count.totalQuantity || 0
        });
      })
    });
  } catch (error) {
    next(error);
  }
};

exports.create = async (req, res, next) => {
  try {
    const { household } = await hostContext(req);
    const title = cleanText(req.body.title, 80) || '来家里吃饭';
    const session = await GuestOrderSession.create({
      householdId: household._id,
      createdBy: req.user.uid,
      title,
      eventAt: dateOrNull(req.body.eventAt),
      expiresAt: expiresAtFrom(req.body.expiresAt),
      shareToken: createCapabilityToken(),
      status: 'open'
    });
    res.status(201).json({
      session: sessionPayload(req, session, {
        guestCount: 0,
        totalQuantity: 0,
        summary: buildOrderSummary([]),
        orders: []
      })
    });
  } catch (error) {
    next(error);
  }
};

exports.detail = async (req, res, next) => {
  try {
    const { session } = await hostSession(req, { includeToken: true });
    const orders = await GuestOrder.find({ sessionId: session._id }).sort({ submittedAt: 1 }).lean();
    const summary = buildOrderSummary(orders);
    res.json({
      session: sessionPayload(req, session, {
        ...summary,
        summary,
        orders: orders.map(orderPayload)
      })
    });
  } catch (error) {
    next(error);
  }
};

exports.update = async (req, res, next) => {
  try {
    const { session } = await hostSession(req, { includeToken: true });
    const requestedStatus = cleanText(req.body.status, 20);
    if (requestedStatus) {
      const transitions = {
        open: ['locked', 'completed', 'cancelled'],
        locked: ['open', 'completed', 'cancelled'],
        completed: [],
        cancelled: []
      };
      if (requestedStatus !== session.status && !transitions[session.status].includes(requestedStatus)) {
        throw httpError('当前宴请状态不能执行这个操作', 409);
      }
      session.status = requestedStatus;
      session.closedAt = ['completed', 'cancelled'].includes(requestedStatus) ? new Date() : null;
    }
    if (Object.prototype.hasOwnProperty.call(req.body, 'title')) {
      const title = cleanText(req.body.title, 80);
      if (!title) throw httpError('宴请名称不能为空');
      session.title = title;
    }
    if (Object.prototype.hasOwnProperty.call(req.body, 'eventAt')) {
      session.eventAt = dateOrNull(req.body.eventAt);
    }
    await session.save();
    const orders = await GuestOrder.find({ sessionId: session._id }).sort({ submittedAt: 1 }).lean();
    const summary = buildOrderSummary(orders);
    res.json({ session: sessionPayload(req, session, { ...summary, summary, orders: orders.map(orderPayload) }) });
  } catch (error) {
    next(error);
  }
};

exports.rotateLink = async (req, res, next) => {
  try {
    const { session } = await hostSession(req, { includeToken: true });
    if (effectiveSessionStatus(session) === 'expired' || ['completed', 'cancelled'].includes(session.status)) {
      throw httpError('已结束的宴请不能刷新分享链接', 409);
    }
    session.shareToken = createCapabilityToken();
    await session.save();
    res.json({ session: sessionPayload(req, session) });
  } catch (error) {
    next(error);
  }
};

exports.publicDetail = async (req, res, next) => {
  try {
    const session = await publicSessionByToken(req.params.shareToken);
    const status = effectiveSessionStatus(session);
    const household = await Household.findById(session.householdId).select('name').lean();
    const statusOnly = req.query.statusOnly === '1';
    let meals = [];
    if (!statusOnly && !['cancelled', 'expired'].includes(status)) {
      meals = await Meal.find({ householdId: session.householdId })
        .select('_id defaultKey name category subcategory imageUrl description tags servingSize prepTime cookTime taste spiceLevel isDefault')
        .sort({ isDefault: -1, category: 1, name: 1 })
        .limit(600)
        .lean();
    }
    res.json({
      session: {
        id: String(session._id),
        title: session.title,
        householdName: cleanText(household?.name, 40) || '主人家',
        eventAt: session.eventAt,
        status,
        canOrder: status === 'open',
        expiresAt: session.expiresAt
      },
      ...(statusOnly ? {} : { meals })
    });
  } catch (error) {
    next(error);
  }
};

exports.createPublicOrder = async (req, res, next) => {
  try {
    const session = await publicSessionByToken(req.params.shareToken);
    if (!isSessionOpen(session)) throw httpError('本次点菜已经锁单或结束', 409);
    const existingOrders = await GuestOrder.countDocuments({ sessionId: session._id });
    if (existingOrders >= 100) throw httpError('本次点菜人数已达上限，请联系主人', 429);
    const mealsById = await mealMapForItems(session, req.body.items);
    const order = await GuestOrder.create({
      sessionId: session._id,
      householdId: session.householdId,
      guestName: normalizeGuestName(req.body.guestName),
      accessToken: createCapabilityToken(),
      items: normalizeOrderItems(req.body.items, mealsById),
      note: cleanText(req.body.note, 300),
      revision: 1,
      submittedAt: new Date()
    });
    const withToken = await GuestOrder.findById(order._id).select('+accessToken').lean();
    res.status(201).json({
      accessToken: withToken.accessToken,
      order: orderPayload(withToken)
    });
  } catch (error) {
    next(error);
  }
};

exports.publicOrder = async (req, res, next) => {
  try {
    const session = await publicSessionByToken(req.params.shareToken);
    const token = cleanText(req.params.accessToken, 120);
    const order = await GuestOrder.findOne({ sessionId: session._id, accessToken: token }).lean();
    if (!order) throw httpError('未找到你的点菜单', 404);
    res.json({ order: orderPayload(order), canEdit: isSessionOpen(session) });
  } catch (error) {
    next(error);
  }
};

exports.updatePublicOrder = async (req, res, next) => {
  try {
    const session = await publicSessionByToken(req.params.shareToken);
    if (!isSessionOpen(session)) throw httpError('本次点菜已经锁单或结束', 409);
    const token = cleanText(req.params.accessToken, 120);
    const expectedRevision = Number(req.body.revision);
    if (!Number.isInteger(expectedRevision) || expectedRevision < 1) {
      throw httpError('订单版本无效，请刷新后重试', 409);
    }
    const mealsById = await mealMapForItems(session, req.body.items);
    const update = {
      guestName: normalizeGuestName(req.body.guestName),
      items: normalizeOrderItems(req.body.items, mealsById),
      note: cleanText(req.body.note, 300),
      submittedAt: new Date()
    };
    const order = await GuestOrder.findOneAndUpdate(
      { sessionId: session._id, accessToken: token, revision: expectedRevision },
      { $set: update, $inc: { revision: 1 } },
      { new: true, runValidators: true }
    ).lean();
    if (!order) {
      const exists = await GuestOrder.exists({ sessionId: session._id, accessToken: token });
      if (exists) throw httpError('订单已在其他设备更新，请刷新后重试', 409);
      throw httpError('未找到你的点菜单', 404);
    }
    res.json({ order: orderPayload(order) });
  } catch (error) {
    next(error);
  }
};
