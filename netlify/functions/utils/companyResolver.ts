/**
 * companyResolver.ts - Utilities for mapping raw company names to canonical companies
 */

import { createAdminClient } from './supabase'

interface CompanyMatch {
  id: string
  name: string
  domain?: string
}

const companyCache = new Map<string, string | null>()

/**
 * Resolve a raw company name to a company ID.
 * Uses an in-memory cache to avoid redundant DB calls during a run.
 */
export async function resolveCompanyId(rawName: string | null): Promise<string | null> {
  if (!rawName) return null

  const normalizedName = rawName.toLowerCase().trim()
  
  if (companyCache.has(normalizedName)) {
    return companyCache.get(normalizedName) || null
  }

  try {
    const supabase = createAdminClient()
    
    // Call the RPC function we created in the migration
    const { data: companyId, error } = await supabase.rpc('resolve_company_id', {
      p_name: rawName
    })

    if (error) {
      console.warn(`companyResolver: RPC failed for "${rawName}":`, error.message)
      return null
    }

    companyCache.set(normalizedName, companyId as string | null)
    return companyId as string | null
  } catch (err) {
    console.warn(`companyResolver: failed to resolve company "${rawName}"`, err)
    return null
  }
}

/**
 * Clear the company resolution cache.
 */
export function clearCompanyCache(): void {
  companyCache.clear()
}
