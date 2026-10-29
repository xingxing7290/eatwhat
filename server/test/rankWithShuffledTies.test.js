const test = require('node:test');
const assert = require('node:assert/strict');
const { rankWithShuffledTies } = require('../utils/rankWithShuffledTies');

test('shuffle changes equal-score order without weakening score ordering or mutating inputs', () => {
  const input = [{ id: 'a', score: 5 }, { id: 'b', score: 2 }, { id: 'c', score: 5 }, { id: 'd', score: 2 }];
  const first = rankWithShuffledTies(input, item => item.score, () => 0);
  const second = rankWithShuffledTies(input, item => item.score, max => max - 1);
  assert.deepEqual(first.map(item => item.score), [5, 5, 2, 2]);
  assert.deepEqual(second.map(item => item.score), [5, 5, 2, 2]);
  assert.notDeepEqual(first.map(item => item.id), second.map(item => item.id));
  assert.deepEqual(input.map(item => item.id), ['a', 'b', 'c', 'd']);
  assert.deepEqual(first.map(item => item.id).sort(), ['a', 'b', 'c', 'd']);
});

test('empty and singleton pools do not require random draws', () => {
  const noRandom = () => { throw new Error('unexpected random draw'); };
  assert.deepEqual(rankWithShuffledTies([], () => 0, noRandom), []);
  assert.deepEqual(rankWithShuffledTies(['a'], () => 0, noRandom), ['a']);
});
