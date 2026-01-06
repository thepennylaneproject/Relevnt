/**
 * =============================================================================
 * COMPONENT: ExportDataButton
 * =============================================================================
 * Button and modal for exporting user career data
 * =============================================================================
 */

import { useState } from 'react'
import { Download, FileJson, FileText, X } from 'lucide-react'
import { useCareerExport } from '../../hooks/useCareerExport'
import type { ExportFormat } from '../../types/export.types'

export function ExportDataButton() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const { progress, isExporting, error, exportData, reset } = useCareerExport()

  const handleExport = async (format: ExportFormat) => {
    await exportData(format)
  }

  const handleClose = () => {
    if (!isExporting) {
      setIsModalOpen(false)
      reset()
    }
  }

  return (
    <>
      {/* Export Button */}
      <button
        onClick={() => setIsModalOpen(true)}
        className="button-secondary"
        type="button"
      >
        <Download size={18} />
        Download My Data
      </button>

      {/* Export Modal */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={handleClose}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Export Your Career Data</h2>
              {!isExporting && (
                <button
                  onClick={handleClose}
                  className="icon-button"
                  aria-label="Close"
                  type="button"
                >
                  <X size={20} />
                </button>
              )}
            </div>

            <div className="modal-body">
              <p className="muted" style={{ marginBottom: '24px' }}>
                Download a complete copy of your career data including resumes, applications,
                personas, and feedback history.
              </p>

              {/* Error Message */}
              {error && (
                <div
                  style={{
                    padding: '12px 16px',
                    marginBottom: '20px',
                    backgroundColor: 'var(--color-error-bg)',
                    borderRadius: '8px',
                    color: 'var(--color-error)',
                  }}
                >
                  {error}
                </div>
              )}

              {/* Progress Indicator */}
              {isExporting && (
                <div style={{ marginBottom: '24px' }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      marginBottom: '8px',
                    }}
                  >
                    <div className="spinner" style={{ width: '20px', height: '20px' }} />
                    <span>{progress.message}</span>
                  </div>
                  <div
                    style={{
                      height: '4px',
                      backgroundColor: 'var(--color-surface-2)',
                      borderRadius: '2px',
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        height: '100%',
                        width: `${progress.progress}%`,
                        backgroundColor: 'var(--color-primary)',
                        transition: 'width 0.3s ease',
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Success Message */}
              {progress.stage === 'complete' && (
                <div
                  style={{
                    padding: '12px 16px',
                    marginBottom: '20px',
                    backgroundColor: 'var(--color-success-bg)',
                    borderRadius: '8px',
                    color: 'var(--color-success)',
                  }}
                >
                  ✓ Export complete! Your download should start automatically.
                </div>
              )}

              {/* Format Selection */}
              {!isExporting && progress.stage !== 'complete' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {/* JSON Option */}
                  <button
                    onClick={() => handleExport('json')}
                    className="option-button"
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '12px',
                      padding: '16px',
                      textAlign: 'left',
                    }}
                    type="button"
                  >
                    <FileJson size={24} style={{ flexShrink: 0, marginTop: '2px' }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, marginBottom: '4px' }}>
                        JSON Format
                      </div>
                      <div className="muted" style={{ fontSize: '14px' }}>
                        Machine-readable format. Import into other tools or keep as backup.
                      </div>
                    </div>
                  </button>

                  {/* PDF Option */}
                  <button
                    onClick={() => handleExport('pdf')}
                    className="option-button"
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '12px',
                      padding: '16px',
                      textAlign: 'left',
                    }}
                    type="button"
                  >
                    <FileText size={24} style={{ flexShrink: 0, marginTop: '2px' }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, marginBottom: '4px' }}>
                        PDF Summary
                      </div>
                      <div className="muted" style={{ fontSize: '14px' }}>
                        Human-readable summary of your career journey and activity.
                      </div>
                    </div>
                  </button>

                  {/* Both Option */}
                  <button
                    onClick={() => handleExport('both')}
                    className="option-button"
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '12px',
                      padding: '16px',
                      textAlign: 'left',
                      borderColor: 'var(--color-primary)',
                    }}
                    type="button"
                  >
                    <Download size={24} style={{ flexShrink: 0, marginTop: '2px' }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, marginBottom: '4px' }}>
                        Both Formats
                      </div>
                      <div className="muted" style={{ fontSize: '14px' }}>
                        Download complete data (JSON) and summary (PDF).
                      </div>
                    </div>
                  </button>
                </div>
              )}

              {/* Info Note */}
              {!isExporting && progress.stage !== 'complete' && (
                <div
                  className="muted"
                  style={{
                    marginTop: '20px',
                    padding: '12px',
                    backgroundColor: 'var(--color-surface-2)',
                    borderRadius: '6px',
                    fontSize: '13px',
                  }}
                >
                  <strong>What's included:</strong> Your profile, all resumes, job search
                  personas, applications with timeline, and feedback signals. This export is
                  provided for your records and data portability.
                </div>
              )}
            </div>

            <div className="modal-footer">
              {!isExporting && (
                <button onClick={handleClose} className="button-secondary" type="button">
                  Cancel
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
