import React from 'react'

interface Props {
  label: string
  icon?: React.ReactNode
  active?: boolean
  onClick: () => void
}

export const SectionNavItem: React.FC<Props> = ({
  label,
  icon,
  active,
  onClick,
}) => {
  return (
    <button
      onClick={onClick}
      className={[
        'w-full flex items-center gap-2 rounded-md px-3 py-2 text-left text-sm font-medium transition',
        active
          ? 'bg-[#C7B68A] text-[#1F2933] border border-[#A8956E]'
          : 'bg-[#F4EBDA] text-[#1F2933] border border-[#E4DAC5] hover:bg-[#E8DCC3]',
      ].join(' ')}
    >
      {icon && <span className="w-4 h-4">{icon}</span>}
      {label}
    </button>
  )
}