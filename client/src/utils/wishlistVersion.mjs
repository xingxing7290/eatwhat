export function validWishVersion (item) {
  const version = item?.editVersion
  return item?.supportsConditionalActions === true && !!version &&
    (version.revision === null || (typeof version.revision === 'string' && !!version.revision && version.revision.length <= 128)) &&
    (version.updatedAt === null || (typeof version.updatedAt === 'string' && Number.isFinite(Date.parse(version.updatedAt))))
}
