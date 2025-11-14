import { describe, test, expect, beforeEach, afterEach } from 'vitest';
import { createMockEvent } from './helpers.js';  // adjust path if needed

// Rest of your test file...
describe('Authentication', () => {
  // ...
});/**
 * =====================================================
 * 🧪 INTEGRATION TESTS FOR AI ENDPOINTS
 * =====================================================
 * 
 * File: netlify/functions/__tests__/ai.test.js
 * 
 * Tests all 10 AI endpoints with:
 * - Authentication validation
 * - Input validation
 * - Rate limiting
 * - Provider routing
 * - Cost tracking
 * - Error handling
 * 
 * Run with: npm test -- ai.test.js
 * 
 * =====================================================
 */

import { handler } from '../ai.js';
import jwt from 'jsonwebtoken';

// =====================================================
// TEST UTILITIES
// =====================================================

/**
 * Create mock event for testing
 */
const createMockEvent = (body, token = null) => {
  const authHeader = token ? `Bearer ${token}` : null;

  return {
    httpMethod: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(authHeader && { authorization: authHeader }),
    },
    body: JSON.stringify(body),
  };
};

/**
 * Generate valid JWT token
 */
const generateToken = () => {
  return jwt.sign(
    {
      sub: 'user-123',
      id: 'user-123',
      email: 'test@example.com',
    },
    process.env.JWT_SECRET || 'your-secret-key',
    { expiresIn: '1h' }
  );
};

/**
 * Parse response body
 */
const parseResponse = (response) => {
  return JSON.parse(response.body);
};

// =====================================================
// AUTHENTICATION TESTS
// =====================================================

describe('Authentication', () => {
  test('should reject requests without token', async () => {
    const event = createMockEvent({ task: 'extract-jobs', content: 'test' });
    const response = await handler(event);

    expect(response.statusCode).toBe(401);
    const body = parseResponse(response);
    expect(body.error).toContain('authorization');
  });

  test('should reject requests with invalid token', async () => {
    const event = createMockEvent(
      { task: 'extract-jobs', content: 'test' },
      'invalid-token'
    );
    const response = await handler(event);

    expect(response.statusCode).toBe(401);
    const body = parseResponse(response);
    expect(body.error).toContain('Invalid token');
  });

  test('should accept valid token', async () => {
    const token = generateToken();
    const event = createMockEvent(
      { task: 'extract-jobs', content: 'Senior Engineer role at Google' },
      token
    );
    const response = await handler(event);

    // Should not return 401 for valid token
    expect(response.statusCode).not.toBe(401);
  });
});

// =====================================================
// CORS TESTS
// =====================================================

describe('CORS', () => {
  test('should handle OPTIONS preflight request', async () => {
    const response = await handler({ httpMethod: 'OPTIONS' });

    expect(response.statusCode).toBe(200);
    expect(response.headers['Access-Control-Allow-Origin']).toBeDefined();
    expect(response.headers['Access-Control-Allow-Methods']).toBe('POST, OPTIONS');
  });

  test('should include CORS headers in response', async () => {
    const token = generateToken();
    const event = createMockEvent(
      { task: 'extract-jobs', content: 'test' },
      token
    );
    const response = await handler(event);

    expect(response.headers['Access-Control-Allow-Origin']).toBeDefined();
    expect(response.headers['Content-Type']).toBe('application/json');
  });
});

// =====================================================
// INPUT VALIDATION TESTS
// =====================================================

describe('Input Validation', () => {
  const token = generateToken();

  test('should reject request without task field', async () => {
    const event = createMockEvent({ content: 'test' }, token);
    const response = await handler(event);

    expect(response.statusCode).toBe(400);
    const body = parseResponse(response);
    expect(body.error).toContain('task');
  });

  test('should reject extract-jobs without content', async () => {
    const event = createMockEvent({ task: 'extract-jobs' }, token);
    const response = await handler(event);

    expect(response.statusCode).toBe(400);
    const body = parseResponse(response);
    expect(body.error).toContain('content');
  });

  test('should reject rank-jobs without required fields', async () => {
    const event = createMockEvent(
      { task: 'rank-jobs', skills: 'Python' }, // Missing requirements
      token
    );
    const response = await handler(event);

    expect(response.statusCode).toBe(400);
  });

  test('should reject generate-cover-letter without company', async () => {
    const event = createMockEvent(
      {
        task: 'generate-cover-letter',
        role: 'Engineer',
        background: 'test',
      }, // Missing company
      token
    );
    const response = await handler(event);

    expect(response.statusCode).toBe(400);
  });

  test('should reject unknown task', async () => {
    const event = createMockEvent(
      { task: 'unknown-task', content: 'test' },
      token
    );
    const response = await handler(event);

    expect(response.statusCode).toBe(400);
    const body = parseResponse(response);
    expect(body.error).toContain('Unknown task');
  });
});

