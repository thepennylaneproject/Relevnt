
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'

export type ContactStatus = 'identified' | 'requested' | 'connected' | 'replied' | 'met'

export interface Contact {
    id: string
    user_id: string
    name: string
    company?: string | null
    role?: string | null
    linkedin_url?: string | null
    email?: string | null
    status: ContactStatus
    notes?: string | null
    created_at: string
}

export interface OutreachLog {
    id: string
    contact_id: string
    method: string
    message_content: string
    sent_at: string
    response_received: boolean
}

export interface OutreachTemplate {
    id: string
    name: string
    content: string
    type: string
}

export function useNetworking() {
    const { user } = useAuth()
    const [contacts, setContacts] = useState<Contact[]>([])
    const [templates, setTemplates] = useState<OutreachTemplate[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const fetchData = useCallback(async () => {
        if (!user?.id) return
        setLoading(true)
        try {
            // Cast to any to bypass strict Supabase typing (tables exist but types not regenerated)
            const [contactRes, templateRes] = await Promise.all([
                (supabase as any).from('networking_contacts').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
                (supabase as any).from('outreach_templates').select('*').eq('user_id', user.id)
            ])

            if (contactRes.error) throw contactRes.error
            if (templateRes.error) throw templateRes.error

            setContacts(contactRes.data as Contact[])
            setTemplates(templateRes.data as OutreachTemplate[])
        } catch (err: any) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }, [user?.id])

    useEffect(() => {
        fetchData()
    }, [fetchData])

    const addContact = async (contact: Partial<Contact>) => {
        if (!user?.id) return
        const { data, error } = await (supabase as any)
            .from('networking_contacts')
            .insert({ ...contact, user_id: user.id })
            .select()
            .single()

        if (error) throw error
        setContacts(prev => [data as Contact, ...prev])
        return data
    }

    const updateContactStatus = async (id: string, status: ContactStatus) => {
        const { error } = await (supabase as any)
            .from('networking_contacts')
            .update({ status, updated_at: new Date().toISOString() })
            .eq('id', id)

        if (error) throw error
        setContacts(prev => prev.map(c => c.id === id ? { ...c, status } : c))
    }

    const logOutreach = async (contactId: string, method: string, content: string) => {
        if (!user?.id) return
        const { data, error } = await (supabase as any)
            .from('outreach_logs')
            .insert({
                contact_id: contactId,
                user_id: user.id,
                method,
                message_content: content
            })
            .select()
            .single()

        if (error) throw error
        return data
    }

    const addTemplate = async (template: Partial<OutreachTemplate>) => {
        if (!user?.id) return
        const { data, error } = await (supabase as any)
            .from('outreach_templates')
            .insert({ ...template, user_id: user.id })
            .select()
            .single()

        if (error) throw error
        setTemplates(prev => [...prev, data as OutreachTemplate])
        return data
    }

    return {
        contacts,
        templates,
        loading,
        error,
        addContact,
        updateContactStatus,
        logOutreach,
        addTemplate,
        refresh: fetchData
    }
}
