/**
 * ML-Based Prioritization Engine
 * Analyzes historical hiring patterns and growth signals
 */

export interface HiringSignals {
  jobs_posted_7d: number
  jobs_posted_30d: number
  new_job_boards_added: number // detected in past week
  avg_time_to_fill: number // days
  seasonal_factor: number // 0.5-1.5 based on quarter
  growth_momentum: number // positive = accelerating, negative = decelerating
}

export interface SmartPriorityScore {
  base_score: number // 0-100 from Phase 1
  hiring_velocity: number // 0-50
  growth_momentum: number // -20 to +20
  seasonality_factor: number // 0.5-1.5
  recency_bonus: number // 0-10
  final_score: number // weighted combination
  confidence: number // 0-1
  factors: Record<string, number>
}

/**
 * Calculate hiring velocity from job data
 */
export async function calculateHiringVelocity(
  companyId: string,
  supabase: any
): Promise<HiringSignals> {
  try {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Query jobs posted from this company
    const { data: recent } = await supabase
      .from('jobs')
      .select('external_id, posted_date')
      .eq('company', companyId)
      .gte('posted_date', sevenDaysAgo.toISOString());

    const { data: month } = await supabase
      .from('jobs')
      .select('external_id, posted_date')
      .eq('company', companyId)
      .gte('posted_date', thirtyDaysAgo.toISOString());

    // Calculate growth momentum (comparing 7d to previous 7d)
    const prevSevenDaysAgo = new Date(sevenDaysAgo.getTime() - 7 * 24 * 60 * 60 * 1000);
    const { data: previous } = await supabase
      .from('jobs')
      .select('external_id')
      .eq('company', companyId)
      .gte('posted_date', prevSevenDaysAgo.toISOString())
      .lt('posted_date', sevenDaysAgo.toISOString());

    const currentWeekJobs = recent?.length || 0;
    const lastWeekJobs = previous?.length || 0;
    const momentum = lastWeekJobs > 0
      ? (currentWeekJobs - lastWeekJobs) / lastWeekJobs
      : 0;

    return {
      jobs_posted_7d: currentWeekJobs,
      jobs_posted_30d: month?.length || 0,
      new_job_boards_added: 0, // Would require source tracking
      avg_time_to_fill: 30, // Placeholder
      seasonal_factor: getSeasonalFactor(),
      growth_momentum: momentum,
    };
  } catch (err) {
    console.error(`Failed to calculate hiring velocity for ${companyId}:`, err);
    return {
      jobs_posted_7d: 0,
      jobs_posted_30d: 0,
      new_job_boards_added: 0,
      avg_time_to_fill: 30,
      seasonal_factor: getSeasonalFactor(),
      growth_momentum: 0,
    };
  }
}

/**
 * Get seasonal factor based on current quarter
 * Q4 (Oct-Dec) has higher hiring due to budget cycles
 * Q3 (Jul-Sep) has lower hiring due to summer
 */
export function getSeasonalFactor(): number {
  const month = new Date().getMonth(); // 0-11
  const quarter = Math.floor(month / 3);

  const factors: Record<number, number> = {
    0: 0.8, // Q1 (Jan-Mar) - moderate
    1: 1.0, // Q2 (Apr-Jun) - baseline
    2: 0.7, // Q3 (Jul-Sep) - summer slowdown
    3: 1.3, // Q4 (Oct-Dec) - budget season
  };

  return factors[quarter] || 1.0;
}

/**
 * Calculate smart priority score incorporating ML signals
 */
