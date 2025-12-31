/**
 * =============================================================================
 * useNetworkLookup Hook
 * =============================================================================
 * Find networking contacts that match a given company name.
 * Part of Platform expansion - Phase 4.2
 * =============================================================================
 */

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'

// Define Contact type inline since useNetworking was removed
export interface Contact {
    id: string
    user_id: string
    name: string
    company?: string
    role?: string
    linkedin_url?: string
    email?: string
    phone?: string
    notes?: string
    status?: 'connected' | 'pending' | 'declined'
    created_at?: string
}

export interface NetworkingMatchResult {
    contacts: Contact[]
    count: number
    loading: boolean
    error: string | null
    hasMatch: boolean
}

/**
 * Hook to find networking contacts at a specific company.
 * Useful for surfacing "You know someone here" prompts during applications.
 */
export function useNetworkLookup(company: string | null | undefined): NetworkingMatchResult {
    const { user } = useAuth()
    const userId = user?.id

    const [contacts, setContacts] = useState<Contact[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const findMatches = async () => {
            // Skip if no user or no company
            if (!userId || !company || company.trim().length < 2) {
                setContacts([])
                setLoading(false)
                return
            }

            setLoading(true)
            setError(null)

            try {
                // Search for contacts at this company (case-insensitive)
                const normalizedCompany = company.toLowerCase().trim()

                const { data, error: fetchError } = await (supabase as any)
                    .from('networking_contacts')
                    .select('*')
                    .eq('user_id', userId)
                    .ilike('company', `%${normalizedCompany}%`)
                    .order('status', { ascending: false }) // connected contacts first

                if (fetchError) throw fetchError

                setContacts(data || [])
            } catch (err: any) {
                console.error('Error finding networking matches:', err)
                setError(err.message || 'Failed to find contacts')
                setContacts([])
            } finally {
                setLoading(false)
            }
        }

        findMatches()
    }, [userId, company])

    return {
        contacts,
        count: contacts.length,
        loading,
        error,
        hasMatch: contacts.length > 0
    }
}

/**
 * Hook to find all companies where user has contacts with counts.
 * Useful for batch-checking multiple jobs.
 */
export function useNetworkingCompanies(): {
    companies: Set<string>
    companyCounts: Record<string, number>
    loading: boolean
    refresh: () => Promise<void>
} {
    const { user } = useAuth()
    const userId = user?.id

    const [companies, setCompanies] = useState<Set<string>>(new Set())
    const [companyCounts, setCompanyCounts] = useState<Record<string, number>>({})
    const [loading, setLoading] = useState(true)

    const fetchCompanies = useCallback(async () => {
        if (!userId) {
            setCompanies(new Set())
            setCompanyCounts({})
            setLoading(false)
            return
        }

        setLoading(true)

        try {
            const { data, error } = await (supabase as any)
                .from('networking_contacts')
                .select('company')
                .eq('user_id', userId)
                .not('company', 'is', null)

            if (error) throw error

            const companySet = new Set<string>()
            const counts: Record<string, number> = {}

            for (const row of data || []) {
                if (row.company) {
                    const normalized = row.company.toLowerCase().trim()
                    companySet.add(normalized)
                    counts[normalized] = (counts[normalized] || 0) + 1
                }
            }

            setCompanies(companySet)
            setCompanyCounts(counts)
        } catch (err) {
            console.error('Error fetching networking companies:', err)
            setCompanies(new Set())
            setCompanyCounts({})
        } finally {
            setLoading(false)
        }
    }, [userId])

    useEffect(() => {
        fetchCompanies()
    }, [fetchCompanies])

    return {
        companies,
        companyCounts,
        loading,
        refresh: fetchCompanies
    }
}

/**
 * Check if a company name matches any known networking contact company and return count.
 */
export function checkCompanyMatch(
    targetCompany: string | null | undefined,
    knownCompanies: Set<string>,
    companyCounts: Record<string, number> = {}
): number {
    if (!targetCompany || knownCompanies.size === 0) return 0

    const normalized = targetCompany.toLowerCase().trim()

    // Exact match
    if (knownCompanies.has(normalized)) return companyCounts[normalized] || 1

    // Partial match - check if any known company is contained in target or vice versa
    for (const known of knownCompanies) {
        if (normalized.includes(known) || known.includes(normalized)) {
            return companyCounts[known] || 1
        }
    }

    return 0
}

export default useNetworkLookup
