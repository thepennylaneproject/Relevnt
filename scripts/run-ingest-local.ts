/**
 * Local Ingestion Runner
 * 
 * Simple script to run the ingestion process manually for a specific source.
 * Usage: npx tsx --env-file=.env.local scripts/run-ingest-local.ts <source-slug>
 */

import { runIngestion } from '../netlify/functions/ingest_jobs';

async function main() {
    const sourceSlug = process.argv[2] || null;
    console.log(`🚀 Starting Local Job Ingestion${sourceSlug ? ` for ${sourceSlug}` : ' for all sources'}...`);

    try {
        const results = await runIngestion(sourceSlug, 'manual');

        console.log('\n' + '='.repeat(50));
        console.log('Ingestion Results:');
        console.log('='.repeat(50));

        results.forEach(res => {
            console.log(`Source: ${res.source}`);
            console.log(` - Status: ${res.status.toUpperCase()}`);
            console.log(` - Total Found: ${res.count}`);
            console.log(` - Normalized: ${res.normalized}`);
            console.log(` - Duplicates: ${res.duplicates}`);
            if (res.error) console.error(` - Error: ${res.error}`);
            console.log('-'.repeat(20));
        });

        process.exit(0);
    } catch (error) {
        console.error('Fatal Ingestion Error:', error);
        process.exit(1);
    }
}

main();
