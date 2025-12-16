import { BaseProvider } from './base.js';

export class GreenhouseProvider extends BaseProvider {
    name = 'greenhouse';

    validate(url: string): boolean {
        const u = new URL(url);
        return u.hostname.endsWith('greenhouse.io') || u.hostname === 'boards.greenhouse.io';
    }
}
