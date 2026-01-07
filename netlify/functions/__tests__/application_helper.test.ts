
import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest'
import type { HandlerResponse } from '@netlify/functions'
import { handler } from '../application_helper'
import { routeLegacyTask } from '../ai/legacyTaskRouter'
import { verifyToken, createAdminClient } from '../utils/supabase'

// Mock dependencies
vi.mock('../ai/legacyTaskRouter', () => ({
    routeLegacyTask: vi.fn()
}))

vi.mock('../utils/supabase', async (importOriginal) => {
    const actual = await importOriginal<typeof import('../utils/supabase')>()
    return {
        ...actual,
        verifyToken: vi.fn(),
        createAdminClient: vi.fn(),
    }
})

describe('Application Helper Function', () => {
    let mockSupabase: any

    beforeEach(() => {
        vi.clearAllMocks()

        mockSupabase = {
            from: vi.fn().mockReturnThis(),
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockReturnThis(),
        }
            ; (createAdminClient as unknown as Mock).mockReturnValue(mockSupabase)
    })

    // Valid settingsSummary for configured state
    const validSettingsSummary = {
        settings_configured: true,
        missing: [],
        persona: { id: 'persona-1', title: 'Software Engineer' },
        hard_constraints: {
            seniority_levels: ['Senior'],
            remote_preference: 'remote',
            min_salary: 150000,
            needs_sponsorship: false,
        },
        soft_preferences: {
            skill_emphasis: ['TypeScript', 'React'],
            relocation: 'no',
            travel: 'none',
        },
        operational: {
            automation_enabled: false,
            auto_apply_max_apps_per_day: null,
            notifications: {
                high_match: true,
                application_updates: true,
                weekly_digest: true,
            },
        },
    }

    const mockEventWithSettings: any = {
        httpMethod: 'POST',
        headers: { authorization: 'Bearer test-token' },
        body: JSON.stringify({
            question: "Why do you want this job?",
            mode: "concise",
            roleTitle: "Engineer",
            resumeContext: "I like coding.",
            settingsSummary: validSettingsSummary,
        })
    }

    const mockEventWithoutSettings: any = {
        httpMethod: 'POST',
        headers: { authorization: 'Bearer test-token' },
        body: JSON.stringify({
            question: "Why do you want this job?",
            mode: "concise",
            roleTitle: "Engineer",
            resumeContext: "I like coding.",
        })
    }

    it('should return 401 if auth fails', async () => {
        (verifyToken as unknown as Mock).mockResolvedValue({ userId: null, error: 'Auth failed' })

        const result = await handler(mockEventWithSettings, {} as any) as HandlerResponse
        expect(result.statusCode).toBe(401)
    })

    it('should return incomplete_settings when settingsSummary is missing', async () => {
        (verifyToken as unknown as Mock).mockResolvedValue({ userId: 'user-123', error: null })

        const result = await handler(mockEventWithoutSettings, {} as any) as HandlerResponse

        expect(result.statusCode).toBe(200)
        const body = JSON.parse(result.body as string)
        expect(body.ok).toBe(false)
        expect(body.incomplete_settings).toBe(true)
        expect(body.missing).toEqual([])
        expect(body.message).toBeDefined()
    })

    it('should return incomplete_settings when settings_configured is false', async () => {
        (verifyToken as unknown as Mock).mockResolvedValue({ userId: 'user-123', error: null })

        const incompleteSettings = {
            settings_configured: false,
            missing: ['persona', 'seniority_levels'],
            persona: { id: null, title: null },
            hard_constraints: {
                seniority_levels: [],
                remote_preference: null,
                min_salary: null,
                needs_sponsorship: null,
            },
            soft_preferences: {
                skill_emphasis: [],
                relocation: null,
                travel: null,
            },
            operational: {
                automation_enabled: false,
                auto_apply_max_apps_per_day: null,
                notifications: {
                    high_match: true,
                    application_updates: true,
                    weekly_digest: true,
                },
            },
        }

        const event = {
            httpMethod: 'POST',
            headers: { authorization: 'Bearer test-token' },
            body: JSON.stringify({
                question: "Why do you want this job?",
                settingsSummary: incompleteSettings,
            })
        }

        const result = await handler(event as any, {} as any) as HandlerResponse

        expect(result.statusCode).toBe(200)
        const body = JSON.parse(result.body as string)
        expect(body.ok).toBe(false)
        expect(body.incomplete_settings).toBe(true)
        expect(body.missing).toEqual(['persona', 'seniority_levels'])
        expect(body.message).toContain('Active persona')
        expect(body.message).toContain('Seniority')
    })

    it('should process request and return AI output when configured', async () => {
        (verifyToken as unknown as Mock).mockResolvedValue({ userId: 'user-123', error: null })
        mockSupabase.single.mockResolvedValue({ data: { tier: 'pro' }, error: null })

        const mockAIOutput = {
            answer: "Because I love it.",
            bullet_points: ["Love coding"],
            follow_up_questions: ["When can you start?"],
            warnings: []
        };

        (routeLegacyTask as unknown as Mock).mockResolvedValue({
            ok: true,
            output: mockAIOutput,
            trace_id: 'trace-1',
            provider: 'openai',
            model: 'gpt-4o'
        })

        const result = await handler(mockEventWithSettings, {} as any) as HandlerResponse

        expect(result.statusCode).toBe(200)
        const body = JSON.parse(result.body as string)
        expect(body.ok).toBe(true)
        expect(body.output).toEqual(mockAIOutput)
        expect(routeLegacyTask).toHaveBeenCalledWith(
            'application-question-answer',
            expect.objectContaining({
                question: "Why do you want this job?",
                context: expect.objectContaining({
                    constraintInstruction: expect.stringContaining('Seniority')
                })
            }),
            expect.objectContaining({
                userId: 'user-123',
                tier: 'pro'
            })
        )
    })

    it('should default to free tier if profile fetch fails', async () => {
        (verifyToken as unknown as Mock).mockResolvedValue({ userId: 'user-123', error: null });
        mockSupabase.single.mockResolvedValue({ data: null, error: 'Not found' });

        (routeLegacyTask as unknown as Mock).mockResolvedValue({
            ok: true,
            output: {},
        })

        await handler(mockEventWithSettings, {} as any)

        expect(routeLegacyTask).toHaveBeenCalledWith(
            expect.any(String),
            expect.any(Object),
            expect.objectContaining({
                tier: 'free'
            })
        )
    })
})
