/**
 * =====================================================
 * 🧪 HUMAN SIGNAL NORMALIZATION TESTS
 * =====================================================
 *
 * File: netlify/functions/__tests__/humanSignal.test.js
 *
 * Tests for:
 * - Prompt generation for each document type
 * - Quality check warnings (detector bait, parallel bullets, etc.)
 * - Mode handling (off/lite/full)
 *
 * Run with: npm test -- humanSignal.test.js
 *
 * =====================================================
 */

import { describe, test, expect } from 'vitest';

// Import the normalizer module
import {
    buildHumanSignalPrompt,
    checkHumanSignal,
    mapTaskToDocType,
    getDefaultMode,
    formatWarnings,
} from '../../../src/lib/humanSignalNormalizer';

// =====================================================
// PROMPT GENERATION TESTS
// =====================================================

describe('buildHumanSignalPrompt', () => {
    test('should generate prompt for resume type', () => {
        const prompt = buildHumanSignalPrompt('resume');
        
        expect(prompt).toContain('Writing constraints');
        expect(prompt).toContain('ENTROPY OVER ELEGANCE');
        expect(prompt).toContain('INTENT ROTATION');
        expect(prompt).toContain('RESUME BULLETS');
        expect(prompt).toContain('PROFESSIONAL SUMMARY');
    });

    test('should generate prompt for cover_letter type', () => {
        const prompt = buildHumanSignalPrompt('cover_letter');
        
        expect(prompt).toContain('COVER LETTER STRUCTURE');
        expect(prompt).toContain('Do NOT follow the classic formula');
        expect(prompt).toContain('not "I look forward to..."');
    });

    test('should generate prompt for application_answer type', () => {
        const prompt = buildHumanSignalPrompt('application_answer');
        
        expect(prompt).toContain('APPLICATION QUESTIONS');
        expect(prompt).toContain('Answer the question directly first');
    });

    test('should generate prompt for networking_message type', () => {
        const prompt = buildHumanSignalPrompt('networking_message');
        
        expect(prompt).toContain('NETWORKING MESSAGES');
        expect(prompt).toContain('No formulaic openings or closings');
    });

    test('should generate prompt for linkedin_about type', () => {
        const prompt = buildHumanSignalPrompt('linkedin_about');
        
        expect(prompt).toContain('LINKEDIN ABOUT SECTION');
    });

    test('should generate prompt for career_narrative type', () => {
        const prompt = buildHumanSignalPrompt('career_narrative');
        
        expect(prompt).toContain('CAREER NARRATIVES');
        expect(prompt).toContain('Avoid polished mini-essays');
    });

    test('should return empty string when mode is off', () => {
        const prompt = buildHumanSignalPrompt('resume', 'off');
        expect(prompt).toBe('');
    });

    test('lite mode should exclude advanced principles', () => {
        const litePrompt = buildHumanSignalPrompt('resume', 'lite');
        const fullPrompt = buildHumanSignalPrompt('resume', 'full');
        
        expect(litePrompt).toContain('ENTROPY OVER ELEGANCE');
        expect(litePrompt).not.toContain('MICRO-IMPRECISION');
        expect(litePrompt).not.toContain('VOICE DRIFT');
        
        expect(fullPrompt).toContain('MICRO-IMPRECISION');
        expect(fullPrompt).toContain('VOICE DRIFT');
    });
});

// =====================================================
// TASK TYPE MAPPING TESTS
// =====================================================

describe('mapTaskToDocType', () => {
    test('should map resume task types correctly', () => {
        expect(mapTaskToDocType('resume_bullets').docType).toBe('resume');
        expect(mapTaskToDocType('resume_summary').docType).toBe('resume');
    });

    test('should map cover_letter task type correctly', () => {
        expect(mapTaskToDocType('cover_letter').docType).toBe('cover_letter');
    });

    test('should map application_answer task type correctly', () => {
        expect(mapTaskToDocType('application_answer').docType).toBe('application_answer');
    });

    test('should map networking_message task type correctly', () => {
        expect(mapTaskToDocType('networking_message').docType).toBe('networking_message');
    });

    test('should return fallback with warning for unknown types', () => {
        const result = mapTaskToDocType('unknown_task_type');
        
        expect(result.docType).toBe('application_answer');
        expect(result.warning).toContain('Unknown taskType');
    });

    test('should return null for undefined task type', () => {
        const result = mapTaskToDocType(undefined);
        expect(result.docType).toBeNull();
    });
});

// =====================================================
// DEFAULT MODE TESTS
// =====================================================

describe('getDefaultMode', () => {
    test('networking_message should default to lite', () => {
        expect(getDefaultMode('networking_message')).toBe('lite');
    });

    test('other types should default to full', () => {
        expect(getDefaultMode('resume')).toBe('full');
        expect(getDefaultMode('cover_letter')).toBe('full');
        expect(getDefaultMode('application_answer')).toBe('full');
        expect(getDefaultMode('career_narrative')).toBe('full');
    });
});

// =====================================================
// QUALITY CHECK TESTS
// =====================================================

