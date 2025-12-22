/**
 * RELEVNT BRAND VOICE i18n CONFIG
 * 
 * Single source of truth for all product copy.
 * Enables:
 * - Consistent brand voice across UI
 * - A/B testing copy without code changes
 * - Easy updates from marketing
 * - Translation support (future)
 * 
 * Usage: import { copy } from '@/config/i18n'
 * Then: copy.onboarding.welcome, copy.upgrade.limitReached, etc.
 * 
 * Brand Principles:
 * - Radical Clarity (plain language, short sentences)
 * - Empowered Honesty (truthful, kind)
 * - Ethical Intelligence (transparency, show reasoning)
 */

export const copy = {
  // ============================================
  // ONBOARDING & WELCOME
  // ============================================
  onboarding: {
    welcome: "Welcome to Relevnt — your AI-powered career coach that shows its work.",
    subtitle: "No corporate spin. No data mining. Just honest tools to help you find what fits.",
    ctaStart: "Start for free",
    tagline: "You're in control. We'll handle the clarity.",
  },

  // ============================================
  // EMPTY STATES
  // ============================================
  emptyState: {
    noAnalyses: "No analyses yet. Upload a résumé or paste a job post to see how the system sees you.",
    noResumes: "No résumés yet. Upload one to get started.",
    noApplications: "No applications tracked yet. Apply to jobs and we'll help you track progress.",
    noJobs: "No jobs found. Try adjusting your search or location.",
    noSavedJobs: "No saved jobs yet. Bookmark jobs as you browse to compare later.",
  },

  // ============================================
  // ANALYSIS & AI OUTPUT
  // ============================================
  analysis: {
    seeHow: "See how this score was calculated",
    whyMatters: "Why this matters",
    transparency: "We're unpacking the reasoning. One sec — we'll show our work.",
    scoreExplain: "This match score is based on skill keywords, experience level, and language alignment. You can view or adjust any factor below.",
    uploadResume: "Upload a résumé",
    pasteJob: "Paste a job posting",
    analyzing: "Analyzing your content...",
    analysisComplete: "Analysis complete. Here's what matters most.",
  },

  // ============================================
  // TIER SYSTEM & USAGE LIMITS
  // ============================================
  tier: {
    starterName: "Starter",
    proName: "Professional",
    premiumName: "Premium",
    enterpriseName: "Enterprise",

    starterDesc: "Perfect for exploring. 5 analyses per month.",
    proDesc: "Deep clarity for active job seekers. 50 analyses per month.",
    premiumDesc: "Unlimited insights, advanced coaching, and analytics.",
    enterpriseDesc: "Custom solutions for teams and institutions.",

    starterPrice: "Free",
    proPrice: "$19/month",
    premiumPrice: "$49/month",
    enterprisePrice: "Custom",

    tryFree: "Try it free",
    upgradeToPro: "Upgrade to Pro",
    unlockUnlimited: "Unlock Unlimited",
    contactSales: "Contact us",
  },

  // ============================================
  // UPGRADE & GATING PROMPTS
  // ============================================
  upgrade: {
    limitReached: "You've reached your current limit. Ready to expand it?",
    limitReachedDetail: "You've used all 5 of your free analyses this month.",
    limitReachedAction: "Buy extra analyses for $2 each or upgrade to Pro for 50 per month.",

    promptResume: "You've seen how Relevnt works. Ready to unlock 50 more analyses and full interview prep?",
    promptInterviewPrep: "Interview prep unlocks your best answers to tough questions. Upgrade to Pro to start.",
    promptDashboard: "Your analytics dashboard tracks progress and wins. Upgrade to Premium to unlock it.",

    upgradeProCTA: "Upgrade to Pro for $19/month",
    upgradeProFeatures: "✓ 50 analyses per month\n✓ Resume optimizer\n✓ Interview prep\n✓ Skill gap analysis",

    upgradePremiumCTA: "Unlock Premium for $49/month",
    upgradePremiumFeatures: "✓ Unlimited analyses\n✓ All Pro features\n✓ Analytics dashboard\n✓ Narrative coaching",

    addAnalyses: "Buy extra analyses",
    buyOneAnalysis: "Add 1 ($2)",
    buyFiveAnalyses: "Add 5 ($10)",
    buyTenAnalyses: "Add 10 ($18)",

    orUpgrade: "Or upgrade to unlimited",
  },

  // ============================================
  // ERROR & ALERT COPY
  // ============================================
  errors: {
    generic: "Something went sideways. We didn't save that — want to try again?",
    timeout: "Server timeout. It's on us, not you. Refresh in a few seconds.",
    invalidFile: "We couldn't analyze that file type. Try PDF or DOCX.",
    networkError: "Connection issue. Check your internet and try again.",
    uploadFailed: "Upload failed. Make sure the file is under 10MB.",
    authRequired: "You need to log in to do that.",
    accessDenied: "You don't have access to this feature.",
    notFound: "We couldn't find that. It may have been deleted.",
  },

  // ============================================
  // SUCCESS STATES
  // ============================================
  success: {
    uploadComplete: "Résumé uploaded. Ready to analyze?",
    analysisReady: "Analysis complete. Here's what we found.",
    resumeUpdated: "Résumé updated — your clarity score just improved.",
    applicationTracked: "Application saved. We'll track your progress.",
    congratulations: "That's one strong application. Let's keep the momentum.",
    saved: "We saved your progress.",
  },

  // ============================================
  // BUTTONS & CTAs
  // ============================================
  buttons: {
    uploadResume: "Upload résumé",
    analyzeResume: "Analyze résumé",
    startAnalysis: "Start analysis",
    seeResults: "See results",
    upgradeNow: "Upgrade now",
    learnMore: "Learn more",
    getStarted: "Get started",
    tryFree: "Try free",
    viewPricing: "View pricing",
    contactSales: "Contact sales",
    save: "Save",
    cancel: "Cancel",
    delete: "Delete",
    apply: "Apply",
    bookmark: "Bookmark",
    share: "Share",
    export: "Export",
    close: "Close",
  },

  // ============================================
  // FEATURE DESCRIPTIONS
  // ============================================
  features: {
    resumeAnalysis: "Get an honest ATS score and see exactly how hiring systems will read your résumé.",
    interviewPrep: "Practice tough interview questions with AI coaching. Build confidence before the real thing.",
    skillGap: "See what skills you're missing for your target role. Get specific learning paths to close the gap.",
    jobMatching: "Find jobs that actually fit. We rank by relevance, not just keyword matches.",
    applicationTracking: "Track every application. See patterns. Know what's working.",
    resumeOptimizer: "Get AI suggestions to improve your ATS score without losing your voice.",
    analytics: "See your job search progress at a glance. Understand what's working and adjust.",
    transparencyReports: "Every score shows its reasoning. No black boxes. Just clarity.",
    jobRanking: "Discover which jobs are the best match for your skills and career goals.",
  },

  // ============================================
  // TRUST & TRANSPARENCY
  // ============================================
  trust: {
    noDataSale: "We'll never sell your data. Promise.",
    encrypted: "Your résumés are encrypted and secure.",
    explainable: "Every suggestion includes the reasoning behind it — no mystery scoring.",
    humanReview: "Built by humans who understand job searching.",
    ethicalAI: "AI that respects your autonomy and your time.",
  },

  // ============================================
  // .EDU PROMO
  // ============================================
  eduPromo: {
    banner: "Welcome, recent grad! You've unlocked six months of Relevnt Professional — free.",
    message: "Start your job search with tools that explain themselves. Your free Pro access lasts until [DATE].",
    expiringSoon: "Your free Pro access expires soon. Ready to keep your edge?",
    reminder: "Your free Pro access ends [DATE]. Upgrade now to keep all your progress.",
  },

  // ============================================
  // MARKETING & EMAILS
  // ============================================
  marketing: {
    emailSubjectAnalysisReady: "Your Relevnt summary is ready",
    emailSubjectAnalysisUnlocked: "You've unlocked 5 new analyses",
    emailSubjectPromoExpiring: "Reminder: Your free Pro access ends soon",
    emailSubjectReactivation: "Your progress is waiting",

    emailBodyWelcome: "Welcome to Relevnt. Here's how we're different: we believe job searching should be transparent, ethical, and actually helpful.",
    emailBodyAnalysisReady: "Your résumé analysis is ready. Here's what the system sees — and what you can do about it.",
    emailBodyKeepMomentum: "You're on a roll. Upgrade to Pro to keep analyzing and unlock deeper insights.",
    emailBodyReactivation: "We get it — timing matters. Whenever you're ready, your data and progress will be here waiting.",

    notificationMatchScore: "Your match score improved — check it out.",
    notificationResumeUpdate: "One more résumé update and you're interview-ready.",
    notificationJobMatch: "Found a job that looks like a fit for you.",
  },

  // ============================================
  // SETTINGS & ACCOUNT
  // ============================================
  settings: {
    accountSettings: "Account settings",
    privacy: "Privacy",
    notifications: "Notifications",
    billing: "Billing",
    dataDownload: "Download my data",
    dataDelete: "Delete my account",
    changePassword: "Change password",
    preferredTier: "Current plan",
    usage: "Monthly usage",
    nextBillingDate: "Next billing date",
    cancelSubscription: "Cancel subscription",
  },

  // ============================================
  // ADMIN DASHBOARD (For your use)
  // ============================================
  admin: {
    dashboard: "Admin Dashboard",
    overview: "Overview",
    users: "Users",
    analytics: "Analytics",
    jobSources: "Job Sources",
    errors: "Errors",
    costs: "Costs",
    tiers: "Tiers",

    totalUsers: "Total users",
    activeThisMonth: "Active this month",
    signupsThisWeek: "Signups this week",
    churnRate: "Churn rate",

    analyses: "Analyses run",
    avgCostPerAnalysis: "Avg cost per analysis",
    topModels: "Top models used",

    jobFeedQuality: "Job feed quality",
    sourcePerformance: "Source performance",
    matchAccuracy: "Match accuracy",

    tierDistribution: "Tier distribution",
    mrrByTier: "MRR by tier",
    conversionRate: "Free → Pro conversion",
    eduConversion: ".EDU conversion rate",

    startDate: "Start date",
    tier: "Tier",
    usage: "Usage",
    status: "Status",
    lastActive: "Last active",
  },

  // ============================================
  // PERSONAS
  // ============================================
  personas: {
    pageTitle: "Persona Management",
    pageSubtitle: "Optimize your narrative for different roles and industries.",
    emptyState: "You haven't created any personas yet. Use personas to target different career paths.",
    createFirst: "Create your first persona",
    newPersona: "New Persona",
    editPersona: "Edit Persona",
    confirmDelete: "Are you sure you want to delete this persona?",
  },

  // ============================================
  // NAVIGATION
  // ============================================
  nav: {
    home: "Home",
    dashboard: "Dashboard",
    resumes: "Résumés",
    jobs: "Jobs",
    applications: "Applications",
    settings: "Settings",
    pricing: "Pricing",
    login: "Log in",
    signup: "Sign up",
    logout: "Log out",
    profile: "Profile",
    help: "Help",
    about: "About",
    contact: "Contact",
  },

  // ============================================
  // FORM LABELS & PLACEHOLDERS
  // ============================================
  form: {
    email: "Email",
    password: "Password",
    confirmPassword: "Confirm password",
    firstName: "First name",
    lastName: "Last name",
    jobTitle: "Job title",
    location: "Location",
    searchJobs: "Search jobs...",
    resumeFile: "Choose file or drag to upload",
    jobDescription: "Paste job description here",
    enterApiKey: "Enter API key",
  },
} as const;

// Type-safe copy access
export type CopyKey = typeof copy;
export type CopyPath = string; // e.g., 'onboarding.welcome'

/**
 * Helper function for type-safe copy access with fallback
 * Usage: getCopy('onboarding.welcome')
 */
export function getCopy(path: string): string {
  const keys = path.split('.');
  let value: any = copy;

  for (const key of keys) {
    if (value && typeof value === 'object' && key in value) {
      value = value[key];
    } else {
      console.warn(`Copy not found: ${path}`);
      return path; // Fallback to the path itself
    }
  }

  return typeof value === 'string' ? value : String(value);
}
