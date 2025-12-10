// src/pages/ResumeBuilder/components/AddItemModal.tsx
import React from 'react'

interface AddItemModalProps {
  isOpen: boolean
  title: string
  description?: string
  children?: React.ReactNode
  onConfirm: () => void
  onCancel: () => void
}

export const AddItemModal: React.FC<AddItemModalProps> = ({
  isOpen,
  title,
  description,
  children,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.4)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 50,
        backdropFilter: 'blur(2px)',
      }}
    >
      <div
        className="surface-card"
        style={{
          width: 'min(480px, 100% - 40px)',
          padding: 24,
          boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
          display: 'grid',
          gap: 16,
        }}
      >
        <div>
          <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 4 }}>{title}</h3>
          {description && (
            <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{description}</p>
          )}
        </div>

        <div>{children}</div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 8 }}>
          <button
            type="button"
            onClick={onCancel}
            className="ghost-button"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="primary-button"
          >
            Add
          </button>
        </div>
      </div>
    </div>
  )
}