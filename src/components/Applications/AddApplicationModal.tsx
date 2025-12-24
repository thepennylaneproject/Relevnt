import React, { useState } from 'react'
import { X } from 'lucide-react'
import { useApplications, type ApplicationStatus } from '../../hooks/useApplications'
import { useResumes } from '../../hooks/useResumes'
import { useAuth } from '../../hooks/useAuth'
import { PoeticVerseMinimal } from '../ui/PoeticVerse'
import { getPoeticVerse } from '../../lib/poeticMoments'

interface AddApplicationModalProps {
    isOpen: boolean
    onClose: () => void
}

export function AddApplicationModal({ isOpen, onClose }: AddApplicationModalProps) {
    const { user } = useAuth()
    const { createApplication } = useApplications()
    // Safe check for user existence, though modal shouldn't be open if not logged in
    const { resumes } = useResumes(user!)

    const [formData, setFormData] = useState({
        company: '',
        position: '',
        location: '',
        resume_id: '',
        status: 'applied',
        applied_date: new Date().toISOString().slice(0, 10)
    })
    const [loading, setLoading] = useState(false)

    if (!isOpen) return null

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        try {
            // Find selected resume to snapshot
            // This is the core "Version Tracking" feature - we assume the current version 
            // of the resume is the one being used.
            const selectedResume = resumes.find(r => r.id === formData.resume_id)

            await createApplication(null, {
                ...formData,
                status: formData.status as ApplicationStatus,
                // Pass the full resume object as the snapshot
                resume_snapshot: selectedResume || null
            })
            onClose()
            // Reset form
            setFormData({
                company: '',
                position: '',
                location: '',
                resume_id: '',
                status: 'applied',
                applied_date: new Date().toISOString().slice(0, 10)
            })
        } catch (err) {
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
            <div className="bg-surface border border-border rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95">
                <header className="flex items-center justify-between p-4 border-b border-border bg-surface-accent/50">
                    <h2 className="text-lg font-semibold">Log Application</h2>
                    <button onClick={onClose} className="p-1 hover:bg-surface-hover rounded-md transition-colors">
                        <X size={20} />
                    </button>
                </header>

                {/* Poetic moment: Application submitted */}
                <div className="px-4 pt-4 pb-2 border-b border-border/50 bg-ivory/30 dark:bg-ink/30">
                    <PoeticVerseMinimal verse={getPoeticVerse('application-submitted')} />
                </div>

                <form onSubmit={handleSubmit} className="p-4 space-y-4">
                    <div>
                        <label className="text-xs font-bold uppercase muted block mb-1">Role</label>
                        <input
                            required
                            className="w-full bg-surface-input border border-border rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-accent focus:border-transparent outline-none transition-all"
                            value={formData.position}
                            onChange={e => setFormData({ ...formData, position: e.target.value })}
                            placeholder="e.g. Senior Product Designer"
                        />
                    </div>
                    <div>
                        <label className="text-xs font-bold uppercase muted block mb-1">Company</label>
                        <input
                            required
                            className="w-full bg-surface-input border border-border rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-accent focus:border-transparent outline-none transition-all"
                            value={formData.company}
                            onChange={e => setFormData({ ...formData, company: e.target.value })}
                            placeholder="e.g. Acme Corp"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-bold uppercase muted block mb-1">Location</label>
                            <input
                                className="w-full bg-surface-input border border-border rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-accent focus:border-transparent outline-none transition-all"
                                value={formData.location}
                                onChange={e => setFormData({ ...formData, location: e.target.value })}
                                placeholder="e.g. Remote"
                            />
                        </div>
                        <div>
                            <label className="text-xs font-bold uppercase muted block mb-1">Date Applied</label>
                            <input
                                type="date"
                                required
                                className="w-full bg-surface-input border border-border rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-accent focus:border-transparent outline-none transition-all"
                                value={formData.applied_date}
                                onChange={e => setFormData({ ...formData, applied_date: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="pt-2">
                        <label className="text-xs font-bold uppercase muted block mb-1">Resume Used</label>
                        <select
                            className="w-full bg-surface-input border border-border rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-accent focus:border-transparent outline-none transition-all"
                            value={formData.resume_id}
                            onChange={e => setFormData({ ...formData, resume_id: e.target.value })}
                        >
                            <option value="">No resume selected</option>
                            {resumes.map(r => (
                                <option key={r.id} value={r.id}>{r.title} {r.version_number ? `(v${r.version_number})` : ''}</option>
                            ))}
                        </select>
                        <p className="text-[10px] muted mt-1.5 flex items-center gap-1">
                            <span className="inline-block w-1.5 h-1.5 rounded-full bg-accent"></span>
                            We'll save a snapshot of this version to track what you sent.
                        </p>
                    </div>

                    <div className="flex justify-end pt-4 border-t border-border mt-2">
                        <button
                            type="submit"
                            disabled={loading}
                            className="primary-button"
                        >
                            {loading ? 'Saving...' : 'Log Application'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
