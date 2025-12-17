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
 */
export async function discoverFromYCombinator(): Promise<DiscoveredCompany[]> {
  try {
    const companies: DiscoveredCompany[] = [];

    // YC companies by batch (can paginate through different years)
    const batches = ['S24', 'F23', 'S23', 'F22', 'S22'];

    for (const batch of batches) {
      try {
        // Public YC API endpoint
        const url = `https://api.ycombinator.com/companies?batch=${batch}`;
        const response = await fetch(url, {
          headers: { 'User-Agent': 'relevnt-discovery/1.0' },

        });

        if (!response.ok) continue;

        const data = (await response.json()) as any;
        const batchCompanies = Array.isArray(data) ? data : data.companies || [];

        for (const company of batchCompanies) {
          if (!company.name || !company.domain) continue;

          companies.push({
            name: company.name,
            domain: company.domain || company.website,
            website: company.website,
            description: company.description,
            industry: company.industry,
            funding_stage: company.stage || 'seed', // YC companies are early stage
            employee_count: company.team_size,
            founded_year: company.founded_year,
            source: `yc_${batch}`,
            confidence: 0.95, // High confidence for YC data
          });
        }
      } catch (e) {
        console.error(`Failed to fetch YC batch ${batch}:`, e);
      }
    }

    console.log(`Discovered ${companies.length} companies from Y Combinator`);
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
 * AngelList (Wellfound) Discovery
 */
export async function discoverFromAngelList(): Promise<DiscoveredCompany[]> {
  try {
    const companies: DiscoveredCompany[] = [];

    // AngelList public API (limited, for startup discovery)
    const tags = ['hiring', 'growth', 'remote', 'funded'];

    for (const tag of tags) {
      try {
        const response = await fetch(
          `https://api.angel.co/1/tags/${encodeURIComponent(tag)}/startups`,
          {
            headers: { 'User-Agent': 'relevnt-discovery/1.0' },

          }
        );

        if (!response.ok) continue;

        const data = (await response.json()) as any;
        const startups = data.startups || [];

        for (const startup of startups) {
          if (!startup.name || !startup.company_url) continue;

          const domain = new URL(startup.company_url).hostname;

          companies.push({
            name: startup.name,
            domain,
            website: startup.company_url,
            description: startup.tagline,
            industry: startup.tag_list?.join(', '),
            employee_count: startup.team_size,
            source: `angellist_${tag}`,
            confidence: 0.8,
          });
        }
      } catch (e) {
        console.error(`Failed to fetch AngelList tag ${tag}:`, e);
      }
    }

    console.log(`Discovered ${companies.length} companies from AngelList`);
    return companies;
  } catch (err) {
    console.error('AngelList discovery failed:', err);
    return [];
  }
}

/**
 * Detect platforms from company careers page
 */
export async function detectPlatformsFromCareersPage(
  company: { name: string; domain: string }
): Promise<PlatformDetectionResult | null> {
  try {
    const urls = [
      `https://${company.domain}/careers`,
      `https://${company.domain}/jobs`,
      `https://careers.${company.domain}`,
      `https://jobs.${company.domain}`,
    ];

    for (const url of urls) {
      try {
        const response = await fetch(url, {
          headers: { 'User-Agent': 'relevnt-discovery/1.0' },

        });

        if (!response.ok) continue;

        const html = await response.text();

        // Detect Lever
        const leverSlugMatch = html.match(
          /api\.lever\.co\/v0\/postings\/([a-z0-9-]+)/i
        );
        const leverJobsMatch = html.match(/jobs\.lever\.co.*\/([a-z0-9-]+)/i);
        const leverSlug = leverSlugMatch?.[1] || leverJobsMatch?.[1];

        // Detect Greenhouse
        const greenhouseMatch = html.match(/boards\.greenhouse\.io.*board_token["\s=:]+([a-z0-9]+)/i);
        const greenhouseToken = greenhouseMatch?.[1];

        if (leverSlug || greenhouseToken) {
          return {
            company_id: `company-${company.domain}`,
            company_name: company.name,
            domain: company.domain,
            lever_slug: leverSlug,
            greenhouse_board_token: greenhouseToken,
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
