// netlify/functions/autoApply.ts
import { Handler } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL as string;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY as string;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Missing Supabase env vars for autoApply function');
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

type AutoApplySettings = {
  user_id: string;
  enabled: boolean;
  mode: 'review' | 'full';
  max_per_week: number;
  min_match_score: number;
  min_salary: number | null;
  apply_only_canonical: boolean;
  require_values_alignment: boolean;
};

type Profile = {
  id: string;
  plan_tier: string | null;
  auto_apply_active: boolean | null;
};

type JobMatchRow = {
  user_id: string;
  job_id: string;
  match_score: number;
  values_alignment: number | null;
};

type JobRow = {
  id: string;
  apply_url: string | null;
  canonical_apply_url: string | null;
  salary_min: number | null;
  salary_max: number | null;
  company_name: string | null;
  title: string;
};

const handler: Handler = async (event) => {
  // Basic guard
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: 'Method not allowed',
    };
  }

  try {
    // 1. Find users who have auto apply settings and add on enabled
    const { data: settingsRows, error: settingsError } = await supabase
      .from('auto_apply_settings')
      .select('*')
      .eq('enabled', true);

    if (settingsError) {
      console.error('Error fetching auto_apply_settings', settingsError);
      return { statusCode: 500, body: 'Error fetching settings' };
    }

    if (!settingsRows || settingsRows.length === 0) {
      return { statusCode: 200, body: 'No users with auto apply enabled' };
    }

    // Fetch profiles for those users
    const userIds = settingsRows.map((s: AutoApplySettings) => s.user_id);

    const { data: profilesRows, error: profilesError } = await supabase
      .from('profiles')
      .select('id, plan_tier, auto_apply_active')
      .in('id', userIds);

    if (profilesError) {
      console.error('Error fetching profiles', profilesError);
      return { statusCode: 500, body: 'Error fetching profiles' };
    }

    const profilesById = new Map<string, Profile>();
    (profilesRows || []).forEach((p: any) => profilesById.set(p.id, p));

    // 2. For each user, decide how many applications we can create
    const summary: any[] = [];

    for (const settings of settingsRows as AutoApplySettings[]) {
      const profile = profilesById.get(settings.user_id);
      if (!profile) continue;

      const plan = profile.plan_tier || 'starter';
      const addOnActive = profile.auto_apply_active ?? false;

      // Gate by plan and add on
      if (!addOnActive || (plan !== 'pro' && plan !== 'premium' && plan !== 'pinnacle')) {
        continue;
      }

      // Count how many auto applications this user has this week
      const { data: existingApps, error: appsError } = await supabase
        .from('job_applications')
        .select('id, created_at')
        .eq('user_id', settings.user_id)
        .eq('source', 'auto_apply')
        .gte('created_at', getStartOfWeekISO());

      if (appsError) {
        console.error('Error fetching job_applications for user', settings.user_id, appsError);
        continue;
      }

      const usedThisWeek = existingApps?.length ?? 0;
      const remaining = Math.max(0, settings.max_per_week - usedThisWeek);
      if (remaining <= 0) {
        summary.push({
          user_id: settings.user_id,
          status: 'limit_reached',
          usedThisWeek,
        });
        continue;
      }

      // 3. Fetch top matching jobs for this user
      // This assumes there are job_matches rows already populated
      const { data: matchRows, error: matchError } = await supabase
        .from('job_matches')
        .select('user_id, job_id, match_score, values_alignment')
        .eq('user_id', settings.user_id)
        .gte('match_score', settings.min_match_score)
        .order('match_score', { ascending: false })
        .limit(remaining * 3); // fetch extra so we can filter

      if (matchError) {
        console.error('Error fetching job_matches for user', settings.user_id, matchError);
        continue;
      }

      if (!matchRows || matchRows.length === 0) {
        summary.push({
          user_id: settings.user_id,
          status: 'no_eligible_matches',
        });
        continue;
      }

      const jobIds = matchRows.map((m: JobMatchRow) => m.job_id);

      // Fetch jobs with those ids
      const { data: jobRows, error: jobsError } = await supabase
        .from('jobs')
        .select(
          'id, title, company_name, apply_url, canonical_apply_url, salary_min, salary_max'
        )
        .in('id', jobIds);

      if (jobsError) {
        console.error('Error fetching jobs for user', settings.user_id, jobsError);
        continue;
      }

      const jobsById = new Map<string, JobRow>();
      (jobRows || []).forEach((j: any) => jobsById.set(j.id, j));

      // Fetch jobs already applied to by this user
      const { data: existingForUser, error: existingForUserError } = await supabase
        .from('job_applications')
        .select('job_id')
        .eq('user_id', settings.user_id);

      if (existingForUserError) {
        console.error(
          'Error fetching existing applications for user',
          settings.user_id,
          existingForUserError
        );
        continue;
      }

      const alreadyAppliedJobIds = new Set(
        (existingForUser || []).map((r: { job_id: string }) => r.job_id)
      );

      // 4. Filter matches according to rules
      const eligible: { job: JobRow; match: JobMatchRow }[] = [];

      for (const match of matchRows as JobMatchRow[]) {
        const job = jobsById.get(match.job_id);
        if (!job) continue;
        if (alreadyAppliedJobIds.has(job.id)) continue;

        // Values alignment rule
        if (settings.require_values_alignment && (match.values_alignment ?? 0) < 60) {
          continue;
        }

        // Salary rule if we have data
        if (settings.min_salary != null) {
          const salaryMin = job.salary_min ?? job.salary_max;
          if (salaryMin != null && salaryMin < settings.min_salary) {
            continue;
          }
        }

        // Apply URL rule
        const canonical = job.canonical_apply_url || job.apply_url;
        if (settings.apply_only_canonical && !job.canonical_apply_url) {
          // skip if we require canonical but only have generic
          continue;
        }

        if (!canonical) continue;

        eligible.push({ job, match });
      }

      if (eligible.length === 0) {
        summary.push({
          user_id: settings.user_id,
          status: 'no_jobs_after_filters',
        });
        continue;
      }

      // Sort by match score and take up to remaining
      eligible.sort((a, b) => b.match.match_score - a.match.match_score);
      const toUse = eligible.slice(0, remaining);

      // 5. Create job_applications rows in prepared or submitted state
      const applicationsPayload = toUse.map(({ job, match }) => {
        const now = new Date().toISOString();

        const baseDetails = {
          apply_url_used: job.canonical_apply_url || job.apply_url,
          company_name: job.company_name,
          job_title: job.title,
        };

        return {
          user_id: settings.user_id,
          job_id: job.id,
          status: settings.mode === 'full' ? 'submitted' : 'prepared',
          source: 'auto_apply',
          mode: settings.mode,
          match_score: match.match_score,
          applied_at: settings.mode === 'full' ? now : null,
          details: baseDetails,
        };
      });

      const { data: inserted, error: insertError } = await supabase
        .from('job_applications')
        .insert(applicationsPayload)
        .select('id, job_id');

      if (insertError) {
        console.error('Error inserting job_applications for user', settings.user_id, insertError);
        summary.push({
          user_id: settings.user_id,
          status: 'insert_error',
        });
        continue;
      }

      summary.push({
        user_id: settings.user_id,
        status: 'ok',
        created: inserted?.length ?? 0,
      });

      // [Inference] Future hook:
      // For full mode you can queue background tasks that:
      // - pick resume version
      // - generate answers
      // - attempt real submissions to ATS forms
      // For review mode you just surface these in the UI for user to approve.
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ ok: true, summary }),
    };
  } catch (err: any) {
    console.error('Unexpected error in autoApply function', err);
    return {
      statusCode: 500,
      body: 'Unexpected error',
    };
  }
};

function getStartOfWeekISO(): string {
  const now = new Date();
  const day = now.getUTCDay(); // 0 is Sunday
  const diff = (day + 6) % 7;  // Monday as start
  const monday = new Date(now);
  monday.setUTCDate(now.getUTCDate() - diff);
  monday.setUTCHours(0, 0, 0, 0);
  return monday.toISOString();
}

export { handler };