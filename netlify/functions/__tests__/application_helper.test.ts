
import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest'
import type { HandlerResponse } from '@netlify/functions'
import { handler } from '../application_helper'
import { runAI } from '../ai/run'
import { verifyToken, createAdminClient } from '../utils/supabase'

// Mock dependencies
vi.mock('../ai/run', () => ({
    runAI: vi.fn()
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

    const mockEvent: any = {
        httpMethod: 'POST',
        headers: { authorization: 'Bearer test-token' },
        body: JSON.stringify({
            question: "Why do you want this job?",
            mode: "concise",
            roleTitle: "Engineer",
            resumeContext: "I like coding."
        })
    }

    it('should return 401 if auth fails', async () => {
        (verifyToken as unknown as Mock).mockResolvedValue({ userId: null, error: 'Auth failed' })

        const result = await handler(mockEvent, {} as any) as HandlerResponse
        expect(result.statusCode).toBe(401)
    })

    it('should process request and return AI output', async () => {
        (verifyToken as unknown as Mock).mockResolvedValue({ userId: 'user-123', error: null })
        mockSupabase.single.mockResolvedValue({ data: { tier: 'pro' }, error: null })

        const mockAIOutput = {
            answer: "Because I love it.",
            bullet_points: ["Love coding"],
            follow_up_questions: ["When can you start?"],
            warnings: []
        };

        (runAI as unknown as Mock).mockResolvedValue({
            ok: true,
            output: mockAIOutput,
            trace_id: 'trace-1',
            provider: 'openai',
            model: 'gpt-4o'
        })

        const result = await handler(mockEvent, {} as any) as HandlerResponse

        expect(result.statusCode).toBe(200)
        const body = JSON.parse(result.body as string)
        expect(body.ok).toBe(true)
        expect(body.output).toEqual(mockAIOutput)
        expect(runAI).toHaveBeenCalledWith(expect.objectContaining({
            task: 'application_question_answer',
            userId: 'user-123',
            tier: 'pro'
        }))
    })

    it('should default to free tier if profile fetch fails', async () => {
        (verifyToken as unknown as Mock).mockResolvedValue({ userId: 'user-123', error: null });
        mockSupabase.single.mockResolvedValue({ data: null, error: 'Not found' });

        (runAI as unknown as Mock).mockResolvedValue({
            ok: true,
            output: {},
        })

        await handler(mockEvent, {} as any)

        expect(runAI).toHaveBeenCalledWith(expect.objectContaining({
            tier: 'free'
        }))
    })
})
