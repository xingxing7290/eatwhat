// Older uploads may contain an absolute same-host URL without the public port.
// Keep external image hosts intact and use the current origin only for our
// own upload routes, so existing records remain usable behind a proxy.
export function resolveUploadedImage (value, origin = window.location.origin) {
  if (typeof value !== 'string' || !value || !/^(https?:)?\/\//i.test(value)) return value
  try {
    const current = new URL(origin)
    const image = new URL(value, current)
    const isUpload = image.pathname.startsWith('/uploads/') || image.pathname.startsWith('/api/uploads/')
    if (isUpload && image.hostname === current.hostname && !image.port && image.origin !== current.origin) {
      return `${current.origin}${image.pathname}${image.search}${image.hash}`
    }
  } catch (_) { /* Invalid URLs remain unchanged. */ }
  return value
}
