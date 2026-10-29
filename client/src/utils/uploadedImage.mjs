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

// Recipe cards accept web URLs and site-relative paths, not arbitrary schemes.
export function resolveRecipeImage (value, fallback, origin = window.location.origin) {
  if (typeof value !== 'string' || !value || !(/^(https?:)?\/\//i.test(value) || value.startsWith('/'))) return fallback
  try {
    const url = new URL(value, origin)
    if (!['http:', 'https:'].includes(url.protocol)) return fallback
    return resolveUploadedImage(value, origin)
  } catch (_) { return fallback }
}

// Only retry our own legacy /uploads path; a failed external image must never
// be substituted with an unrelated local image bearing the same path.
export function retryLocalUpload (event, origin = window.location.origin) {
  const image = event?.target
  if (!image) return false
  try {
    const url = new URL(image.src, origin)
    if (url.origin === new URL(origin).origin && url.pathname.startsWith('/uploads/') && image.dataset.retry !== '1') {
      image.dataset.retry = '1'
      image.src = `${new URL(origin).origin}/api${url.pathname}${url.search}${url.hash}`
      return true
    }
  } catch (_) { /* No safe alternate route. */ }
  return false
}

export function handleUploadedImageError (event, fallback, origin = window.location.origin) {
  const image = event?.target
  if (!image || retryLocalUpload(event, origin)) return
  if (image.dataset.placeholder !== '1') {
    image.dataset.placeholder = '1'
    image.src = fallback
    image.alt = '图片暂不可用'
  }
}
