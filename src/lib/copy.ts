/**
 * ═══════════════════════════════════════════════════════════════════════════
 * RELEVNT COPY / I18N
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Centralized copy for the entire Relevnt app.
 * All UI text should be pulled from this file.
 * 
 * Voice mantra: "Be clear. Be kind. Be accountable."
 * 
 * Guidelines:
 * - Write like you'd talk to a smart friend
 * - Keep sentences short and active
 * - Use contractions (it's, you'll, we're)
 * - Lead with empathy, close with empowerment
 * - Avoid: leverage, synergy, ecosystem, optimize, KPI
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 */

export const copy = {
  // ─────────────────────────────────────────────────────────────────────────
  // BRAND
  // ─────────────────────────────────────────────────────────────────────────
  brand: {
    name: 'Relevnt',
    tagline: 'Authentic intelligence for real people navigating broken systems.',
    footer: 'Relevnt • Est. 2025',
    copyright: '© 2025 Relevnt. All rights reserved.',
  },

  // ─────────────────────────────────────────────────────────────────────────
  // NAVIGATION
  // ─────────────────────────────────────────────────────────────────────────
  nav: {
    dashboard: 'Dash',
    jobs: 'Jobs',
    applications: 'Apps',
    autoApplyQueue: 'Queue',
    resumes: 'CVs',
    learn: 'Learn',
    voice: 'Voice',
    personas: 'Personas',
    settings: 'Prefs',
  },

  // ─────────────────────────────────────────────────────────────────────────
  // ONBOARDING
  // ─────────────────────────────────────────────────────────────────────────
  onboarding: {
    welcome: "Welcome to Relevnt — your AI-powered career coach that shows its work.",
    subtitle: "No corporate spin. No data mining. Just honest tools to help you find what fits.",
    promise: "You're in control. We'll handle the clarity.",
    startButton: "Start for free",
    signInButton: "Sign in",
  },

  // ─────────────────────────────────────────────────────────────────────────
  // DASHBOARD
  // ─────────────────────────────────────────────────────────────────────────
  dashboard: {
    greeting: "Welcome back. Let's find clarity.",
    analysisCount: (used: number, total: number) =>
      `You've used ${used} of ${total} analyses this month.`,
    transparencyReady: "Transparency report ready.",
  },

  // ─────────────────────────────────────────────────────────────────────────
  // JOBS
  // ─────────────────────────────────────────────────────────────────────────
  jobs: {
    pageTitle: "Jobs",
    pageHeadline: "Let Relevnt bring the right roles to you.",
    pageSubtitle: "Browse your ranked feed or explore the full stream when you're in that mood.",
    transparencyLine: "These jobs are ranked based on your persona, résumé, and filters — no mystery scoring.",
    tabs: {
      feed: "Relevnt Feed",
      all: "All jobs",
    },
    feedContext: {
      title: "Your personalized feed",
      description: "Jobs ranked by AI using your preferences. Adjust weights below to fine-tune.",
      noPersona: "Select a persona to see your personalized feed.",
    },
    tuner: {
      title: "Tune your ranking",
      description: "Tell us what to emphasize. We still consider everything — this just adjusts the balance.",
      howItWorks: "How this ranking works",
      presets: {
        balanced: "Balanced",
        skillsFirst: "Skills-first",
        payFirst: "Pay-first",
        remoteFirst: "Remote-friendly",
      },
      presetDescriptions: {
        balanced: "A little bit of everything weighted equally.",
        skillsFirst: "Roles that best match what you already know.",
        payFirst: "Higher salary takes priority in the ranking.",
        remoteFirst: "Remote-friendly roles float to the top.",
      },
    },
    filters: {
      search: "Search title or company",
      location: "Location",
      source: "Source",
      employmentType: "Employment type",
      postedWithin: "Posted within",
      minSalary: "Min salary (USD)",
      remoteOnly: "Remote friendly only",
      clearFilters: "Clear filters",
      refreshJobs: "Refresh jobs",
      minMatchScore: "Match ≥",
    },
    emptyState: {
      title: "No matches visible yet",
      filtered: (visible: number, total: number) =>
        `${visible} of ${total} matches visible with your filters. Try lowering the minimum score or salary to see more — you're not out of chances, just filtered tight.`,
      adjustFilters: "Adjust filters",
      editPersona: "Edit persona",
    },
    card: {
      save: "Save",
      saved: "Saved",
      viewPosting: "View job posting",
    },
    matchScore: {
      label: "Match score",
      explanation: "See how this score was calculated",
    },
  },

  // ─────────────────────────────────────────────────────────────────────────
  // APPLICATIONS
  // ─────────────────────────────────────────────────────────────────────────
  applications: {
    pageTitle: "Applications",
    pageSubtitle: "Track where you're at in each process, without losing the plot.",
    stats: {
      total: "Total",
      active: "Active",
    },
    statuses: {
      all: "All",
      applied: "Applied",
      inProgress: "In progress",
      offer: "Offer",
      accepted: "Accepted",
      rejected: "Rejected",
      withdrawn: "Withdrawn",
    },
    emptyPrompt: "No applications yet. When you apply to a job, log it here so Future You has receipts.",
  },

  // ─────────────────────────────────────────────────────────────────────────
  // RESUMES / CVs
  // ─────────────────────────────────────────────────────────────────────────
  resumes: {
    pageTitle: "Resume builder",
    pageSubtitle: "This draft is your source of truth. Edit sections directly and Relevnt will autosave.",
    uploadButton: "Upload Resume",
    status: {
      ready: "Ready",
      analyzing: "Analyzing...",
      needsWork: "Needs work",
    },
    sections: {
      contact: {
        title: "Contact",
        subtitle: "Who you are and how people should reach you.",
      },
      summary: {
        title: "Summary",
        subtitle: "A sharp, outcome-focused snapshot that sets the frame for your story.",
        headlinePlaceholder: "Your professional headline",
        summaryPlaceholder: "2 to 4 lines that describe who you are, what you do best, and the value you create.",
        rewriteButton: "Rewrite Professional",
      },
      skills: {
        title: "Skills",
        subtitle: "Group skills into themes: Core, Technical, Leadership, Tools, etc.",
        addGroup: "Add skill group",
      },
      experience: {
        title: "Experience",
        subtitle: "Roles where you did the most damage, quantified and structured.",
        addRole: "Add experience",
      },
      education: {
        title: "Education",
        subtitle: "Formal education, bootcamps, and high impact training.",
        addEducation: "Add education",
      },
      certifications: {
        title: "Certifications",
        subtitle: "License, certs, and credentials that move the needle.",
        addCert: "Add certification",
      },
      projects: {
        title: "Projects",
        subtitle: "Passion builds and side projects you're proud of.",
        addProject: "Add project",
      },
    },
  },

  // ─────────────────────────────────────────────────────────────────────────
  // VOICE PROFILE
  // ─────────────────────────────────────────────────────────────────────────
  voice: {
    pageTitle: "Your voice, your agent",
    pageSubtitle: "Before Relevnt writes anything for you, it learns how you sound. This keeps your applications honest, consistent, and authentic.",
    updateNote: "You can update this anytime. Relevnt will use it for resume bullets, application answers, and cover letters when needed.",
    baseStyle: {
      title: "Choose your base style",
      subtitle: "This is the general tone you're comfortable with in professional writing. You can still fine tune below.",
      options: {
        natural: {
          label: "Natural you",
          description: "Balanced, human, clear. Sounds like your best self on a good day.",
        },
        professional: {
          label: "Professional but warm",
          description: "Friendly, polished, and approachable. Great for most roles.",
        },
        direct: {
          label: "Direct and concise",
          description: "Short, efficient, and to the point. Ideal for senior or technical roles.",
        },
        creative: {
          label: "Creative storyteller",
          description: "A bit more narrative and expressive. Good for creative careers.",
        },
        values: {
          label: "Values driven",
          description: "Emphasizes impact, ethics, and alignment. Ideal for mission driven orgs.",
        },
        academic: {
          label: "Academic",
          description: "Measured, well structured, and grounded in evidence.",
        },
      },
    },
    tuning: {
      title: "Fine tune your tone",
      subtitle: "Adjust how playful, formal, and concise you want your writing assistant to be.",
      formality: {
        label: "Formality",
        low: "More casual",
        high: "More formal",
      },
      playfulness: {
        label: "Playfulness",
        low: "Serious",
        high: "Playful",
      },
      conciseness: {
        label: "Conciseness",
        low: "More detail",
        high: "More concise",
      },
    },
    sample: {
      title: "Optional sample",
      subtitle: "Paste a short paragraph you have written. We will use it as additional context to match your voice.",
      placeholder: "Paste a short writing sample here...",
    },
    saveButton: "Save voice profile",
    savedNote: "You can change this later in your settings. Your agent will start using this voice for new applications after you save.",
  },

  // ─────────────────────────────────────────────────────────────────────────
  // PERSONAS
  // ─────────────────────────────────────────────────────────────────────────
  personas: {
    pageTitle: "Personas",
    pageSubtitle: "Create different versions of yourself for different job markets. Switch between them to tailor your feed and applications.",
    emptyState: "You usually wear more than one hat. Define your first persona to start targeting specific roles.",
  },

  // ─────────────────────────────────────────────────────────────────────────
  // PROFESSIONAL PROFILE
  // ─────────────────────────────────────────────────────────────────────────
  profile: {
    pageTitle: "Professional profile",
    pageSubtitle: "This is the version of you Relevnt uses when drafting resumes, cover letters, and outreach. Later we will sync this with your saved resumes and matching logic.",
    versionNote: "This page is v1. Later, we will connect it to your stored profiles and use it as the source of truth for AI-generated applications and outreach.",
    fields: {
      headline: "Headline",
      targetRoles: "Target roles / lanes",
      story: "Short professional story",
      skills: "Top skills you want highlighted",
      links: "Links to surface",
    },
    applicationDetails: {
      title: "Application details",
      subtitle: "These are the boring questions forms ask over and over. We use them to prefill applications and flag anything that needs your approval.",
      workAuth: "Work authorization",
      sponsorship: "Do you now or will you in the future require sponsorship?",
      relocation: {
        label: "Open to relocation?",
        options: {
          no: "No",
          yes: "Yes",
          depends: "Depends on role",
        },
      },
      startDate: "Earliest start date (optional)",
      travel: {
        label: "Travel",
        options: {
          none: "No travel",
          occasional: "Occasional",
          frequent: "Frequent OK",
        },
      },
      whyYou: "Evergreen \"Why you?\" answer",
      strengths: "Strengths or story you want highlighted",
    },
    saveButton: "Save profile",
  },

  // ─────────────────────────────────────────────────────────────────────────
  // SETTINGS / PREFERENCES
  // ─────────────────────────────────────────────────────────────────────────
  settings: {
    pageTitle: "Settings",
    pageSubtitle: "Tune how Relevnt works for you. We keep things simple, honest, and in your control.",
    tabs: {
      jobPrefs: "Job preferences",
      profile: "Professional profile",
      voice: "Voice profile",
    },
    account: {
      title: "Profile & account",
      subtitle: "Basic details to personalize recommendations and copy.",
      fullName: "Full name",
      preferredName: "Preferred name",
      location: "Location",
      locationNote: "We use this to localize roles, salaries, and suggestions. No spam, no sharing.",
      timezone: "Timezone",
      currentRole: "Current role title",
    },
    behavior: {
      title: "How Relevnt behaves",
      subtitle: "Set your theme and how tightly we pack information on screen.",
      theme: {
        label: "Theme preference",
        options: {
          system: "System",
          light: "Light",
          dark: "Dark",
        },
        note: "You can still toggle in the header. This sets your default.",
      },
      density: {
        label: "Layout density",
        options: {
          cozy: "Cozy",
          compact: "Compact",
        },
        note: "Compact mode squeezes more data into view for power browsing.",
      },
    },
    notifications: {
      title: "Notifications & privacy",
      subtitle: "Control what reaches your inbox and how your data is used.",
      options: {
        highConfidence: {
          label: "New high-confidence matches",
          description: "We email you when fresh roles hit your threshold.",
        },
        statusUpdates: {
          label: "Application status updates",
          description: "Progress, rejections, or ghosting patterns we can detect.",
        },
        weeklyDigest: {
          label: "Weekly digest",
          description: "A simple snapshot of activity and next steps.",
        },
        improveRecs: {
          label: "Use my data to improve recommendations",
          description: "We only use your data to rank jobs for you, never to sell or share.",
        },
        experimental: {
          label: "Show experimental features",
          description: "You may see features that are still in progress.",
        },
      },
    },
    actions: {
      exportData: "Export my data",
      deleteAccount: "Delete my account",
      saveChanges: "Save changes",
    },
  },

  // ─────────────────────────────────────────────────────────────────────────
  // LEARN
  // ─────────────────────────────────────────────────────────────────────────
  learn: {
    pageTitle: "Learn",
    pageSubtitle: "Close the gaps the market cares about most, without signing your life away to another bootcamp.",
    comingSoon: "Content coming soon.",
  },

  // ─────────────────────────────────────────────────────────────────────────
  // TRANSPARENCY / AI EXPLANATIONS
  // ─────────────────────────────────────────────────────────────────────────
  transparency: {
    seeHow: "See how this score was calculated",
    whySuggested: "Why we suggested this keyword",
    whatNoticed: "What the AI noticed — and what you can do about it",
    loading: "We're unpacking the reasoning. One sec — we'll show our work.",
    matchExplanation: "This match score is based on skill keywords, experience level, and language alignment. You can view or adjust any factor below.",
  },

  // ─────────────────────────────────────────────────────────────────────────
  // UPGRADE / GATING
  // ─────────────────────────────────────────────────────────────────────────
  upgrade: {
    limitReached: "You've reached your current limit. Ready to expand it?",
    keepExploring: "You've hit your 5 free analyses this month. Upgrade to keep exploring and unlock full transparency reports.",
    doingHardPart: "You're already doing the hard part. Let's make the next step easier — unlock 50 analyses and deeper coaching with Pro.",
    proFeatures: "Relevnt Pro unlocks 50 analyses per month, full résumé optimization, and AI interview prep — all while protecting your data.",
    banner: "Transparency belongs to everyone. Upgrade to unlock deeper insight — and see exactly how we calculate every score.",
    emailSnippet: "Relevnt doesn't believe in paywalls that hide clarity. We just believe your time is worth better tools.",
    upgradeButton: "Upgrade now",
    learnMore: "Learn more",
  },

  // ─────────────────────────────────────────────────────────────────────────
  // ERRORS & ALERTS
  // ─────────────────────────────────────────────────────────────────────────
  errors: {
    generic: "Something went sideways. Want to try again?",
    notSaved: "We didn't save that last analysis — want to try again?",
    timeout: "Server timeout. It's on us, not you. Refresh in a few seconds.",
    fileType: "We couldn't analyze that file type. Try PDF or DOCX.",
    networkError: "We're having trouble connecting. Check your internet and try again.",
    notFound: "We lost our bearings — that page doesn't exist.",
    unauthorized: "You'll need to sign in to see this.",
    tryAgain: "Try again",
    goBack: "Go back",
    refresh: "Refresh",
  },

  // ─────────────────────────────────────────────────────────────────────────
  // SUCCESS STATES
  // ─────────────────────────────────────────────────────────────────────────
  success: {
    analysisComplete: "Analysis complete. Here's what matters most.",
    resumeUpdated: "Résumé updated — your clarity score just improved.",
    applicationSent: "That's one strong application. Let's keep the momentum.",
    profileSaved: "Profile saved.",
    settingsSaved: "Settings saved.",
    voiceSaved: "Voice profile saved. Your agent will use this going forward.",
  },

  // ─────────────────────────────────────────────────────────────────────────
  // CONFIRMATIONS
  // ─────────────────────────────────────────────────────────────────────────
  confirmations: {
    saved: "We saved your progress.",
    upgraded: "Upgrade successful — clarity unlocked.",
    backOnTrack: "You're back on track.",
  },

  // ─────────────────────────────────────────────────────────────────────────
  // BUTTONS / ACTIONS (Generic)
  // ─────────────────────────────────────────────────────────────────────────
  actions: {
    save: "Save",
    cancel: "Cancel",
    delete: "Delete",
    edit: "Edit",
    add: "Add",
    remove: "Remove",
    upload: "Upload",
    download: "Download",
    share: "Share",
    copy: "Copy",
    close: "Close",
    back: "Back",
    next: "Next",
    done: "Done",
    submit: "Submit",
    apply: "Apply",
    search: "Search",
    filter: "Filter",
    clear: "Clear",
    reset: "Reset",
    continue: "Continue",
    skip: "Skip",
    learnMore: "Learn more",
    seeAll: "See all",
    viewDetails: "View details",
    getStarted: "Get started",
    signIn: "Sign in",
    signOut: "Log out",
    signUp: "Sign up",
  },

  // ─────────────────────────────────────────────────────────────────────────
  // EMPTY STATES
  // ─────────────────────────────────────────────────────────────────────────
  emptyStates: {
    applications: {
      title: "Your story starts here",
      description: "No applications yet? No problem. Use the helper below to draft answers for your first one, or log it when you're ready.",
    },
    jobs: {
      title: "Fresh opportunities await",
      description: "We haven't found jobs matching your criteria yet. Try adjusting your filters or check back soon.",
    },
    resumes: {
      title: "Your story, ready to unfold",
      description: "Upload a résumé to see how the system sees you — and how to make it see you better.",
    },
    saved: {
      title: "Nothing saved yet",
      description: "When you find a role worth holding onto, save it here. We'll keep it safe.",
    },
    matches: {
      title: "Finding your direction",
      description: "Once we know more about you, we'll surface roles that actually fit. Upload a résumé to get started.",
    },
    search: {
      title: "No results found",
      description: "We couldn't find what you're looking for. Try different keywords or broaden your search.",
    },
    learn: {
      title: "Coming soon",
      description: "We're building resources to close the gaps the market cares about — without signing your life away to another bootcamp.",
    },
    analysis: {
      title: "No analyses yet",
      description: "Paste a job post or upload a résumé to see how the system sees you. We'll show our work.",
    },
  },

  // ─────────────────────────────────────────────────────────────────────────
  // PRICING
  // ─────────────────────────────────────────────────────────────────────────
  pricing: {
    headline: "Try it free. Upgrade when you're ready.",
    tiers: {
      starter: {
        name: "Starter",
        price: "Free",
        description: "Get started with basic tools.",
      },
      pro: {
        name: "Professional",
        price: "$19/mo",
        description: "Deep clarity for active job seekers.",
      },
      premium: {
        name: "Premium",
        price: "$49/mo",
        description: "Unlimited insights, advanced coaching.",
      },
    },
  },

  // ─────────────────────────────────────────────────────────────────────────
  // ETHICAL AI SECTION
  // ─────────────────────────────────────────────────────────────────────────
  ethics: {
    headline: "We believe in explainable algorithms.",
    audit: "Every model we use is open to audit.",
    privacy: "Your data is encrypted, never sold.",
    dataPromise: "We'll never sell your data. Promise.",
  },
} as const;

// Type helper for accessing nested copy
export type CopyKeys = typeof copy;

export default copy;
