/**
 * POETIC VOICE INTEGRATION
 *
 * Five-Poet Foundation + Supporting Voices
 * - Poe: Darkness, melancholy, introspection
 * - Frost: Choice, journeys, wisdom
 * - Shakespeare: Truth, humanity, boldness
 * - Angelou: Resilience, strength, dignity
 * - Oliver: Self-trust, wonder, discovery
 * - Hughes: Aspiration, persistence, hope
 * - Dickinson: Quiet persistence, small victories
 * - Lorde: Visibility, authenticity, refusal to disappear
 * - Giovanni: Confidence, pride, celebratory power
 */

export type PoeticMoment =
  | 'empty-jobs'
  | 'empty-applications'
  | 'empty-saved'
  | 'empty-resumes'
  | 'rejection'
  | 'interview-prep'
  | 'application-submitted'
  | 'wellness-sleep'
  | 'wellness-resilience'
  | 'wellness-small-win'
  | 'goal-setting'
  | 'feature-discovery'
  | 'offer-negotiation'
  | 'career-pivot'
  | 'authenticity'
  | 'confidence-boost'

export type PoetName =
  | 'Poe'
  | 'Frost'
  | 'Shakespeare'
  | 'Angelou'
  | 'Oliver'
  | 'Hughes'
  | 'Dickinson'
  | 'Lorde'
  | 'Giovanni'

export interface PoeticVerse {
  moment: PoeticMoment
  poet: PoetName
  verse: string
  attribution: string
  reflection: string
  tone: 'melancholic' | 'grounded' | 'bold' | 'resilient' | 'contemplative' | 'aspirational' | 'persistent'
}

export const poeticMoments: Record<PoeticMoment, PoeticVerse> = {
  'empty-jobs': {
    moment: 'empty-jobs',
    poet: 'Frost',
    verse: 'Two roads diverged in a yellow wood,\nAnd sorry I could not travel both\nAnd be one traveler, long I stood\nAnd looked down one as far as I could\nTo where it bent in the undergrowth.',
    attribution: 'The Road Not Taken — Robert Frost',
    reflection: 'Every journey begins with standing at a threshold. The absence of visible paths is where discovery happens.',
    tone: 'grounded',
  },

  'rejection': {
    moment: 'rejection',
    poet: 'Angelou',
    verse: 'You may write me down in history\nWith your bitter, twisted lies,\nYou may tread me in the very dirt\nBut still, like dust, I\'ll rise.',
    attribution: 'Still I Rise — Maya Angelou',
    reflection: 'Rejection is not a definition; it is a momentary shadow. You have been knocked down, but your capacity to rise is unchanged.',
    tone: 'resilient',
  },

  'career-pivot': {
    moment: 'career-pivot',
    poet: 'Angelou',
    verse: 'You may shoot me with your words,\nYou may cut me with your eyes,\nYou may kill me with your hatefulness,\nBut still, like air, I\'ll rise.',
    attribution: 'Still I Rise — Maya Angelou',
    reflection: 'Changing paths requires a profound act of rising. Do not apologize for your evolution.',
    tone: 'resilient',
  },

  'authenticity': {
    moment: 'authenticity',
    poet: 'Lorde',
    verse: 'And when we speak we are afraid\nour words will not be heard\nnor welcomed—but when we are silent\nwe are still afraid.\nSo it is better to speak\nremembering\nwe were never meant to survive.',
    attribution: 'A Litany for Survival — Audre Lorde',
    reflection: 'Your voice is not a risk; it is a right. Showing up as yourself is the strategy, not the gamble.',
    tone: 'resilient',
  },

  'confidence-boost': {
    moment: 'confidence-boost',
    poet: 'Giovanni',
    verse: 'I sat on the throne\ndrinking nectar with Allah\nI got hot and sent an ice age to Europe\nto cool my thirst.',
    attribution: 'Ego Tripping — Nikki Giovanni',
    reflection: 'Before you walk in, remember the room needs your energy. Let your worth take up space.',
    tone: 'bold',
  },

  'interview-prep': {
    moment: 'interview-prep',
    poet: 'Shakespeare',
    verse: 'All the world\'s a stage,\nAnd all the men and women merely players;\nThey have their exits and their entrances,\nAnd one man in his time plays many parts.',
    attribution: 'As You Like It — William Shakespeare',
    reflection: 'You are not auditioning. You are in conversation. Bring your full repertoire of human truth.',
    tone: 'bold',
  },

  'application-submitted': {
    moment: 'application-submitted',
    poet: 'Frost',
    verse: 'And miles to go before I sleep,\nAnd miles to go before I sleep.',
    attribution: 'Stopping by Woods on a Snowy Evening — Robert Frost',
    reflection: 'You have taken the step. The path continues. Rest when you need to, but know the journey is worth every mile.',
    tone: 'grounded',
  },

  'wellness-sleep': {
    moment: 'wellness-sleep',
    poet: 'Poe',
    verse: 'A dim and shadowed land of sleep,\nWhere tired minds their vigil keep,\nAnd dreams like smoke drift soft and deep—\nIn rest, the soul its secrets keep.',
    attribution: 'The Sleeper (adapted) — Edgar Allan Poe',
    reflection: 'Rest is wisdom. The mind that rests is the mind that rises stronger.',
    tone: 'melancholic',
  },

  'wellness-resilience': {
    moment: 'wellness-resilience',
    poet: 'Angelou',
    verse: 'Leaving behind nights of terror and fear\nI rise\nInto a daybreak that’s wondrously clear\nI rise',
    attribution: 'Still I Rise — Maya Angelou',
    reflection: 'You have endured the difficult cycles. Today is a clear dawn. Trust your strength.',
    tone: 'resilient',
  },

  'wellness-small-win': {
    moment: 'wellness-small-win',
    poet: 'Dickinson',
    verse: '"Hope" is the thing with feathers\nThat perches in the soul\nAnd sings the tune without the words\nAnd never stops - at all -',
    attribution: 'Hope is the thing with feathers — Emily Dickinson',
    reflection: 'Small acts compound. You are building momentum. Hope is a practice, not a destination.',
    tone: 'persistent',
  },

  'goal-setting': {
    moment: 'goal-setting',
    poet: 'Hughes',
    verse: 'Hold fast to dreams\nFor if dreams die\nLife is a broken-winged bird\nThat cannot fly.',
    attribution: 'Dreams — Langston Hughes',
    reflection: 'Your dream matters. Every intentional goal set today moves you closer to flight.',
    tone: 'aspirational',
  },

  'feature-discovery': {
    moment: 'feature-discovery',
    poet: 'Shakespeare',
    verse: 'Of all the wonders that I yet have heard,\nIt seems to me most strange that men should fear.',
    attribution: 'Julius Caesar — William Shakespeare',
    reflection: 'Each new tool in your hands is an act of courage. Using what you\'ve been given is how you become unstoppable.',
    tone: 'bold',
  },

  'offer-negotiation': {
    moment: 'offer-negotiation',
    poet: 'Oliver',
    verse: 'One day you finally knew\nwhat you had to do, and began...',
    attribution: 'The Journey — Mary Oliver',
    reflection: 'This choice—made thoughtfully, with full clarity of what you deserve—is the one that shapes your future.',
    tone: 'contemplative',
  },

  'empty-applications': {
    moment: 'empty-applications',
    poet: 'Oliver',
    verse: 'Tell me, what is it you plan to do\nwith your one wild and precious life?',
    attribution: 'The Summer Day — Mary Oliver',
    reflection: 'Your story is waiting to be told. Begin now to see the world—notice it closely.',
    tone: 'contemplative',
  },

  'empty-saved': {
    moment: 'empty-saved',
    poet: 'Oliver',
    verse: 'Instructions for living a life:\nPay attention.\nBe astonished.\nTell about it.',
    attribution: 'Sometimes — Mary Oliver',
    reflection: 'When you find something worth keeping, save it. Look closer.',
    tone: 'contemplative',
  },

  'empty-resumes': {
    moment: 'empty-resumes',
    poet: 'Shakespeare',
    verse: 'This above all: to thine own self be true,\nAnd it must follow, as the night the day,\nThou canst not then be false to any man.',
    attribution: 'Hamlet — William Shakespeare',
    reflection: 'Your résumé is your truth on paper. Tell your story plainly, and let your work speak.',
    tone: 'bold',
  },
}

