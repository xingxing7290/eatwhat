const mealId = meal => String(meal?._id || meal?.id || '')

// New servers return an exact first page; older servers return the complete
// array. Never present a partial or duplicate response as a complete search.
export function normalizeMealSearch (result, query, limit = 50) {
  let rows = result?.data
  let total = result?.total
  if (!Array.isArray(rows) || !Number.isSafeInteger(total) || total < 0 || rows.some(meal => !mealId(meal) || typeof meal.name !== 'string' || !meal.name.trim()) || new Set(rows.map(mealId)).size !== rows.length) throw new Error('菜品列表不完整')
  if (result.page == null && result.limit == null) {
    if (rows.length !== total) throw new Error('菜品列表不完整')
    const lower = String(query || '').trim().toLowerCase()
    rows = rows.filter(meal => [meal.name, meal.description, meal.tips, ...(Array.isArray(meal.tags) ? meal.tags : []), ...(Array.isArray(meal.ingredients) ? meal.ingredients.map(item => item?.name || item) : []), ...(Array.isArray(meal.steps) ? meal.steps.map(item => item?.description || item) : [])].some(field => String(field || '').toLowerCase().includes(lower)))
    total = rows.length
    rows = rows.slice(0, limit)
  } else if (result.page !== 1 || result.limit !== limit || rows.length !== Math.min(limit, total)) throw new Error('菜品分页数据不完整，请重试')
  return { rows, total }
}
