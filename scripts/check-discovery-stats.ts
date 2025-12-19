import { createAdminClient } from '../netlify/functions/utils/supabase';

async function checkStats() {
    const supabase = createAdminClient();

    const { count: totalCompanies, error: err1 } = await supabase
        .from('companies')
        .select('*', { count: 'exact', head: true });

    const { count: withLever, error: err2 } = await supabase
        .from('companies')
        .select('*', { count: 'exact', head: true })
        .not('lever_slug', 'is', null);

    const { count: withGreenhouse, error: err3 } = await supabase
        .from('companies')
        .select('*', { count: 'exact', head: true })
        .not('greenhouse_board_token', 'is', null);

    console.log('\n--- Discovery Stats ---');
    console.log(`Total Companies: ${totalCompanies}`);
    console.log(`With Lever: ${withLever}`);
    console.log(`With Greenhouse: ${withGreenhouse}`);
    console.log(`Yield: ${(((withLever || 0) + (withGreenhouse || 0)) / (totalCompanies || 1) * 100).toFixed(1)}%`);
    console.log('-----------------------\n');
}

checkStats().catch(console.error);
