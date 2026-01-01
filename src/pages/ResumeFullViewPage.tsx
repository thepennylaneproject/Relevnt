import React from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Container } from '../components/shared/Container'
import PageBackground from '../components/shared/PageBackground'
import { Button } from '../components/ui/Button'
import { ResumePreview } from '../components/ResumeBuilder/ResumePreview'
import { useResumeBuilder } from '../hooks/useResumeBuilder'
import { Icon } from '../components/ui/Icon'

export default function ResumeFullViewPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  
  const { draft, status, error } = useResumeBuilder({ 
    resumeId: id,
    autosaveDelayMs: 0 // Disable autosave as this is read-only
  })

  if (status === 'loading') {
    return (
      <PageBackground>
        <Container maxWidth="xl" padding="md">
          <div className="flex items-center justify-center min-h-[50vh]">
            <p className="text-muted-foreground">Loading resume...</p>
          </div>
        </Container>
      </PageBackground>
    )
  }

  if (error) {
     return (
      <PageBackground>
        <Container maxWidth="xl" padding="md">
           <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
            <p className="text-red-500">Error loading resume: {error}</p>
             <Button variant="secondary" onClick={() => navigate('/resumes')}>
              Back to Library
            </Button>
          </div>
        </Container>
      </PageBackground>
    )
  }

  return (
    <PageBackground>
      <Container maxWidth="lg" padding="md">
        <div className="flex flex-col gap-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => navigate('/resumes')}
                    className="gap-2"
                >
                    <Icon name="chevron-left" size="sm" />
                    Back to Library
                </Button>

                <div className="flex gap-2">
                     <Button 
                        variant="secondary" 
                        size="sm" 
                        onClick={() => navigate(`/resumes/builder?id=${id}`)}
                    >
                        Edit Resume
                    </Button>
                     <Button 
                        variant="primary" 
                        size="sm" 
                        onClick={() => window.print()}
                    >
                        Print / Download
                    </Button>
                </div>
            </div>

            {/* Resume Preview Paper */}
            <div className="bg-white shadow-lg rounded-sm p-[40px] min-h-[1000px] mx-auto w-full max-w-[850px]">
                <ResumePreview draft={draft} />
            </div>
        </div>
      </Container>
    </PageBackground>
  )
}
