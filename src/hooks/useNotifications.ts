import { useEffect, useState, useMemo } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'
import type { Notification } from '../shared/types'

interface UseNotificationsOptions {
    filterLevel?: 'all' | 'important' | 'critical'
}

export function useNotifications({ filterLevel = 'all' }: UseNotificationsOptions = {}) {
    const { user } = useAuth()
    const [notifications, setNotifications] = useState<Notification[]>([])
    const [loading, setLoading] = useState(true)
    const [unreadCount, setUnreadCount] = useState(0)

    const fetchNotifications = async () => {
        if (!user?.id) return

        try {
            // Cast to any to bypass strict Supabase typing (table exists but types not regenerated)
            const { data, error } = await (supabase as any)
                .from('notifications')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })
                .limit(50) // Increased limit

            if (error) throw error
            if (data) {
                setNotifications(data as Notification[])
            }
        } catch (err) {
            console.error('Error fetching notifications:', err)
        } finally {
            setLoading(false)
        }
    }

    const markAsRead = async (notificationId: string) => {
        try {
            const { error } = await (supabase as any)
                .from('notifications')
                .update({ is_read: true })
                .eq('id', notificationId)

            if (error) throw error

            setNotifications(prev =>
                prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
            )
        } catch (err) {
            console.error('Error marking notification as read:', err)
        }
    }

    const markAllAsRead = async () => {
        if (!user?.id) return
        try {
            const { error } = await (supabase as any)
                .from('notifications')
                .update({ is_read: true })
                .eq('user_id', user.id)
                .eq('is_read', false)

            if (error) throw error

            setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
        } catch (err) {
            console.error('Error marking all notifications as read:', err)
        }
    }

    // Filter notifications based on level
    const filteredNotifications = useMemo(() => {
        if (filterLevel === 'all') return notifications

        const importantTypes = ['success', 'warning', 'job_alert']
        const criticalTypes = ['warning', 'job_alert']

        if (filterLevel === 'important') {
            return notifications.filter(n => importantTypes.includes(n.type))
        }
        if (filterLevel === 'critical') {
            return notifications.filter(n => criticalTypes.includes(n.type))
        }
        return notifications
    }, [notifications, filterLevel])

    // Compute unread count based on FILTERED list (to reduce stress in gentle mode)
    const effectiveUnreadCount = useMemo(() => {
        return filteredNotifications.filter(n => !n.is_read).length
    }, [filteredNotifications])

    useEffect(() => {
        fetchNotifications()

        // Subscribe to new notifications
        if (user?.id) {
            const channel = supabase
                .channel(`notifications:${user.id}`)
                .on('postgres_changes', {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'notifications',
                    filter: `user_id=eq.${user.id}`
                }, (payload) => {
                    const newNotif = payload.new as Notification
                    setNotifications(prev => [newNotif, ...prev])
                })
                .subscribe()

            return () => {
                supabase.removeChannel(channel)
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user?.id])

    return {
        notifications: filteredNotifications,
        allNotifications: notifications, // access to raw list if needed
        loading,
        unreadCount: effectiveUnreadCount,
        markAsRead,
        markAllAsRead,
        refresh: fetchNotifications
    }
}
