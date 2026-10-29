const path = require('path');
const crypto = require('crypto');
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

function sessionHasFutureExpiry(session) {
  const time = session?.expiresAt ? new Date(session.expiresAt).getTime() : NaN;
  return Number.isFinite(time) && time > Date.now();
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
  const updated = source?.updatedAt ? new Date(source.updatedAt) : null;
  const validVersion = !updated || Number.isFinite(updated.getTime());
  return {
    id: String(source?._id || source?.id || ''),
    householdId: String(source?.householdId || ''),
    title: source?.title || '来家里吃饭',
    eventAt: source?.eventAt || null,
    status: effectiveSessionStatus(source),
    storedStatus: source?.status || 'open',
    expiresAt: source?.expiresAt,
    closedAt: source?.closedAt || null,
    createdAt: source?.createdAt,
    updatedAt: source?.updatedAt,
    supportsConditionalSession: validVersion,
    editVersion: validVersion ? { revision: source?.editRevision || null, updatedAt: updated ? updated.toISOString() : null } : null,
    shareUrl: token ? shareUrl(req, token) : '',
    ...extra
  };
}

function conditionalVersion(body) {
  if (!Object.prototype.hasOwnProperty.call(body || {}, 'expectedEditVersion')) return undefined;
  const version = body.expectedEditVersion;
  if (!version || typeof version !== 'object' || Array.isArray(version) || !Object.prototype.hasOwnProperty.call(version, 'revision') || !Object.prototype.hasOwnProperty.call(version, 'updatedAt') || (version.revision !== null && (typeof version.revision !== 'string' || !version.revision || version.revision.length > 128)) || (version.updatedAt !== null && (typeof version.updatedAt !== 'string' || !Number.isFinite(Date.parse(version.updatedAt))))) throw httpError('宴请版本无效，请重新加载', 400);
  return version;
}

function versionFilter(session, version) {
  return { _id: session._id, householdId: session.householdId, editRevision: version.revision, updatedAt: version.updatedAt === null ? null : new Date(version.updatedAt) };
}

exports.capabilities = async (req, res, next) => {
  try { const { household } = await hostContext(req); res.json({ householdId: String(household._id), supportsConditionalSession: true, supportsIdempotentSessionCreate: true, supportsSessionPagination: true }); }
  catch (error) { next(error); }
};

async function hostContext(req) {
  return ensureUserHousehold(req.user.uid, 0, req.expectedHouseholdId);
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
  if (Array.isArray(rawItems) && rawItems.length > 50) throw httpError('单次最多选择 50 道菜');
  const ids = [...new Set((Array.isArray(rawItems) ? rawItems : [])
    .map(item => cleanText(item?.mealId || item?._id || item?.id, 64))
    .filter(Boolean))];
  if (ids.some(id => !mongoose.isValidObjectId(id))) {
    throw httpError('订单中包含不存在的菜品');
  }
  const meals = ids.length
    ? await Meal.find({ _id: { $in: ids }, householdId: session.householdId, archived: { $ne: true } })
      .select('_id defaultKey name imageUrl')
      .lean()
    : [];
  const mealMap = new Map(meals.map(meal => [String(meal._id), meal]));
  const unavailableIds = ids.filter(id => !mealMap.has(id));
  if (unavailableIds.length) {
    const error = httpError('部分菜品已下架或不可用，请核对点菜单', 409);
    error.code = 'GUEST_MEAL_UNAVAILABLE';
    error.unavailableIds = unavailableIds;
    throw error;
  }
  return mealMap;
}

function handlePublicOrderError(error, res, next) {
  if (error.code === 'GUEST_MEAL_UNAVAILABLE') return res.status(409).json({ code: error.code, error: error.message, unavailableIds: error.unavailableIds });
  if (error.code === 'GUEST_ORDER_CONFLICT') return res.status(409).json({ code: error.code, error: error.message });
  if (error.code === 'GUEST_SESSION_CLOSED') return res.status(409).json({ code: error.code, error: error.message });
  return next(error);
}
function closedGuestSession() { const error = httpError('本次点菜已经锁单或结束', 409); error.code = 'GUEST_SESSION_CLOSED'; return error; }

