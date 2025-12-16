import { JobApplicationProvider, PlatformDetectionResult } from './types.js';
import { GreenhouseProvider } from './greenhouse.js';
import { LeverProvider } from './lever.js';
import { WorkdayProvider } from './workday.js';
import { LinkedInProvider } from './linkedin.js';

export class ProviderRegistry {
    private providers: JobApplicationProvider[] = [];

    constructor() {
        this.register(new GreenhouseProvider());
        this.register(new LeverProvider());
        this.register(new WorkdayProvider());
        this.register(new LinkedInProvider());
    }

    register(provider: JobApplicationProvider) {
        this.providers.push(provider);
    }

    detectPlatform(url: string): PlatformDetectionResult {
        try {
            // Basic URL validation
            new URL(url);
        } catch {
            return { type: 'UNSUPPORTED', reason: 'Invalid URL' };
        }

        for (const provider of this.providers) {
            if (provider.validate(url)) {
                if (provider.name === 'workday') {
                    // Workday is experimental/manual for now, but technically supported as a platform we identify.
                    // We can return SUPPORTED but maybe add a note? For now, stick to the type.
                    return { type: 'SUPPORTED', provider };
                }
                if (provider.name === 'linkedin') {
                    // LinkedIn is restricted.
                    return { type: 'RESTRICTED', reason: 'LinkedIn automation is restricted to official APIs only.' };
                }
                return { type: 'SUPPORTED', provider };
            }
        }

        return { type: 'UNSUPPORTED', reason: 'No matching provider found' };
    }
}

export const registry = new ProviderRegistry();