/**
 * HAIKU SYSTEM
 */
export type HaikuTheme = 'searching' | 'waiting' | 'finding' | 'resting'

export interface Haiku {
  lines: [string, string, string]
  theme: HaikuTheme
}

const HAIKUS: Haiku[] = [
  { theme: 'searching', lines: ['Blank page waits for ink', 'A path unseen pulls me on', 'Silent steps forward'] },
  { theme: 'searching', lines: ['Sifting through the tide', 'One shell among the many', 'Waiting for my hand'] },
  { theme: 'waiting', lines: ['The deep winter wait', 'Roots are busy in the dark', 'Spring is not a lie'] },
  { theme: 'waiting', lines: ['Mailbox empty still', 'Patience is a quiet room', 'Resting in the gap'] },
  { theme: 'finding', lines: ['The key turns the lock', 'Light floods the forgotten hall', 'Home is where you start'] },
  { theme: 'finding', lines: ['Clear sight through the mist', 'The map matches the mountain', 'Here is where I am'] },
  { theme: 'resting', lines: ['Pen laid on the wood', 'Breath returns to its own rhythm', 'Quiet is enough'] },
  { theme: 'resting', lines: ['Sun sinks in the glass', 'Labor yields to evening light', 'Tomorrow can wait'] },
]

/**
 * Get a random haiku for a specific theme
 */
export function getHaiku(theme: HaikuTheme): Haiku {
  const themedHaikus = HAIKUS.filter(h => h.theme === theme)
  return themedHaikus[Math.floor(Math.random() * themedHaikus.length)]
}

/**
 * Get a poetic verse for a specific moment
 */
export function getPoeticVerse(moment: PoeticMoment): PoeticVerse {
  return poeticMoments[moment]
}
