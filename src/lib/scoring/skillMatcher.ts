/**
 * ============================================================================
 * SKILL MATCHER
 * ============================================================================
 * Smart skill matching with synonym support and fuzzy matching.
 * 
 * Features:
 * - Extensive skill alias mapping (100+ common tech skills)
 * - Case-insensitive matching
 * - Partial/substring matching for compound skills
 * - Skill category awareness
 * ============================================================================
 */

// ============================================================================
// SKILL ALIASES
// ============================================================================

/**
 * Mapping of canonical skill names to their aliases/synonyms.
 * Uses lowercase for all comparisons.
 */
export const SKILL_ALIASES: Record<string, string[]> = {
    // Programming Languages
    'javascript': ['js', 'ecmascript', 'es6', 'es2015', 'es2020', 'vanilla js', 'vanilla javascript'],
    'typescript': ['ts', 'type script'],
    'python': ['py', 'python3', 'python 3'],
    'java': ['java8', 'java 8', 'java11', 'java 11', 'java17', 'java 17'],
    'c++': ['cpp', 'cplusplus', 'c plus plus'],
    'c#': ['csharp', 'c sharp', 'dotnet', '.net'],
    'ruby': ['ruby on rails', 'ror'],
    'go': ['golang', 'go lang'],
    'rust': ['rustlang'],
    'php': ['php7', 'php 7', 'php8', 'php 8'],
    'swift': ['swift 5', 'swiftui'],
    'kotlin': ['kotlin android'],
    'scala': ['scala lang'],
    'r': ['r programming', 'r language', 'rstats'],

    // Frontend Frameworks
    'react': ['reactjs', 'react.js', 'react js', 'react native', 'reactnative'],
    'angular': ['angularjs', 'angular.js', 'angular 2', 'angular2'],
    'vue': ['vuejs', 'vue.js', 'vue 3', 'vue3', 'nuxt', 'nuxtjs'],
    'svelte': ['sveltejs', 'sveltekit'],
    'next.js': ['nextjs', 'next js', 'next'],
    'gatsby': ['gatsbyjs'],

    // Backend Frameworks
    'node.js': ['nodejs', 'node js', 'node', 'express', 'expressjs', 'express.js'],
    'django': ['django rest', 'drf', 'django rest framework'],
    'flask': ['flask python'],
    'spring': ['spring boot', 'springboot', 'spring framework'],
    'rails': ['ruby on rails', 'ror', 'ruby rails'],
    'laravel': ['laravel php'],
    'fastapi': ['fast api', 'fast-api'],

    // Databases
    'postgresql': ['postgres', 'psql', 'pg', 'postgre'],
    'mysql': ['my sql', 'mariadb', 'maria db'],
    'mongodb': ['mongo', 'mongo db', 'nosql'],
    'redis': ['redis cache', 'redis db'],
    'elasticsearch': ['elastic search', 'elastic', 'es', 'opensearch'],
    'dynamodb': ['dynamo db', 'dynamo', 'aws dynamodb'],
    'cassandra': ['apache cassandra'],
    'sqlite': ['sqlite3', 'sq lite'],

    // Cloud Platforms
    'amazon web services': ['aws', 'amazon aws', 'amazon cloud'],
    'google cloud platform': ['gcp', 'google cloud', 'google gcp'],
    'microsoft azure': ['azure', 'ms azure', 'azure cloud'],
    'heroku': ['heroku cloud'],
    'digitalocean': ['digital ocean', 'do'],
    'vercel': ['vercel cloud', 'zeit'],
    'netlify': ['netlify cloud'],

    // DevOps & Infrastructure
    'docker': ['docker container', 'containerization', 'dockerfile'],
    'kubernetes': ['k8s', 'kube', 'k8', 'aks', 'eks', 'gke'],
    'terraform': ['terraform iac', 'tf'],
    'ansible': ['ansible automation'],
    'jenkins': ['jenkins ci', 'jenkins pipeline'],
    'github actions': ['gh actions', 'github ci'],
    'gitlab ci': ['gitlab ci/cd', 'gitlab pipeline'],
    'circleci': ['circle ci', 'circle'],

    // AI/ML
    'machine learning': ['ml', 'ai/ml', 'ml/ai', 'ml engineering'],
    'artificial intelligence': ['ai', 'gen ai', 'generative ai', 'genai'],
    'deep learning': ['dl', 'neural networks', 'neural network'],
    'tensorflow': ['tf', 'tensor flow'],
    'pytorch': ['torch', 'py torch'],
    'scikit-learn': ['sklearn', 'scikit learn'],
    'natural language processing': ['nlp', 'nlu', 'text mining'],
    'computer vision': ['cv', 'image recognition', 'image processing'],
    'large language models': ['llm', 'llms', 'gpt', 'chatgpt', 'openai'],

    // Data
    'sql': ['structured query language', 'tsql', 't-sql', 'pl/sql', 'plsql'],
    'data analysis': ['data analytics', 'analytics', 'data analyst'],
    'data science': ['data scientist', 'ds'],
    'data engineering': ['data engineer', 'de', 'etl'],
    'apache spark': ['spark', 'pyspark', 'sparkml'],
    'apache kafka': ['kafka', 'kafka streaming'],
    'airflow': ['apache airflow', 'airflow dag'],
    'tableau': ['tableau desktop', 'tableau server'],
    'power bi': ['powerbi', 'power bi desktop', 'pbi'],
    'looker': ['looker studio', 'google looker'],

    // Testing
    'unit testing': ['unit tests', 'unittest', 'testing'],
    'jest': ['jest testing', 'jestjs'],
    'pytest': ['py test', 'python testing'],
    'selenium': ['selenium webdriver', 'selenium testing'],
    'cypress': ['cypress testing', 'cypress.io'],
    'playwright': ['playwright testing'],

    // Methodologies
    'agile': ['agile methodology', 'agile development', 'scrum agile'],
    'scrum': ['scrum master', 'scrum methodology'],
    'kanban': ['kanban board', 'kanban methodology'],
    'ci/cd': ['cicd', 'ci cd', 'continuous integration', 'continuous deployment'],
    'devops': ['dev ops', 'development operations'],
    'tdd': ['test driven development', 'test-driven'],
    'bdd': ['behavior driven development', 'behaviour driven'],

    // Soft Skills
    'communication': ['communication skills', 'written communication', 'verbal communication'],
    'leadership': ['team leadership', 'technical leadership', 'lead'],
    'problem solving': ['problem-solving', 'analytical thinking', 'critical thinking'],
    'project management': ['pm', 'project manager', 'project coordination'],
    'teamwork': ['team collaboration', 'collaboration', 'team player'],
}

