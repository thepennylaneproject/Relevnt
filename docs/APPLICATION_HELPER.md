# Application Question Helper API

## Overview
The Application Question Helper module allows the frontend to request AI-generated answers for job application questions. It is designed to be safe (avoiding hallucinations), context-aware (using resume and job descriptions), and cost-effective (adhering to tier limits).

## Endpoint
`POST /.netlify/functions/application_helper`

**Auth Required**: usage of Supabase JWT in `Authorization` header (`Bearer <token>`).

### Request Body
```json
{
  "question": "What is your biggest weakness?",
  "mode": "concise", // optional: "default" | "concise" | "confident" | "metrics" | "values"
  "roleTitle": "Software Engineer", // optional
  "companyName": "Acme Inc", // optional
  "jobDescription": "Must know React...", // optional
  "resumeContext": "I have 5 years of experience...", // optional
  "personaId": "uuid-..." // optional, used for tracking analytics
}
```

### Response
```json
{
  "ok": true,
  "output": {
    "answer": "My biggest weakness is serving the user too well...",
    "bullet_points": ["Focus on quality", "User empathy"],
    "follow_up_questions": ["How do you handle deadlines?"],
    "warnings": []
  },
  "trace_id": "uuid",
  "provider": "openai",
  "model": "gpt-4o",
  "cache_hit": false
}
```

## AI Task Specification
The task `application_question_answer` is used.
- **Safety**: High. Instructions explicitly forbid inventing facts not present in `resumeContext`.
- **Quality**: 'standard' by default. High tier users get high quality if available/configured.
- **Caching**: 10 minutes TTL.

## Integration
The frontend component `ApplicationQuestionHelper` handles the interaction. It is embedded in the `ApplicationsPage`.

## Testing
Run unit tests via:
```bash
npm test netlify/functions/__tests__/application_helper.test.ts
```
