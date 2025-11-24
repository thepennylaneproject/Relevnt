import React from 'react'

type RouteKey = 'dashboard' | 'jobs' | 'apps' | 'cvs' | 'learn' | 'voice' | 'prefs'

const doodles: Record<RouteKey, JSX.Element> = {
  dashboard: (
    <svg width="80" height="80" viewBox="0 0 80 80" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 64c22-12 12-20 24-32s18-4 24-14" />
      <path d="M50 18l6 2-2 6" />
      <circle cx="24" cy="48" r="3" />
      <circle cx="38" cy="34" r="3" />
      <circle cx="56" cy="22" r="3" />
    </svg>
  ),
  jobs: (
    <svg width="80" height="80" viewBox="0 0 80 80" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="34" cy="34" r="16" />
      <path d="M44 44l14 14" />
      <path d="M28 30l8 8" />
      <path d="M28 38l2-2" />
      <path d="M24 26l3-3" />
    </svg>
  ),
  apps: (
    <svg width="80" height="80" viewBox="0 0 80 80" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="16" y="18" width="44" height="32" rx="4" />
      <path d="M16 24l22 14 22-14" />
      <rect x="20" y="30" width="40" height="32" rx="4" transform="translate(5 8)" />
      <path d="M25 41l20 12" />
    </svg>
  ),
  cvs: (
    <svg width="80" height="80" viewBox="0 0 80 80" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="20" y="14" width="34" height="52" rx="4" />
      <path d="M54 22l6 6v32c0 2-2 4-4 4H26" />
      <path d="M28 26h20M28 34h16M28 42h12" />
    </svg>
  ),
  learn: (
    <svg width="80" height="80" viewBox="0 0 80 80" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 34l22-8 22 8-22 8z" />
      <path d="M28 38v14l12 6 12-6V38" />
      <path d="M36 30l4-10 4 10" />
      <path d="M50 28l4-6" />
    </svg>
  ),
  voice: (
    <svg width="80" height="80" viewBox="0 0 80 80" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="16" y="18" width="42" height="30" rx="10" />
      <path d="M58 32h6l-3 6z" />
      <path d="M26 30v10" />
      <path d="M34 26v18" />
      <path d="M42 32v8" />
      <path d="M50 28v16" />
    </svg>
  ),
  prefs: (
    <svg width="80" height="80" viewBox="0 0 80 80" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 24h30" />
      <path d="M18 40h30" />
      <path d="M18 56h30" />
      <circle cx="54" cy="24" r="6" />
      <circle cx="30" cy="40" r="6" />
      <circle cx="46" cy="56" r="6" />
    </svg>
  ),
}

type Props = {
  routeKey: RouteKey
}

export const RouteDoodle: React.FC<Props> = ({ routeKey }) => {
  return (
    <div className="route-doodle" style={{ animation: 'fadeInDoodle 220ms ease both' }}>
      <div className="route-doodle__inner">{doodles[routeKey]}</div>
    </div>
  )
}
