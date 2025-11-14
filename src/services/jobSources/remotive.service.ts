/**
 * REMOTIVE API SERVICE
 * 
 * Integration with Remotive - remote job board
 * 
 * Docs: https://remotive.com/api/remote-jobs
 * API: No key required for basic access
 * 
 * Features:
 * - Search remote jobs by category, keyword, level
 * - Salary information included
 * - Company information
 * - Direct application links
 * - Clean, simple data format
 */

import { trackEvent } from '../analytics.service';

export interface RemotiveJob {
  id: string;
  title: string;
  company: string;
  company_logo: string;
  level: 'junior' | 'mid' | 'senior' | 'lead' | '';
  category: string;
  description: string;
  salary: string;
  salary_range?: {
    min: number;
    max: number;
    currency: string;
  };
  location: string;
  remote_type: 'fully_remote' | 'partially_remote' | 'hybrid' | 'on_site';
  tags: string[];
  url: string;
  published_at: string;
  source: 'remotive';
  matchScore?: number;
}

interface RemotiveApiResponse {
  jobs: Array<{
    id: number;
    title: string;
    company_name: string;
    company_logo: string;
    experience_level: string;
    category_name: string;
    job_description: string;
    salary: string;
    location: string;
    job_type: string;
    tags: string[];
    url: string;
    published_at: string;
  }>;
}

class RemotiveService {
  private baseUrl = 'https://remotive.com/api/remote-jobs';

  /**
   * Search remote jobs
   */
  async searchJobs(
    keyword?: string,
    category?: string,
    limit: number = 25
  ): Promise<RemotiveJob[]> {
    try {
      const params = new URLSearchParams();
      if (keyword) params.append('search', keyword);
      if (category) params.append('category', category);
      params.append('limit', String(limit));

      const response = await fetch(
        `${this.baseUrl}?${params.toString()}`
      );

      if (!response.ok) {
        throw new Error(`Remotive API error: ${response.status}`);
      }

      const data: RemotiveApiResponse = await response.json();

      // Track successful search
      trackEvent('job_searched', {
        source: 'remotive',
        keyword: keyword || 'all',
        category: category || 'all',
        results_count: data.jobs.length,
      });

      return this.parseJobs(data.jobs);
    } catch (error) {
      console.error('Remotive search failed:', error);
      trackEvent('error_occurred', {
        error: 'remotive_search_failed',
        keyword,
        category,
      });
      throw error;
    }
  }

  /**
   * Get jobs by category
   */
  async getJobsByCategory(category: string, limit: number = 25): Promise<RemotiveJob[]> {
    return this.searchJobs(undefined, category, limit);
  }

  /**
   * Get list of available categories
   */
  async getCategories(): Promise<string[]> {
    try {
      const response = await fetch(`${this.baseUrl}?limit=1`);
      const data: RemotiveApiResponse = await response.json();
      
      // Get unique categories from jobs
      const categories = new Set(data.jobs.map((job) => job.category_name));
      return Array.from(categories);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
      // Return default categories if API fails
      return [
        'Software Development',
        'Data Analyst',
        'Product Manager',
        'Designer',
        'Sales',
        'Marketing',
        'Support',
        'DevOps',
      ];
    }
  }

  /**
   * Parse Remotive API response to our standard format
   */
  private parseJobs(jobs: RemotiveApiResponse['jobs']): RemotiveJob[] {
    return jobs.map((job) => ({
      id: String(job.id),
      title: job.title,
      company: job.company_name,
      company_logo: job.company_logo || '',
      level: this.normalizeLevel(job.experience_level),
      category: job.category_name,
      description: job.job_description,
      salary: job.salary || '',
      salary_range: this.parseSalaryRange(job.salary),
      location: job.location || 'Remote',
      remote_type: this.normalizeRemoteType(job.job_type),
      tags: job.tags || [],
      url: job.url,
      published_at: job.published_at,
      source: 'remotive',
    }));
  }

  /**
   * Normalize experience level to standard format
   */
  private normalizeLevel(
    level: string
  ): 'junior' | 'mid' | 'senior' | 'lead' | '' {
    const lower = level.toLowerCase();
    if (lower.includes('junior')) return 'junior';
    if (lower.includes('mid') || lower.includes('middle')) return 'mid';
    if (lower.includes('senior')) return 'senior';
    if (lower.includes('lead') || lower.includes('principal')) return 'lead';
    return '';
  }

  /**
   * Normalize remote type
   */
  private normalizeRemoteType(
    type: string
  ): 'fully_remote' | 'partially_remote' | 'hybrid' | 'on_site' {
    const lower = type.toLowerCase();
    if (lower.includes('fully')) return 'fully_remote';
    if (lower.includes('partial')) return 'partially_remote';
    if (lower.includes('hybrid')) return 'hybrid';
    return 'on_site';
  }

  /**
   * Parse salary range from string like "$50,000 - $70,000"
   */
  private parseSalaryRange(
    salaryStr: string | null
  ): { min: number; max: number; currency: string } | undefined {
    if (!salaryStr) return undefined;

    // Try to extract numbers
    const numbers = salaryStr.match(/\d+,?\d*/g);
    if (numbers && numbers.length >= 2) {
      const min = parseInt(numbers[0].replace(/,/g, ''), 10);
      const max = parseInt(numbers[1].replace(/,/g, ''), 10);
      return { min, max, currency: 'USD' };
    }

    return undefined;
  }
}

// Export singleton
const remotiveService = new RemotiveService();
export default remotiveService;
