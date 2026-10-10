/**
 * The Phase 4 furniture studio is kept for debugging and is not part of the
 * main navigation. Open it with `?studio=furniture` or `#furniture-studio`.
 */
export function isFurnitureStudioRequested(location: { readonly search: string; readonly hash: string }): boolean {
  const params = new URLSearchParams(location.search)
  return params.get('studio') === 'furniture' || location.hash === '#furniture-studio'
}
