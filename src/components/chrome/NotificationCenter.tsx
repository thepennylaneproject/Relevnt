
import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useNotifications } from '../../hooks/useNotifications'
import { Icon } from '../ui/Icon'
import { formatRelativeTime } from '../../lib/utils/time'
import '../../styles/notification-center.css'

export default function NotificationCenter() {
    const { notifications, unreadCount, markAsRead, markAllAsRead, loading } = useNotifications()
    const [isOpen, setIsOpen] = useState(false)
    const navigate = useNavigate()

    const handleNotificationClick = (n: any) => {
        markAsRead(n.id)
        setIsOpen(false)
        if (n.link) {
            navigate(n.link)
        }
    }

    return (
        <div className="notification-center">
            <button
                className={`notification-trigger ${unreadCount > 0 ? 'has-unread' : ''}`}
                onClick={() => setIsOpen(!isOpen)}
                title="Notifications"
            >
                <Icon name="stars" size="md" hideAccent={unreadCount === 0} />
                {unreadCount > 0 && <span className="unread-badge">{unreadCount}</span>}
            </button>

            {isOpen && (
                <>
                    <div className="notification-overlay" onClick={() => setIsOpen(false)} />
                    <div className="notification-dropdown surface-card animate-in fade-in zoom-in-95">
                        <header className="notification-dropdown__header">
                            <h3>Notifications</h3>
                            {unreadCount > 0 && (
                                <button className="mark-all-read" onClick={markAllAsRead}>
                                    Mark all as read
                                </button>
                            )}
                        </header>

                        <div className="notification-list">
                            {loading ? (
                                <div className="notification-loading">Loading...</div>
                            ) : notifications.length === 0 ? (
                                <div className="notification-empty">
                                    <Icon name="compass" size="lg" />
                                    <p>All quiet for now.</p>
                                </div>
                            ) : (
                                notifications.map(n => (
                                    <article
                                        key={n.id}
                                        className={`notification-item ${n.is_read ? 'is-read' : 'is-unread'}`}
                                        onClick={() => handleNotificationClick(n)}
                                    >
                                        <div className="notification-item__icon">
                                            <Icon
                                                name={n.type === 'job_alert' ? 'briefcase' : 'stars'}
                                                size="sm"
                                                hideAccent={n.is_read}
                                            />
                                        </div>
                                        <div className="notification-item__content">
                                            <h4>{n.title}</h4>
                                            <p>{n.message}</p>
                                            <span className="notification-time">
                                                {formatRelativeTime(n.created_at)}
                                            </span>
                                        </div>
                                        {!n.is_read && <div className="unread-dot" />}
                                    </article>
                                ))
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    )
}
