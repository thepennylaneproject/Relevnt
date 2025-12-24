/**
 * POETIC VOICE INTEGRATION
 *
 * Five-Poet Framework
 * - Poe: Darkness, melancholy, introspection, acceptance
 * - Frost: Choice, grounded wisdom, paths and journeys
 * - Shakespeare: Truth, humanity, boldness, self-awareness
 * - Angelou: Resilience, strength, rising up
 * - Mary Oliver: Self-trust, wonder, discovery
 */

export type PoeticMoment =
  | 'empty-jobs'
  | 'rejection'
  | 'interview-prep'
  | 'application-submitted'
  | 'wellness-sleep'
  | 'feature-discovery'
  | 'offer-negotiation'

export type PoetName = 'Poe' | 'Frost' | 'Shakespeare' | 'Angelou' | 'Oliver'

export interface PoeticVerse {
  moment: PoeticMoment
  poet: PoetName
  verse: string
  attribution: string
  reflection: string
  tone: 'melancholic' | 'grounded' | 'bold' | 'resilient' | 'contemplative'
}

export const poeticMoments: Record<PoeticMoment, PoeticVerse> = {
  'empty-jobs': {
    moment: 'empty-jobs',
    poet: 'Frost',
    verse: 'Two roads diverged in a yellow wood,\nAnd sorry I could not travel both\nAnd be one traveler, long I stood\nAnd looked down one as far as I could\nTo where it bent in the undergrowth.',
    attribution: 'The Road Not Taken — Robert Frost',
    reflection: 'Every journey begins with standing at a threshold. The absence of visible paths is where discovery happens. The road you take matters less than taking the first step.',
    tone: 'grounded',
  },

  'rejection': {
    moment: 'rejection',
    poet: 'Poe',
    verse: 'Once upon a midnight dreary, as I pondered, weak and weary,\nOver many a quaint and curious volume of forgotten lore—\nWhile I nodded, napping suddenly, there came a tapping, gently rapping,\n"Sir or Madam," came the tapping, "know that this is not your floor."',
    attribution: 'The Raven (adapted) — Edgar Allan Poe',
    reflection: 'Not every door opens. Not every silence means stillness. The knock that closes one threshold often signals another is preparing to open.',
    tone: 'melancholic',
  },

  'interview-prep': {
    moment: 'interview-prep',
    poet: 'Shakespeare',
    verse: 'All the world\'s a stage,\nAnd all the men and women merely players;\nThey have their exits and their entrances,\nAnd one man in his time plays many parts.',
    attribution: 'As You Like It — William Shakespeare',
    reflection: 'You are not auditioning. You are in conversation. The role you play is the authentic one—bring your full repertoire of experience, wisdom, and human truth.',
    tone: 'bold',
  },

  'application-submitted': {
    moment: 'application-submitted',
    poet: 'Frost',
    verse: 'And miles to go before I sleep,\nAnd miles to go before I sleep.',
    attribution: 'Stopping by Woods on a Snowy Evening — Robert Frost',
    reflection: 'You have taken the step. The path continues. Rest when you need to, but know the journey is long and worth every mile.',
    tone: 'grounded',
  },

  'wellness-sleep': {
    moment: 'wellness-sleep',
    poet: 'Poe',
    verse: 'A dim and shadowed land of sleep,\nWhere tired minds their vigil keep,\nAnd dreams like smoke drift soft and deep—\nIn rest, the soul its secrets keep.',
    attribution: 'The Sleeper (adapted) — Edgar Allan Poe',
    reflection: 'Rest is not surrender. It is wisdom. The mind that rests is the mind that rises stronger.',
    tone: 'melancholic',
  },

  'feature-discovery': {
    moment: 'feature-discovery',
    poet: 'Shakespeare',
    verse: 'Cowards die many times before their deaths;\nThe valiant never taste of death but once.\nOf all the wonders that I yet have heard,\nIt seems to me most strange that men should fear.',
    attribution: 'Julius Caesar — William Shakespeare',
    reflection: 'Each new tool in your hands is an act of courage. Using what you\'ve been given—without hesitation—is how you become unstoppable.',
    tone: 'bold',
  },

  'offer-negotiation': {
    moment: 'offer-negotiation',
    poet: 'Frost',
    verse: 'I took the one less traveled by,\nAnd that has made all the difference.',
    attribution: 'The Road Not Taken — Robert Frost',
    reflection: 'This offer is not the only path. Your choice—made thoughtfully, with full clarity of what you deserve—is the one that shapes your future.',
    tone: 'grounded',
  },
}

/**
 * Get a poetic verse for a specific moment
 */
export function getPoeticVerse(moment: PoeticMoment): PoeticVerse {
  return poeticMoments[moment]
}

/**
 * Get all verses for a specific poet
 */
export function getVersesByPoet(poet: PoetName): PoeticVerse[] {
  const verses: PoeticVerse[] = []
  for (const moment of Object.keys(poeticMoments) as PoeticMoment[]) {
    if (poeticMoments[moment].poet === poet) {
      verses.push(poeticMoments[moment])
    }
  }
  return verses
}

/**
 * Get random reflective text for a moment (for variation)
 */
export function getReflectionForMoment(moment: PoeticMoment): string {
  const verse = getPoeticVerse(moment)
  return verse.reflection
}