function creationIdentity(session, body) {
  const key = body?.creationKey;
  if (typeof key !== 'string' || !/^[A-Za-z0-9_-]{43}$/.test(key)) throw httpError('安全提交凭证无效', 400);
  const raw = body?.items;
  if (!Array.isArray(raw) || !raw.length || raw.length > 50) throw httpError('每次需选择 1 至 50 道菜', 400);
  const fakeMeals = new Map();
  for (const item of raw) {
    const id = cleanText(item?.mealId || item?._id || item?.id, 64);
    if (!/^[a-f0-9]{24}$/.test(id)) throw httpError('订单中包含无效菜品', 400);
    fakeMeals.set(id, { _id: id, name: 'item' });
  }
  const items = normalizeOrderItems(raw, fakeMeals).map(item => ({ mealId: item.mealId, quantity: item.quantity, note: item.note }));
  const payload = JSON.stringify({ guestName: normalizeGuestName(body.guestName), note: cleanText(body.note, 300), items });
  const orderId = new mongoose.Types.ObjectId(crypto.createHash('sha256').update('eatwhat-guest-order-v1\0').update(String(session._id)).update('\0').update(key).digest('hex').slice(0, 24));
  const fingerprint = crypto.createHmac('sha256', key).update(payload).digest('hex');
  return { orderId, fingerprint };
}

async function replayCreatedOrder(session, identity) {
  const order = await GuestOrder.findById(identity.orderId).select('+accessToken +creationFingerprint').lean();
  if (!order) return null;
  if (String(order.sessionId) !== String(session._id) || order.creationFingerprint !== identity.fingerprint || !order.accessToken) {
    throw httpError('安全提交凭证已用于其他内容，请联系主人核对', 409);
  }
  return order;
}

exports.page = (req, res) => {
  res.set('Cache-Control', 'private, no-store');
  res.set('Referrer-Policy', 'no-referrer');
  res.sendFile(path.join(__dirname, '..', 'public', 'guest-order.html'));
};

