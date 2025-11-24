export const ASSETS = {
  hero: {
    applications: {
      desktop: '/assets/illustrations/hero/applications/relevnt-applications-hero-16x9.png',
      mobile: '/assets/illustrations/hero/applications/relevnt-applications-hero-4x5.png',
    },
    dashboard: {
      desktop: '/assets/illustrations/hero/dashboard/relevnt-dashboard-hero-16x9.png',
      mobile: '/assets/illustrations/hero/dashboard/relevnt-dashboard-hero-4x5.png',
    },
    jobs: {
      desktop: '/assets/illustrations/hero/jobs/relevnt-jobs-hero-16x9.png',
      mobile: '/assets/illustrations/hero/jobs/relevnt-jobs-hero-4x5.png',
    },
    learn: {
      desktop: '/assets/illustrations/hero/learn/relevnt-learn-hero-16x9.png',
      mobile: '/assets/illustrations/hero/learn/relevnt-learn-hero-4x5.png',
    },
    onboarding: {
      desktop: '/assets/illustrations/hero/onboarding/relevnt-onboarding-hero-16x9.png',
      mobile: '/assets/illustrations/hero/onboarding/relevnt-onboarding-hero-4x5.png',
    },
    preferences: {
      desktop: '/assets/illustrations/hero/preferences/relevnt-preferences-hero-16x9.png',
      mobile: '/assets/illustrations/hero/preferences/relevnt-preferences-hero-4x5.png',
    },
    resumes: {
      desktop: '/assets/illustrations/hero/resumes/relevnt-resumes-hero-16x9.png',
      mobile: '/assets/illustrations/hero/resumes/relevnt-resumes-hero-4x5.png',
    },
    voice: {
      desktop: '/assets/illustrations/hero/voice/relevnt-voice-hero-16x9.png',
      mobile: '/assets/illustrations/hero/voice/relevnt-voice-hero-4x5.png',
    },
  },
  navIcons: {
    applications: {
      svg: '/assets/icons/nav/icon-nav-applications.svg',
      png: '/assets/icons/nav/icon-nav-applications.png',
    },
    dashboard: {
      svg: '/assets/icons/nav/icon-nav-dashboard.svg',
      png: '/assets/icons/nav/icon-nav-dashboard.png',
    },
    jobs: {
      svg: '/assets/icons/nav/icon-nav-jobs.svg',
      png: '/assets/icons/nav/icon-nav-jobs.png',
    },
    learn: {
      svg: '/assets/icons/nav/icon-nav-learn.svg',
      png: '/assets/icons/nav/icon-nav-learn.png',
    },
    preferences: {
      svg: '/assets/icons/nav/icon-nav-preferences.svg',
      png: '/assets/icons/nav/icon-nav-preferences.png',
    },
    resumes: {
      svg: '/assets/icons/nav/icon-nav-resumes.svg',
      png: '/assets/icons/nav/icon-nav-resumes.png',
    },
    voice: {
      svg: '/assets/icons/nav/icon-nav-voice.svg',
      png: '/assets/icons/nav/icon-nav-voice.png',
    },
  },
} as const

export type HeroSection = keyof typeof ASSETS.hero
export type NavIconName = keyof typeof ASSETS.navIcons

export const HERO_ASSET_CONFIG: Record<
  HeroSection,
  {
    desktop: {
      src: string
      alt: string
      invertOnDark: boolean
    }
    mobile: {
      src: string
      alt: string
      invertOnDark: boolean
    }
  }
