import React, { useState } from 'react'
import { SectionNavItem } from './SectionNavItem'

export interface SidebarSection {
  id: string
  label: string
  icon?: string
}

interface Props {
  sections: SidebarSection[]
}

export const Sidebar: React.FC<Props> = ({ sections }) => {
  const [activeId, setActiveId] = useState<string>('contact')

  const handleClick = (id: string) => {
    setActiveId(id)
    const el = document.getElementById(id)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  return (
    <nav
      style={{
        position: 'sticky',
        top: 96,
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
      }}
    >
      {sections.map((section) => (
        <SectionNavItem
          key={section.id}
          label={section.label}
          icon={section.icon}
          active={section.id === activeId}
          onClick={() => handleClick(section.id)}
        />
      ))}
    </nav>
  )
}