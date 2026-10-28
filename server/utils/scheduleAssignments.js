const mongoose = require('mongoose');

// Evaluate against the document being updated, so concurrent legacy writes
// cannot make a separately-read attribution snapshot stale. A missing author
// on an existing meal remains unknown; only genuinely new meals get an actor.
function retainedMealAssignments(mealType, mealIds, actorId) {
  if (!mealIds.length) return [];
  const ids = mealIds.map(id => new mongoose.Types.ObjectId(String(id)));
  const actor = new mongoose.Types.ObjectId(String(actorId));
  return {
    $map: {
      input: { $literal: ids },
      as: 'mealId',
      in: {
        $let: {
          vars: {
            prior: {
              $filter: {
                input: { $ifNull: [`$meals.${mealType}`, []] },
                as: 'item',
                cond: { $eq: [{ $ifNull: ['$$item.meal', '$$item'] }, '$$mealId'] }
              }
            }
          },
          in: {
            meal: '$$mealId',
            addedBy: {
              $cond: [
                { $gt: [{ $size: '$$prior' }, 0] },
                { $let: { vars: { first: { $arrayElemAt: ['$$prior', 0] } }, in: { $ifNull: ['$$first.addedBy', null] } } },
                actor
              ]
            }
          }
        }
      }
    }
  };
}

// A millisecond-resolution timestamp must advance even if two writes occur in
// the same millisecond, otherwise a stale expectedVersion could still match.
function scheduleUpdatePipeline(householdId, assignments) {
  return [{
    $set: {
      householdId,
      ...assignments,
      updatedAt: {
        $cond: [
          { $gte: [{ $ifNull: ['$updatedAt', new Date(0)] }, '$$NOW'] },
          { $add: ['$updatedAt', 1] },
          '$$NOW'
        ]
      }
    }
  }];
}

module.exports = { retainedMealAssignments, scheduleUpdatePipeline };