/**
 * Reverse lookup: alias -> canonical name
 */
const ALIAS_TO_CANONICAL: Map<string, string> = new Map()

// Build reverse lookup on module load
for (const [canonical, aliases] of Object.entries(SKILL_ALIASES)) {
    const canonicalLower = canonical.toLowerCase()
    ALIAS_TO_CANONICAL.set(canonicalLower, canonicalLower)
    for (const alias of aliases) {
        ALIAS_TO_CANONICAL.set(alias.toLowerCase(), canonicalLower)
    }
}

// ============================================================================
// MATCHING FUNCTIONS
// ============================================================================

/**
 * Normalize a skill string for comparison.
 */
export function normalizeSkill(skill: string): string {
    return skill.toLowerCase().trim()
}

/**
 * Get the canonical form of a skill (resolving aliases).
 */
export function getCanonicalSkill(skill: string): string {
    const normalized = normalizeSkill(skill)
    return ALIAS_TO_CANONICAL.get(normalized) ?? normalized
}

/**
 * Check if a user skill matches text in a job posting.
 * Uses synonym matching and substring matching.
 */
export function matchSkill(userSkill: string, jobText: string): boolean {
    const normalizedJobText = jobText.toLowerCase()
    const normalizedSkill = normalizeSkill(userSkill)
    const canonical = getCanonicalSkill(userSkill)

    // Direct match
    if (normalizedJobText.includes(normalizedSkill)) {
        return true
    }

    // Canonical match
    if (normalizedJobText.includes(canonical)) {
        return true
    }

    // Check all aliases for the canonical skill
    const aliases = SKILL_ALIASES[canonical]
    if (aliases) {
        for (const alias of aliases) {
            if (normalizedJobText.includes(alias.toLowerCase())) {
                return true
            }
        }
    }

    // Check if the skill appears as the canonical of any alias
    for (const alias of ALIAS_TO_CANONICAL.keys()) {
        if (alias === normalizedSkill && normalizedJobText.includes(ALIAS_TO_CANONICAL.get(alias)!)) {
            return true
        }
    }

    return false
}

/**
 * Count skill matches between user skills and job requirements.
 * Returns matched skills, missing required skills, and bonus matches.
 */
export function countSkillMatches(
    userSkills: string[],
    jobRequiredSkills: string[] | null,
    jobPreferredSkills: string[] | null,
    jobDescription: string
): {
    requiredMatched: string[]
    requiredMissing: string[]
    preferredMatched: string[]
    bonusMatches: string[]
} {
    const result = {
        requiredMatched: [] as string[],
        requiredMissing: [] as string[],
        preferredMatched: [] as string[],
        bonusMatches: [] as string[],
    }

    const normalizedJobText = jobDescription.toLowerCase()
    const userSkillSet = new Set(userSkills.map(normalizeSkill))
    const userCanonicalSet = new Set(userSkills.map(getCanonicalSkill))

    // Check required skills
    if (jobRequiredSkills && jobRequiredSkills.length > 0) {
        for (const required of jobRequiredSkills) {
            const requiredCanonical = getCanonicalSkill(required)
            if (userCanonicalSet.has(requiredCanonical) || userSkillSet.has(normalizeSkill(required))) {
                result.requiredMatched.push(required)
            } else {
                result.requiredMissing.push(required)
            }
        }
    }

    // Check preferred skills
    if (jobPreferredSkills && jobPreferredSkills.length > 0) {
        for (const preferred of jobPreferredSkills) {
            const preferredCanonical = getCanonicalSkill(preferred)
            if (userCanonicalSet.has(preferredCanonical) || userSkillSet.has(normalizeSkill(preferred))) {
                result.preferredMatched.push(preferred)
            }
        }
    }

    // Check for bonus matches in job description (skills user has that appear in description)
    for (const skill of userSkills) {
        if (matchSkill(skill, normalizedJobText)) {
            const canonical = getCanonicalSkill(skill)
            // Only count as bonus if not already counted in required/preferred
            const isRequired = result.requiredMatched.some(r => getCanonicalSkill(r) === canonical)
            const isPreferred = result.preferredMatched.some(p => getCanonicalSkill(p) === canonical)
            if (!isRequired && !isPreferred) {
                result.bonusMatches.push(skill)
            }
        }
    }

    return result
}

/**
 * Get all canonical skill names for a list of skills.
 */
export function getCanonicalSkills(skills: string[]): string[] {
    const canonicals = new Set<string>()
    for (const skill of skills) {
        canonicals.add(getCanonicalSkill(skill))
    }
    return Array.from(canonicals)
}

/**
 * Check if two skill lists have overlap (considering aliases).
 */
export function hasSkillOverlap(skills1: string[], skills2: string[]): boolean {
    const set1 = new Set(skills1.map(getCanonicalSkill))
    return skills2.some(skill => set1.has(getCanonicalSkill(skill)))
}
