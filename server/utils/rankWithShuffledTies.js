const { randomInt } = require('node:crypto');

// Randomize only equal-score ordering; higher-scoring candidates remain first.
function rankWithShuffledTies(items, score, randomIndex = randomInt) {
  const ranked = items.map(item => ({ item, score: score(item) }));
  for (let i = ranked.length - 1; i > 0; i--) {
    const j = randomIndex(i + 1);
    [ranked[i], ranked[j]] = [ranked[j], ranked[i]];
  }
  ranked.sort((a, b) => b.score - a.score);
  return ranked.map(entry => entry.item);
}

module.exports = { rankWithShuffledTies };
