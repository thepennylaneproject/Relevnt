import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs/promises';
import * as path from 'path';

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Error: Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
    console.log('Fetching ATS configs from Supabase...');
    const { data: companies, error } = await supabase
        .from('companies')
        .select('name, domain, lever_slug, greenhouse_board_token')
        .or('lever_slug.not.is.null,greenhouse_board_token.not.is.null');

    if (error) {
        console.error('Error fetching companies:', error);
        return;
    }

    const leverSources = companies
        .filter(c => c.lever_slug)
        .map(c => ({ companyName: c.name, leverSlug: c.lever_slug }));

    const greenhouseBoards = companies
        .filter(c => c.greenhouse_board_token)
        .map(c => ({ companyName: c.name, boardToken: c.greenhouse_board_token }));

    const dataDir = path.resolve(process.cwd(), 'src/data/jobSources');

    await fs.writeFile(
        path.join(dataDir, 'greenhouse_boards.json'),
        JSON.stringify(greenhouseBoards, null, 2)
    );

    await fs.writeFile(
        path.join(dataDir, 'lever_sources.json'),
        JSON.stringify(leverSources, null, 2)
    );

    console.log(`\n✅ Exported ${greenhouseBoards.length} Greenhouse boards`);
    console.log(`✅ Exported ${leverSources.length} Lever sources`);
}

main();
