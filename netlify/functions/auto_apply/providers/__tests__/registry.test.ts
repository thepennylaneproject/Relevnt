import { describe, it, expect } from 'vitest';
import { registry } from '../registry.js';

describe('ProviderRegistry', () => {
    it('detects Greenhouse URLs', () => {
        expect(registry.detectPlatform('https://boards.greenhouse.io/example/jobs/123').type).toBe('SUPPORTED');
        expect((registry.detectPlatform('https://boards.greenhouse.io/example/jobs/123') as any).provider.name).toBe('greenhouse');
    });

    it('detects Lever URLs', () => {
        expect(registry.detectPlatform('https://jobs.lever.co/example/123').type).toBe('SUPPORTED');
        expect((registry.detectPlatform('https://jobs.lever.co/example/123') as any).provider.name).toBe('lever');
    });

    it('detects Workday URLs', () => {
        expect(registry.detectPlatform('https://example.myworkdayjobs.com/en-US/jobs/details/123').type).toBe('SUPPORTED');
        expect((registry.detectPlatform('https://example.myworkdayjobs.com/en-US/jobs/details/123') as any).provider.name).toBe('workday');
    });

    it('detects LinkedIn URLs as RESTRICTED', () => {
        expect(registry.detectPlatform('https://www.linkedin.com/jobs/view/123').type).toBe('RESTRICTED');
    });

    it('returns UNSUPPORTED for unknown platforms', () => {
        expect(registry.detectPlatform('https://example.com/jobs/123').type).toBe('UNSUPPORTED');
    });

    it('returns UNSUPPORTED for invalid URLs', () => {
        expect(registry.detectPlatform('not-a-url').type).toBe('UNSUPPORTED');
    });
});