export function calculateSmartPriorityScore(
  baseScore: number,
  hiringSignals: HiringSignals,
  lastSyncHoursAgo: number
): SmartPriorityScore {
  // 1. Hiring Velocity Component (0-50 points)
  // Scale weekly job posting rate to 0-50
  const hiringVelocity = Math.min(
    hiringSignals.jobs_posted_7d * 5, // 1 job/week = 5 points
    50
  );

  // 2. Growth Momentum Component (-20 to +20 points)
  // Positive momentum = accelerating hiring
  const growthMomentum = Math.max(
    Math.min(hiringSignals.growth_momentum * 20, 20),
    -20
  );

  // 3. Recency Bonus (0-10 points)
  // Recent syncs get small bonus
  const recencyBonus = Math.max(0, 10 - Math.floor(lastSyncHoursAgo / 24));

  // 4. Apply seasonality to velocity
  const seasonalizedVelocity = hiringVelocity * hiringSignals.seasonal_factor;

  // Weighted combination
  const weights = {
    base: 0.3, // From Phase 1 (priority tier + growth + velocity)
    velocity: 0.35, // Current hiring activity
    momentum: 0.2, // Trend direction
    recency: 0.1, // Freshness
    seasonality: 0.05, // Seasonal adjustment
  };

  const finalScore =
    baseScore * weights.base +
    seasonalizedVelocity * weights.velocity +
    (growthMomentum + 20) * (weights.momentum / 2) + // Normalize momentum to 0-40
    recencyBonus * weights.recency;

  const maxPossibleScore = 100;
  const normalizedScore = Math.min(finalScore, maxPossibleScore);

  // Confidence based on data availability
  const confidence = Math.min(
    1.0,
    (hiringSignals.jobs_posted_30d > 0 ? 0.7 : 0.3) +
      (Math.abs(hiringSignals.growth_momentum) > 0 ? 0.2 : 0)
  );

  return {
    base_score: baseScore,
    hiring_velocity: hiringVelocity,
    growth_momentum: growthMomentum,
    seasonality_factor: hiringSignals.seasonal_factor,
    recency_bonus: recencyBonus,
    final_score: normalizedScore,
    confidence,
    factors: {
      base: baseScore * weights.base,
      velocity: seasonalizedVelocity * weights.velocity,
      momentum: (growthMomentum + 20) * (weights.momentum / 2),
      recency: recencyBonus * weights.recency,
    },
  };
}

/**
 * Detect hiring spikes (sudden increase in job postings)
 */
export async function detectHiringSpikes(
  companyId: string,
  supabase: any,
  threshold: number = 2.0 // 2x normal rate
): Promise<{ isSpiking: boolean; multiplier: number; description: string }> {
  try {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    // Get jobs from last week
    const { data: thisWeek } = await supabase
      .from('jobs')
      .select('id', { count: 'exact' })
      .eq('company', companyId)
      .gte('posted_date', weekAgo.toISOString());

    // Get jobs from week before
    const { data: lastWeek } = await supabase
      .from('jobs')
      .select('id', { count: 'exact' })
      .eq('company', companyId)
      .gte('posted_date', twoWeeksAgo.toISOString())
      .lt('posted_date', weekAgo.toISOString());

    const thisWeekCount = thisWeek?.length || 0;
    const lastWeekCount = lastWeek?.length || 0;

    if (lastWeekCount === 0) {
      return {
        isSpiking: thisWeekCount > 0,
        multiplier: thisWeekCount > 0 ? Infinity : 1,
        description: 'No historical data',
      };
    }

    const multiplier = thisWeekCount / lastWeekCount;
    const isSpiking = multiplier >= threshold;

    return {
      isSpiking,
      multiplier,
      description: isSpiking
        ? `Hiring spike detected: ${(multiplier * 100 - 100).toFixed(0)}% increase`
        : `Normal hiring rate (${(multiplier * 100).toFixed(0)}% vs last week)`,
    };
  } catch (err) {
    console.error(`Failed to detect hiring spikes for ${companyId}:`, err);
    return {
      isSpiking: false,
      multiplier: 1,
      description: 'Detection failed',
    };
  }
}

/**
 * Identify companies with accelerating growth (candidates for higher priority)
 */
