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
        <nav className="space-y-6">
            <h3 className="text-[10px] uppercase tracking-[0.2em] font-bold text-text-muted px-3">
                Jump to
            </h3>
            <ul className="flex flex-col gap-1">
                {sections.map(({ id, label }) => (
                    <li key={id}>
                        <button
                            onClick={() => scrollToSection(id)}
                            className={`w-full text-left px-3 py-2 text-sm transition-colors rounded-none ${
                                activeSection === id 
                                    ? 'text-text font-bold border-l-2 border-accent -ml-[2px]' 
                                    : 'text-text-muted hover:text-text hover:bg-black/[0.02]'
                            }`}
                        >
                            {label}
                        </button>
                    </li>
                ))}
            </ul>
        </nav>
    )
}
