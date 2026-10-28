const assert = require('node:assert/strict')
const http = require('node:http')
const base = process.env.EATWHAT_TEST_URL || 'http://127.0.0.1:5179'
if (!/^http:\/\/127\.0\.0\.1:(5178|5179)$/.test(base)) throw new Error('Proxy test requires a local development server')

async function main () {
  const seen = []
  const backend = http.createServer((req, res) => {
    seen.push(req.url)
    res.writeHead(200, { 'content-type': 'application/json', 'cache-control': 'private, no-store' })
    res.end(JSON.stringify({ path: req.url }))
  })
  await new Promise((resolve, reject) => { backend.once('error', reject); backend.listen(3000, 'localhost', resolve) })
  try {
    for (const path of ['/guest-order/test-only-token', '/guest-orders/public/test-only-token', '/api/health']) {
      const response = await fetch(base + path)
      assert.equal(response.status, 200)
      assert.match(response.headers.get('cache-control'), /no-store/)
      assert.equal((await response.json()).path, path === '/api/health' ? '/health' : path)
    }
    assert.deepEqual(seen, ['/guest-order/test-only-token', '/guest-orders/public/test-only-token', '/health'])
    console.log('Development proxy forwards guest page, public API and regular API paths')
  } finally { await new Promise(resolve => backend.close(resolve)) }
}
main().catch(error => { console.error(error); process.exitCode = 1 })
