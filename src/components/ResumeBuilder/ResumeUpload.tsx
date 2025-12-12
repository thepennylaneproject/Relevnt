// src/components/ResumeBuilder/ResumeUpload.tsx
// Enhanced resume upload with drag-and-drop, PDF/DOCX support, and AI extraction

import React, { useState, useCallback, useRef } from 'react'
import { Icon } from '../ui/Icon'
import { useExtractResume } from '../../hooks/useExtractResume'
import type { ResumeDraft } from '../../types/resume-builder.types'

// ============================================================================
// TYPES
// ============================================================================

interface Props {
    onUploadComplete: (parsedData: Partial<ResumeDraft>) => void
}

type UploadStep = 'idle' | 'reading' | 'extracting' | 'complete' | 'error'

interface UploadState {
    step: UploadStep
    fileName: string | null
    progress: number
    error: string | null
}

// ============================================================================
// FILE PARSING UTILITIES
// ============================================================================

/**
 * Extract text from PDF using pdfjs-dist
 */
async function extractTextFromPDF(file: File): Promise<string> {
    // Dynamic import to avoid loading pdfjs unless needed
    const pdfjsLib = await import('pdfjs-dist')

    // Set worker source to local file copied from node_modules
    pdfjsLib.GlobalWorkerOptions.workerSrc = `/pdf.worker.min.mjs`

    const arrayBuffer = await file.arrayBuffer()
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise

    const textParts: string[] = []

    for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i)
        const content = await page.getTextContent()
        const pageText = content.items
            .map((item: any) => item.str)
            .join(' ')
        textParts.push(pageText)
    }

    return textParts.join('\n\n')
}

/**
 * Extract text from DOCX using mammoth
 */
async function extractTextFromDOCX(file: File): Promise<string> {
    const mammothModule = await import('mammoth/mammoth.browser')
    const arrayBuffer = await file.arrayBuffer()
    const result = await mammothModule.convertToHtml({ arrayBuffer })

    // Strip HTML tags to get plain text
    const div = document.createElement('div')
    div.innerHTML = result.value
    return div.textContent || div.innerText || ''
}

/**
 * Detect file type and extract text
 */
/**
 * Detect file type and extract text
 */
async function extractTextFromFile(file: File): Promise<string> {
    const extension = file.name.toLowerCase().split('.').pop()

    try {
        switch (extension) {
            case 'pdf':
                return await extractTextFromPDF(file)
            case 'docx':
            case 'doc':
                return await extractTextFromDOCX(file)
            case 'txt':
                return await file.text()
            default:
                throw new Error(`Unsupported file type: ${extension}. Please use PDF, DOCX, or TXT.`)
        }
    } catch (error) {
        console.error('File extraction error:', error)
        if (error instanceof Error && error.message.includes('import')) {
            throw new Error('Failed to load file parser. Please check your network connection or try a different file format.')
        }
        throw error
    }
}

// ============================================================================
// COMPONENT
// ============================================================================

