/**
 * Tree search keeps casual keywords focused on visible key/value text.
 * Path search is enabled only when the query looks like a JSONPath fragment.
 */
export function matchesTreeNode(node, rawQuery) {
  const query = rawQuery.trim().toLowerCase()
  if (!query) return false

  const visibleText = `${node.key} ${node.summary}`.toLowerCase()
  if (visibleText.includes(query)) return true

  return isPathQuery(query) && node.path.toLowerCase().includes(query)
}

function isPathQuery(query) {
  return query.startsWith('$') || query.includes('.') || query.includes('[') || query.includes(']')
}
