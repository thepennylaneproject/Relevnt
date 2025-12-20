// scripts/cleanupStuckRuns.ts
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function cleanup() {
    console.log('Cleaning up stuck ingestion runs...');

    const { data, error } = await supabase
        .from('job_ingestion_runs')
        .update({
            finished_at: new Date().toISOString(),
            status: 'failed',
            error_summary: 'Function timed out before completion (cleanup script)'
        })
        .is('finished_at', null)
        .eq('status', 'running');

    if (error) {
        console.error('Error cleaning up stuck runs:', error);
        process.exit(1);
    }

    console.log('Stuck runs marked as failed.');
}

cleanup();
