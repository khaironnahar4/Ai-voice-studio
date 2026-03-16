# Vocera AI — Technical Documentation

> **Scope:** Database architecture, schema design, indexing strategy, and engineering decisions.  
> **Audience:** The project author (future reference) and any future contributors.  
> **Status:** Living document — update this file alongside every schema migration.

---

## Table of Contents

1. [Technology Choices](#1-technology-choices)
2. [Schema Overview](#2-schema-overview)
3. [Domain 1 — Identity & Authentication](#3-domain-1--identity--authentication)
4. [Domain 2 — ElevenLabs API Sync](#4-domain-2--elevenlabs-api-sync)
5. [Domain 3 — Voice Catalog](#5-domain-3--voice-catalog)
6. [Domain 4 — TTS Engine](#6-domain-4--tts-engine)
7. [Domain 5 — Job Queue](#7-domain-5--job-queue)
8. [Domain 6 — Rate Limiting](#8-domain-6--rate-limiting)
9. [Domain 7 — Billing](#9-domain-7--billing)
10. [Domain 8 — Analytics & Request Cache](#10-domain-8--analytics--request-cache)
11. [Enums Reference](#11-enums-reference)
12. [Indexing Strategy](#12-indexing-strategy)
13. [Raw SQL Constraints](#13-raw-sql-constraints)
14. [Data Retention & Cleanup Policy](#14-data-retention--cleanup-policy)
15. [Scaling Notes](#15-scaling-notes)
16. [Change Log](#16-change-log)

---

## 1. Technology Choices

| Concern | Choice | Rationale |
|---|---|---|
| **Database** | PostgreSQL (Neon) | Serverless scaling, branching for dev/staging, first-class Prisma support |
| **ORM** | Prisma | Type-safe queries, auto-generated client, clean migration workflow |
| **Auth** | BetterAuth | Drop-in OAuth + password auth; generates `user`, `session`, `account`, `verification` tables |
| **TTS Provider** | ElevenLabs | Best-in-class voice quality, large voice library, multilingual support |
| **Storage** | Cloudflare R2 / AWS S3 | Binary audio files kept out of Postgres; DB stores only metadata and signed URL references |
| **Cache hot-path** | Redis (Upstash) | Sub-millisecond rate-limit enforcement; DB is the durable audit layer, not the hot counter |
| **Job queue** | BullMQ / pg-boss | Async TTS generation decoupled from HTTP request lifecycle |

---

## 2. Schema Overview

The database has **18 tables** organized into 8 functional domains. The diagram below shows the high-level relationships between domains.

```
┌─────────────────────────────────────────────────────────────────┐
│                     IDENTITY & AUTH                             │
│   user ◄─── session                                             │
│   user ◄─── account                                             │
│             verification                                        │
└───────────────────────────┬─────────────────────────────────────┘
                            │ user.id (FK hub — all domains ref user)
         ┌──────────────────┼───────────────────────────────────┐
         │                  │                                   │
         ▼                  ▼                                   ▼
┌────────────────┐ ┌─────────────────────┐ ┌───────────────────────┐
│  TTS ENGINE    │ │     BILLING         │ │    JOB QUEUE          │
│  tts_request   │ │  plan               │ │    job                │
│  audio_file    │ │  subscription       │ └───────────────────────┘
└───────┬────────┘ │  invoice            │
        │          │  invoice_item       │
        │          └─────────────────────┘
        │
        ▼
┌──────────────────────────────────┐
│          VOICE CATALOG           │
│  language ◄─── voice_model       │
│               voice_model ◄──────┼──── el_speech_model
└──────────────────────────────────┘       (EL API SYNC domain)

┌──────────────────────┐   ┌──────────────────────┐
│    RATE LIMITING     │   │  ANALYTICS & CACHE   │
│  rate_limit_rule     │   │  usage_analytics     │
│  rate_limit_event    │   │  request_cache       │
└──────────────────────┘   └──────────────────────┘
```

---

## 3. Domain 1 — Identity & Authentication

These tables are managed by **BetterAuth**. Do not hand-edit unless you know exactly what BetterAuth expects.

### `user`

Central account table. Every other domain references `user.id`.

| Column | Type | Notes |
|---|---|---|
| `id` | `String` (CUID) | Primary key — BetterAuth generates this |
| `email` | `String` | Unique; used as login identifier |
| `emailVerified` | `Boolean` | Set to `true` after email verification flow |
| `image` | `String?` | Avatar URL (OAuth providers) |
| `role` | `String?` | Reserved for RBAC (`admin`, `moderator`, etc.) |
| `banned` | `Boolean?` | Account ban flag |
| `banReason` | `String?` | Human-readable ban reason |
| `banExpires` | `DateTime?` | `NULL` = permanent ban |

**Design note:** `deletedAt` is intentionally absent from this model. GDPR-compliant soft-delete should be added as a future migration when a data deletion workflow is implemented. Currently, hard-deleting a user cascades to all owned data via `onDelete: Cascade` on all FK relations.

---

### `session`

One row per active user session. BetterAuth manages session lifecycle.

| Column | Notes |
|---|---|
| `token` | Unique session token stored in the cookie |
| `ipAddress` | Logged for security audit purposes |
| `userAgent` | Browser/client fingerprint |
| `impersonateBy` | Admin impersonation support — stores the impersonating admin's ID |
| `expiresAt` | Session expiry; BetterAuth rotates tokens on activity |

---

### `account`

Stores OAuth provider credentials and password hashes. A single user may have multiple accounts (Google + GitHub + email/password).

| Column | Notes |
|---|---|
| `providerId` | `"google"`, `"github"`, `"credential"` (password), etc. |
| `accountId` | The user's ID within that provider's system |
| `password` | Bcrypt hash — only set for `credential` provider; `NULL` for OAuth |
| `accessToken` / `refreshToken` | OAuth tokens for provider API calls |

---

### `verification`

One-time token storage for email verification and password-reset flows.

| Column | Notes |
|---|---|
| `identifier` | The email address or user ID being verified |
| `value` | The verification token (hashed recommended) |
| `expiresAt` | Tokens are short-lived (15–60 minutes) |

---

## 4. Domain 2 — ElevenLabs API Sync

These tables mirror data from the ElevenLabs API into the local database. This prevents rate-limit exposure on every page render and enables offline catalog browsing.

### `el_speech_models`

A local mirror of the ElevenLabs model catalog, synced daily via `GET /v1/models`.

| Column | Notes |
|---|---|
| `elModelId` | EL's model string: `eleven_v3`, `eleven_flash_v2_5`, `eleven_multilingual_v2` |
| `canDoTts` | Some EL models are for voice conversion only — this filters them |
| `supportedLanguages` | `String[]` of ISO 639-1 codes |
| `maxCharactersPerRequest` | 5,000 (v3) / 10,000 (v2) / 40,000 (flash) — enforced before submission |
| `isFlash` | Flash models have ~75ms latency, ideal for real-time |
| `isDeprecated` | Set `true` for `monolingual_v1`, `turbo_v2`, etc. — hide from UI |
| `tokenCostFactor` | Relative cost multiplier from EL pricing page; used for cost estimation |
| `lastSyncedAt` | Updated every sync run |

**Sync strategy:** On each daily cron run, upsert all models by `elModelId`. Set `isActive = false` for any model not returned by the API (soft deprecation). Never hard-delete rows — historical TTS requests reference these.

---

### `el_usage_sync`

Append-only snapshot of the ElevenLabs account character usage, polled hourly via `GET /v1/user/subscription`.

| Column | Notes |
|---|---|
| `charactersUsed` | Cumulative characters consumed this billing period |
| `characterLimit` | Total allowed characters per the EL plan |
| `charactersRemaining` | Pre-computed: `characterLimit - charactersUsed` (avoids runtime subtraction) |
| `elPlanTier` | EL internal plan: `free`, `starter`, `creator`, `pro`, `enterprise` |
| `rawResponse` | Full JSON from EL API — stored for debugging if computed values diverge |

**Why append-only?** Rows are never updated. This preserves a full hourly time series for trend analysis, alerting (e.g., "80% of character quota consumed"), and historical debugging. Prune rows older than 90 days via scheduled job.

---

### `el_voice_sync_log`

An audit trail for every sync operation against the EL voice library.

| Column | Notes |
|---|---|
| `syncType` | `full` (rebuild all), `incremental` (since last sync), `single_voice` (on-demand) |
| `status` | `running` → `completed` / `failed` / `partial` |
| `voicesFetched` / `voicesAdded` / `voicesUpdated` / `voicesDeactivated` | Diff counters per run |
| `durationMs` | Performance tracking |
| `errorMessage` | Populated on failure for post-mortem |

---

## 5. Domain 3 — Voice Catalog

### `languages`

Reference table seeded at migration. Maps BCP-47 language codes to display names.

| Column | Notes |
|---|---|
| `code` | BCP-47: `en`, `en-US`, `fr`, `bn`, `de`, etc. Unique. |
| `nativeName` | Rendered in locale-native script (e.g., `বাংলা` for Bengali) |
| `isActive` | Set `false` to hide unsupported languages from the UI |

**Seeding:** Populate from the ElevenLabs supported languages list. Add new rows when EL adds support for new languages.

---

### `voice_models`

The central voice persona catalog. Synced daily from `GET /v1/voices`.

| Column | Notes |
|---|---|
| `slug` | URL-safe unique identifier: `rachel-american-english`. Used in routes. |
| `provider` | Always `"elevenlabs"` currently. Future-proofed for multi-provider. |
| `providerVoiceId` | EL's `voice_id` (same as `elVoiceId`). Composite unique with `provider`. |
| `elVoiceId` | EL `voice_id` used in all API calls. Kept as a top-level field for fast lookup. |
| `elCategory` | `premade` / `cloned` / `generated` / `professional` / `community` |
| `elLabels` | Freeform metadata JSON from EL: `{ age, accent, description, gender, use_case }` |
| `elAvailableForTiers` | `["free", "starter", "creator"]` — controls voice access by plan |
| `elVerifiedLanguages` | `[{ language_id, model_id }]` — EL verified language+model combos for this voice |
| `elHighQualityModelIds` | Which EL speech models produce best output for this voice |
| `elFineTuningStatus` | Relevant for cloned/professional voices: `fine_tuned`, `fine_tuning`, etc. |
| `elSafetyControl` | EL abuse flag: `NONE` / `BAN` / `CAPTCHA` / `ENTERPRISE_BAN` |
| `isPremium` | If `true`, voice is only accessible on paid plans (`hasPremiumVoices = true`) |
| `styleTags` | Internal tagging: `["conversational", "narration", "news"]` — for filtering |
| `sampleAudioUrl` | Self-hosted sample (uploaded to R2). Different from `elPreviewUrl`. |
| `elPreviewUrl` | EL-hosted preview URL. Can embed directly at no character cost. |
| `sortOrder` | Controls display order in the voice picker UI |

**Key constraint:** `@@unique([provider, providerVoiceId])` prevents duplicate voices across providers. The separate `elVoiceId @unique` index exists for fast API-path lookups without specifying the provider.

---

## 6. Domain 4 — TTS Engine

The core operational domain. Processes user text-to-speech requests from submission to audio delivery.

### `tts_requests`

One row per user TTS submission. This is the highest-volume table and the primary workload driver.

**Request lifecycle:**
```
pending → queued → processing → completed
                              ↘ failed (retryable)
                  cancelled (user-initiated)
```

| Column | Notes |
|---|---|
| `inputText` | Raw submitted text. Stored for audit and cache lookup. |
| `inputTextHash` | `SHA-256(inputText + elVoiceId + elModelId + languageCode + outputFormat)` — cache key |
| `charCount` | Character count. Checked against plan quota before accepting the request. |
| `wordCount` | Optional — for analytics and display |
| `priority` | Higher = sooner. Default `0`. Paid plans may receive elevated priority. |
| `outputFormat` | EL format string: `mp3_44100_128`, `wav`, `ogg`, `flac` |
| `stability` | `0.0–1.0`. Low = expressive/emotional; High = consistent/neutral |
| `similarityBoost` | `0.0–1.0`. How closely to match the voice's original characteristics |
| `style` | `0.0–1.0`. Exaggeration of speaking style |
| `useSpeakerBoost` | Boosts clarity. Adds ~50ms latency. Recommended for clean output. |
| `seed` | Pass an integer for deterministic generation. `NULL` = random. |
| `applyTextNormalization` | `auto` / `on` / `off`. Controls EL's number/abbreviation expansion. |
| `servedFromCache` | `TRUE` = returned from `request_cache`; no EL API call was made |
| `retryCount` | Incremented by the worker on each retry. Capped by `job.maxAttempts`. |
| `options` | JSONB escape hatch for provider-specific overrides not yet in schema |

**Scaling note:** At high volume, consider range-partitioning this table by `created_at` (monthly). Prisma does not manage partitioning — apply via raw SQL migration.

---

### `audio_files`

Metadata record for each generated audio file. The binary audio data lives in **Cloudflare R2 / S3** — this table holds the reference.

| Column | Notes |
|---|---|
| `requestId` | `@unique` — one audio file per TTS request |
| `userId` | Denormalized for fast `user → audio library` queries without a JOIN through `tts_requests` |
| `storageBucket` | R2/S3 bucket name |
| `storageKey` | Object path: `audio/{userId}/{YYYY/MM}/{requestId}.mp3` |
| `cdnUrl` | CDN-fronted permanent URL. Only set for public files. |
| `signedUrl` | Pre-signed temporary URL (15-min TTL). Regenerated on expiry by cron job. |
| `signedUrlExpiresAt` | Used by `REFRESH_SIGNED_URLS` cleanup job to find stale URLs |
| `checksumMd5` | Integrity check. Populated from S3/R2 ETag on upload. |
| `elRequestId` | EL's `xi-request-id` response header. Critical for filing support tickets with EL. |
| `elCharacterCost` | Actual characters billed by EL (may differ from `tts_requests.charCount` after text normalization) |
| `elModelUsed` | Denormalized EL model string — protects audit queries if the `el_speech_models` row changes |
| `elVoiceIdUsed` | Denormalized EL voice ID — preserves history if `voice_models` row is updated/deleted |
| `deletedAt` | Soft delete. The S3 object is purged 30 days later by a cleanup job. |

**Why denormalize `userId`?** Fetching a user's audio library (`SELECT * FROM audio_files WHERE user_id = $1`) is an extremely frequent query. Adding a JOIN through `tts_requests` on every list call is unnecessary overhead. The slight data redundancy is an intentional trade-off.

---

## 7. Domain 5 — Job Queue

### `job`

A durable, database-backed audit trail for all background jobs. Complements the actual queue backend (BullMQ / pg-boss) which manages scheduling and worker dispatch.

This table is the **source of truth** for job history and debugging — the queue backend's own storage is considered ephemeral.

| Column | Notes |
|---|---|
| `queueName` | Logical queue: `tts.generate`, `tts.export`, `email.send`, `sync.voices`, `cleanup` |
| `jobType` | Semantic type: `GENERATE_AUDIO`, `SEND_EMAIL`, `SYNC_VOICES`, `REFRESH_SIGNED_URLS` |
| `requestId` | FK to `tts_requests` — `NULL` for non-TTS jobs |
| `userId` | FK to `user` — `NULL` for system-level jobs (sync, cleanup) |
| `payload` | Input data passed to the worker function |
| `status` | `waiting → active → completed / failed / delayed / cancelled` |
| `priority` | Higher priority jobs are dequeued first within the same queue |
| `attempts` | Current retry count |
| `maxAttempts` | Default 3. Configure per job type. |
| `workerId` | Identity of the worker process (hostname + PID) — useful for diagnosing stuck jobs |
| `scheduledFor` | For deferred/cron jobs — the scheduled execution timestamp |
| `result` | Worker output on success: `{ audioFileId, durationMs }` |
| `error` | Structured error on failure: `{ message, stack, code }` |

**Composite index `idx_jobs_queue_status_priority`** on `(queue_name, status, priority)` is the worker dequeue index — the most performance-sensitive query in this domain.

---

## 8. Domain 6 — Rate Limiting

### `rate_limit_rules`

Policy definitions. Seeded at migration; editable by admins at runtime.

| Column | Notes |
|---|---|
| `scope` | `user` / `role` / `plan` / `global` — determines how the rule is matched |
| `scopeId` | The specific plan slug or role name this rule applies to. `NULL` for `global`. |
| `resource` | What is being throttled: `tts_request`, `api_call`, `audio_download` |
| `maxRequests` | Maximum allowed requests within `windowSeconds` |
| `windowSeconds` | Rolling window: `60` (per minute), `3600` (per hour), `86400` (per day) |
| `burstAllowance` | Extra requests allowed momentarily above `maxRequests` before blocking |

**Rule resolution order:** `user` > `role` > `plan` > `global`. The most specific matching rule wins.

---

### `rate_limit_events`

Rolling audit log of rate-limit enforcement events. The hot-path counter lives in **Redis**; this table is the durable audit layer.

| Column | Notes |
|---|---|
| `requestCount` | Number of requests counted in this event row |
| `windowStart` / `windowEnd` | The time window this event covers |
| `blockedAt` | Populated when this event triggered a `429 Too Many Requests` response |
| `ipAddress` | Logged for IP-based abuse detection |

**Retention:** Rows are purged after **7 days** by a scheduled cleanup job. This table is append-heavy — do not add unnecessary indexes.

---

## 9. Domain 7 — Billing

### `plans`

Local mirror of Stripe pricing configuration. The UI reads this table; Stripe is the payment processor.

| Column | Notes |
|---|---|
| `slug` | Machine-readable identifier: `free`, `pro`, `business`, `enterprise` |
| `priceMonthly` / `priceYearly` | Stored in cents (USD). `0` = free tier. |
| `charLimitMonthly` | Monthly character quota. `NULL` = unlimited. |
| `requestLimitMonthly` | Monthly TTS request cap. `NULL` = unlimited. |
| `storageLimitMb` | Audio storage quota in MB. `NULL` = unlimited. |
| `maxFileDurationSec` | Maximum audio length per single request in seconds |
| `concurrentJobs` | Max parallel background jobs this plan permits |
| `hasPremiumVoices` | Whether this plan unlocks `voice_models.isPremium = true` voices |
| `hasApiAccess` | Whether this plan allows programmatic API key usage |
| `features` | Freeform JSONB for feature flags not yet formalized in columns |
| `stripeMonthlyPriceId` / `stripeYearlyPriceId` | Stripe Price IDs for checkout and subscription creation |

---

### `subscriptions`

One row per user subscription. A user may have multiple historical subscriptions (past-due, cancelled, expired), but only **one** `active` or `trialing` subscription at a time — enforced by a raw SQL partial unique index.

| Column | Notes |
|---|---|
| `billingCycle` | `monthly` or `yearly` |
| `currentPeriodStart` / `currentPeriodEnd` | Billing period. Updated by Stripe webhook on renewal. |
| `trialEndsAt` | `NULL` = no trial for this subscription |
| `cancelledAt` | Set when user cancels (subscription remains `active` until `currentPeriodEnd`) |
| `stripeSubscriptionId` | For webhook reconciliation |
| `stripeCustomerId` | Denormalized for Stripe Customer Portal session creation without JOIN |
| `metadata` | Freeform JSONB for promo codes, referral tracking, etc. |

**Constraint (apply via raw SQL after migration):**
```sql
CREATE UNIQUE INDEX uq_subscriptions_user_active
  ON subscriptions (user_id)
  WHERE status IN ('active', 'trialing');
```

---

### `invoices`

One invoice per billing period per subscription. Synced from Stripe webhooks.

| Column | Notes |
|---|---|
| `userId` | Denormalized for fast user invoice listing without joining through `subscriptions` |
| `amountCents` | Total invoice amount in cents |
| `currency` | ISO 4217: `USD`, `EUR`, etc. Stored as `CHAR(3)`. |
| `paidAt` | Timestamp of successful payment |
| `stripeInvoiceId` | For reconciliation with Stripe dashboard |
| `pdfUrl` | URL to Stripe-generated invoice PDF (linked in billing UI) |

**Status flow:** `draft → open → paid` (happy path) or `open → void / uncollectible` (failure path).

---

### `invoice_items`

Line items within an invoice. Supports overage billing and add-ons alongside the base plan charge.

| Column | Notes |
|---|---|
| `description` | Human-readable: `"Pro Plan — Monthly"`, `"Character Overage (50k chars)"` |
| `type` | `plan` / `overage` / `addon` / `credit` / `tax` |
| `unitPriceCents` | Price per unit in cents |
| `totalCents` | `quantity × unitPriceCents` — pre-computed for fast invoice total rendering |

---

## 10. Domain 8 — Analytics & Request Cache

### `usage_analytics`

Aggregated daily usage metrics, one row per `(user, date)`. Written by a background summarizer job that rolls up completed `tts_requests` each night.

| Column | Notes |
|---|---|
| `planId` | The plan active on this date — enables historical plan tracking even after upgrades |
| `requestCount` | Total submissions (all statuses) |
| `completedCount` / `failedCount` / `cachedCount` | Status breakdown |
| `totalChars` | Sum of `tts_requests.charCount` for the day |
| `totalDurationSec` | Sum of generated audio duration (seconds) |
| `totalFileSizeBytes` | Sum of audio file sizes stored |
| `apiCalls` | Actual EL API calls made (excludes cached requests) |
| `rateLimitHits` | Number of `429` responses received by this user on this date |

**Unique constraint:** `@@unique([userId, date])` — allows `INSERT ... ON CONFLICT DO UPDATE` (upsert) for idempotent summarizer runs.

---

### `request_cache`

Deduplication cache for TTS requests. Prevents redundant ElevenLabs API calls when a user submits identical synthesis parameters.

**Cache key formula:**
```
SHA-256(inputText + elVoiceId + elModelId + languageCode + outputFormat)
```

| Column | Notes |
|---|---|
| `cacheKey` | The SHA-256 hash. `CHAR(64)`. Unique. |
| `audioFileId` | FK to the cached `audio_files` row — the result to serve on a cache hit |
| `voiceModelId` | FK for cache management (invalidate if voice settings change) |
| `hitCount` | Incremented on every cache hit — used for cache value analysis |
| `lastHitAt` | Timestamp of the most recent hit — used for LRU eviction logic |
| `expiresAt` | `NULL` = permanent cache. Set a timestamp for volatile or trial content. |

**Cache hit flow:**
1. Compute `cache_key` from request parameters
2. `SELECT * FROM request_cache WHERE cache_key = $1 AND (expires_at IS NULL OR expires_at > NOW())`
3. If hit: return `audio_files.signed_url` directly; set `tts_requests.served_from_cache = true`
4. If miss: dispatch job to EL API, insert result into both `audio_files` and `request_cache`

---

## 11. Enums Reference

### `RequestStatus`
| Value | Meaning |
|---|---|
| `pending` | Submitted by user; not yet queued |
| `queued` | Accepted into the job queue |
| `processing` | Worker is actively calling EL API |
| `completed` | Audio file generated and uploaded to storage |
| `failed` | All retry attempts exhausted |
| `cancelled` | User or admin cancelled before completion |

### `JobStatus`
| Value | Meaning |
|---|---|
| `waiting` | Job created; not yet picked up by a worker |
| `active` | Worker is executing the job |
| `completed` | Job finished successfully |
| `failed` | Job exhausted all attempts |
| `delayed` | Scheduled for future execution |
| `cancelled` | Removed before execution |

### `SubscriptionStatus`
| Value | Meaning |
|---|---|
| `active` | Subscription is current and paid |
| `trialing` | Within a free trial period |
| `past_due` | Payment failed; grace period active |
| `cancelled` | User cancelled; access until period end |
| `expired` | Subscription has fully lapsed |

### `InvoiceStatus`
| Value | Meaning |
|---|---|
| `draft` | Created but not yet finalized |
| `open` | Sent to customer; awaiting payment |
| `paid` | Payment collected successfully |
| `void` | Invoice voided (e.g., on subscription change) |
| `uncollectible` | Marked as bad debt |

---

## 12. Indexing Strategy

### Philosophy
- Every foreign key column has an index (Prisma does not create these automatically unlike some ORMs).
- Composite indexes are ordered by **selectivity** (most selective column first) and **query pattern**.
- Avoid over-indexing write-heavy tables (`rate_limit_events`, `el_usage_sync`).

### Critical Indexes

| Table | Index | Query it serves |
|---|---|---|
| `tts_requests` | `(user_id, status)` | User's active/recent request list |
| `tts_requests` | `(input_text_hash)` | Cache lookup before submission |
| `audio_files` | `(user_id)` | User audio library |
| `audio_files` | `(signed_url_expires_at)` | URL refresh cron |
| `audio_files` | `(el_request_id)` | EL support ticket lookup |
| `jobs` | `(queue_name, status, priority)` | Worker dequeue — most critical index |
| `jobs` | `(scheduled_for)` | Delayed job scheduler |
| `request_cache` | `(cache_key)` | Cache hit check — must be sub-ms |
| `request_cache` | `(expires_at)` | Cache eviction cron |
| `rate_limit_events` | `(user_id, rule_id, window_start)` | Rate limit check within window |
| `usage_analytics` | `(user_id, date)` | Dashboard usage graph |
| `subscriptions` | `(stripe_subscription_id)` | Stripe webhook reconciliation |
| `el_usage_sync` | `(synced_at)` | Time-series trend queries |

---

## 13. Raw SQL Constraints

Prisma cannot express these constraints in the schema file. Apply them manually via a raw SQL migration after `prisma migrate deploy`.

```sql
-- 1. One active subscription per user (partial unique index)
CREATE UNIQUE INDEX uq_subscriptions_user_active
  ON subscriptions (user_id)
  WHERE status IN ('active', 'trialing');

-- 2. Voice setting value ranges on tts_requests
ALTER TABLE tts_requests
  ADD CONSTRAINT chk_stability CHECK (stability BETWEEN 0 AND 1),
  ADD CONSTRAINT chk_similarity_boost CHECK (similarity_boost BETWEEN 0 AND 1),
  ADD CONSTRAINT chk_style CHECK (style BETWEEN 0 AND 1);

-- 3. Positive char count
ALTER TABLE tts_requests
  ADD CONSTRAINT chk_char_count CHECK (char_count > 0);

-- 4. Positive file size
ALTER TABLE audio_files
  ADD CONSTRAINT chk_file_size CHECK (file_size_bytes > 0);

-- 5. Non-negative hit count
ALTER TABLE request_cache
  ADD CONSTRAINT chk_hit_count CHECK (hit_count >= 0);
```

Create a migration file for these: `prisma/migrations/YYYYMMDD_raw_constraints.sql`.

---

## 14. Data Retention & Cleanup Policy

| Table | Retention | Cleanup Method |
|---|---|---|
| `rate_limit_events` | 7 days | Scheduled cleanup job: `DELETE WHERE created_at < NOW() - INTERVAL '7 days'` |
| `el_usage_sync` | 90 days | Scheduled cleanup job |
| `el_voice_sync_log` | 30 days | Scheduled cleanup job |
| `audio_files` (soft-deleted) | 30 days after `deleted_at` | `PURGE_DELETED_FILES` job deletes S3 object then hard-deletes row |
| `jobs` (terminal states) | 14 days | Scheduled cleanup job for `completed` / `cancelled` jobs |
| `session` (expired) | Immediate | BetterAuth purges on next auth request |

---

## 15. Scaling Notes

**Partitioning `tts_requests`:**  
At scale (millions of rows), partition this table by `created_at` using monthly range partitioning. This is a raw SQL operation not managed by Prisma.

```sql
-- Example partition structure (PostgreSQL 14+)
CREATE TABLE tts_requests PARTITION BY RANGE (created_at);
CREATE TABLE tts_requests_2025_01 PARTITION OF tts_requests
  FOR VALUES FROM ('2025-01-01') TO ('2025-02-01');
```

**Read replicas:**  
Direct analytics queries (`usage_analytics`, `el_usage_sync`) to a Neon read replica. Prisma supports this via `datasource.url` / `datasource.directUrl` configuration.

**Connection pooling:**  
Neon's serverless driver handles connection pooling. For edge deployments (Vercel Edge Runtime), use `@neondatabase/serverless` directly rather than the Prisma TCP adapter.

**`audio_files` storage key pattern:**  
The pattern `audio/{userId}/{YYYY/MM}/{requestId}.mp3` enables efficient S3 lifecycle rules scoped to a prefix (e.g., purge `audio/{userId}/2024/` when a user deletes their account).

---

## 16. Change Log

| Date | Author | Change |
|---|---|---|
| 2026-03-16 | Initial | Initial schema design — all 8 domains |

