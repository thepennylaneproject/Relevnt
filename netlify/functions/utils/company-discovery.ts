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
  growth_score?: number
  source: string
  confidence: number // 0-1
}

export interface PlatformDetectionResult {
  company_id: string
  company_name: string
  domain: string
  lever_slug?: string
  greenhouse_board_token?: string
  growth_score?: number
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
        url: 'https://yc-oss.github.io/api/companies/all.json',
        parser: (data: any) => data.map((c: any) => {
          let domain = c.domain;
          if (!domain && c.website) {
            try {
              domain = new URL(c.website).hostname;
            } catch (e) { }
          }
          return {
            name: c.name,
            domain: domain,
            website: c.website,
            description: c.long_description || c.one_liner,
            industry: c.industry,
            source: 'yc_oss_all',
            confidence: 0.95
          };
        })
      }
    ];

    for (const source of sources) {
      let retries = 2;
      let success = false;

      while (retries >= 0 && !success) {
        try {
          // Add a timeout to avoid hanging the discovery process
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 10000);

          const response = await fetch(source.url, {
            headers: { 'User-Agent': 'Mozilla/5.0 (compatible; RelevntDiscovery/1.0)' },
            signal: controller.signal
          });
          clearTimeout(timeoutId);

          if (!response.ok) {
            retries--;
            continue;
          }
          const data = await response.json();
          const discovered = source.parser(data).filter((c: any) => c.name && c.domain);
          companies.push(...discovered);
          success = true;
        } catch (e) {
          retries--;
          if (retries < 0) console.error(`Failed to fetch YC source ${source.url}:`, e);
        }
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

          // Map funding stage to initial growth score
          const growthScore = stage.includes('series_c') ? 60 : stage.includes('series_b') ? 40 : 20;

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
            growth_score: growthScore, // Corrected: passing the calculated score
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
      },
      {
        url: 'https://raw.githubusercontent.com/andreasbm/awesome-it-companies/master/companies.json',
        parser: (data: any) => {
          // This list has a different structure: { "companies": [ ... ] }
          const list = data.companies || [];
          return list.map((c: any) => ({
            name: c.name,
            domain: c.website ? new URL(c.website).hostname : undefined,
            website: c.website,
            source: 'github_awesome_it',
            confidence: 0.7
          }));
        }
      }
    ];

    for (const source of sources) {
      try {
        const response = await fetch(source.url, {
          headers: { 'User-Agent': 'relevnt-discovery/1.0' }
        });
        if (!response.ok) continue;
        const data = await response.json();
        const discovered = source.parser(data).filter((c: any) => c.name && (c.domain || c.website));
        companies.push(...discovered);
      } catch (e) {
        console.error(`Failed to fetch GitHub source ${source.url}:`, e);
      }
    }

    return companies;
  } catch (err) {
    console.error('Error in discoverFromGitHubLists:', err);
    return [];
  }
}

/**
 * Harvest known ATS board tokens/slugs from local registries
 * This is the "Inverted Pipeline" approach: known ATS -> Company
 */
export async function harvestFromRegistries(): Promise<PlatformDetectionResult[]> {
  try {
    const results: PlatformDetectionResult[] = [];

    // Use fs/promises to be safe about ESM execution context
    const { readFile } = await import('fs/promises');
    const { join } = await import('path');
    const greenhousePath = join(process.cwd(), 'src/data/jobSources/greenhouse_boards.json');
    const leverPath = join(process.cwd(), 'src/data/jobSources/lever_sources.json');

    let greenhouseBoards = [];
    let leverSources = [];

    try {
      const ghContent = await readFile(greenhousePath, 'utf-8');
      greenhouseBoards = JSON.parse(ghContent);
    } catch (e) {
      console.warn(`Could not load greenhouse_boards.json: ${e instanceof Error ? e.message : String(e)}`);
    }

    try {
      const lvContent = await readFile(leverPath, 'utf-8');
      leverSources = JSON.parse(lvContent);
    } catch (e) {
      console.warn(`Could not load lever_sources.json: ${e instanceof Error ? e.message : String(e)}`);
    }

    const now = new Date().toISOString();

    if (Array.isArray(greenhouseBoards)) {
      for (const board of greenhouseBoards) {
        if (board.boardToken) {
          results.push({
            company_id: `reg-gh-${board.boardToken}`,
            company_name: board.companyName || board.boardToken,
            domain: board.boardToken + '.com', // Heuristic: many tokens match domain
            greenhouse_board_token: board.boardToken,
            detected_at: now,
            detection_method: 'manual'
          });
        }
      }
    }

    if (Array.isArray(leverSources)) {
      for (const source of leverSources) {
        if (source.leverSlug) {
          results.push({
            company_id: `reg-lv-${source.leverSlug}`,
            company_name: source.companyName || source.leverSlug,
            domain: source.leverSlug + '.com', // Heuristic
            lever_slug: source.leverSlug,
            detected_at: now,
            detection_method: 'manual'
          });
        }
      }
    }

    return results;
  } catch (err) {
    console.error('Error harvesting from registries:', err);
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
  company: { name: string; domain: string; growth_score?: number }
): Promise<PlatformDetectionResult | null> {
  const { detectATSFromContent } = await import('./atsDetector');

  try {
    const urls = [
      `https://${company.domain}/careers`,
      `https://${company.domain}/jobs`,
      `https://${company.domain}/hiring`,
      `https://${company.domain}/join`,
      `https://careers.${company.domain}`,
      `https://jobs.${company.domain}`,
    ];

    // Try finding careers page via crawling if direct guesses fail
    const crawledUrl = await crawlCareersPage(company.domain);

    const { detectATS } = await import('./atsDetector');

    // First try the robust detection that includes direct probing
    // NOW: prioritize the crawledUrl if we found one
    const bestDetected = await detectATS(null, company.name, company.domain, crawledUrl);
    if (bestDetected) {
      return {
        company_id: `company-${company.domain}`,
        company_name: company.name,
        domain: company.domain,
        lever_slug: bestDetected.slug,
        greenhouse_board_token: bestDetected.token,
        growth_score: company.growth_score,
        detected_at: new Date().toISOString(),
        detection_method: bestDetected.detectionMethod === 'url_pattern' ? 'api_query' : 'html_parse',
      };
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
  concurrency: number = 10
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
          growth_score: (company as any).growth_score,
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