export const ResumeUpload: React.FC<Props> = ({ onUploadComplete }) => {
    const [showModal, setShowModal] = useState(false)
    const [uploadState, setUploadState] = useState<UploadState>({
        step: 'idle',
        fileName: null,
        progress: 0,
        error: null
    })
    const [resumeText, setResumeText] = useState('')
    const [isDragOver, setIsDragOver] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    // AI extraction hook
    const { extract, loading: extracting } = useExtractResume()

    // -------------------------------------------------------------------------
    // File handling
    // -------------------------------------------------------------------------

    const processFile = useCallback(async (file: File) => {
        setUploadState({
            step: 'reading',
            fileName: file.name,
            progress: 20,
            error: null
        })

        try {
            // Step 1: Extract text from file
            const text = await extractTextFromFile(file)
            console.log('Extracted Text Length:', text.length)
            console.log('Extracted Text Preview:', text.substring(0, 100))
            setResumeText(text)

            setUploadState(prev => ({
                ...prev,
                step: 'extracting',
                progress: 50
            }))

            // Step 2: Use AI to intelligently parse the resume
            const result = await extract(text)

            if (result?.success && result.data) {
                console.log('✅ AI Extraction Success:', result.data)
                console.log('- Full Name:', result.data.fullName)
                console.log('- Email:', result.data.email)
                console.log('- Skills:', result.data.skills)
                console.log('- Experience Count:', result.data.experience?.length)
                console.log('- Education Count:', result.data.education?.length)

                // Map extraction data to ResumeDraft format
                const parsedData: Partial<ResumeDraft> = {
                    contact: {
                        fullName: result.data.fullName || '',
                        email: result.data.email || '',
                        phone: result.data.phone || '',
                        location: result.data.location || '',
                        headline: '',
                        links: []
                    },
                    summary: {
                        headline: '',
                        summary: result.data.summary || ''
                    },
                    skillGroups: result.data.skills?.length
                        ? [{ label: 'Core Skills', skills: result.data.skills }]
                        : [],
                    experience: result.data.experience?.map((exp, idx) => ({
                        id: `exp-${idx}-${Date.now()}`,
                        title: exp.title || '',
                        company: exp.company || '',
                        location: exp.location || '',
                        startDate: exp.startDate || '',
                        endDate: exp.endDate || '',
                        current: exp.current || false,
                        bullets: exp.bullets?.join('\n') || ''
                    })) || [],
                    education: result.data.education?.map((edu, idx) => ({
                        id: `edu-${idx}-${Date.now()}`,
                        institution: edu.institution || '',
                        degree: edu.degree || '',
                        fieldOfStudy: edu.fieldOfStudy || '',
                        startDate: edu.startDate || '',
                        endDate: edu.endDate || '',
                        location: ''
                    })) || [],
                    certifications: result.data.certifications?.map((cert, idx) => ({
                        id: `cert-${idx}-${Date.now()}`,
                        name: cert.name || '',
                        issuer: cert.issuer || '',
                        year: cert.year || ''
                    })) || [],
                    projects: []
                }

                console.log('📦 Parsed Data for ResumeBuilder:', parsedData)
                console.log('- Contact:', parsedData.contact)
                console.log('- Experience entries:', parsedData.experience?.length)
                console.log('- Skill groups:', parsedData.skillGroups?.length)

                setUploadState(prev => ({
                    ...prev,
                    step: 'complete',
                    progress: 100
                }))

                // Brief delay to show completion
                setTimeout(() => {
                    console.log('🚀 Calling onUploadComplete with:', parsedData)
                    onUploadComplete(parsedData)
                    setShowModal(false)
                    resetState()
                }, 500)
            } else {
                console.warn('⚠️ AI extraction failed or returned no data, falling back to regex parsing')
                // Fallback to basic parsing if AI fails
                fallbackParsing(text)
            }
        } catch (err) {
            console.error('Resume parsing error:', err)
            setUploadState(prev => ({
                ...prev,
                step: 'error',
                error: err instanceof Error ? err.message : 'Failed to parse resume'
            }))
        }
    }, [extract, onUploadComplete])

    const fallbackParsing = useCallback((text: string) => {
        // Basic regex parsing as fallback
        const lines = text.split('\n').map(l => l.trim()).filter(Boolean)
        const emailMatch = text.match(/[\w.-]+@[\w.-]+\.\w+/)
        const phoneMatch = text.match(/\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/)

        const parsedData: Partial<ResumeDraft> = {
            contact: {
                fullName: lines[0] || '',
                email: emailMatch ? emailMatch[0] : '',
                phone: phoneMatch ? phoneMatch[0] : '',
                location: '',
                headline: '',
                links: []
            },
            summary: {
                headline: '',
                summary: text.slice(0, 500)
            },
            skillGroups: [],
            experience: [],
            education: [],
            certifications: [],
            projects: []
        }

        setUploadState(prev => ({
            ...prev,
            step: 'complete',
            progress: 100
        }))

        setTimeout(() => {
            onUploadComplete(parsedData)
            setShowModal(false)
            resetState()
        }, 500)
    }, [onUploadComplete])

    const resetState = () => {
        setUploadState({
            step: 'idle',
            fileName: null,
            progress: 0,
            error: null
        })
        setResumeText('')
        setIsDragOver(false)
    }

    // -------------------------------------------------------------------------
    // Drag and drop handlers
    // -------------------------------------------------------------------------

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        setIsDragOver(true)
    }, [])

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        setIsDragOver(false)
    }, [])

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        setIsDragOver(false)

        const files = e.dataTransfer.files
        if (files.length > 0) {
            processFile(files[0])
        }
    }, [processFile])

    const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files
        if (files && files.length > 0) {
            processFile(files[0])
        }
    }, [processFile])

    const handleTextSubmit = useCallback(async () => {
        if (!resumeText.trim()) return

        setUploadState({
            step: 'extracting',
            fileName: 'Pasted text',
            progress: 50,
            error: null
        })

        try {
            const result = await extract(resumeText)

            if (result?.success && result.data) {
                const parsedData: Partial<ResumeDraft> = {
                    contact: {
                        fullName: result.data.fullName || '',
                        email: result.data.email || '',
                        phone: result.data.phone || '',
                        location: result.data.location || '',
                        headline: '',
                        links: []
                    },
                    summary: {
                        headline: '',
                        summary: result.data.summary || ''
                    },
                    skillGroups: result.data.skills?.length
                        ? [{ label: 'Core Skills', skills: result.data.skills }]
                        : [],
                    experience: result.data.experience?.map((exp, idx) => ({
                        id: `exp-${idx}-${Date.now()}`,
                        title: exp.title || '',
                        company: exp.company || '',
                        location: exp.location || '',
                        startDate: exp.startDate || '',
                        endDate: exp.endDate || '',
                        current: exp.current || false,
                        bullets: exp.bullets?.join('\n') || ''
                    })) || [],
                    education: result.data.education?.map((edu, idx) => ({
                        id: `edu-${idx}-${Date.now()}`,
                        institution: edu.institution || '',
                        degree: edu.degree || '',
                        fieldOfStudy: edu.fieldOfStudy || '',
                        startDate: edu.startDate || '',
                        endDate: edu.endDate || '',
                        location: ''
                    })) || [],
                    certifications: result.data.certifications?.map((cert, idx) => ({
                        id: `cert-${idx}-${Date.now()}`,
                        name: cert.name || '',
                        issuer: cert.issuer || '',
                        year: cert.year || ''
                    })) || [],
                    projects: []
                }

                setUploadState(prev => ({ ...prev, step: 'complete', progress: 100 }))
                setTimeout(() => {
                    onUploadComplete(parsedData)
                    setShowModal(false)
                    resetState()
                }, 500)
            } else {
                fallbackParsing(resumeText)
            }
        } catch (err) {
            fallbackParsing(resumeText)
        }
    }, [resumeText, extract, onUploadComplete, fallbackParsing])

    // -------------------------------------------------------------------------
    // Render
    // -------------------------------------------------------------------------

    const isProcessing = uploadState.step === 'reading' || uploadState.step === 'extracting'

    return (
        <>
            <button
                type="button"
                onClick={() => setShowModal(true)}
                className="ghost-button button-sm"
            >
                <Icon name="scroll" size="sm" />
                Import Resume
            </button>

            {showModal && (
                <div className="modal-overlay" onClick={() => !isProcessing && setShowModal(false)}>
                    <div className="modal-content modal-content--lg" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <div>
                                <h3 className="text-sm font-semibold">Import Your Resume</h3>
                                <p className="text-xs muted" style={{ marginTop: '4px' }}>
                                    Upload a file or paste your resume text. We'll intelligently extract your information.
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => !isProcessing && setShowModal(false)}
                                className="ghost-button button-xs"
                                disabled={isProcessing}
                            >
                                ✕
                            </button>
                        </div>

                        <div className="modal-body">
                            {/* Progress indicator when processing */}
                            {isProcessing && (
                                <div className="upload-progress-container" style={{ marginBottom: '16px' }}>
                                    <div className="upload-progress-bar">
                                        <div
                                            className="upload-progress-fill"
                                            style={{ width: `${uploadState.progress}%` }}
                                        />
                                    </div>
                                    <div className="upload-progress-text text-xs">
                                        {uploadState.step === 'reading' && (
                                            <>
                                                <Icon name="scroll" size="sm" />
                                                <span>Reading {uploadState.fileName}...</span>
                                            </>
                                        )}
                                        {uploadState.step === 'extracting' && (
                                            <>
                                                <Icon name="stars" size="sm" />
                                                <span>AI is extracting your information...</span>
                                            </>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Drag and drop zone */}
                            {!isProcessing && (
                                <div
                                    className={`upload-dropzone ${isDragOver ? 'upload-dropzone--active' : ''}`}
                                    onDragOver={handleDragOver}
                                    onDragLeave={handleDragLeave}
                                    onDrop={handleDrop}
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept=".pdf,.docx,.doc,.txt"
                                        onChange={handleFileSelect}
                                        style={{ display: 'none' }}
                                    />
                                    <div className="upload-dropzone-content">
                                        <div className="upload-dropzone-icon">
                                            <Icon name="scroll" size="lg" />
                                        </div>
                                        <p className="text-sm font-medium">
                                            Drag and drop your resume here
                                        </p>
                                        <p className="text-xs muted">
                                            or click to browse
                                        </p>
                                        <p className="text-xs muted" style={{ marginTop: '8px' }}>
                                            Supports PDF, DOCX, and TXT files
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Divider */}
                            {!isProcessing && (
                                <div className="upload-divider">
                                    <span className="text-xs muted">or paste your resume text</span>
                                </div>
                            )}

                            {/* Text paste area */}
                            {!isProcessing && (
                                <textarea
                                    value={resumeText}
                                    onChange={(e) => setResumeText(e.target.value)}
                                    placeholder="Paste your resume text here..."
                                    rows={8}
                                    className="w-full"
                                    style={{ fontFamily: 'var(--font-sans)', fontSize: '0.825rem' }}
                                />
                            )}

                            {/* Error display */}
                            {uploadState.error && (
                                <div className="upload-error text-xs" style={{ marginTop: '12px' }}>
                                    <Icon name="key" size="sm" />
                                    <span>{uploadState.error}</span>
                                </div>
                            )}

                            {/* Success indicator */}
                            {uploadState.step === 'complete' && (
                                <div className="upload-success text-xs" style={{ marginTop: '12px' }}>
                                    <Icon name="stars" size="sm" />
                                    <span>Successfully extracted your resume data!</span>
                                </div>
                            )}
                        </div>

                        <div className="modal-footer">
                            <button
                                type="button"
                                onClick={() => {
                                    setShowModal(false)
                                    resetState()
                                }}
                                className="ghost-button button-sm"
                                disabled={isProcessing}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleTextSubmit}
                                className="primary-button button-sm"
                                disabled={isProcessing || !resumeText.trim()}
                            >
                                {isProcessing ? 'Processing...' : 'Import from Text'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}
