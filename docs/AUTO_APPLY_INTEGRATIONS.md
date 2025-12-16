# Auto-Apply Integrations Roadmap and Compliance

This document outlines the strategy, roadmap, and compliance standards for the "Auto-Apply" feature in Relevnt.

## Core Philosophy

We prioritize **user trust and platform compliance**.
- We **DO NOT** scrape websites against their Terms of Service.
- We **DO** use official APIs where available.
- We **DO** use lightweight automation (e.g., pre-filling forms) only when it is safe, transparent to the user, and compliant.
- If a platform cannot be supported compliantly, we clearly mark it as **Unsupported** and direct the user to apply manually.

## Supported Platforms (Roadmap)

| Platform | Status | Integration Method | Notes |
| :--- | :--- | :--- | :--- |
| **Greenhouse** | *Scaffolding* | URL Parsing + Form Analysis | Identification via `boards.greenhouse.io` or `greenhouse.io`. High consistency in form structure. |
| **Lever** | *Scaffolding* | URL Parsing + Form Analysis | Identification via `jobs.lever.co`. Very consistent API-like form structure. |
| **Workday** | *Experimental* | TBD | **Complex**. Often requires account creation. Identifying `myworkdayjobs.com` is easy, but automating application is hard. May remain manual-only. |
| **LinkedIn** | *Restricted* | Official API Only | We will **NOT** scrape LinkedIn. We will only support "Easy Apply" if an official partner API is available and we have access. Otherwise, manual handoff. |

## Architecture

The integration layer is built as a set of serverless functions in `/netlify/functions/auto_apply/providers/`.

### Provider Interface
Each provider implements a standard `JobApplicationProvider` interface:
- `validate(url)`: Returns true if the provider can handle this URL.
- `extractJobDetails(url)`: (Future) Parsed job description.
- `apply(userProfile, jobDetails)`: (Future) Performs the application or returns application artifacts for the user/browser to use.

## Security & Compliance

1.  **Credentials**: No platform credentials (username/password for job sites) are stored unless explicitly required for an approved API integration (e.g., OAuth).
2.  **Rate Limiting**: All automation must respect platform rate limits to avoid IP bans.
3.  **User Agent**: Requests, if any, will identify themselves honestly, not spoofing browsers to bypass anti-bot protections in a deceptive manner.
4.  **Data Privacy**: User PII is only sent to the specific employer's application form.

## Refusal Strategy

If a URL does not match a supported provider (or matches a banned one), the system returns a `PlatformDetectionResult` of `UNSUPPORTED`.
The UI should then display: "We cannot auto-apply to this site. Please apply manually."