exports.list = async (req, res, next) => {
  try {
    const { household } = await hostContext(req);
    const query = { householdId: household._id };
    const paginated = Object.prototype.hasOwnProperty.call(req.query, 'page');
    let page; let limit; let total;
    if (paginated) {
      page = Number(req.query.page); limit = req.query.limit === undefined ? 12 : Number(req.query.limit);
      if (!Number.isSafeInteger(page) || page < 1 || page > 1000000 || !Number.isSafeInteger(limit) || limit < 1 || limit > 50) throw httpError('宴请分页参数无效', 400);
      if ((req.query.search !== undefined && typeof req.query.search !== 'string') || (req.query.status !== undefined && typeof req.query.status !== 'string')) throw httpError('宴请筛选参数无效', 400);
      const search = String(req.query.search || '').trim(); const status = String(req.query.status || '').trim();
      if (search.length > 80 || (status && !['open', 'locked', 'completed', 'cancelled', 'expired'].includes(status))) throw httpError('宴请筛选参数无效', 400);
      if (search) {
        const titleMatch = { $regex: search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' };
        if ('来家里吃饭'.includes(search)) query.$or = [{ title: titleMatch }, { title: null }, { title: '' }];
        else query.title = titleMatch;
      }
      if (status === 'open' || status === 'expired') {
        const expires = { $convert: { input: '$expiresAt', to: 'date', onError: null, onNull: null } };
        const expired = { $and: [{ $ne: [expires, null] }, { $lte: [expires, new Date()] }] };
        const open = { $in: [{ $ifNull: ['$status', ''] }, ['open', '', false, 0]] };
        query.$expr = { $and: [open, status === 'expired' ? expired : { $not: [expired] }] };
      } else if (status) query.status = status;
    } else if (req.query.status && ['open', 'locked', 'completed', 'cancelled'].includes(req.query.status)) {
      query.status = req.query.status;
    }
    let sessionQuery = GuestOrderSession.find(query).select('+shareToken').sort({ createdAt: -1, _id: -1 });
    if (paginated) sessionQuery = sessionQuery.skip((page - 1) * limit).limit(limit);
    else sessionQuery = sessionQuery.limit(SESSION_LIMIT);
    let sessions;
    if (paginated) [total, sessions] = await Promise.all([GuestOrderSession.countDocuments(query), sessionQuery.lean()]);
    else sessions = await sessionQuery.lean();
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
      ...(paginated ? { householdId: String(household._id), pagination: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) } } : {}),
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

exports.createIdempotent = async (req, res, next) => {
  try {
    const { household } = await hostContext(req);
    const key = req.body?.creationKey;
    if (typeof req.body?.expectedHouseholdId !== 'string' || req.body.expectedHouseholdId !== String(household._id)) return res.status(409).json({ code: 'GUEST_HOUSEHOLD_CHANGED', error: '当前家庭已变化，请重新核对后创建' });
    if (typeof key !== 'string' || !/^[A-Za-z0-9_-]{43}$/.test(key)) throw httpError('安全创建凭证无效', 400);
    const title = cleanText(req.body.title, 80) || '来家里吃饭';
    const eventAt = dateOrNull(req.body.eventAt);
    const expiresAt = dateOrNull(req.body.expiresAt);
    if (!expiresAt) throw httpError('请提供链接有效期', 400);
    const payload = JSON.stringify({ title, eventAt: eventAt?.toISOString() || null, expiresAt: expiresAt.toISOString() });
    const id = new mongoose.Types.ObjectId(crypto.createHash('sha256').update('eatwhat-host-session-v1\0').update(String(household._id)).update('\0').update(key).digest('hex').slice(0, 24));
    const fingerprint = crypto.createHmac('sha256', key).update(payload).digest('hex');
    const replay = async () => {
      const item = await GuestOrderSession.findById(id).select('+shareToken +creationFingerprint');
      if (!item) return null;
      if (String(item.householdId) !== String(household._id) || item.creationFingerprint !== fingerprint || !item.shareToken) throw httpError('安全创建凭证已用于其他内容，请先核对', 409);
      return item;
    };
    let session = await replay();
    let replayed = !!session;
    if (!session) {
      try {
        await GuestOrderSession.create({ _id: id, householdId: household._id, createdBy: req.user.uid, title, eventAt, expiresAt: expiresAtFrom(expiresAt), shareToken: createCapabilityToken(), status: 'open', creationFingerprint: fingerprint });
      } catch (error) {
        if (error?.code !== 11000) throw error;
        session = await replay();
        if (!session) throw error;
        replayed = true;
      }
      if (!session) session = await replay();
    }
    if (!session) throw new Error('无法确认新建的宴请');
    const orders = await GuestOrder.find({ sessionId: session._id }).sort({ submittedAt: 1 }).lean();
    const summary = buildOrderSummary(orders);
    return res.status(replayed ? 200 : 201).json({ session: sessionPayload(req, session, { ...summary, summary, orders: orders.map(orderPayload) }), replayed });
  } catch (error) { next(error); }
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
    if (error.status === 404) return res.status(404).json({ code: 'GUEST_SESSION_NOT_FOUND', error: error.message });
    next(error);
  }
};

