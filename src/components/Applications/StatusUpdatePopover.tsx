import React, { useState, useRef, useEffect } from 'react'
import { ApplicationStatus } from '../../hooks/useApplications'

interface StatusUpdatePopoverProps {
  currentStatus: ApplicationStatus | null
  onSelect: (status: ApplicationStatus) => void
  buttonLabel?: string
}

const STATUS_OPTIONS: { value: ApplicationStatus; label: string }[] = [
  { value: 'staged', label: 'Staged' },
  { value: 'applied', label: 'Applied' },
  { value: 'interviewing', label: 'Interviewing' },
  { value: 'in-progress', label: 'In Review' },
  { value: 'offer', label: 'Offer' },
  { value: 'accepted', label: 'Accepted' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'withdrawn', label: 'Withdrawn' },
]

export function StatusUpdatePopover({
  currentStatus,
  onSelect,
  buttonLabel = 'Update status',
}: StatusUpdatePopoverProps) {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return

    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false)
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen])

  const handleSelect = (status: ApplicationStatus) => {
    onSelect(status)
    setIsOpen(false)
  }

  return (
    <div ref={containerRef} className="status-popover-container">
      <button
        type="button"
        className="status-popover-trigger"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        {buttonLabel}
      </button>

      {isOpen && (
        <div className="status-popover" role="listbox" aria-label="Select status">
          {STATUS_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              role="option"
              aria-selected={currentStatus === option.value}
              className={`status-popover__option ${currentStatus === option.value ? 'status-popover__option--active' : ''}`}
              onClick={() => handleSelect(option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