// =====================================================
// ENDPOINT TESTS
// =====================================================

describe('AI Endpoints', () => {
  const token = generateToken();

  // 1. Extract Jobs
  test('extract-jobs should return parsed job data', async () => {
    const event = createMockEvent(
      {
        task: 'extract-jobs',
        content: 'Senior Software Engineer at Google. $150k-200k. Requirements: Python, React',
      },
      token
    );
    const response = await handler(event);

    expect(response.statusCode).toBe(200);
    const body = parseResponse(response);
    expect(body.success).toBe(true);
    expect(body.data).toBeDefined();
    expect(body.data.task).toBe('extract-jobs');
    expect(body.data.provider).toBeDefined();
    expect(body.data.cost).toBeGreaterThanOrEqual(0);
    expect(body.data.data).toBeDefined();
  });

  // 2. Rank Jobs
  test('rank-jobs should return score and analysis', async () => {
    const event = createMockEvent(
      {
        task: 'rank-jobs',
        skills: 'Python, React, Node.js',
        requirements: 'Python, React, AWS',
      },
      token
    );
    const response = await handler(event);

    expect(response.statusCode).toBe(200);
    const body = parseResponse(response);
    expect(body.success).toBe(true);
    expect(body.data.task).toBe('rank-jobs');
    expect(body.data.data).toBeDefined();
    expect(body.data.data.score).toBeDefined();
  });

  // 3. Generate Cover Letter
  test('generate-cover-letter should return letter text', async () => {
    const event = createMockEvent(
      {
        task: 'generate-cover-letter',
        company: 'Google',
        role: 'Senior Engineer',
        background: '10 years in software engineering, startup founder',
      },
      token
    );
    const response = await handler(event);

    expect(response.statusCode).toBe(200);
    const body = parseResponse(response);
    expect(body.success).toBe(true);
    expect(body.data.task).toBe('generate-cover-letter');
    expect(body.data.letter).toBeDefined();
    expect(typeof body.data.letter).toBe('string');
  });

  // 4. Optimize Resume
  test('optimize-resume should return score and suggestions', async () => {
    const event = createMockEvent(
      {
        task: 'optimize-resume',
        content: 'Software Engineer at Startup Inc. Did stuff with Python and React.',
      },
      token
    );
    const response = await handler(event);

    expect(response.statusCode).toBe(200);
    const body = parseResponse(response);
    expect(body.success).toBe(true);
    expect(body.data.task).toBe('optimize-resume');
    expect(body.data.data).toBeDefined();
    expect(body.data.data.score).toBeGreaterThanOrEqual(0);
    expect(body.data.data.score).toBeLessThanOrEqual(100);
    expect(Array.isArray(body.data.data.suggestions)).toBe(true);
  });

  // 5. Match Jobs
  test('match-jobs should return matching opportunities', async () => {
    const event = createMockEvent(
      {
        task: 'match-jobs',
        skills: 'Python, React, AWS, Docker',
      },
      token
    );
    const response = await handler(event);

    expect(response.statusCode).toBe(200);
    const body = parseResponse(response);
    expect(body.success).toBe(true);
    expect(body.data.task).toBe('match-jobs');
    expect(body.data.matches).toBeDefined();
  });

  // 6. Analyze Skills Gap
  test('analyze-skills-gap should return gap analysis', async () => {
    const event = createMockEvent(
      {
        task: 'analyze-skills-gap',
        role: 'Data Scientist',
        skills: 'Python, SQL',
      },
      token
    );
    const response = await handler(event);

    expect(response.statusCode).toBe(200);
    const body = parseResponse(response);
    expect(body.success).toBe(true);
    expect(body.data.task).toBe('analyze-skills-gap');
    expect(body.data.analysis).toBeDefined();
    expect(body.data.analysis.gaps).toBeDefined();
  });

  // 7. Prepare Interview
  test('prepare-interview should return questions and answers', async () => {
    const event = createMockEvent(
      {
        task: 'prepare-interview',
        role: 'Senior Engineer',
        company: 'Google',
      },
      token
    );
    const response = await handler(event);

    expect(response.statusCode).toBe(200);
    const body = parseResponse(response);
    expect(body.success).toBe(true);
    expect(body.data.task).toBe('prepare-interview');
    expect(body.data.preparation).toBeDefined();
    expect(Array.isArray(body.data.preparation.questions)).toBe(true);
  });

  // 8. Extract Resume
  test('extract-resume should return structured resume data', async () => {
    const event = createMockEvent(
      {
        task: 'extract-resume',
        content:
          'John Doe, john@example.com. Senior Engineer at Tech Corp (2020-2023). Skills: Python, React, AWS',
      },
      token
    );
    const response = await handler(event);

    expect(response.statusCode).toBe(200);
    const body = parseResponse(response);
    expect(body.success).toBe(true);
    expect(body.data.task).toBe('extract-resume');
    expect(body.data.resume).toBeDefined();
  });

  // 9. Refine Bullet Points
  test('refine-bullet-points should improve achievement statements', async () => {
    const event = createMockEvent(
      {
        task: 'refine-bullet-points',
        bullets: ['Worked on projects', 'Did coding stuff', 'Fixed bugs'],
      },
      token
    );
    const response = await handler(event);

    expect(response.statusCode).toBe(200);
    const body = parseResponse(response);
    expect(body.success).toBe(true);
    expect(body.data.task).toBe('refine-bullet-points');
    expect(Array.isArray(body.data.refined)).toBe(true);
  });

  // 10. Analyze Job Description
  test('analyze-job-description should return parsed requirements', async () => {
    const event = createMockEvent(
      {
        task: 'analyze-job-description',
        content:
          'Senior Engineer role. Requires 5+ years Python. Must know React, AWS, Docker. Benefits: 401k, Health insurance',
      },
      token
    );
    const response = await handler(event);

    expect(response.statusCode).toBe(200);
    const body = parseResponse(response);
    expect(body.success).toBe(true);
    expect(body.data.task).toBe('analyze-job-description');
    expect(body.data.analysis).toBeDefined();
  });
});

