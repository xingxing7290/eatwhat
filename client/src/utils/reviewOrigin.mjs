// A review origin is an explicitly selected, supported month or year.
export function readReviewOrigin (query = {}) {
  const month = query.reviewMonth
  const year = query.reviewYear
  if (month !== undefined && year !== undefined) return null
  if (typeof month === 'string' && /^(20\d{2}|2100)-(0[1-9]|1[0-2])$/.test(month)) return { reviewMonth: month }
  if (typeof year === 'string' && /^(20\d{2}|2100)$/.test(year)) return { reviewYear: year }
  return null
}

export function reviewDestination (origin) {
  return { name: 'review', query: origin.reviewMonth ? { month: origin.reviewMonth } : { year: origin.reviewYear } }
}
