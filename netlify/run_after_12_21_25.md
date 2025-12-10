Prompt C - Stop the table from “emptying out” faster than it fills

Use this once the above is in place and ingestion is happening regularly.

You are a backend engineer focused on data retention.

I have a jobs table that is losing rows over time because we are deleting or expiring jobs faster than new ones are ingested.

Goal:
	•	Make job expiration sane and tuneable so that:
	•	We do not show obviously dead or old jobs.
	•	We also do not end up with an empty table if ingestion is temporarily slow.

Files to inspect:
	•	Any code that deletes or expires jobs, for example:
	•	netlify/functions/cleanup_jobs.[js|ts]
	•	any scheduled cleanup scripts

Tasks:
	1.	Identify where and how jobs are being deleted or marked expired.
	2.	Replace hard deletes with:
	•	a status field (for example active, expired, hidden) and
	•	a valid_until or expires_at timestamp.
	3.	Update queries used by the app so that:
	•	Users only see active jobs whose valid_until is in the future.
	•	The raw rows remain in the database for a reasonable window so we do not lose historical data instantly.
	4.	Add a small config section at the top of the cleanup script defining:
	•	how long after valid_until we actually hard delete, for example 30 days.
	5.	Log how many jobs are marked expired versus permanently deleted.

Output:
	•	Updated cleanup script.
	•	Any necessary migrations or schema changes for the jobs table.