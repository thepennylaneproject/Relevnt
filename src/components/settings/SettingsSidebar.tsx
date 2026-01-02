import { useEffect, useState } from 'react'

const sections = [
    { id: 'targeting', label: 'Targeting' },
    { id: 'profile', label: 'Profile & Voice' },
    { id: 'system', label: 'System & Auto-Apply' },
]

export function SettingsSidebar() {
    const [activeSection, setActiveSection] = useState('targeting')

    // Track scroll position to highlight active section
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        setActiveSection(entry.target.id)
                    }
                })
            },
            {
                rootMargin: '-20% 0px -70% 0px', // Trigger when section is in top 30% of viewport
                threshold: 0,
            }
        )

        sections.forEach(({ id }) => {
            const element = document.getElementById(id)
            if (element) observer.observe(element)
        })

        return () => observer.disconnect()
    }, [])

    const scrollToSection = (id: string) => {
        const element = document.getElementById(id)
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }
    }

    return (
        <nav className="settings-sidebar">
            <h3 className="sidebar-title">Jump to</h3>
            <ul className="sidebar-list">
                {sections.map(({ id, label }) => (
                    <li key={id}>
                        <button
                            onClick={() => scrollToSection(id)}
                            className={`sidebar-link ${activeSection === id ? 'active' : ''}`}
                        >
                            {label}
                        </button>
                    </li>
                ))}
            </ul>
        </nav>
    )
}
