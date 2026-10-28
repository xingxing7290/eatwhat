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

function lockSession() {
  if (!locked) {
    locked = true;
    window.dispatchEvent(new CustomEvent('eatwhat-session-changed'));
  }
}
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
export function adoptSession(token) {
  boundToken = token || '';
  boundUser = userScope(localStorage.getItem('user'));
  locked = false;
  window.dispatchEvent(new CustomEvent('eatwhat-session-adopted'));
  sessionIsCurrent();
}
export function replaceSessionUser(user) {
  if (!sessionIsCurrent()) throw sessionChangedError();
  localStorage.setItem('user', JSON.stringify(user));
  boundUser = userScope(localStorage.getItem('user'));
}
export function sessionChangedError(requestSent = false) {
  return { code: 'SESSION_CHANGED', requestSent, error: requestSent ? '账号或小家已变化，此前发送的请求可能已完成，请核对结果。' : '账号或小家已变化，本次请求未发送；请保留草稿并重新加载。' };
}

window.addEventListener('storage', event => {
  if (event.key === 'token' && (event.newValue || '') !== boundToken) lockSession();
  else if (event.key === 'user') {
    const before = userScope(event.oldValue); const after = userScope(event.newValue);
    if ((before.userId && after.userId && before.userId !== after.userId) ||
        (before.householdId && after.householdId && before.householdId !== after.householdId)) lockSession();
    else sessionIsCurrent();
  } else if (event.key === null) sessionIsCurrent();
});
