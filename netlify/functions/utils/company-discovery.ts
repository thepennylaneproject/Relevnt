/**
 * Company Auto-Discovery Service
 * Continuously finds new companies using public data sources
 */

export interface CompanyDiscoverySource {
  name: string
  fetch: () => Promise<DiscoveredCompany[]>
  enabled: boolean
}

export interface DiscoveredCompany {
  name: string
  domain: string
  website?: string
  description?: string
  industry?: string
  funding_stage?: string
  employee_count?: number
  founded_year?: number
  source: string
  confidence: number // 0-1
}

export interface PlatformDetectionResult {
  company_id: string
  company_name: string
  domain: string
  lever_slug?: string
  greenhouse_board_token?: string
  detected_at: string
  detection_method: 'html_parse' | 'api_query' | 'manual'
}

/**
 * Y Combinator Directory Discovery
 * Uses multiple reliable community-maintained sources
 */
export async function discoverFromYCombinator(): Promise<DiscoveredCompany[]> {
  try {
    const companies: DiscoveredCompany[] = [];

    // Reliable community sources for YC data
    const sources = [
      {
        url: 'https://raw.githubusercontent.com/mittsh/yclist/master/list.json',
        parser: (data: any) => data
          .filter((c: any) => c.status === 'Active')
          .map((c: any) => ({
            name: c.name,
            domain: c.hostname || (c.url ? new URL(c.url).hostname : undefined),
            website: c.url,
            description: c.description,
            source: 'yc_list_master',
            confidence: 0.9
          }))
      },
      {
        url: 'https://yc-oss.github.io/api/companies/hiring.json',
        parser: (data: any) => data.map((c: any) => ({
          name: c.name,
          domain: c.domain,
          website: c.website,
          description: c.description,
          industry: c.industry,
          source: 'yc_oss_hiring',
          confidence: 0.95
        }))
      }
    ];

    for (const source of sources) {
      try {
        const response = await fetch(source.url, {
          headers: { 'User-Agent': 'relevnt-discovery/1.0' }
        });
        if (!response.ok) continue;
        const data = await response.json();
        const discovered = source.parser(data).filter((c: any) => c.name && c.domain);
        companies.push(...discovered);
      } catch (e) {
        console.error(`Failed to fetch YC source ${source.url}:`, e);
      }
    }

    console.log(`Discovered ${companies.length} companies from Y Combinator sources`);
    return companies;
  } catch (err) {
    console.error('YC discovery failed:', err);
    return [];
  }
}

/**
 * Crunchbase Discovery
 * Requires CRUNCHBASE_API_KEY environment variable
 */
