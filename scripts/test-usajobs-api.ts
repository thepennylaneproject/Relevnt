/**
 * USAJobs API Connectivity Diagnostics
 * 
 * Usage: npx tsx scripts/test-usajobs-api.ts
 */
import { config } from 'dotenv';
import { existsSync } from 'fs';
import { join } from 'path';

// Load .env.local explicitly
const envPath = join(process.cwd(), '.env.local');
if (existsSync(envPath)) {
    console.log(`📝 Found .env.local at ${envPath}`);
    config({ path: envPath });
} else {
    console.warn(`⚠️ .env.local not found at ${envPath}, falling back to standard .env`);
    config();
}

// Note: Using global fetch (Node 18+)
async function testUSAJobs() {
    console.log('--- USAJobs API Diagnostic ---');
    
    const apiKey = process.env.USAJOBS_API_KEY;
    const userAgent = process.env.USAJOBS_USER_AGENT;
    
    if (!apiKey) {
        console.error('❌ Missing USAJOBS_API_KEY in environment');
    } else {
        console.log(`✅ USAJOBS_API_KEY found: ${apiKey.slice(0, 4)}...${apiKey.slice(-4)}`);
    }
    
    if (!userAgent) {
        console.error('❌ Missing USAJOBS_USER_AGENT in environment');
        console.warn('⚠️ USAJobs requires a specific User-Agent that was associated with your API key.');
    } else {
        console.log(`✅ USAJOBS_USER_AGENT found: "${userAgent}"`);
    }
    
    if (!apiKey || !userAgent) {
        console.log('\nStopping: Credentials missing.');
        return;
    }

    const testUrl = 'https://data.usajobs.gov/api/Search?Keyword=Software&ResultsPerPage=1';
    
    const headers = {
        'User-Agent': userAgent,
        'Authorization-Key': apiKey,
        'Accept': 'application/json'
    };

    console.log(`\nTesting connection to: ${testUrl}`);
    console.log('Sending headers:', {
        'User-Agent': headers['User-Agent'],
        'Authorization-Key': 'MASKED',
        'Accept': headers['Accept']
    });

    try {
        const response = await fetch(testUrl, { headers });
        const status = response.status;
        const text = await response.text();
        
        console.log('\n--- Response ---');
        console.log(`Status: ${status} ${response.statusText}`);
        
        if (status === 200) {
            console.log('✅ Success! Connection established.');
            try {
                const json = JSON.parse(text);
                const count = json.SearchResult?.SearchResultCountTotal || 0;
                console.log(`Found ${count} total jobs matching "Software".`);
            } catch (e) {
                console.log('Raw text response (not JSON):', text.slice(0, 200));
            }
        } else {
            console.error(`❌ Failed with status ${status}`);
            console.error('Body:', text);
            
            if (status === 401) {
                console.log('\n💡 Troubleshooting 401:');
                console.log('1. Ensure your API Key is active at https://developer.usajobs.gov/');
                console.log('2. Ensure the User-Agent matches EXACTLY the email/value registered with the key.');
                console.log('3. Check for whitespace or special characters in .env.local values.');
            }
        }
    } catch (err: any) {
        console.error(`\n❌ Network Error: ${err.message}`);
    }
}

testUSAJobs();
