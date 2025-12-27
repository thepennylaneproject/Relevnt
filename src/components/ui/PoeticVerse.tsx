import React from 'react'
import { PoeticVerse as PoeticVerseType } from '../../lib/poeticMoments'

export interface PoeticVerseProps {
  verse: PoeticVerseType
  className?: string
  layout?: 'centered' | 'inline' | 'epigraph'
}

export function PoeticVerse({
  verse,
  className = '',
  layout = 'centered'
}: PoeticVerseProps) {
  if (layout === 'epigraph') {
    return <PoeticEpigraph verse={verse} className={className} />
  }

  if (layout === 'inline') {
    return (
      <div className={`poetic-verse poetic-verse--inline ${className}`}>
        <p className="italic text-ink-secondary dark:text-ivory-secondary">
          "{verse.verse.split('\n')[0]}..."
        </p>
        <span className="text-xs tracking-wider opacity-60">— {verse.poet}</span>
      </div>
    )
  }

  return (
    <div className={`poetic-verse poetic-verse--centered text-center space-y-4 py-8 px-6 ${className}`}>
      <div className="flex justify-center mb-4">
        <span className="w-12 h-px bg-emerald/20"></span>
      </div>
      
      <p 
        className="text-xl md:text-2xl italic text-ink dark:text-ivory leading-relaxed max-w-2xl mx-auto"
        style={{ fontFamily: '"Crimson Text", "Georgia", serif', fontWeight: 300 }}
      >
        {verse.verse}
      </p>
      
      <div className="flex flex-col items-center gap-1">
        <span className="text-sm tracking-widest text-emerald dark:text-emerald/80 font-medium opacity-80">
          {verse.poet}
        </span>
        {verse.attribution && (
          <span className="text-[10px] tracking-wider text-ink-tertiary dark:text-ivory-tertiary italic">
            {verse.attribution}
          </span>
        )}
      </div>

      <div className="flex justify-center mt-6">
        <span className="w-12 h-px bg-emerald/20"></span>
      </div>
    </div>
  )
}

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
      <p className="text-xs tracking-widest text-emerald dark:text-emerald/80">
        {verse.poet}
      </p>
    </div>
  )
}

export function PoeticVerseMinimal({
  verse,
  className = '',
}: {
  verse: PoeticVerseType
  className?: string
}) {
  return (
    <div className={`poetic-verse--minimal text-center ${className}`}>
      <p 
        className="italic text-ink-secondary dark:text-ivory-secondary mb-2"
        style={{ fontFamily: '"Crimson Text", "Georgia", serif', fontSize: '1.1rem' }}
      >
        {verse.verse}
      </p>
      <span className="text-[10px] tracking-widest text-emerald/60">
        — {verse.poet}
      </span>
    </div>
  )
}