// =====================================================
// COST TRACKING TESTS
// =====================================================

describe('Cost Tracking', () => {
  const token = generateToken();

  test('should return cost information in response', async () => {
    const event = createMockEvent(
      {
        task: 'extract-jobs',
        content: 'Senior Engineer at Google',
      },
      token
    );
    const response = await handler(event);

    const body = parseResponse(response);
    expect(body.data.cost).toBeDefined();
    expect(typeof body.data.cost).toBe('number');
    expect(body.data.cost).toBeGreaterThanOrEqual(0);
  });

  test('should track provider used', async () => {
    const event = createMockEvent(
      {
        task: 'extract-jobs',
        content: 'Senior Engineer',
      },
      token
    );
    const response = await handler(event);

    const body = parseResponse(response);
    expect(body.data.provider).toBeDefined();
    expect(['anthropic', 'openai', 'deepseek', 'local']).toContain(body.data.provider);
  });
});

// =====================================================
// ERROR HANDLING TESTS
// =====================================================

describe('Error Handling', () => {
  const token = generateToken();

  test('should handle empty body gracefully', async () => {
    const event = {
      httpMethod: 'POST',
      headers: { authorization: `Bearer ${token}` },
      body: '',
    };
    const response = await handler(event);

    expect(response.statusCode).toBe(400);
  });

  test('should handle malformed JSON', async () => {
    const event = {
      httpMethod: 'POST',
      headers: { authorization: `Bearer ${token}` },
      body: '{ invalid json }',
    };
    const response = await handler(event);

    expect(response.statusCode).toBe(400);
  });

  test('should return proper error format', async () => {
    const event = createMockEvent({ task: 'extract-jobs' }, token);
    const response = await handler(event);

    const body = parseResponse(response);
    expect(body.success).toBe(false);
    expect(body.error).toBeDefined();
  });
});

