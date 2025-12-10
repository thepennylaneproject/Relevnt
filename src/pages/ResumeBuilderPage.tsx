// src/pages/ResumeBuilderPage.tsx
import * as React from 'react'
import { useState, useMemo } from 'react'

import PageBackground from '../components/shared/PageBackground'
import { Container } from '../components/shared/Container'
import { ContactSection } from '../components/ResumeBuilder/ContactSection'
import { SummarySection } from '../components/ResumeBuilder/SummarySection'
import { SkillsSection } from '../components/ResumeBuilder/SkillsSection'
import { ExperienceSection } from '../components/ResumeBuilder/ExperienceSection'
import { EducationSection } from '../components/ResumeBuilder/EducationSection'
import { CertificationsSection } from '../components/ResumeBuilder/CertificationsSection'
import { ProjectsSection } from '../components/ResumeBuilder/ProjectsSection'
import { SectionCard } from '../components/ResumeBuilder/SectionCard'
import { ResumePreview } from '../components/ResumeBuilder/ResumePreview'
import { Icon, IconName } from '../components/ui/Icon'
import { copy } from '../lib/copy'
import { useRelevntColors } from '../hooks/useRelevntColors'
import type { ResumeDraft } from '../types/resume-builder.types'

type ActiveSection =
  | 'contact'
  | 'summary'
  | 'skills'
  | 'experience'
  | 'education'
  | 'certifications'
  | 'projects'

const SECTION_META: {
  id: ActiveSection
  label: string
  icon: IconName
}[] = [
    { id: 'contact', label: copy.resumes.sections.contact.title, icon: 'compass' },
    { id: 'summary', label: copy.resumes.sections.summary.title, icon: 'scroll' },
    { id: 'skills', label: copy.resumes.sections.skills.title, icon: 'stars' },
    { id: 'experience', label: copy.resumes.sections.experience.title, icon: 'briefcase' },
    { id: 'education', label: copy.resumes.sections.education.title, icon: 'book' },
    { id: 'certifications', label: copy.resumes.sections.certifications.title, icon: 'key' },
    { id: 'projects', label: copy.resumes.sections.projects.title, icon: 'lighthouse' },
  ]

const ResumeBuilderPage: React.FC = () => {
  const [activeSection, setActiveSection] = useState<ActiveSection>('contact')

  // shared state (can tighten types later)
  const [contact, setContact] = useState<any>({})
  const [summary, setSummary] = useState<any>('')
  const [skillGroups, setSkillGroups] = useState<any[]>([])
  const [experienceItems, setExperienceItems] = useState<any[]>([])
  const [educationItems, setEducationItems] = useState<any[]>([])
  const [certificationItems, setCertificationItems] = useState<any[]>([])
  const [projectItems, setProjectItems] = useState<any[]>([])

  const colors = useRelevntColors()

  const draft: ResumeDraft = useMemo(
    () =>
    ({
      contact,
      summary: { summary },
      experience: experienceItems,
      education: educationItems,
      skillGroups,
      projects: projectItems,
      certifications: certificationItems,
    } as ResumeDraft),
    [
      contact,
      summary,
      experienceItems,
      educationItems,
      skillGroups,
      projectItems,
      certificationItems,
    ]
  )

  return (
    <PageBackground>
      <Container maxWidth="xl" padding="md">
        <div className="resume-page">
          {/* HERO */}
          <section className="hero-shell">
            <div className="hero-header">
              <div className="hero-icon">
                <Icon name="scroll" size="md" />
              </div>
              <div className="hero-header-main">
                <p className="text-xs muted">{copy.nav.resumes}</p>
                <h1 className="font-display">{copy.resumes.pageTitle}</h1>
                <p className="muted">
                  {copy.resumes.pageSubtitle}
                </p>
              </div>
            </div>

            <div className="hero-actions-accent">
              <nav className="resume-section-nav">
                {SECTION_META.map((section) => {
                  const isActive = section.id === activeSection
                  return (
                    <button
                      key={section.id}
                      type="button"
                      onClick={() => setActiveSection(section.id)}
                      className={`resume-section-nav-btn ${isActive ? 'resume-section-nav-btn--active' : ''}`}
                    >
                      <Icon name={section.icon} size="sm" hideAccent={!isActive} />
                      <span className="sr-only">{section.label}</span>
                    </button>
                  )
                })}
              </nav>
            </div>
          </section>

          {/* EDITOR + PREVIEW IN 2-COLUMN GRID */}
          <section className="page-two-column">
            {/* LEFT: active editor section */}
            <div className="card-shell card-shell--soft">

              {activeSection === 'contact' && (
                <ContactSection contact={contact} onChange={setContact} />
              )}

              {activeSection === 'summary' && (
                <SummarySection summary={summary} onChange={setSummary} />
              )}

              {activeSection === 'skills' && (
                <SkillsSection
                  id="skills"
                  skillGroups={skillGroups}
                  onChange={setSkillGroups}
                  colors={colors}
                />
              )}

              {activeSection === 'experience' && (
                <ExperienceSection
                  id="experience"
                  items={experienceItems}
                  onChange={setExperienceItems}
                  colors={colors}
                />
              )}

              {activeSection === 'education' && (
                <EducationSection
                  id="education"
                  items={educationItems}
                  onChange={setEducationItems}
                  colors={colors}
                />
              )}

              {activeSection === 'certifications' && (
                <CertificationsSection
                  id="certifications"
                  items={certificationItems}
                  onChange={setCertificationItems}
                  colors={colors}
                />
              )}

              {activeSection === 'projects' && (
                <ProjectsSection
                  id="projects"
                  items={projectItems}
                  onChange={setProjectItems}
                  colors={colors}
                />
              )}
            </div>

            {/* RIGHT: preview card */}
            <div className="card-shell card-shell--soft">
              <div>
                <h2 className="text-sm font-semibold">Preview</h2>
                <p className="muted text-xs">
                  Your resume layout will update as you fill in each section.
                </p>
              </div>
              <ResumePreview draft={draft} />
            </div>
          </section>
        </div>
      </Container>
    </PageBackground>
  )
}

export default ResumeBuilderPage
