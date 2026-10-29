const mealTypes = ['breakfast', 'lunch', 'dinner'];

// A historic schedule can outlive a membership change or contain a stale
// reference. Keep the slot, but do not populate objects from another household.
function schedulePopulation(householdId, { includeAuthors = true } = {}) {
  const paths = mealTypes.map(type => ({ path: `meals.${type}.meal`, match: { householdId } }));
  if (includeAuthors) paths.push(...mealTypes.map(type => ({ path: `meals.${type}.addedBy`, match: { householdId }, select: 'username displayName avatarUrl' })));
  return paths;
}

module.exports = { schedulePopulation };
