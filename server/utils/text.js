function textValue(value) {
  return value === null || value === undefined ? '' : String(value);
}

function looksBrokenText(value) {
  const text = textValue(value).trim();
  if (!text) return false;
  if (/[\uFFFD]/.test(text) || text.includes('\u951f')) return true;
  const compact = text.replace(/\s+/g, '');
  const questionMarks = (compact.match(/[??]/g) || []).length;
  return questionMarks >= 3 && questionMarks / Math.max(compact.length, 1) > 0.28;
}

function cleanDisplayName(displayName, username = '') {
  const name = textValue(displayName).trim();
  if (name && !looksBrokenText(name)) return name;
  return textValue(username).trim();
}

function cleanHouseholdName(name, fallback = '\u6211\u4eec\u7684\u6e29\u99a8\u5c0f\u5bb6') {
  const safeName = textValue(name).trim();
  if (safeName && !looksBrokenText(safeName)) return safeName;
  return fallback;
}

module.exports = {
  looksBrokenText,
  cleanDisplayName,
  cleanHouseholdName,
};
