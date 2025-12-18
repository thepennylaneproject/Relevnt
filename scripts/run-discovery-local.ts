/**
 * Local Discovery Runner
 * 
 * Simple script to run the discovery process manually.
 * Usage: npx tsx --env-file=.env.local scripts/run-discovery-local.ts
 */

import { runDiscoveryDaemon } from '../netlify/functions/discover_companies';

async function main() {
    console.log('🚀 Starting Local Company Discovery...');

    try {
        const result = await runDiscoveryDaemon();

        console.log('\n' + '='.repeat(50));
        console.log('Final Discovery Results:');
        console.log('='.repeat(50));
        console.log(`Status: ${result.status.toUpperCase()}`);
        console.log(`Companies Discovered: ${result.stats.companies_discovered}`);
        console.log(`Platforms Detected: ${result.stats.platforms_detected}`);
        console.log(`Companies Added/Updated: ${result.stats.companies_added}`);
        console.log(`Duration: ${(result.duration_ms / 1000).toFixed(1)}s`);

        if (result.errors.length > 0) {
            console.log('\nErrors encountered:');
            result.errors.forEach(err => console.error(` - ${err}`));
        }

        process.exit(0);
    } catch (error) {
        console.error('Fatal Discovery Error:', error);
        process.exit(1);
    }
}

main();
