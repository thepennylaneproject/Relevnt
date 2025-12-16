import React, { useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Icon } from '../components/ui/Icon'
import PageBackground from '../components/shared/PageBackground'
import { Container } from '../components/shared/Container'
import ResumeBuilderPage from './ResumeBuilderPage'
import ResumeListPage from './ResumeListPage'

type View = 'builder' | 'library'

export default function ResumeWorkspacePage(): JSX.Element {
  const [searchParams, setSearchParams] = useSearchParams()
  const viewParam = searchParams.get('view')
  const view: View = viewParam === 'library' ? 'library' : 'builder'

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
      { id: 'builder' as View, label: 'Builder', icon: 'scroll' },
      { id: 'library' as View, label: 'Library', icon: 'folder' },
    ],
    []
  )

  return (
    <PageBackground>
      <Container maxWidth="xl" padding="md">
        <section className="hero-shell">
          <div className="hero-header">
            <div className="jobs-hero-icon">
              <Icon name="scroll" size="md" />
            </div>
            <div className="hero-header-main">
              <p className="text-xs muted">Resumes</p>
              <h1 className="font-display">
                Build, refine, and keep multiple resumes organized.
              </h1>
              <p className="muted">
                Toggle between your builder and library without losing your place.
              </p>
            </div>
          </div>

          <div className="hero-actions-accent">
            <div className="hero-actions-primary">
              <div className="jobs-tabs">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    className={`jobs-tab ${view === tab.id ? 'active' : ''}`}
                    onClick={() => toggle(tab.id)}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>
      </Container>

      {view === 'builder' ? <ResumeBuilderPage embedded /> : <ResumeListPage embedded />}
    </PageBackground>
  )
}