exports.update = async (req, res, next) => {
  try {
    let { session } = await hostSession(req, { includeToken: true });
    const expected = conditionalVersion(req.body);
    const changes = {};
    const requestedStatus = cleanText(req.body.status, 20);
    if (requestedStatus) {
      if (requestedStatus === 'open' && !sessionHasFutureExpiry(session)) throw httpError('点菜链接已过期，不能重新开放', 409);
      const transitions = {
        open: ['locked', 'completed', 'cancelled'],
        locked: ['open', 'completed', 'cancelled'],
        completed: [],
        cancelled: []
      };
      if (requestedStatus !== session.status && !transitions[session.status].includes(requestedStatus)) {
        throw httpError('当前宴请状态不能执行这个操作', 409);
      }
      changes.status = requestedStatus;
      changes.closedAt = ['completed', 'cancelled'].includes(requestedStatus) ? new Date() : null;
    }
    if (Object.prototype.hasOwnProperty.call(req.body, 'title')) {
      const title = cleanText(req.body.title, 80);
      if (!title) throw httpError('宴请名称不能为空');
      changes.title = title;
    }
    if (Object.prototype.hasOwnProperty.call(req.body, 'eventAt')) {
      changes.eventAt = dateOrNull(req.body.eventAt);
    }
    if (expected) {
      const filter = versionFilter(session, expected);
      if (requestedStatus === 'open') filter.expiresAt = { $gt: new Date() };
      session = await GuestOrderSession.findOneAndUpdate(filter, { $set: changes }, { new: true, runValidators: true }).select('+shareToken');
      if (!session) return res.status(409).json({ code: 'GUEST_SESSION_CONFLICT', error: '宴请已被其他成员更新，请重新核对' });
    } else { Object.assign(session, changes); await session.save(); }
    const orders = await GuestOrder.find({ sessionId: session._id }).sort({ submittedAt: 1 }).lean();
    const summary = buildOrderSummary(orders);
    res.json({ session: sessionPayload(req, session, { ...summary, summary, orders: orders.map(orderPayload) }) });
  } catch (error) {
    next(error);
  }
};

exports.rotateLink = async (req, res, next) => {
  try {
    let { session } = await hostSession(req, { includeToken: true });
    const expected = conditionalVersion(req.body);
    if (!sessionHasFutureExpiry(session) || ['completed', 'cancelled'].includes(session.status)) {
      throw httpError('已结束的宴请不能刷新分享链接', 409);
    }
    const newToken = createCapabilityToken();
    if (expected) {
      session = await GuestOrderSession.findOneAndUpdate({ ...versionFilter(session, expected), expiresAt: { $gt: new Date() } }, { $set: { shareToken: newToken } }, { new: true, runValidators: true }).select('+shareToken');
      if (!session) return res.status(409).json({ code: 'GUEST_SESSION_CONFLICT', error: '宴请已被其他成员更新，请重新核对' });
    } else { session.shareToken = newToken; await session.save(); }
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
    const paginated = !statusOnly && Object.prototype.hasOwnProperty.call(req.query, 'page');
    let meals = [];
    let menu;
    if (paginated) {
      const page = Number(req.query.page);
      const limit = req.query.limit === undefined ? 24 : Number(req.query.limit);
      if (!Number.isSafeInteger(page) || page < 1 || page > 1000000 || !Number.isSafeInteger(limit) || limit < 1 || limit > 48) throw httpError('菜单分页参数无效', 400);
      if ((req.query.search !== undefined && typeof req.query.search !== 'string') || (req.query.category !== undefined && typeof req.query.category !== 'string')) throw httpError('菜单筛选参数无效', 400);
      const search = String(req.query.search || '').trim();
      const category = String(req.query.category || '').trim();
      if (search.length > 100 || category.length > 1000) throw httpError('菜单筛选条件过长', 400);
      let total = 0; let categories = [];
      if (!['cancelled', 'expired'].includes(status)) {
        const base = { householdId: session.householdId, archived: { $ne: true } };
        if (search) {
          const literal = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          base.$or = ['name', 'category', 'subcategory', 'description', 'tags', 'taste'].map(field => ({ [field]: { $regex: literal, $options: 'i' } }));
        }
        const query = { ...base };
        if (category) query.category = category === '其他' ? { $in: ['', null, '其他'] } : category;
        const categoryExpr = { $cond: [{ $in: [{ $ifNull: ['$category', ''] }, ['', '其他']] }, '其他', '$category'] };
        [total, meals, categories] = await Promise.all([
          Meal.countDocuments(query),
          Meal.find(query).select('_id defaultKey name category subcategory imageUrl description tags servingSize prepTime cookTime taste spiceLevel isDefault')
            .sort({ isDefault: -1, category: 1, name: 1, _id: 1 }).skip((page - 1) * limit).limit(limit).lean(),
          Meal.aggregate([{ $match: base }, { $group: { _id: categoryExpr, count: { $sum: 1 } } }, { $sort: { _id: 1 } }])
        ]);
      }
      menu = { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)), categories: categories.map(row => ({ name: row._id, count: row.count })) };
    }
    if (!statusOnly && !paginated && !['cancelled', 'expired'].includes(status)) {
      meals = await Meal.find({ householdId: session.householdId, archived: { $ne: true } })
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
        expiresAt: session.expiresAt,
        supportsIdempotentCreate: true,
        supportsGuestMenuPagination: true
      },
      ...(statusOnly ? {} : { meals, ...(paginated ? { menu } : {}) })
    });
  } catch (error) {
    next(error);
  }
};