export async function discoverFromCrunchbase(options?: {
  minFunding?: number; // in millions
  fundingStages?: string[];
  limit?: number;
}): Promise<DiscoveredCompany[]> {
  const apiKey = process.env.CRUNCHBASE_API_KEY;
  if (!apiKey) {
    console.log('Crunchbase discovery skipped (no API key)');
    return [];
  }

  try {
    const companies: DiscoveredCompany[] = [];

    const stages = options?.fundingStages || [
      'series_a',
      'series_b',
      'series_c',
      'early_stage_vc',
    ];
    const limit = options?.limit || 500;

    for (const stage of stages) {
      try {
        // Crunchbase entity search endpoint
        const query = {
          field_ids: [
            'name',
            'domain',
            'short_description',
            'industries',
            'funding_stage',
            'num_employees_enum',
            'founded_date',
            'location_identifiers',
          ],
          limit,
          order: [
            {
              field_id: 'announced_on',
              sort: 'desc',
            },
          ],
          filter_ids: [
            {
              field_id: 'primary_role',
              values: ['company'],
            },
            {
              field_id: 'funding_status',
              values: [stage],
            },
          ],
        };

        const response = await fetch('https://api.crunchbase.com/api/v4/entities/companies/search', {
          method: 'POST',
          headers: {
            'User-Agent': 'relevnt-discovery/1.0',
            'X-Cb-User-Key': apiKey,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(query),

        });

        if (!response.ok) continue;

        const data = (await response.json()) as any;
        const results = data.entities || [];

        for (const entity of results) {
          if (!entity.name || !entity.domain_name) continue;

          companies.push({
            name: entity.name,
            domain: entity.domain_name,
            description: entity.short_description,
            industry:
              entity.industries?.[0]?.name ||
              (Array.isArray(entity.industries) ? entity.industries[0] : undefined),
            funding_stage: stage,
            employee_count: parseEmployeeCount(entity.num_employees_enum),
            founded_year: extractYear(entity.founded_date),
            source: `crunchbase_${stage}`,
            confidence: 0.9,
          });
        }
      } catch (e) {
        console.error(`Failed to fetch Crunchbase stage ${stage}:`, e);
      }
    }

    console.log(`Discovered ${companies.length} companies from Crunchbase`);
    return companies;
  } catch (err) {
    console.error('Crunchbase discovery failed:', err);
    return [];
  }
}

/**
 * AngelList Discovery (Wellfound)
 * Note: Public API is mostly restricted now, keeping as placeholder or for manual small runs
 */
export async function discoverFromAngelList(): Promise<DiscoveredCompany[]> {
  // Skipping active discovery for AngelList due to API restrictions
  return [];
}

/**
 * GitHub-based Discovery (Startup lists)
 */
export async function discoverFromGitHubLists(): Promise<DiscoveredCompany[]> {
  try {
    const companies: DiscoveredCompany[] = [];

    // List of curated company/startup datasets on GitHub
    const sources = [
      {
        url: 'https://raw.githubusercontent.com/derhuerst/vbb-companies/master/companies.json',
        parser: (data: any) => data.map((c: any) => ({
          name: c.name,
          domain: c.website ? new URL(c.website).hostname : undefined,
          source: 'github_vbb_list',
          confidence: 0.7
        }))
      },
      {
        url: 'https://raw.githubusercontent.com/yc-oss/open-source-companies/main/companies.json',
        parser: (data: any) => data.map((c: any) => ({
          name: c.name,
          domain: c.domain,
          website: c.website,
          source: 'github_yc_oss',
          confidence: 0.8
        }))
      }
    ];

    for (const source of sources) {
      try {
        const response = await fetch(source.url, {
          headers: { 'User-Agent': 'relevnt-discovery/1.0' }
        });
        if (!response.ok) continue;
        const data = await response.json();
        const discovered = source.parser(data).filter((c: any) => c.name && c.domain);
        companies.push(...discovered);
      } catch (e) {
        console.error(`Failed to fetch GitHub source ${source.url}:`, e);
      }
    }

    return companies;
  } catch (err) {
    console.error('GitHub discovery failed:', err);
    return [];
  }
}

/**
 * Advanced crawler: Follow "Careers" or "Jobs" links from homepage
 */
export async function crawlCareersPage(domain: string): Promise<string | null> {
  try {
    const response = await fetch(`https://${domain}`, {
      headers: { 'User-Agent': 'relevnt-discovery/1.0' },
    });

    if (!response.ok) return null;

    const html = await response.text();

    // Look for careers/jobs links
    // <a href="...">Careers</a>, <a href="...">Jobs</a>, etc.
    const linkMatch = html.match(/href=["']([^"']*(?:careers|jobs|hiring)[^"']*)["'][^>]*>(?:Careers|Jobs|Hiring|Work with us)/i);

    if (linkMatch?.[1]) {
      let url = linkMatch[1];
      if (url.startsWith('/')) {
        url = `https://${domain}${url}`;
      } else if (!url.startsWith('http')) {
        url = `https://${domain}/${url}`;
      }
      return url;
    }

    return null;
  } catch (err) {
    console.warn(`Crawl failed for ${domain}:`, err);
    return null;
  }
}

/**
 * Detect platforms from company careers page
 */
export async function detectPlatformsFromCareersPage(
  company: { name: string; domain: string }
): Promise<PlatformDetectionResult | null> {
  const { detectATSFromContent } = await import('./atsDetector');

  try {
    const urls = [
      `https://${company.domain}/careers`,
      `https://${company.domain}/jobs`,
      `https://careers.${company.domain}`,
      `https://jobs.${company.domain}`,
    ];

    // Try finding careers page via crawling if direct guesses fail
    const crawledUrl = await crawlCareersPage(company.domain);
    if (crawledUrl && !urls.includes(crawledUrl)) {
      urls.push(crawledUrl);
    }

    for (const url of urls) {
      try {
        const response = await fetch(url, {
          headers: { 'User-Agent': 'relevnt-discovery/1.0' },
        });

        if (!response.ok) continue;

        const html = await response.text();
        const ats = detectATSFromContent(html);

        if (ats && ats.type !== 'unknown') {
          return {
            company_id: `company-${company.domain}`,
            company_name: company.name,
            domain: company.domain,
            lever_slug: ats.slug,
            greenhouse_board_token: ats.token,
            detected_at: new Date().toISOString(),
            detection_method: 'html_parse',
          };
        }
      } catch (e) {
        // Continue to next URL
      }
    }

    return null;
  } catch (err) {
    console.error(
      `Failed to detect platforms for ${company.domain}:`,
      err
    );
    return null;
  }
}

/**
 * Helper: Parse employee count from Crunchbase enum
 */
function parseEmployeeCount(enumValue?: string): number | undefined {
  const ranges: Record<string, number> = {
    '1': 1,
    '2_10': 5,
    '11_50': 30,
    '51_100': 75,
    '101_250': 175,
    '251_500': 375,
    '501_1000': 750,
    '1001_5000': 2500,
    '5001_10000': 7500,
    '10001_': 10001,
  };
  return ranges[enumValue || ''] || undefined;
}

/**
 * Helper: Extract year from date string
 */
function extractYear(dateStr?: string): number | undefined {
  if (!dateStr) return undefined;
  const match = dateStr.match(/\d{4}/);
  return match ? parseInt(match[0], 10) : undefined;
}

/**
 * Main discovery orchestrator
 */
export async function runCompanyDiscovery(): Promise<DiscoveredCompany[]> {
  console.log('Starting company discovery...');
  const startTime = Date.now();

  const sources: CompanyDiscoverySource[] = [
    {
      name: 'Y Combinator',
      fetch: discoverFromYCombinator,
      enabled: true,
    },
    {
      name: 'Crunchbase',
      fetch: discoverFromCrunchbase,
      enabled: !!process.env.CRUNCHBASE_API_KEY,
    },
    {
      name: 'AngelList',
      fetch: discoverFromAngelList,
      enabled: false, // Disabled due to API restrictions
    },
    {
      name: 'GitHub Lists',
      fetch: discoverFromGitHubLists,
      enabled: true,
    },
  ];

  const allCompanies: DiscoveredCompany[] = [];
  const seenDomains = new Set<string>();

  for (const source of sources) {
    if (!source.enabled) {
      console.log(`⊘ ${source.name} disabled`);
      continue;
    }

    try {
      console.log(`Fetching from ${source.name}...`);
      const companies = await source.fetch();

      // Deduplicate by domain
      for (const company of companies) {
        if (!seenDomains.has(company.domain)) {
          allCompanies.push(company);
          seenDomains.add(company.domain);
        }
      }
    } catch (err) {
      console.error(`${source.name} discovery error:`, err);
    }
  }

  console.log(
    `Discovery complete: found ${allCompanies.length} unique companies in ${Date.now() - startTime}ms`
  );
  return allCompanies;
}

/**
 * Batch detect platforms for discovered companies
 */
export async function detectPlatformsInBatch(
  companies: DiscoveredCompany[],
  concurrency: number = 5
): Promise<PlatformDetectionResult[]> {
  const results: PlatformDetectionResult[] = [];
  const queue = [...companies];
  let running = 0;

  await new Promise<void>((resolve) => {
    const process = () => {
      while (running < concurrency && queue.length > 0) {
        running++;
        const company = queue.shift()!;

        detectPlatformsFromCareersPage({
          name: company.name,
          domain: company.domain,
        })
          .then((result) => {
            if (result) {
              results.push(result);
              console.log(
                `✓ Detected platforms for ${company.name}`,
                {
                  lever: result.lever_slug ? '✓' : '✗',
                  greenhouse: result.greenhouse_board_token ? '✓' : '✗',
                }
              );
            }
          })
          .catch((err) =>
            console.error(`Failed to detect platforms for ${company.name}:`, err)
          )
          .finally(() => {
            running--;
            if (queue.length > 0 || running > 0) {
              process();
            } else {
              resolve();
            }
          });
      }
    };

    process();
  });

  console.log(
    `Platform detection complete: ${results.length}/${companies.length} companies have job boards`
  );
  return results;
}
