import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PageLayout } from '../components/layout/PageLayout'
import { Card } from '../components/ui/Card'
import { Heading, Text } from '../components/ui/Typography'
import { Badge } from '../components/ui/Badge'
import { Icon } from '../components/ui/Icon'
import { EmptyState } from '../components/ui/EmptyState'
import { CollectionEmptyGuard } from '../components/ui/CollectionEmptyGuard'
import { Button } from '../components/ui/Button'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import type { Database } from '../types/supabase'

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
      navigate(`/resumes?id=${data.id}`)
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
    <div className="space-y-12">
      <header className="flex justify-between items-end border-b border-border/30 pb-6">
        <div>
          <Heading level={4} className="uppercase tracking-widest text-xs">Resume Library</Heading>
          <Text muted className="mt-1">Manage and access your stored professional records.</Text>
        </div>
        <div className="flex gap-6">
          <button 
            className="text-[10px] uppercase tracking-widest font-bold text-accent border-b border-accent/20 hover:border-accent transition-colors"
            onClick={createResume}
            disabled={creating}
          >
            {creating ? 'Creating…' : 'New Draft'}
          </button>
          <button 
            className="text-[10px] uppercase tracking-widest font-bold text-text-muted hover:text-text transition-colors"
            onClick={() => navigate('/resumes')}
          >
            Active Editor
          </button>
        </div>
      </header>

      {statusText && (
        <Text muted className="italic py-4 border-l border-border pl-4">{statusText}</Text>
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
            onClick: () => navigate('/resumes'),
            variant: 'secondary',
          }}
          
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {resumes.map((resume) => (
            <Card key={resume.id} className="group relative">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <Heading level={4} className="group-hover:text-accent transition-colors">
                    {resume.title || 'Untitled Record'}
                  </Heading>
                  <Text muted className="text-[10px] mt-1 tabular-nums">
                    Updated {resume.updated_at ? new Date(resume.updated_at).toLocaleDateString() : '—'}
                  </Text>
                </div>
                <Badge variant="neutral">Draft</Badge>
              </div>

              <div className="flex justify-between items-center pt-6 border-t border-border/30">
                <div className="flex gap-6">
                  <button
                    className="text-[10px] uppercase tracking-widest font-bold text-accent border-b border-accent/20 hover:border-accent transition-colors"
                    onClick={() => navigate(`/resumes?id=${resume.id}`)}
                  >
                    Modify
                  </button>
                  <button
                    className="text-[10px] uppercase tracking-widest font-bold text-text-muted hover:text-text transition-colors"
                    onClick={() => navigate(`/resumes/${resume.id}/view`)}
                  >
                    Review
                  </button>
                </div>
                <button
                  className="text-[10px] uppercase tracking-widest font-bold text-text-muted hover:text-error transition-colors"
                  onClick={() => deleteResume(resume.id)}
                  disabled={deletingId === resume.id}
                >
                  {deletingId === resume.id ? 'Deleting…' : 'Delete'}
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )

  if (embedded) return content

  return (
    <PageLayout
      title="Resume Library"
      subtitle="Your collection of saved professional records."
    >
      {content}
    </PageLayout>
  )
}
