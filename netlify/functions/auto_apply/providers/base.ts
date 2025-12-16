import { JobApplicationProvider } from './types.js';

export abstract class BaseProvider implements JobApplicationProvider {
    abstract name: string;

    abstract validate(url: string): boolean;

    protected log(message: string) {
        console.log(`[AutoApply:${this.name}] ${message}`);
    }

    // Common utility methods can be added here
}
