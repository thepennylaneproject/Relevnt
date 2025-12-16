import { BaseProvider } from './base.js';

export class LinkedInProvider extends BaseProvider {
    name = 'linkedin';

    validate(url: string): boolean {
        const u = new URL(url);
        return u.hostname.endsWith('linkedin.com') && u.pathname.includes('/jobs/');
    }

    // Note: Implementation will be restricted to official APIs only.
}
