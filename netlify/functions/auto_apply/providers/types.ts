export interface JobApplicationProvider {
    /**
     * The unique name of the provider (e.g., 'greenhouse', 'lever').
     */
    name: string;

    /**
     * Determines if this provider can handle the given URL.
     * @param url The job posting URL.
     */
    validate(url: string): boolean;

    /**
     * (Future) Extracts job details from the URL.
     * @param url The job posting URL.
     */
    extractJobDetails?(url: string): Promise<any>;

    /**
     * (Future) Applies to the job or generates artifacts.
     */
    apply?(userProfile: any, jobDetails: any): Promise<any>;
}

export type PlatformDetectionResult =
    | { type: 'SUPPORTED'; provider: JobApplicationProvider }
    | { type: 'UNSUPPORTED'; reason: string }
    | { type: 'RESTRICTED'; reason: string };
