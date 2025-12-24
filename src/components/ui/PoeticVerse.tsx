import React from 'react'
import { PoeticVerse as PoeticVerseType } from '@/lib/poeticMoments'

interface PoeticVerseProps {
  verse: PoeticVerseType
  showReflection?: boolean
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

/**
 * Renders a poetic verse with design system styling
 * Supports serif font, emerald accent, and light/dark mode
 */
export function PoeticVerse({
  verse,
  showReflection = true,
  size = 'md',
  className = '',
}: PoeticVerseProps) {
  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
  }

  return (
    <div
      className={`
        space-y-4 p-4 rounded-lg
        border border-emerald/20
        bg-ivory dark:bg-ink
        animate-in fade-in slide-in-from-bottom-4 duration-500
        ${className}
      `}
    >
      {/* Verse Text */}
      <div
        className={`
          italic font-serif whitespace-pre-line
          text-ink dark:text-ivory
          leading-relaxed
          ${sizeClasses[size]}
        `}
        style={{
          fontFamily: '"Crimson Text", "Georgia", serif',
        }}
      >
        {verse.verse}
      </div>

      {/* Attribution */}
      <div className="text-xs font-medium text-emerald dark:text-emerald/80">
        {verse.attribution}
      </div>

      {/* Reflection */}
      {showReflection && (
        <div
          className={`
            text-sm leading-relaxed
            text-gray dark:text-gray/90
            pt-2 border-t border-emerald/10
          `}
        >
          {verse.reflection}
        </div>
      )}

      {/* Poet Badge */}
      <div className="flex items-center justify-end pt-1">
        <span
          className={`
            inline-block text-xs font-semibold
            px-2 py-1 rounded
            bg-emerald/10 text-emerald dark:bg-emerald/20
          `}
        >
          {verse.poet}
        </span>
      </div>
    </div>
  )
}

/**
 * Minimal verse variant - just the verse and attribution
 * Used for subtle integration into existing UI
 */
export function PoeticVerseMinimal({
  verse,
  className = '',
}: {
  verse: PoeticVerseType
  className?: string
}) {
  return (
    <div
      className={`
        space-y-2
        animate-in fade-in duration-300
        ${className}
      `}
    >
      <p
        className="italic text-sm text-ink dark:text-ivory leading-relaxed"
        style={{
          fontFamily: '"Crimson Text", "Georgia", serif',
        }}
      >
        "{verse.verse.split('\n')[0]}"
      </p>
      <p className="text-xs text-gray dark:text-gray/80">
        — {verse.attribution.split(' — ')[1] || verse.attribution}
      </p>
    </div>
  )
}

/**
 * Epigraph variant - used for page headers or major moments
 * Larger, more prominent presentation
 */
export function PoeticEpigraph({
  verse,
  className = '',
}: {
  verse: PoeticVerseType
  className?: string
}) {
  return (
    <div
      className={`
        text-center space-y-3 py-6 px-4
        border-y border-emerald/20
        bg-ivory/50 dark:bg-ink/50
        animate-in fade-in slide-in-from-top-2 duration-700
        ${className}
      `}
    >
      <p
        className="text-lg md:text-xl italic text-ink dark:text-ivory leading-relaxed"
        style={{
          fontFamily: '"Crimson Text", "Georgia", serif',
          fontWeight: 300,
        }}
      >
        {verse.verse.split('\n')[0]}
      </p>
      <p className="text-xs uppercase tracking-widest text-emerald dark:text-emerald/80">
        {verse.poet}
      </p>
    </div>
  )
}
