/**
 * Cross-product navigation configuration for Ready
 * Manages URLs for linking to the Relevnt app
 */

const isDevelopment = import.meta.env.DEV

export const RELEVNT_APP_URL = isDevelopment
  ? 'http://localhost:5173'
  : 'https://relevnt.work'

/**
 * Get URL for Relevnt app page
 * @param path - Path within Relevnt app (e.g., '/jobs', '/applications')
 * @returns Full URL to Relevnt app page
 */
export function getRelevntUrl(path: string = '/'): string {
  const cleanPath = path.startsWith('/') ? path : `/${path}`
  return `${RELEVNT_APP_URL}${cleanPath}`
}
