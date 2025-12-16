import { BaseProvider } from './base.js';

export class LeverProvider extends BaseProvider {
    name = 'lever';

    validate(url: string): boolean {
        const u = new URL(url);
        return u.hostname.endsWith('lever.co') || u.hostname === 'jobs.lever.co';
    }
}
