import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import PageBackground from '../components/shared/PageBackground'
import { Container } from '../components/shared/Container'
import { Icon } from '../components/ui/Icon'
import { EmptyState } from '../components/ui/EmptyState'
import { CollectionEmptyGuard } from '../components/ui/CollectionEmptyGuard'
import { Button } from '../components/ui/Button'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import type { Database } from '../lib/database.types'

type ResumeRow = Pick<Database['public']['Tables']['resumes']['Row'], 'id' | 'title' | 'updated_at' | 'created_at'>

const LOCAL_STORAGE_KEY = 'resume_builder_last_id'

export default function ResumeListPage({ embedded = false }: { embedded?: boolean }): JSX.Element {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [resumes, setResumes] = useState<ResumeRow[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const loadResumes = useCallback(async () => {
    if (!user) return
    setLoading(true)
    setError(null)
    try {
      const { data, error: fetchError } = await supabase
        .from('resumes')
        .select('id, title, updated_at, created_at')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false, nullsFirst: false })

      if (fetchError) throw fetchError
      setResumes(data || [])
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to load resumes.'
      setError(message)
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    loadResumes()
  }, [loadResumes])

  const createResume = useCallback(async () => {
    if (!user) return
    setCreating(true)
    setError(null)
    try {
      const { data, error: insertError } = await supabase
        .from('resumes')
        .insert({
          user_id: user.id,
          title: 'Untitled Resume',
          parsed_fields: {},
        })
        .select('id')
        .single()

      if (insertError || !data?.id) throw insertError || new Error('Failed to create resume')

      window.localStorage.setItem(LOCAL_STORAGE_KEY, data.id)
      navigate(`/resumes/builder?id=${data.id}`)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to create resume.'
      setError(message)
    } finally {
      setCreating(false)
    }
  }, [user, navigate])

  const deleteResume = useCallback(
    async (id: string) => {
      if (!user) return
      setDeletingId(id)
      setError(null)
      try {
        const { error: deleteError } = await supabase
          .from('resumes')
          .delete()
          .eq('id', id)
          .eq('user_id', user.id)

        if (deleteError) throw deleteError

        setResumes((prev) => prev.filter((r) => r.id !== id))
        if (window.localStorage.getItem(LOCAL_STORAGE_KEY) === id) {
          window.localStorage.removeItem(LOCAL_STORAGE_KEY)
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unable to delete resume.'
        setError(message)
      } finally {
        setDeletingId(null)
      }
    },
    [user]
  )

  const statusText = useMemo(() => {
    if (loading) return 'Loading...'
    if (error) return error
    return ''
  }, [loading, error])

  const content = (
    <Container maxWidth="xl" padding="md">
      <div className="tab-pane active">
        <div className="section-header">
          <h2>Your Resumes</h2>
          <p>Create, edit, and organize multiple resumes.</p>
        </div>

        <div className="section-actions">
          <Button
            type="button"
            variant="primary"
            onClick={createResume}
            disabled={creating}
          >
            {creating ? 'Creating…' : 'New Resume'}
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => navigate('/resumes/builder')}
          >
            Open Builder
          </Button>
        </div>

        {statusText && (
          <div className="mb-4 text-sm text-slate-600">{statusText}</div>
        )}

        {/* DEV: Validate empty state compliance */}
        <CollectionEmptyGuard
          itemsCount={resumes.length}
          hasEmptyState={true}
          scopeId="resume-list"
          expectedAction="Create first resume"
        />

        {resumes.length === 0 && !loading ? (
          <EmptyState
            type="resumes"
            action={{
              label: creating ? 'Creating…' : 'Create your first resume',
              onClick: createResume,
            }}
            secondaryAction={{
              label: 'Open Builder',
              onClick: () => navigate('/resumes/builder'),
              variant: 'secondary',
            }}
            includePoetry={false}
          />
        ) : (
          <div className="resume-list">
            {resumes.map((resume) => (
              <div key={resume.id} className="card-resume">
                <div className="card-header">
                  <h3 className="text-sm font-semibold">
                    {resume.title || 'Untitled Resume'}
                  </h3>
                  <p className="meta">
                    Updated {resume.updated_at ? new Date(resume.updated_at).toLocaleString() : '—'}
                  </p>
                </div>
                <div className="card-actions">
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={() => deleteResume(resume.id)}
                    disabled={deletingId === resume.id}
                  >
                    {deletingId === resume.id ? 'Deleting…' : 'Delete'}
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => navigate(`/resumes/builder?id=${resume.id}`)}
                  >
                    Edit
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate(`/resumes/builder?id=${resume.id}`)}
                  >
                    Open
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Container>
  )

  if (embedded) return content

  return <PageBackground>{content}</PageBackground>
}
