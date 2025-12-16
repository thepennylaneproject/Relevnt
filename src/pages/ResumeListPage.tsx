import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import PageBackground from '../components/shared/PageBackground'
import { Container } from '../components/shared/Container'
import { Icon } from '../components/ui/Icon'
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
      <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-slate-900 text-white p-2">
              <Icon name="scroll" size="sm" />
            </div>
            <div>
              <h1 className="text-lg font-display">Your Resumes</h1>
              <p className="text-sm text-slate-600">
                Create, edit, and organize multiple resumes.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="primary-button button-sm"
              onClick={createResume}
              disabled={creating}
            >
              {creating ? 'Creating…' : 'New Resume'}
            </button>
            <Link to="/resumes/builder" className="ghost-button button-sm">
              Open Builder
            </Link>
          </div>
        </div>

        {statusText && (
          <div className="mb-4 text-sm text-slate-600">{statusText}</div>
        )}

        {resumes.length === 0 && !loading ? (
          <div className="rounded-lg border border-dashed border-slate-200 p-8 text-center">
            <p className="text-sm text-slate-600 mb-3">
              No resumes yet. Create your first resume to get started.
            </p>
            <button
              type="button"
              className="primary-button button-sm"
              onClick={createResume}
              disabled={creating}
            >
              {creating ? 'Creating…' : 'Create Resume'}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {resumes.map((resume) => (
              <div key={resume.id} className="card flex flex-col gap-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold">
                      {resume.title || 'Untitled Resume'}
                    </p>
                    <p className="text-xs text-slate-500">
                      Updated {resume.updated_at ? new Date(resume.updated_at).toLocaleString() : '—'}
                    </p>
                  </div>
                  <button
                    type="button"
                    className="text-xs text-rose-600 hover:text-rose-700"
                    onClick={() => deleteResume(resume.id)}
                    disabled={deletingId === resume.id}
                  >
                    {deletingId === resume.id ? 'Deleting…' : 'Delete'}
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="ghost-button button-sm"
                    onClick={() => navigate(`/resumes/builder?id=${resume.id}`)}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    className="ghost-button button-sm"
                    onClick={() => navigate(`/resumes/builder?id=${resume.id}`)}
                  >
                    Open
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
    </Container>
  )

  if (embedded) return content

  return <PageBackground>{content}</PageBackground>
}