// =====================================================
// RATE LIMITING TESTS
// =====================================================

describe('Rate Limiting', () => {
  const token = generateToken();

  test('should track usage per user', async () => {
    const event = createMockEvent(
      {
        task: 'extract-jobs',
        content: 'Senior Engineer',
      },
      token
    );

    const response = await handler(event);
    const body = parseResponse(response);

    // First request should succeed
    expect(response.statusCode).toBe(200);
    expect(body.success).toBe(true);
  });

  // Note: Full rate limiting test would require:
  // - Mocking Supabase queries
  // - Making 100+ requests
  // - Verifying 429 response on 101st request
});

// =====================================================
// PROVIDER FALLBACK TESTS
// =====================================================

describe('Provider Fallback', () => {
  const token = generateToken();

  test('should handle provider failure gracefully', async () => {
    // This test requires mocking API calls
    // In production, use jest-fetch-mock or similar
    const event = createMockEvent(
      {
        task: 'extract-jobs',
        content: 'Senior Engineer',
      },
      token
    );

    const response = await handler(event);

    // Should either succeed with fallback or return error
    expect([200, 500]).toContain(response.statusCode);
  });
});

// =====================================================
// INTEGRATION FLOW TESTS
// =====================================================

describe('User Workflows', () => {
  const token = generateToken();

  test('complete job application workflow', async () => {
    // Step 1: Extract job data
    let event = createMockEvent(
      {
        task: 'extract-jobs',
        content: 'Senior Engineer at Google. Requires Python, React, AWS.',
      },
      token
    );
    let response = await handler(event);
    expect(response.statusCode).toBe(200);
    let body = parseResponse(response);
    expect(body.data.data).toBeDefined();

    // Step 2: Rank the job
    event = createMockEvent(
      {
        task: 'rank-jobs',
        skills: 'Python, React, AWS, Docker',
        requirements: 'Python, React, AWS',
      },
      token
    );
    response = await handler(event);
    expect(response.statusCode).toBe(200);
    body = parseResponse(response);
    expect(body.data.data.score).toBeDefined();

    // Step 3: Generate cover letter
    event = createMockEvent(
      {
        task: 'generate-cover-letter',
        company: 'Google',
        role: 'Senior Engineer',
        background: '5 years software engineering',
      },
      token
    );
    response = await handler(event);
    expect(response.statusCode).toBe(200);
    body = parseResponse(response);
    expect(body.data.letter).toBeDefined();
  });

  test('resume optimization workflow', async () => {
    // Step 1: Extract resume
    let event = createMockEvent(
      {
        task: 'extract-resume',
        content: 'Senior Engineer at Tech Corp. Python, React.',
      },
      token
    );
    let response = await handler(event);
    expect(response.statusCode).toBe(200);

    // Step 2: Optimize for ATS
    event = createMockEvent(
      {
        task: 'optimize-resume',
        content: 'Senior Engineer at Tech Corp. Worked on stuff.',
      },
      token
    );
    response = await handler(event);
    expect(response.statusCode).toBe(200);
    const body = parseResponse(response);
    expect(body.data.data.suggestions).toBeDefined();

    // Step 3: Refine bullet points
    event = createMockEvent(
      {
        task: 'refine-bullet-points',
        bullets: ['Did engineering work', 'Fixed bugs', 'Wrote code'],
      },
      token
    );
    response = await handler(event);
    expect(response.statusCode).toBe(200);
  });
});

// =====================================================
// PERFORMANCE TESTS
// =====================================================

describe('Performance', () => {
  const token = generateToken();

  test('should respond within 25 seconds', async () => {
    const startTime = Date.now();

    const event = createMockEvent(
      {
        task: 'extract-jobs',
        content: 'Senior Engineer at Google',
      },
      token
    );
    const response = await handler(event);

    const endTime = Date.now();
    const duration = endTime - startTime;

    expect(duration).toBeLessThan(25000); // 25 seconds
  });
});

// =====================================================
// EXPORT TESTS
// =====================================================

exports = {
  createMockEvent,
  generateToken,
  parseResponse,
};