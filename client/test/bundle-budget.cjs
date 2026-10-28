const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')

const dist = path.resolve(__dirname, '../dist')
const html = fs.readFileSync(path.join(dist, 'index.html'), 'utf8')
const script = html.match(/<script[^>]+src="(\/assets\/[^"?]+\.js)"/)
const style = html.match(/<link[^>]+href="(\/assets\/[^"?]+\.css)"/)
assert.ok(script && style, 'build must contain a local entry script and stylesheet')
for (const [label, match, budget] of [['entry JavaScript', script, 500_000], ['entry CSS', style, 150_000]]) {
  const asset = path.resolve(dist, `.${match[1]}`)
  assert.ok(asset.startsWith(`${dist}${path.sep}`), 'asset must remain inside dist')
  const bytes = fs.statSync(asset).size
  assert.ok(bytes <= budget, `${label} is ${bytes} bytes; budget is ${budget}`)
  console.log(`${label}: ${bytes} / ${budget} bytes`)
}
