# Private contributions: installation and review

This section reuses the existing Supabase project, Vercel API host, archive owner allowlist, and owner sign-in session. It creates no new account system and changes no pass, payment, customer or MRA tables.

## Current release posture

Public scene/editor/recorder/attachment review are implemented. Sending is fail-closed until the API health endpoint confirms readiness. No submission is saved by typing, recording or choosing a file. Drafts exist only in page memory. Website and book permissions are unchecked independently and recorded verbatim with version `2026-10-22-v1`.

At implementation time, the existing archive API returned 503 with “Archive storage is unavailable. Confirm the archive schema and private bucket.” No Supabase administrative SQL connection was available in this workspace. Do not infer that a deployed API means storage has been installed.

## Installation in the existing project

1. Review and run `supabase/eyes_private_schema.sql` in the existing Supabase project using authenticated administrative access. This installs `eyes_submissions`, `eyes_rate_limits`, private `eyes-private` storage, atomic begin/finalize functions and restrictive storage policies. It does not publish contributions.
2. Reuse the server-only Supabase URL/key and `ARCHIVE_OWNER_USER_IDS` already used by `/api/archive`. Do not place private keys in browser configuration, source, screenshots or logs.
3. Deploy `/api/eyes` through the existing Vercel project. Leave `EYES_SUBMISSIONS_ENABLED` unset until authenticated owner review and storage policies are tested. Production frontend calls the established Vercel host. Local UI calls its local `/api/eyes`.
4. Confirm unauthenticated database/storage reads are rejected, the bucket is private, the owner can list/download privately, and a clearly labeled test entry can be finalized with all files. Test separate consent flags, invalid signatures, duplicate finalization and failure retry. Remove that identified test row and its objects after verification.
5. Set `EYES_SUBMISSIONS_ENABLED=true` only once storage and owner review pass. `/api/eyes?action=health` must then report `accepting:true`. No frontend source change is necessary to open sending.

## Limits and privacy

- Text: 20,000 characters; context: 3,000; title: 160; credit: 100; private contact: 240.
- Four attachments, each at most 8 MiB. TXT, PDF, JPG, PNG, WebP, MP3, M4A, WAV, OGG and audio WebM. Video is not accepted.
- Recording: at most three minutes or 8 MiB, actual MediaRecorder output, no transcription. The microphone is requested only by Start recording and tracks stop on stop, mode change, close or navigation.
- Uploads use random object paths and temporary signed upload capabilities. Finalization verifies actual sizes/signatures and checksums. Owner-only download links expire after 60 seconds and request attachment download; uploaded content is never injected into a page or published.
- Anonymous is default; private contact is separate from public credit. Identifying details in content/voice/files are not magically removed by anonymous credit.
- Database API access is server-only. An existing owner session and allowlisted owner ID are required for queue listing, downloads and review-status changes. The owner page provides no publish action.
- The capability token is held only in page memory. Finalization is idempotent. Failed saves retain work; an expired 24-hour upload session requires starting a new attempt with the retained work.
- Rate limiting permits five starts per hourly window using a daily keyed hash of the request IP; raw IP is not stored. Review abandoned uploads older than 24 hours and expire rate-limit hashes after 48 hours. Establish operational cleanup before inviting large-scale submissions.
- No malware-scanning service is provisioned. Keep attachments private/download-only; owner review should use normal endpoint protection. Do not render arbitrary attachments as HTML.

## Review

Use existing `/archive/manage/` owner sign-in, then `/my-eyes-your-eyes/review/`. It shows the newest 100 confirmed entries, their supplied attribution, permissions, private contact, text and download controls. Marking reviewed/declined does not publish anything or change consent. Incoming files are never copied to the Git repository.

## Verification boundaries

`node scripts/verify-eyes.cjs` runs offline only. Browser integration uses a separate localhost-only disposable harness outside the repository: it exercises actual MediaRecorder encoding with a synthetic tone, real playback, upload progress, a forced failure and retry, and storage confirmation. This is not evidence that production Supabase is installed or that a physical microphone/iOS keyboard was tested. No real visitor entries or live commerce transactions are created by these checks.
