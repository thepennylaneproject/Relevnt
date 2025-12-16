import { BaseProvider } from './base.js';

export class WorkdayProvider extends BaseProvider {
    name = 'workday';

    validate(url: string): boolean {
        const u = new URL(url);
        return u.hostname.endsWith('myworkdayjobs.com');
    }
}
