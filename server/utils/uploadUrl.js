// Keep generated URLs compatible with existing absolute-URL clients. A
// configured public base is authoritative when TLS or a proxy obscures it.
function buildUploadUrl(req, filename) {
  const name = encodeURIComponent(filename);
  const publicBase = process.env.PUBLIC_BASE_URL?.trim();
  if (publicBase) return `${publicBase.replace(/\/$/, '')}/uploads/${name}`;

  try {
    const headers = req.headers || {};
    const protocol = String(headers['x-forwarded-proto'] || req.protocol || 'http').trim();
    const authority = String(headers['x-forwarded-host'] || headers.host || '').trim();
    if (!['http', 'https'].includes(protocol) || !authority || /[\s,/?#@\\]/.test(authority)) throw new Error('invalid origin');
    const origin = new URL(`${protocol}://${authority}`);
    if (origin.username || origin.password || origin.pathname !== '/' || origin.search || origin.hash) throw new Error('invalid host');

    // Prefer the public port explicitly provided in Host over an internal
    // reverse-proxy port, including IPv6 and explicit default ports.
    const explicitPort = /:\d+$/.test(authority) && (!authority.startsWith('[') || /\]:\d+$/.test(authority));
    const forwardedPort = String(headers['x-forwarded-port'] || '').trim();
    if (!explicitPort && forwardedPort) {
      if (!/^\d{1,5}$/.test(forwardedPort) || Number(forwardedPort) < 1 || Number(forwardedPort) > 65535) throw new Error('invalid port');
      origin.port = forwardedPort;
    }
    return `${origin.origin}/uploads/${name}`;
  } catch (_) {
    return `/api/uploads/${name}`;
  }
}

module.exports = { buildUploadUrl };
