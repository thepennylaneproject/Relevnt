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
        background: 'rgba(15, 23, 42, 0.8)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 50,
      }}
    >
      <div
        style={{
          width: 'min(480px, 100% - 40px)',
          background: '#020617',
          borderRadius: 16,
          border: '1px solid rgba(148, 163, 184, 0.7)',
          padding: 20,
          boxShadow: '0 20px 60px rgba(0,0,0,0.7)',
        }}
      >
        <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 4 }}>{title}</h3>
        {description && (
          <p style={{ fontSize: 13, color: '#9ca3af', marginBottom: 12 }}>{description}</p>
        )}

        <div style={{ marginBottom: 16 }}>{children}</div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button
            type="button"
            onClick={onCancel}
            style={{
              padding: '6px 10px',
              borderRadius: 999,
              border: '1px solid rgba(148, 163, 184, 0.7)',
              background: 'transparent',
              color: '#e5e7eb',
              fontSize: 13,
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            style={{
              padding: '6px 10px',
              borderRadius: 999,
              border: 'none',
              background: '#22c55e',
              color: '#020617',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Add
          </button>
        </div>
      </div>
    </div>
  )
}