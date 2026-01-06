import React, { useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { PageLayout } from '../components/layout/PageLayout'
import { Heading, Text } from '../components/ui/Typography'
import ResumeBuilderPage from './ResumeBuilderPage'
import ResumeListPage from './ResumeListPage'
import CoverLetterListPage from './CoverLetterListPage'

type View = 'builder' | 'library' | 'letters'

export default function ResumeWorkspacePage(): JSX.Element {
  const [searchParams, setSearchParams] = useSearchParams()
  const viewParam = searchParams.get('view')
  const view: View = viewParam === 'letters' ? 'letters' : viewParam === 'library' ? 'library' : 'builder'

  const toggle = (next: View) => {
    const updated = new URLSearchParams(searchParams)
    if (next === 'builder') {
      updated.delete('view')
    } else {
      updated.set('view', next)
    }
    setSearchParams(updated, { replace: true })
  }

  const tabs = useMemo(
    () => [
      { id: 'builder' as View, label: 'Builder' },
      { id: 'library' as View, label: 'Library' },
      { id: 'letters' as View, label: 'Cover Letters' },
    ],
    []
  )

  return (
    <PageLayout
      title="Resumes & Letters"
      subtitle="Build, refine, and keep multiple professional records organized."
    >
      <div className="space-y-12">
        {/* Navigation Triggers */}
        <div className="flex gap-10 border-b border-border pb-6">
          {tabs.map((tab) => {
            const isActive = view === tab.id
            return (
              <button
                key={tab.id}
                type="button"
                className={`text-[10px] uppercase tracking-[0.2em] font-bold transition-colors ${
                  isActive ? 'text-text border-b border-accent pb-6 -mb-[25px]' : 'text-text-muted hover:text-text'
                }`}
                onClick={() => toggle(tab.id as View)}
              >
                {tab.label}
              </button>
            )
          })}
        </div>

        <div className="pt-4">
          {view === 'builder' ? (
            <ResumeBuilderPage embedded />
          ) : view === 'library' ? (
            <ResumeListPage embedded />
          ) : (
            <CoverLetterListPage embedded />
          )}
        </div>
      </div>
    </PageLayout>
  )
}
