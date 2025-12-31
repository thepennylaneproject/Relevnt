/**
 * Cross-product navigation configuration for Relevnt
 * Manages URLs for linking to the Ready app
 */

const isDevelopment = import.meta.env.DEV

export const READY_APP_URL = isDevelopment
  ? 'http://localhost:5174'
  : 'https://relevnt.work/ready'

/**
 * Get URL for Ready app page
 * @param path - Path within Ready app (e.g., '/practice', '/')
 * @returns Full URL to Ready app page
 */
export function getReadyUrl(path: string = '/'): string {
  const cleanPath = path.startsWith('/') ? path : `/${path}`
  return `${READY_APP_URL}${cleanPath}`
}
