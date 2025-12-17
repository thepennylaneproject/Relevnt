/**
 * USAJOBS API SERVICE
 * 
 * Integration with USAJOBS.gov - federal job listings
 * 
 * Docs: https://developer.usajobs.gov/API-Reference
 * API Key: In your credentials file
 * 
 * Features:
 * - Search federal jobs by keyword, location, agency
 * - Filter by salary, series, grade
 * - Get detailed job descriptions
 * - Clean data structure for ranking
 */

import { trackEvent } from '../analytics.service';

export interface USAJobsListing {
  id: string;
  positionTitle: string;
  organizationName: string;
  jobCategory: string[];
  salaryRange: {
    min: number;
    max: number;
    currency: string;
  };
  locations: string[];
  jobSummary: string;
  qualifications: string;
  benefits: string[];
  applicationUrl: string;
  postingDate: string;
  closingDate: string;
  source: 'usajobs';
  matchScore?: number;
}

interface USAJobsResponse {
  SearchResult: {
    SearchResultItems: Array<{
      MatchedObjectId: string;
      MatchedObjectDescriptor: {
        PositionTitle: string;
        OrganizationName: string;
        JobCategory: Array<{ Name: string }>;
        SalaryRange: Array<{
          MinimumRange: number;
          MaximumRange: number;
          RateIntervalCode: string;
        }>;
        JobLocations: Array<{ Location: string }>;
        UserArea: {
          Details: {
            JobSummary: string;
            WhoMayApply: string;
            LowGrade: number;
            HighGrade: number;
            Qualifications: string;
            Benefits: string[];
          };
          IsApplicable?: boolean;
        };
        ApplyUrl: Array<{ URL: string }>;
        PublicationStartDate: string;
        ApplicationCloseDate: string;
      };
    }>;
    TotalMatched: number;
  };
}

class USAJobsService {
  private apiKey: string;
  private baseUrl = 'https://data.usajobs.gov/api/search';
  private userAgent = 'Relevnt-CareerAssistant (contact@relevnt.work)'; // Required by USAJOBS

  constructor(apiKey: string = (typeof (globalThis as any).process !== 'undefined' && (globalThis as any).process?.env?.REACT_APP_USAJOBS_API_KEY) || '') {
    if (!apiKey) {
      throw new Error('USAJOBS API key not found. Set REACT_APP_USAJOBS_API_KEY in .env');
    }
    this.apiKey = apiKey;
  }

  /**
   * Search federal jobs
   */
  async searchJobs(
    keyword: string,
    location?: string,
    limit: number = 25,
    offset: number = 0
  ): Promise<USAJobsListing[]> {
    try {
      const params = new URLSearchParams({
        Keyword: keyword,
        LocationName: location || '',
        ResultsPerPage: String(limit),
        StartIndex: String(offset + 1), // USAJOBS uses 1-based indexing
      });

      const response = await fetch(
        `${this.baseUrl}?${params.toString()}`,
        {
          headers: {
            'Authorization-Key': this.apiKey,
            'User-Agent': this.userAgent,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`USAJOBS API error: ${response.status}`);
      }

      const data: USAJobsResponse = await response.json();
      
      // Track successful search
      trackEvent('job_searched', {
        source: 'usajobs',
        keyword,
        location,
        results_count: data.SearchResult.SearchResultItems.length,
      });

      return this.parseJobListings(data);
    } catch (error) {
      console.error('USAJOBS search failed:', error);
      trackEvent('error_occurred', {
        error: 'usajobs_search_failed',
        keyword,
        location,
      });
      throw error;
    }
  }

  /**
   * Get single job details
   */
  async getJobDetails(jobId: string): Promise<USAJobsListing | null> {
    try {
      const params = new URLSearchParams({
        PositionID: jobId,
      });

      const response = await fetch(
        `${this.baseUrl}?${params.toString()}`,
        {
          headers: {
            'Authorization-Key': this.apiKey,
            'User-Agent': this.userAgent,
          },
        }
      );

      if (!response.ok) {
        return null;
      }

      const data: USAJobsResponse = await response.json();
      const listings = this.parseJobListings(data);
      return listings[0] || null;
    } catch (error) {
      console.error('USAJOBS detail fetch failed:', error);
      return null;
    }
  }

  /**
   * Parse USAJOBS API response to our standard format
   */
  private parseJobListings(data: USAJobsResponse): USAJobsListing[] {
    if (!data.SearchResult?.SearchResultItems) {
      return [];
    }

    return data.SearchResult.SearchResultItems.map((item) => {
      const descriptor = item.MatchedObjectDescriptor;
      const details = (descriptor.UserArea?.Details || {}) as any;
      const salary = (descriptor.SalaryRange?.[0] || {}) as any;

      return {
        id: item.MatchedObjectId,
        positionTitle: descriptor.PositionTitle,
        organizationName: descriptor.OrganizationName,
        jobCategory: descriptor.JobCategory?.map((cat) => cat.Name) || [],
        salaryRange: {
          min: salary?.MinimumRange || 0,
          max: salary?.MaximumRange || 0,
          currency: 'USD',
        },
        locations: descriptor.JobLocations?.map((loc) => loc.Location) || [],
        jobSummary: details?.JobSummary || '',
        qualifications: details?.Qualifications || '',
        benefits: details?.Benefits || [],
        applicationUrl: descriptor.ApplyUrl?.[0]?.URL || '',
        postingDate: descriptor.PublicationStartDate || '',
        closingDate: descriptor.ApplicationCloseDate || '',
        source: 'usajobs',
      };
    });
  }
  /**
   * Get list of job categories (for filtering)
   */
  async getJobCategories(): Promise<string[]> {
    // This would require another API call - simplified for now
    return [
      'Administrative',
      'Business',
      'Accounting',
      'Information Technology',
      'Engineering',
      'Healthcare',
      'Law',
    ];
  }
}

// Export singleton
const usaJobsService = new USAJobsService();
export default usaJobsService;
