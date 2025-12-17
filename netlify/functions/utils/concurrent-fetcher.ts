/**
 * Concurrent Fetcher with Rate Limiting
 * Handles parallel requests while respecting rate limits
 */

interface FetchTask<T> {
  id: string;
  fn: () => Promise<T>;
}

interface FetchResult<T> {
  id: string;
  status: 'success' | 'failed' | 'timeout';
  data?: T;
  error?: Error;
  duration: number;
}

/**
 * Simple rate-limited concurrent fetcher (no external dependencies)
 * Replaces p-queue for compatibility
 */
export class ConcurrentFetcher {
  private concurrency: number;
  private interval: number; // milliseconds
  private intervalCap: number; // max requests per interval
  private running: number = 0;
  private queue: FetchTask<any>[] = [];
  private requestTimestamps: number[] = [];

  constructor(options: {
    concurrency?: number;
    interval?: number; // milliseconds
    intervalCap?: number;
  } = {}) {
    this.concurrency = options.concurrency || 8;
    this.interval = options.interval || 60000; // 1 minute default
    this.intervalCap = options.intervalCap || 100; // 100 requests/minute default
  }

  /**
   * Check if we can make a request based on rate limit
   */
  private canMakeRequest(): boolean {
    const now = Date.now();
    const cutoff = now - this.interval;

    // Remove old timestamps outside the interval window
    this.requestTimestamps = this.requestTimestamps.filter((ts) => ts > cutoff);

    // Check if we're at capacity
    return this.requestTimestamps.length < this.intervalCap;
  }

  /**
   * Record a request
   */
  private recordRequest(): void {
    this.requestTimestamps.push(Date.now());
  }

  /**
   * Process a single task
   */
  private async processTask<T>(task: FetchTask<T>): Promise<FetchResult<T>> {
    const startTime = Date.now();

    try {
      // Wait until we can make a request
      while (!this.canMakeRequest()) {
        await this.sleep(100);
      }

      this.recordRequest();
      const data = await task.fn();

      return {
        id: task.id,
        status: 'success',
        data,
        duration: Date.now() - startTime,
      };
    } catch (error) {
      return {
        id: task.id,
        status: 'failed',
        error: error instanceof Error ? error : new Error(String(error)),
        duration: Date.now() - startTime,
      };
    }
  }

  /**
   * Sleep helper
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Add a task to the queue
   */
  async add<T>(id: string, fn: () => Promise<T>): Promise<FetchResult<T>> {
    return new Promise((resolve) => {
      this.queue.push({
        id,
        fn: () => this.processTask<T>({ id, fn }).then(resolve),
      });

      this.processQueue();
    });
  }

  /**
   * Add multiple tasks as a batch
   */
  async addBatch<T>(
    tasks: Array<{ id: string; fn: () => Promise<T> }>
  ): Promise<FetchResult<T>[]> {
    const promises = tasks.map((task) => this.add(task.id, task.fn));
    return Promise.all(promises);
  }

  /**
   * Process queue with concurrency limit
   */
  private processQueue(): void {
    while (this.running < this.concurrency && this.queue.length > 0) {
      this.running++;
      const task = this.queue.shift();

      if (task) {
        task
          .fn()
          .then(() => {
            this.running--;
            this.processQueue();
          })
          .catch(() => {
            this.running--;
            this.processQueue();
          });
      }
    }
  }

  /**
   * Get current queue stats
   */
  getStats() {
    return {
      running: this.running,
      queued: this.queue.length,
      concurrency: this.concurrency,
      requestsInWindow: this.requestTimestamps.length,
      windowCap: this.intervalCap,
    };
  }
}

/**
 * Batch fetcher for companies
 */
export interface CompanyFetchTask {
  companyId: string;
  companyName: string;
  fetchFn: () => Promise<any[]>; // Returns array of jobs
}

export interface CompanyFetchResult {
  companyId: string;
  companyName: string;
  status: 'success' | 'failed' | 'timeout';
  jobs?: any[];
  jobCount?: number;
  error?: string;
  duration: number;
}

export async function fetchCompaniesInParallel(
  tasks: CompanyFetchTask[],
  options: {
    concurrency?: number;
    interval?: number;
    intervalCap?: number;
  } = {}
): Promise<CompanyFetchResult[]> {
  const fetcher = new ConcurrentFetcher(options);
  const results: CompanyFetchResult[] = [];

  for (const task of tasks) {
    const startTime = Date.now();

    try {
      const result = await fetcher.add(task.companyId, task.fetchFn);

      if (result.status === 'success') {
        results.push({
          companyId: task.companyId,
          companyName: task.companyName,
          status: 'success',
          jobs: result.data || [],
          jobCount: (result.data || []).length,
          duration: result.duration,
        });
      } else {
        results.push({
          companyId: task.companyId,
          companyName: task.companyName,
          status: 'failed',
          error: result.error?.message || 'Unknown error',
          duration: result.duration,
        });
      }
    } catch (error) {
      results.push({
        companyId: task.companyId,
        companyName: task.companyName,
        status: 'failed',
        error: error instanceof Error ? error.message : String(error),
        duration: Date.now() - startTime,
      });
    }
  }

  return results;
}

/**
 * Fetch from multiple platforms concurrently
 */
export async function fetchFromMultiplePlatforms(
  companies: Array<{
    id: string;
    name: string;
    lever_slug?: string;
    greenhouse_board_token?: string;
    leverFetch?: () => Promise<any[]>;
    greenhouseFetch?: () => Promise<any[]>;
  }>,
  options: {
    concurrency?: number;
    interval?: number;
    intervalCap?: number;
  } = {}
) {
  const fetcher = new ConcurrentFetcher(options);
  const allResults = {
    lever: [] as CompanyFetchResult[],
    greenhouse: [] as CompanyFetchResult[],
  };

  // Fetch from both platforms in parallel
  const promises = companies.flatMap((company) => {
    const tasks = [];

    if (company.lever_slug && company.leverFetch) {
      tasks.push(
        fetcher
          .add(`${company.id}-lever`, company.leverFetch)
          .then((result) => {
            if (result.status === 'success') {
              allResults.lever.push({
                companyId: company.id,
                companyName: company.name,
                status: 'success',
                jobs: result.data || [],
                jobCount: (result.data || []).length,
                duration: result.duration,
              });
            } else {
              allResults.lever.push({
                companyId: company.id,
                companyName: company.name,
                status: 'failed',
                error: result.error?.message,
                duration: result.duration,
              });
            }
          })
      );
    }

    if (company.greenhouse_board_token && company.greenhouseFetch) {
      tasks.push(
        fetcher
          .add(`${company.id}-greenhouse`, company.greenhouseFetch)
          .then((result) => {
            if (result.status === 'success') {
              allResults.greenhouse.push({
                companyId: company.id,
                companyName: company.name,
                status: 'success',
                jobs: result.data || [],
                jobCount: (result.data || []).length,
                duration: result.duration,
              });
            } else {
              allResults.greenhouse.push({
                companyId: company.id,
                companyName: company.name,
                status: 'failed',
                error: result.error?.message,
                duration: result.duration,
              });
            }
          })
      );
    }

    return tasks;
  });

  await Promise.all(promises);

  return allResults;
}
