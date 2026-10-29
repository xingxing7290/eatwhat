// A page remains bound to the account it was opened with. Other tabs share
// localStorage, so reading its latest token for every request is unsafe.
let boundToken = localStorage.getItem('token') || '';
function userScope(value) {
  try {
    const user = JSON.parse(value || 'null');
    return { userId: String(user?.id || user?._id || ''), householdId: String(user?.householdId || user?.household?.id || '') };
  } catch (_) { return { userId: '', householdId: '' }; }
}
let boundUser = userScope(localStorage.getItem('user'));
let locked = false;
let lockReason = '';

function lockSession(reason = 'changed') {
  if (!locked) {
    locked = true;
    lockReason = reason;
    window.dispatchEvent(new CustomEvent(reason === 'expired' ? 'eatwhat-session-expired' : 'eatwhat-session-changed'));
  }
}
export function markSessionStale() { lockSession(); }
export function markSessionExpired() { lockSession('expired'); }
export function currentSessionScope() { return { token: boundToken, ...boundUser }; }
export function sessionIsCurrent(requestScope = currentSessionScope()) {
  const actual = userScope(localStorage.getItem('user'));
  if (locked || (localStorage.getItem('token') || '') !== boundToken ||
      (boundUser.userId && actual.userId !== boundUser.userId) ||
      (boundUser.householdId && actual.householdId !== boundUser.householdId)) {
    lockSession();
    return false;
  }
  return requestScope.token === boundToken && requestScope.userId === boundUser.userId && requestScope.householdId === boundUser.householdId;
}

export function currentSessionToken() { return boundToken; }
export function sessionIsLocked() { return !sessionIsCurrent(); }
export function sessionLockReason() { sessionIsCurrent(); return lockReason; }
export function adoptSession(token) {
  boundToken = token || '';
  boundUser = userScope(localStorage.getItem('user'));
  locked = false;
  lockReason = '';
  window.dispatchEvent(new CustomEvent('eatwhat-session-adopted'));
  sessionIsCurrent();
}
export function replaceSessionUser(user) {
  if (!sessionIsCurrent()) throw sessionUnavailableError();
  localStorage.setItem('user', JSON.stringify(user));
  boundUser = userScope(localStorage.getItem('user'));
  window.dispatchEvent(new CustomEvent('eatwhat-session-user-updated'));
}
export function sessionChangedError(requestSent = false) {
  return { code: 'SESSION_CHANGED', requestSent, error: requestSent ? '账号或小家已变化，此前发送的请求可能已完成，请核对结果。' : '账号或小家已变化，本次请求未发送；请保留草稿并重新加载。' };
}
export function sessionExpiredError(requestSent = false) {
  return { code: 'SESSION_EXPIRED', requestSent, error: requestSent ? '登录状态已失效，已发送的请求可能仍会完成，请核对结果。' : '登录状态已失效，本次请求未发送；请保留草稿并重新登录。' };
}
export function sessionUnavailableError(requestSent = false) {
  return lockReason === 'expired' ? sessionExpiredError(requestSent) : sessionChangedError(requestSent);
}

window.addEventListener('storage', event => {
  if (event.key === 'token' && (event.newValue || '') !== boundToken) lockSession();
  else if (event.key === 'user') {
    const before = userScope(event.oldValue); const after = userScope(event.newValue);
    if ((before.userId && after.userId && before.userId !== after.userId) ||
        (before.householdId && after.householdId && before.householdId !== after.householdId)) lockSession();
    else if (sessionIsCurrent()) window.dispatchEvent(new CustomEvent('eatwhat-session-user-updated'));
  } else if (event.key === null) sessionIsCurrent();
});
