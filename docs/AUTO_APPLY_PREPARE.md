
# Auto-Apply Preparation Stage

This document describes the "Preparation" stage of the Auto-Apply system, where job applications are processed to generate necessary artifacts (resumes, cover letters) before submission.

## Overview

The preparation worker (`netlify/functions/auto_apply/prepare.ts`) transforms a `pending` queue item into a ready-to-submit application by leveraging the AI engine.

## Workflow

1.  **Trigger**:
    -   Scheduled cron job (e.g., every 10 minutes).
    -   Manual admin trigger via `POST /.netlify/functions/auto_apply_prepare`.

2.  **Input**:
    -   `pending` items from `auto_apply_queue`.
    -   Data sources: `jobs`, `user_personas`, `resumes`, `profiles`.

3.  **Process**:
    -   **Data Gathering**: Fetches full resume details (experience, education, skills) and job description.
    -   **AI Generation**:
        -   **Keyword Extraction**: Identifies key terms from the JD.
        -   **Targeted Highlights**: Selects relevant resume achievements.
        -   **Cover Letter**: Generates a tailored letter using User Persona and Resume context.
    -   **Validation**: Checks for hallucinations, length constraints, and presence of placeholders.

4.  **Output**:
    -   **Artifacts**: Saved to `job_application_artifacts`.
    -   **Queue Status**:
        -   `ready_to_submit`: All artifacts generated and validated.
        -   `requires_review`: AI failed, validation failed, or confidence low.
    -   **Logs**: Detailed execution info in `auto_apply_logs`.

## Safety & Heuristics

The system applies the following checks before marking an application as `ready_to_submit`:
-   **No Hallucinations**: Ensures no leftover placeholders (e.g., `[Company Name]`) exist in generated text.
-   **Company Match**: Verifies the cover letter mentions the correct company name.
-   **Length limits**: Rejects overly short or long generated content.
-   **Data Consistency**: Uses strictly the provided resume data for factual claims.

## Cost Management

-   Limit processing to batches (e.g., 5 items/run).
-   Respect User Tier via `runAI` (quality clamping).
