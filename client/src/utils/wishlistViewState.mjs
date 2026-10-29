// History state is untrusted and must not carry arbitrary route parameters.
export function readWishlistViewState (value, scope) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  if (!scope?.userId || !scope?.householdId || value.userId !== scope.userId || value.householdId !== scope.householdId) return null
  const search = typeof value.search === 'string' && value.search.length <= 100 ? value.search : ''
  const status = ['all', 'open', 'planned', 'done', 'unknown'].includes(value.status) ? value.status : 'all'
  const priority = ['all', 'high', 'normal', 'low', 'unset'].includes(value.priority) ? value.priority : 'all'
  const page = Number.isSafeInteger(value.page) && value.page >= 1 && value.page <= 10000 ? value.page : 1
  return { search, status, priority, page, userId: scope.userId, householdId: scope.householdId }
}
