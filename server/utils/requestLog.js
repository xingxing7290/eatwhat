function safeRequestUrl(value) {
  return String(value || '')
    .replace(/(\/guest-orders\/public\/)[^/?]+/g, '$1[share-token]')
    .replace(/(\/guest-order\/)[^/?]+/g, '$1[share-token]')
    .replace(/(\/orders\/)[^/?]+/g, '$1[order-token]');
}

function redactSensitivePayload(value) {
  if (Array.isArray(value)) return value.map(redactSensitivePayload);
  if (!value || typeof value !== 'object') return value;
  return Object.fromEntries(Object.entries(value).map(([key, item]) => [
    key,
    /(password|token|secret|authorization|invite[_-]?code|creation[_-]?key|share[_-]?url)/i.test(key)
      ? '[redacted]'
      : redactSensitivePayload(item)
  ]));
}

function safeRequestHeaders(headers) {
  return redactSensitivePayload(headers || {});
}

function safeRequestBody(req) {
  const body = req?.body;
  if (!body || typeof body !== 'object') return body;
  if (/\/guest-orders\/public\//.test(String(req.originalUrl || req.url || ''))) {
    return {
      guestName: body.guestName ? '[redacted]' : undefined,
      itemCount: Array.isArray(body.items) ? body.items.length : 0,
      hasNote: Boolean(body.note),
      revision: body.revision
    };
  }
  if (/\/guest-orders(?:\/|\?|$)/.test(String(req.originalUrl || req.url || ''))) {
    return { hasTitle: Boolean(body.title), hasEventAt: Boolean(body.eventAt), hasExpiry: Boolean(body.expiresAt), hasExpectedVersion: Boolean(body.expectedEditVersion) };
  }
  return redactSensitivePayload(body);
}

module.exports = {
  redactSensitivePayload,
  safeRequestBody,
  safeRequestHeaders,
  safeRequestUrl
};