export async function findGrowthCompanies(
  supabase: any,
  minMomentum: number = 0.5 // 50% week-over-week growth
): Promise<Array<{ company_id: string; momentum: number; spike_info: any }>> {
  try {
    // Get all companies
    const { data: companies } = await supabase
      .from('companies')
      .select('id, name')
      .eq('is_active', true);

    const growingCompanies = [];

    for (const company of companies || []) {
      const signals = await calculateHiringVelocity(company.name, supabase);
      const spike = await detectHiringSpikes(company.name, supabase);

      if (signals.growth_momentum >= minMomentum || spike.isSpiking) {
        growingCompanies.push({
          company_id: company.id,
          momentum: signals.growth_momentum,
          spike_info: spike,
        });
      }
    }

    return growingCompanies.sort(
      (a, b) => b.momentum - a.momentum
    );
  } catch (err) {
    console.error('Failed to find growth companies:', err);
    return [];
  }
}

/**
 * Update company priorities based on ML signals
 */
export async function updateCompanyPrioritiesML(supabase: any): Promise<{
  updated: number
  promoted: number
  demoted: number
}> {
  try {
    let updated = 0;
    let promoted = 0;
    let demoted = 0;

    // Find companies with hiring spikes
    const { data: companies } = await supabase
      .from('companies')
      .select('id, name, priority_tier, growth_score, last_synced_at, job_creation_velocity')
      .eq('is_active', true)
      .order('job_creation_velocity', { ascending: false });

    for (const company of companies || []) {
      try {
        const signals = await calculateHiringVelocity(
          company.name,
          supabase
        );
        const spike = await detectHiringSpikes(company.name, supabase);

        let newTier = company.priority_tier;
        let newScore = company.growth_score;

        // Promote if spiking or high momentum
        if (spike.isSpiking && company.priority_tier !== 'high') {
          newTier = 'high';
          promoted++;
        } else if (
          signals.growth_momentum > 1.0 &&
          company.priority_tier === 'low'
        ) {
          newTier = 'standard';
          promoted++;
        }

        // Update growth score based on velocity
        newScore = Math.min(
          100,
          Math.floor(signals.jobs_posted_30d * 3 + company.growth_score * 0.5)
        );

        // Demote if no recent activity
        const lastSync = company.last_synced_at
          ? new Date(company.last_synced_at).getTime()
          : 0;
        const daysSinceSync =
          (Date.now() - lastSync) / (1000 * 60 * 60 * 24);

        if (
          daysSinceSync > 90 &&
          signals.jobs_posted_30d === 0 &&
          company.priority_tier !== 'low'
        ) {
          newTier = 'low';
          demoted++;
        }

        if (newTier !== company.priority_tier || newScore !== company.growth_score) {
          await supabase
            .from('companies')
            .update({
              priority_tier: newTier,
              growth_score: newScore,
              updated_at: new Date().toISOString(),
            })
            .eq('id', company.id);

          updated++;
        }
      } catch (e) {
        console.error(`Failed to update priorities for ${company.name}:`, e);
      }
    }

    console.log(
      `Priority updates complete: ${updated} companies updated (${promoted} promoted, ${demoted} demoted)`
    );
    return { updated, promoted, demoted };
  } catch (err) {
    console.error('Failed to update company priorities:', err);
    return { updated: 0, promoted: 0, demoted: 0 };
  }
}

/**
 * Generate hiring forecast based on historical patterns
 */
export function generateHiringForecast(
  hiringSignals: HiringSignals,
  daysAhead: number = 7
): {
  predicted_jobs: number
  confidence: number
  reasoning: string
} {
  // Simple linear extrapolation with seasonal adjustment
  const dailyRate = hiringSignals.jobs_posted_7d / 7;
  const forecastBase = dailyRate * daysAhead;
  const seasonalForecast = forecastBase * hiringSignals.seasonal_factor;

  // Add momentum adjustment
  const momentumFactor = 1 + hiringSignals.growth_momentum * 0.1;
  const predictedJobs = Math.round(seasonalForecast * momentumFactor);

  const confidence =
    hiringSignals.jobs_posted_30d > 5 ? 0.8 : 0.5;

  const reasoning =
    hiringSignals.growth_momentum > 0
      ? 'Accelerating hiring detected'
      : hiringSignals.growth_momentum < -0.5
        ? 'Decelerating hiring detected'
        : 'Stable hiring rate';

  return {
    predicted_jobs: Math.max(0, predictedJobs),
    confidence,
    reasoning,
  };
}
