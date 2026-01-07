import { useEffect, useState } from 'react'

const sections = [
    { id: 'account', label: 'Account' },
    { id: 'jobsearch', label: 'Job Search' },
    { id: 'preferences', label: 'Preferences' },
]

export function SettingsSidebar() {
    const [activeSection, setActiveSection] = useState('account')

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
                rootMargin: '-20% 0px -70% 0px',
                threshold: 0,
            }
        )

        sections.forEach(({ id }) => {
            const element = document.getElementById(id)
            if (element) observer.observe(element)
        })

        return () => observer.disconnect()
    }, [])

    const scrollToSection = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
        e.preventDefault()
        const element = document.getElementById(id)
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }
    }

    return (
        <nav className="settings-nav">
            <ul className="settings-nav-list">
                {sections.map(({ id, label }) => (
                    <li key={id}>
                        <a
                            href={`#${id}`}
                            onClick={(e) => scrollToSection(e, id)}
                            className={`settings-nav-link ${activeSection === id ? 'active' : ''}`}
                        >
                            {label}
                        </a>
                    </li>
                ))}
            </ul>
        </nav>
    )
}