// A dedicated endpoint cannot silently fall back to the legacy create path on
// an older server. The deterministic _id uses MongoDB's existing unique index;
// no migration or new production index is needed.
exports.createPublicOrderIdempotent = async (req, res, next) => {
  try {
    const session = await publicSessionByToken(req.params.shareToken);
    const identity = creationIdentity(session, req.body);
    let existing = await replayCreatedOrder(session, identity);
    if (existing) return res.status(200).json({ accessToken: existing.accessToken, order: orderPayload(existing), replayed: true });
    if (!isSessionOpen(session)) throw closedGuestSession();
    if (await GuestOrder.countDocuments({ sessionId: session._id }) >= 100) throw httpError('本次点菜人数已达上限，请联系主人', 429);
    const mealsById = await mealMapForItems(session, req.body.items);
    try {
      await GuestOrder.create({
        _id: identity.orderId, sessionId: session._id, householdId: session.householdId,
        guestName: normalizeGuestName(req.body.guestName), accessToken: createCapabilityToken(),
        creationFingerprint: identity.fingerprint, items: normalizeOrderItems(req.body.items, mealsById),
        note: cleanText(req.body.note, 300), revision: 1, submittedAt: new Date()
      });
    } catch (error) {
      if (error?.code !== 11000) throw error;
      existing = await replayCreatedOrder(session, identity);
      if (!existing) throw error;
      return res.status(200).json({ accessToken: existing.accessToken, order: orderPayload(existing), replayed: true });
    }
    existing = await replayCreatedOrder(session, identity);
    if (!existing) throw new Error('无法确认新建的点菜单');
    return res.status(201).json({ accessToken: existing.accessToken, order: orderPayload(existing), replayed: false });
  } catch (error) { handlePublicOrderError(error, res, next); }
};

exports.createPublicOrder = async (req, res, next) => {
  try {
    const session = await publicSessionByToken(req.params.shareToken);
    if (!isSessionOpen(session)) throw closedGuestSession();
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
    handlePublicOrderError(error, res, next);
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
    if (!isSessionOpen(session)) throw closedGuestSession();
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
      if (exists) { const error = httpError('订单已在其他设备更新，请刷新后重试', 409); error.code = 'GUEST_ORDER_CONFLICT'; throw error; }
      throw httpError('未找到你的点菜单', 404);
    }
    res.json({ order: orderPayload(order) });
  } catch (error) {
    handlePublicOrderError(error, res, next);
  }
};