describe('checkHumanSignal', () => {
    describe('detector bait phrases', () => {
        test('should flag "I am excited to apply"', () => {
            const text = 'I am excited to apply for this position at your company.';
            const warnings = checkHumanSignal(text, 'cover_letter');
            
            expect(warnings.some(w => w.code === 'HS001_DETECTOR_BAIT')).toBe(true);
            expect(warnings.some(w => w.match === 'i am excited to apply')).toBe(true);
        });

        test('should flag "I look forward to"', () => {
            const text = 'I look forward to hearing from you.';
            const warnings = checkHumanSignal(text, 'cover_letter');
            
            expect(warnings.some(w => w.code === 'HS001_DETECTOR_BAIT')).toBe(true);
        });

        test('should flag "dynamic team"', () => {
            const text = 'I want to join your dynamic team.';
            const warnings = checkHumanSignal(text, 'application_answer');
            
            expect(warnings.some(w => w.code === 'HS001_DETECTOR_BAIT')).toBe(true);
        });

        test('should flag "fast-paced environment"', () => {
            const text = 'I thrive in a fast-paced environment.';
            const warnings = checkHumanSignal(text, 'application_answer');
            
            expect(warnings.some(w => w.code === 'HS001_DETECTOR_BAIT')).toBe(true);
        });

        test('should flag "i am passionate about"', () => {
            const text = 'I am passionate about technology and innovation.';
            const warnings = checkHumanSignal(text, 'cover_letter');
            
            expect(warnings.some(w => w.code === 'HS001_DETECTOR_BAIT')).toBe(true);
        });
    });

    describe('parallel bullet detection', () => {
        test('should flag 3+ bullets starting with same verb', () => {
            const text = `
- Led the engineering team
- Led the product launch
- Led the customer success initiative
- Led the infrastructure migration
            `;
            const warnings = checkHumanSignal(text, 'resume');
            
            expect(warnings.some(w => w.code === 'HS002_PARALLEL_BULLETS')).toBe(true);
            expect(warnings.some(w => w.match === 'led')).toBe(true);
        });

        test('should not flag varied bullet structures', () => {
            const text = `
- Led the engineering team
- Developed new features
- Managed client relationships
- Built internal tooling
            `;
            const warnings = checkHumanSignal(text, 'resume');
            
            expect(warnings.some(w => w.code === 'HS002_PARALLEL_BULLETS')).toBe(false);
        });
    });

    describe('metric stacking detection', () => {
        test('should flag 3+ metrics in single sentence', () => {
            const text = 'Improved efficiency by 40%, reduced costs by 25%, and increased revenue by 30% in one quarter.';
            const warnings = checkHumanSignal(text, 'resume');
            
            expect(warnings.some(w => w.code === 'HS003_METRIC_STACKING')).toBe(true);
        });

        test('should not flag metrics across separate sentences', () => {
            const text = 'Improved efficiency by 40%. Reduced costs by 25%. Increased revenue by 30%.';
            const warnings = checkHumanSignal(text, 'resume');
            
            expect(warnings.some(w => w.code === 'HS003_METRIC_STACKING')).toBe(false);
        });
    });

    describe('formulaic closing detection', () => {
        test('should flag standard cover letter closings', () => {
            const text = 'Thank you for your time and consideration. I look forward to hearing from you.';
            const warnings = checkHumanSignal(text, 'cover_letter');
            
            expect(warnings.some(w => w.code === 'HS005_FORMULAIC_CLOSING')).toBe(true);
        });

        test('should flag networking message closings', () => {
            const text = 'I would welcome the opportunity to connect.';
            const warnings = checkHumanSignal(text, 'networking_message');
            
            expect(warnings.some(w => w.code === 'HS005_FORMULAIC_CLOSING')).toBe(true);
        });
    });

    describe('uniform sentence length detection', () => {
        test('should flag very uniform sentence lengths in cover letters', () => {
            // All sentences are approximately the same length
            const text = 'I have five years of experience. I worked at several companies. I learned many valuable skills. I am ready for new challenges.';
            const warnings = checkHumanSignal(text, 'cover_letter');
            
            expect(warnings.some(w => w.code === 'HS004_UNIFORM_LENGTH')).toBe(true);
        });

        test('should not flag varied sentence lengths', () => {
            const text = 'I have extensive experience. Over the past five years, I have worked at several companies where I developed a wide range of technical and leadership skills. I am ready.';
            const warnings = checkHumanSignal(text, 'cover_letter');
            
            expect(warnings.some(w => w.code === 'HS004_UNIFORM_LENGTH')).toBe(false);
        });
    });

    test('should return empty array for clean text', () => {
        const text = 'Built and maintained internal tooling. Took ownership of a broken workflow. By the end of the year, the process was more reliable.';
        const warnings = checkHumanSignal(text, 'resume');
        
        // Should have no high-severity warnings
        expect(warnings.filter(w => w.severity === 'high').length).toBe(0);
    });
});

// =====================================================
// WARNING FORMATTING TESTS
// =====================================================

describe('formatWarnings', () => {
    test('should format empty warnings', () => {
        const result = formatWarnings([]);
        expect(result).toBe('No human signal warnings');
    });

    test('should format multiple warnings', () => {
        const warnings = [
            { code: 'HS001_DETECTOR_BAIT', message: 'Test message 1', severity: 'high' },
            { code: 'HS002_PARALLEL_BULLETS', message: 'Test message 2', severity: 'warn' },
        ];
        const result = formatWarnings(warnings);
        
        expect(result).toContain('[HIGH] HS001_DETECTOR_BAIT');
        expect(result).toContain('[WARN] HS002_PARALLEL_BULLETS');
    });
});
