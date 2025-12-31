import React, { useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import PageBackground from '../components/shared/PageBackground'
import { Container } from '../components/shared/Container'
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
    <PageBackground>
      <Container maxWidth="xl" padding="md">
        <div className="page-header">
          <h1>Resumes</h1>
          <p>Build, refine, and keep multiple resumes organized. Toggle between your builder and library without losing your place.</p>
        </div>

        <div className="tabs">
          {tabs.map((tab) => {
            const isActive = view === tab.id
            return (
              <button
                key={tab.id}
                type="button"
                className={`tab ${isActive ? 'active' : ''}`}
                onClick={() => toggle(tab.id as View)}
              >
                <span>{tab.label}</span>
              </button>
            )
          })}
        </div>
      </Container>

      {view === 'builder' ? (
        <ResumeBuilderPage embedded />
      ) : view === 'library' ? (
        <ResumeListPage embedded />
      ) : (
        <CoverLetterListPage embedded />
      )}
    </PageBackground>
  )
}
