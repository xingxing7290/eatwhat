const mealId = meal => String(meal?._id || meal?.id || '')

// New servers return an exact first page; older servers return the complete
// array. Never present a partial or duplicate response as a complete search.
export function normalizeMealSearch (result, query, limit = 50, { page = 1, category = '', uncategorized = false, subcategory = '', tag = '' } = {}) {
  let rows = result?.data
  let total = result?.total
  if (!Array.isArray(rows) || !Number.isSafeInteger(total) || total < 0 || rows.some(meal => !mealId(meal) || typeof meal.name !== 'string' || !meal.name.trim()) || new Set(rows.map(mealId)).size !== rows.length) throw new Error('菜品列表不完整')
  if (result.page == null && result.limit == null) {
    if (rows.length !== total) throw new Error('菜品列表不完整')
    const lower = String(query || '').trim().toLowerCase()
    rows = rows.filter(meal => (!uncategorized || meal.category == null || meal.category === '') && (!category || meal.category === category) && (!subcategory || meal.subcategory === subcategory) && (!tag || (Array.isArray(meal.tags) && meal.tags.includes(tag))) && [meal.name, meal.description, meal.tips, ...(Array.isArray(meal.tags) ? meal.tags : []), ...(Array.isArray(meal.ingredients) ? meal.ingredients.map(item => item?.name || item) : []), ...(Array.isArray(meal.steps) ? meal.steps.map(item => item?.description || item) : [])].some(field => String(field || '').toLowerCase().includes(lower)))
    total = rows.length
    rows = rows.slice((page - 1) * limit, page * limit)
  } else {
    if (uncategorized && !result.supportsUncategorizedFilter) throw new Error('当前服务器不支持未分类筛选，请升级服务器或查看全部分类')
    if (uncategorized && rows.some(meal => meal.category != null && meal.category !== '')) throw new Error('未分类筛选结果不完整，请重试')
    if (result.page !== page || result.limit !== limit || rows.length !== Math.min(limit, Math.max(0, total - (page - 1) * limit))) throw new Error('菜品分页数据不完整，请重试')
  }
  return { rows, total }
}
