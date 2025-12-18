/**
 * THEIRSTACK API SERVICE
 * 
 * Integration with TheirStack - tech job aggregator with technographic data
 * 
 * Docs: https://api.theirstack.com/openapi
 * API Key: JWT token from credentials
 * 
 * Unique Features:
 * - 195+ countries coverage
 * - Company tech stack data (shows what tech they use)
 * - Real-time job aggregation
 * - Technographic matching (jobs using specific tech)
 * 
 * Value for Relevnt:
 * - Match users to jobs based on tech skills
 * - Show company tech stack in job details
 * - Filter jobs by tech stack requirements
 */

import { trackEvent } from '../analytics.service';

export interface TheirStackJob {
  id: string;
  title: string;
  company: string;
  company_logo: string;
  description: string;
  level: string;
  location: string;
  country: string;
  remote: boolean;
  salary_min?: number;
  salary_max?: number;
  salary_currency?: string;
  job_type: string;
  url: string;
  source: string;
  posted_at: string;
  technologies: string[];
  company_tech_stack?: string[];
  source_name: 'theirstack';
  matchScore?: number;
}

interface TheirStackResponse {
  data: Array<{
    id: string;
    title: string;
    company: string;
    company_logo: string;
    body: string;
    seniority_level: string;
    location: string;
    country: string;
    remote: boolean;
    salary_min?: number;
    salary_max?: number;
    salary_currency?: string;
    employment_type: string;
    url: string;
    source: string;
    posted_at: string;
    technologies?: string[];
    company_data?: {
      technologies?: string[];
    };
  }>;
  next?: string;
}

class TheirStackService {
  private apiKey: string;
  private baseUrl = 'https://api.theirstack.com/api/v1/jobs';

  constructor(apiKey: string = (typeof (globalThis as any).process !== 'undefined' && (globalThis as any).process?.env?.REACT_APP_THEIRSTACK_API_KEY) || '') {
    if (!apiKey) {
      throw new Error('TheirStack API key not found. Set REACT_APP_THEIRSTACK_API_KEY in .env');
    }
    this.apiKey = apiKey;
  }

  /**
   * Search jobs by keyword and/or technology
   */
  async searchJobs(
    keyword?: string,
    technologies?: string[],
    location?: string,
    remote?: boolean,
    limit: number = 25
  ): Promise<TheirStackJob[]> {
    try {
      const params = new URLSearchParams();
      if (keyword) params.append('title', keyword);
      if (location) params.append('location', location);
      if (remote !== undefined) params.append('remote', String(remote));
      params.append('limit', String(limit));

      // Add technologies if provided
      if (technologies?.length) {
        technologies.forEach((tech) => {
          params.append('technologies', tech);
        });
      }

      const response = await fetch(
        `${this.baseUrl}?${params.toString()}`,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`TheirStack API error: ${response.status}`);
      }

      const data: TheirStackResponse = await response.json();

      // Track successful search
      trackEvent('job_searched', {
        source: 'theirstack',
        keyword: keyword || 'all',
        technologies: technologies?.join(',') || 'any',
        remote,
        results_count: data.data.length,
      });

      return this.parseJobs(data.data);
    } catch (error) {
      console.error('TheirStack search failed:', error);
      trackEvent('error_occurred', {
        error: 'theirstack_search_failed',
        keyword,
        technologies: technologies?.join(','),
      });
      throw error;
    }
  }

  /**
   * Search jobs by technology stack
   * (Useful for skill gap analysis - "Find jobs using Python + React")
   */
  async searchByTechStack(
    technologies: string[],
    location?: string,
    limit: number = 25
  ): Promise<TheirStackJob[]> {
    return this.searchJobs(undefined, technologies, location, undefined, limit);
  }

  /**
   * Get popular technologies across job market
   */
  async getPopularTechnologies(): Promise<string[]> {
    // This would require a separate endpoint - simplified for now
    return [
      'JavaScript',
      'Python',
      'React',
      'TypeScript',
      'Node.js',
      'PostgreSQL',
      'AWS',
      'Docker',
      'Kubernetes',
      'Go',
      'Rust',
      'Vue.js',
      'Angular',
      'Java',
      'C++',
      'SQL',
      'GraphQL',
      'MongoDB',
    ];
  }

  /**
   * Parse TheirStack API response to our standard format
   */
  private parseJobs(jobs: TheirStackResponse['data']): TheirStackJob[] {
    return jobs.map((job) => ({
      id: job.id,
      title: job.title,
      company: job.company,
      company_logo: job.company_logo || '',
      description: job.body || '',
      level: job.seniority_level || '',
      location: job.location || '',
      country: job.country || '',
      remote: job.remote || false,
      salary_min: job.salary_min,
      salary_max: job.salary_max,
      salary_currency: job.salary_currency || 'USD',
      job_type: job.employment_type || 'Full-time',
      url: job.url,
      source: job.source,
      posted_at: job.posted_at,
      technologies: job.technologies || [],
      company_tech_stack: job.company_data?.technologies || [],
      source_name: 'theirstack',
    }));
  }

  /**
   * Calculate match score based on technology overlap
   * (Useful for ranking jobs by skill fit)
   */
  calculateTechMatch(
    userTechs: string[],
    jobTechs: string[]
  ): { score: number; matched: string[]; missing: string[] } {
    const userTechsLower = userTechs.map((t) => t.toLowerCase());
    const jobTechsLower = jobTechs.map((t) => t.toLowerCase());

    const matched = jobTechsLower.filter((tech) =>
      userTechsLower.includes(tech)
    );

    const missing = jobTechsLower.filter(
      (tech) => !userTechsLower.includes(tech)
    );

    const score = jobTechsLower.length > 0
      ? Math.round((matched.length / jobTechsLower.length) * 100)
      : 0;

    return {
      score,
      matched: matched.map((t) =>
        jobTechs.find((original) => original.toLowerCase() === t) || t
      ),
      missing: missing.map((t) =>
        jobTechs.find((original) => original.toLowerCase() === t) || t
      ),
    };
  }
}

// Export singleton
const theirStackService = new TheirStackService();
export default theirStackService;
