/**
 * =============================================================================
 * CAREER EXPORT SERVICE
 * =============================================================================
 * Service for generating and downloading user career data exports
 * =============================================================================
 */

import { jsPDF } from 'jspdf'
import { supabase } from '../lib/supabase'
import type { User } from '@supabase/supabase-js'
import type { CareerExport, ExportUserProfile } from '../types/export.types'
import { CAREER_EXPORT_VERSION } from '../types/export.types'
import type { Resume } from '../hooks/useResumes'
import type { Application } from '../hooks/useApplications'
import type { UserPersona } from '../types/v2-personas'
import type { FeedbackSignal } from './feedbackService'

/**
 * Generate complete career export data
 */
export async function generateCareerExport(user: User): Promise<CareerExport> {
  // Fetch user profile
  const { data: profileData } = await supabase
    .from('profiles')
    .select('full_name, preferred_name, email, location, current_role_title, timezone, created_at')
    .eq('id', user.id)
    .single()

  const userProfile: ExportUserProfile = {
    fullName: profileData?.full_name || '',
    preferredName: profileData?.preferred_name || '',
    email: user.email || '',
    location: profileData?.location || '',
    currentRoleTitle: profileData?.current_role_title || '',
    timezone: profileData?.timezone || '',
    createdAt: profileData?.created_at || new Date().toISOString(),
  }

  // Fetch all resumes
  const { data: resumesData } = await supabase
    .from('resumes')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  const resumes = (resumesData as Resume[]) || []

  // Fetch all personas with preferences
  const { data: personasData } = await supabase
    .from('user_personas')
    .select('*, preferences:persona_preferences(*)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  const personas = (personasData as UserPersona[]) || []

  // Fetch all applications with events
  const { data: applicationsData } = await supabase
    .from('applications')
    .select('*, jobs(id, title, company, location, salary_min, salary_max), application_events(*)')
    .eq('user_id', user.id)
    .order('applied_date', { ascending: false })

  const applications: Application[] = (applicationsData || []).map((app: any) => ({
    ...app,
    events: (app.application_events || []).sort((a: any, b: any) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    ),
    job: app.jobs ? {
      id: app.jobs.id,
      title: app.jobs.title,
      company: app.jobs.company,
      location: app.jobs.location,
      salary_min: app.jobs.salary_min,
      salary_max: app.jobs.salary_max,
    } : undefined,
  }))

  // Fetch all feedback signals
  const { data: feedbackData } = await supabase
    .from('feedback_signals')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  const feedbackHistory = (feedbackData as FeedbackSignal[]) || []

  // Calculate account age
  const accountCreated = new Date(userProfile.createdAt)
  const now = new Date()
  const daysDiff = Math.floor((now.getTime() - accountCreated.getTime()) / (1000 * 60 * 60 * 24))
  const accountAge = daysDiff < 30 
    ? `${daysDiff} days` 
    : daysDiff < 365 
    ? `${Math.floor(daysDiff / 30)} months`
    : `${Math.floor(daysDiff / 365)} years`

  // Calculate approximate export size
  const dataSize = JSON.stringify({
    resumes,
    personas,
    applications,
    feedbackHistory
  }).length
  const exportSize = dataSize < 1024 
    ? `${dataSize} bytes` 
    : dataSize < 1024 * 1024 
    ? `${(dataSize / 1024).toFixed(1)} KB`
    : `${(dataSize / (1024 * 1024)).toFixed(1)} MB`

  const careerExport: CareerExport = {
    exportDate: new Date().toISOString(),
    version: CAREER_EXPORT_VERSION,
    user: userProfile,
    resumes,
    personas,
    applications,
    feedbackHistory,
    summary: {
      totalResumes: resumes.length,
      totalPersonas: personas.length,
      totalApplications: applications.length,
      totalFeedbackSignals: feedbackHistory.length,
      accountAge,
      exportSize,
    },
  }

  return careerExport
}

/**
 * Download career data as JSON
 */
export function downloadJSON(data: CareerExport): void {
  const jsonString = JSON.stringify(data, null, 2)
  const blob = new Blob([jsonString], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  
  const link = document.createElement('a')
  link.href = url
  link.download = `career-export-${new Date().toISOString().split('T')[0]}.json`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * Generate and download career summary as PDF
 */
export function generatePDFSummary(data: CareerExport): void {
  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 20
  const lineHeight = 7
  let yPosition = margin

  // Helper function to add new page if needed
  const checkPageBreak = (requiredSpace: number = 20) => {
    if (yPosition + requiredSpace > pageHeight - margin) {
      doc.addPage()
      yPosition = margin
      return true
    }
    return false
  }

  // Helper function to add text with word wrap
  const addText = (text: string, fontSize: number = 10, isBold: boolean = false) => {
    doc.setFontSize(fontSize)
    if (isBold) {
      doc.setFont('helvetica', 'bold')
    } else {
      doc.setFont('helvetica', 'normal')
    }
    
    const maxWidth = pageWidth - (2 * margin)
    const lines = doc.splitTextToSize(text, maxWidth)
    
    lines.forEach((line: string) => {
      checkPageBreak()
      doc.text(line, margin, yPosition)
      yPosition += lineHeight
    })
  }

  // Title
  doc.setFontSize(20)
  doc.setFont('helvetica', 'bold')
  doc.text('Career Export Summary', pageWidth / 2, yPosition, { align: 'center' })
  yPosition += 15

  // Export metadata
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text(`Exported: ${new Date(data.exportDate).toLocaleDateString()}`, pageWidth / 2, yPosition, { align: 'center' })
  yPosition += 10

  // User Profile Section
  addText('Professional Profile', 16, true)
  yPosition += 3
  doc.setDrawColor(0, 0, 0)
  doc.line(margin, yPosition, pageWidth - margin, yPosition)
  yPosition += 8

  if (data.user.fullName) addText(`Name: ${data.user.fullName}`)
  if (data.user.currentRoleTitle) addText(`Current Role: ${data.user.currentRoleTitle}`)
  if (data.user.location) addText(`Location: ${data.user.location}`)
  if (data.user.email) addText(`Email: ${data.user.email}`)
  yPosition += 5

  // Summary Statistics
  checkPageBreak(40)
  addText('Account Summary', 16, true)
  yPosition += 3
  doc.line(margin, yPosition, pageWidth - margin, yPosition)
  yPosition += 8

  addText(`Account Age: ${data.summary.accountAge}`)
  addText(`Total Resumes: ${data.summary.totalResumes}`)
  addText(`Total Personas: ${data.summary.totalPersonas}`)
  addText(`Total Applications: ${data.summary.totalApplications}`)
  addText(`Feedback Signals: ${data.summary.totalFeedbackSignals}`)
  yPosition += 5

  // Resumes Section
  if (data.resumes.length > 0) {
    checkPageBreak(40)
    addText('Resumes', 16, true)
    yPosition += 3
    doc.line(margin, yPosition, pageWidth - margin, yPosition)
    yPosition += 8

    data.resumes.forEach((resume, index) => {
      checkPageBreak(25)
      addText(`${index + 1}. ${resume.title}`, 12, true)
      addText(`   Created: ${new Date(resume.created_at).toLocaleDateString()}`)
      if (resume.ats_score) {
        addText(`   ATS Score: ${resume.ats_score}%`)
      }
      if (resume.is_default) {
        addText(`   ⭐ Default Resume`)
      }
      yPosition += 3
    })
    yPosition += 5
  }

  // Personas Section
  if (data.personas.length > 0) {
    checkPageBreak(40)
    addText('Job Search Personas', 16, true)
    yPosition += 3
    doc.line(margin, yPosition, pageWidth - margin, yPosition)
    yPosition += 8

    data.personas.forEach((persona, index) => {
      checkPageBreak(30)
      addText(`${index + 1}. ${persona.name}`, 12, true)
      if (persona.description) {
        addText(`   ${persona.description}`)
      }
      if (persona.is_active) {
        addText(`   ⭐ Active Persona`)
      }
      if (persona.preferences) {
        const prefs = persona.preferences
        if (prefs.job_title_keywords && prefs.job_title_keywords.length > 0) {
          addText(`   Target Roles: ${prefs.job_title_keywords.slice(0, 3).join(', ')}${prefs.job_title_keywords.length > 3 ? '...' : ''}`)
        }
        if (prefs.locations && prefs.locations.length > 0) {
          addText(`   Locations: ${prefs.locations.slice(0, 3).join(', ')}${prefs.locations.length > 3 ? '...' : ''}`)
        }
      }
      yPosition += 3
    })
    yPosition += 5
  }

  // Applications Section Summary
  if (data.applications.length > 0) {
    checkPageBreak(40)
    addText('Application Activity', 16, true)
    yPosition += 3
    doc.line(margin, yPosition, pageWidth - margin, yPosition)
    yPosition += 8

    // Count by status
    const statusCounts = data.applications.reduce((acc, app) => {
      const status = app.status || 'unknown'
      acc[status] = (acc[status] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    Object.entries(statusCounts).forEach(([status, count]) => {
      addText(`${status.charAt(0).toUpperCase() + status.slice(1)}: ${count} applications`)
    })
    yPosition += 5

    // Recent applications
    addText('Recent Applications', 14, true)
    yPosition += 5

    const recentApps = data.applications.slice(0, 10)
    recentApps.forEach((app, index) => {
      checkPageBreak(20)
      addText(`${index + 1}. ${app.position} at ${app.company}`, 11, true)
      addText(`   Applied: ${new Date(app.applied_date).toLocaleDateString()}`)
      addText(`   Status: ${app.status || 'N/A'}`)
      yPosition += 2
    })
  }

  // Footer
  doc.setFontSize(8)
  doc.setFont('helvetica', 'italic')
  const footerText = `Generated by Relevnt • ${new Date().toLocaleDateString()}`
  doc.text(footerText, pageWidth / 2, pageHeight - 10, { align: 'center' })

  // Download PDF
  doc.save(`career-summary-${new Date().toISOString().split('T')[0]}.pdf`)
}

/**
 * Download both JSON and PDF formats
 */
export async function downloadBothFormats(user: User): Promise<void> {
  const data = await generateCareerExport(user)
  downloadJSON(data)
  
  // Small delay to avoid simultaneous downloads being blocked
  setTimeout(() => {
    generatePDFSummary(data)
  }, 500)
}
