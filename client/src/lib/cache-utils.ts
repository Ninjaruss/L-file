/**
 * Utility functions for managing paged cache invalidation across the app.
 * Used to clear cached data when updates occur (e.g., user profile changes).
 */

/**
 * Invalidates the paged cache for a specific resource type.
 * This clears all cached pages from sessionStorage.
 *
 * @param resourceType - The type of resource to invalidate (e.g., 'users', 'characters')
 */
export function invalidatePagedCache(resourceType: string): void {
  if (typeof window === 'undefined') return

  try {
    const storageKey = `paged:${resourceType}`
    sessionStorage.removeItem(storageKey)
  } catch (e) {
    // Silently fail if sessionStorage is unavailable
    console.warn(`Failed to invalidate cache for ${resourceType}:`, e)
  }
}

/**
 * Invalidates multiple paged cache resources at once.
 *
 * @param resourceTypes - Array of resource types to invalidate
 */
export function invalidateMultiplePagedCaches(resourceTypes: string[]): void {
  resourceTypes.forEach(invalidatePagedCache)
}
