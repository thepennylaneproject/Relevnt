
import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest'
import type { HandlerResponse } from '@netlify/functions'
import { handler } from '../prepare'
import { runAI } from '../../ai/run'
import { createAdminClient } from '../../utils/supabase'

// Mock dependencies
vi.mock('../../ai/run', () => ({
    runAI: vi.fn()
}))

vi.mock('../../utils/supabase', () => ({
    createAdminClient: vi.fn()
}))

describe('Auto-Apply Prepare Worker', () => {
    let mockSupabase: any

    beforeEach(() => {
        vi.clearAllMocks()

        // Mock chainable Supabase client
        mockSupabase = {
            from: vi.fn().mockReturnThis(),
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            limit: vi.fn().mockReturnThis(),
            insert: vi.fn().mockReturnThis(),
            update: vi.fn().mockReturnThis(),
            single: vi.fn().mockReturnThis(),
        }
            ; (createAdminClient as unknown as Mock).mockReturnValue(mockSupabase)
    })

    const mockEvent: any = {
        httpMethod: 'POST',
        headers: { 'x-admin-secret': process.env.ADMIN_SECRET || 'secret' }
    }

    it('should process a queued item successfully', async () => {
        const mockQueueItems = [{
            id: 'q1',
            job_id: 'job1',
            user_id: 'user1',
            rule_id: 'rule1',
            status: 'pending',
            jobs: { title: 'Engineer', company: 'TechCorp', description: 'Code stuff' },
            user_personas: { id: 'p1', resume_id: 'r1', base_prompt: 'Be pro' }
        }]

        const mockResume = {
            id: 'r1',
            full_name: 'Jane Doe',
            professional_summary: 'Senior Dev',
            experiences: [{ company: 'OldCorp', position: 'Dev' }],
            education: [],
            skills: []
        }

        // Setup mock returns
        // 1. Fetch Queue
        mockSupabase.select.mockImplementationOnce(() => Promise.resolve({ data: mockQueueItems, error: null }))

        // 2. Fetch Profile (Tier)
        mockSupabase.single.mockImplementationOnce(() => Promise.resolve({ data: { tier: 'pro' } }))

        // 3. Fetch Resume
        mockSupabase.single.mockImplementationOnce(() => Promise.resolve({ data: mockResume }))

            // 4. Mock AI Responses
            ; (runAI as unknown as Mock)
                .mockResolvedValueOnce({ ok: true, output: '["Java", "TS"]', trace_id: 't1' }) // Keywords
                .mockResolvedValueOnce({ ok: true, output: 'Great at coding', trace_id: 't2' }) // Highlights
                .mockResolvedValueOnce({ ok: true, output: 'Dear Hiring Manager at TechCorp...', trace_id: 't3' }) // Cover Letter

        // 5. Artifact Insert
        mockSupabase.insert.mockImplementationOnce(() => Promise.resolve({ error: null }))

        // 6. Queue Update
        mockSupabase.update.mockImplementationOnce(() => Promise.resolve({ error: null }))

        // 7. Log Insert
        mockSupabase.insert.mockImplementationOnce(() => Promise.resolve({ error: null }))

        const result = await handler(mockEvent, {} as any) as HandlerResponse

        expect(result.statusCode).toBe(200)
        expect(runAI).toHaveBeenCalledTimes(3)

        // Verify status update was 'ready_to_submit'
        expect(mockSupabase.update).toHaveBeenCalledWith(
            expect.objectContaining({ status: 'ready_to_submit' })
        )
    })

    it('should mark requires_review if AI fails validation (hallucination)', async () => {
        const mockQueueItems = [{
            id: 'q1',
            job_id: 'job1',
            user_id: 'user1',
            rule_id: 'rule1',
            status: 'pending',
            jobs: { title: 'Engineer', company: 'TechCorp', description: 'Code stuff' },
            user_personas: { id: 'p1', resume_id: 'r1' }
        }]

        mockSupabase.select.mockResolvedValue({ data: mockQueueItems, error: null }) // Queue
        mockSupabase.single.mockResolvedValueOnce({ data: { tier: 'free' } }) // Profile
        mockSupabase.single.mockResolvedValueOnce({ data: { id: 'r1', full_name: 'John' } }) // Resume

            // AI returns placeholder
            ; (runAI as unknown as Mock)
                .mockResolvedValueOnce({ ok: true, output: '[]' })
                .mockResolvedValueOnce({ ok: true, output: 'High' })
                .mockResolvedValueOnce({ ok: true, output: 'Dear [Company Name], I want this job.' })

        await handler(mockEvent, {} as any)

        expect(mockSupabase.update).toHaveBeenCalledWith(
            expect.objectContaining({ status: 'requires_review' })
        )
    })
})