> = {
  applications: {
    desktop: {
      src: ASSETS.hero.applications.desktop,
      alt: 'Hand-drawn hero illustration for applications, showing a calm view of your submissions.',
      invertOnDark: true,
    },
    mobile: {
      src: ASSETS.hero.applications.mobile,
      alt: 'Hand-drawn hero illustration for applications, showing a calm view of your submissions.',
      invertOnDark: true,
    },
  },
  dashboard: {
    desktop: {
      src: ASSETS.hero.dashboard.desktop,
      alt: 'Hand-drawn hero illustration for the dashboard, showing a calm overview of your job search.',
      invertOnDark: true,
    },
    mobile: {
      src: ASSETS.hero.dashboard.mobile,
      alt: 'Hand-drawn hero illustration for the dashboard, showing a calm overview of your job search.',
      invertOnDark: true,
    },
  },
  jobs: {
    desktop: {
      src: ASSETS.hero.jobs.desktop,
      alt: 'Hand-drawn hero illustration for jobs, highlighting a gentle job discovery flow.',
      invertOnDark: true,
    },
    mobile: {
      src: ASSETS.hero.jobs.mobile,
      alt: 'Hand-drawn hero illustration for jobs, highlighting a gentle job discovery flow.',
      invertOnDark: true,
    },
  },
  learn: {
    desktop: {
      src: ASSETS.hero.learn.desktop,
      alt: 'Hand-drawn hero illustration for learning, showing a calm space to pick up new skills.',
      invertOnDark: true,
    },
    mobile: {
      src: ASSETS.hero.learn.mobile,
      alt: 'Hand-drawn hero illustration for learning, showing a calm space to pick up new skills.',
      invertOnDark: true,
    },
  },
  onboarding: {
    desktop: {
      src: ASSETS.hero.onboarding.desktop,
      alt: 'Hand-drawn hero illustration for onboarding, guiding you through first steps.',
      invertOnDark: true,
    },
    mobile: {
      src: ASSETS.hero.onboarding.mobile,
      alt: 'Hand-drawn hero illustration for onboarding, guiding you through first steps.',
      invertOnDark: true,
    },
  },
  preferences: {
    desktop: {
      src: ASSETS.hero.preferences.desktop,
      alt: 'Hand-drawn hero illustration for preferences, showing gentle controls to tune your experience.',
      invertOnDark: true,
    },
    mobile: {
      src: ASSETS.hero.preferences.mobile,
      alt: 'Hand-drawn hero illustration for preferences, showing gentle controls to tune your experience.',
      invertOnDark: true,
    },
  },
  resumes: {
    desktop: {
      src: ASSETS.hero.resumes.desktop,
      alt: 'Hand-drawn hero illustration for resumes, showing tidy documents ready to share.',
      invertOnDark: true,
    },
    mobile: {
      src: ASSETS.hero.resumes.mobile,
      alt: 'Hand-drawn hero illustration for resumes, showing tidy documents ready to share.',
      invertOnDark: true,
    },
  },
  voice: {
    desktop: {
      src: ASSETS.hero.voice.desktop,
      alt: 'Hand-drawn hero illustration for voice, reflecting a calm way to set your tone.',
      invertOnDark: true,
    },
    mobile: {
      src: ASSETS.hero.voice.mobile,
      alt: 'Hand-drawn hero illustration for voice, reflecting a calm way to set your tone.',
      invertOnDark: true,
    },
  },
}

export const NAV_ICON_CONFIG: Record<
  NavIconName,
  {
    svg: string
    png: string
    alt: string
    invertOnDark: boolean
  }
> = {
  applications: {
    svg: ASSETS.navIcons.applications.svg,
    png: ASSETS.navIcons.applications.png,
    alt: 'Hand-drawn applications icon',
    invertOnDark: true,
  },
  dashboard: {
    svg: ASSETS.navIcons.dashboard.svg,
    png: ASSETS.navIcons.dashboard.png,
    alt: 'Hand-drawn dashboard icon',
    invertOnDark: true,
  },
  jobs: {
    svg: ASSETS.navIcons.jobs.svg,
    png: ASSETS.navIcons.jobs.png,
    alt: 'Hand-drawn jobs icon',
    invertOnDark: true,
  },
  learn: {
    svg: ASSETS.navIcons.learn.svg,
    png: ASSETS.navIcons.learn.png,
    alt: 'Hand-drawn learn icon',
    invertOnDark: true,
  },
  preferences: {
    svg: ASSETS.navIcons.preferences.svg,
    png: ASSETS.navIcons.preferences.png,
    alt: 'Hand-drawn preferences icon',
    invertOnDark: true,
  },
  resumes: {
    svg: ASSETS.navIcons.resumes.svg,
    png: ASSETS.navIcons.resumes.png,
    alt: 'Hand-drawn resumes icon',
    invertOnDark: true,
  },
  voice: {
    svg: ASSETS.navIcons.voice.svg,
    png: ASSETS.navIcons.voice.png,
    alt: 'Hand-drawn voice icon',
    invertOnDark: true,
  },
}
