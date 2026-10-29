const text = (value, limit = 1000) => typeof value === 'string' && value.length <= limit ? value : ''
export function readCatalogQuery (query = {}) {
  const uncategorized = query.uncategorized === '1'
  const category = uncategorized ? '' : text(query.category)
  const rawPage = typeof query.page === 'string' && /^[1-9]\d*$/.test(query.page) ? Number(query.page) : 1
  return {
    search: text(query.q, 200), category, uncategorized, subcategory: category ? text(query.subcategory) : '', tag: text(query.tag),
    difficulty: ['easy', 'medium', 'hard'].includes(query.difficulty) ? query.difficulty : '',
    favorite: query.favorite === '1', page: Number.isSafeInteger(rawPage) && rawPage <= 10000 ? rawPage : 1,
    view: ['grid', 'list', 'table', 'grouped'].includes(query.view) ? query.view : 'grid'
  }
}
export function buildCatalogQuery (state) {
  const query = {}
  if (state.search) query.q = state.search
  if (state.uncategorized) query.uncategorized = '1'
  else if (state.category) query.category = state.category
  if (!state.uncategorized && state.category && state.subcategory) query.subcategory = state.subcategory
  if (state.tag) query.tag = state.tag
  if (state.difficulty) query.difficulty = state.difficulty
  if (state.favorite) query.favorite = '1'
  if (state.page > 1) query.page = String(state.page)
  if (state.view !== 'grid') query.view = state.view
  return query
}
export const filterCatalogQuery = query => buildCatalogQuery(readCatalogQuery(query))
