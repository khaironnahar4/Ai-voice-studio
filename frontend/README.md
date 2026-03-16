# Vocera AI

> **Production-grade Text-to-Speech SaaS platform** powered by ElevenLabs, built with Next.js, PostgreSQL (Neon), and Prisma.

---

## Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Database Architecture](#database-architecture)
- [ElevenLabs Integration](#elevenlabs-integration)
- [Environment Variables](#environment-variables)
- [Getting Started](#getting-started)
- [Database Setup](#database-setup)
- [Background Jobs](#background-jobs)
- [Billing & Subscriptions](#billing--subscriptions)
- [Rate Limiting](#rate-limiting)
- [Caching Strategy](#caching-strategy)
- [Analytics](#analytics)
- [Roadmap](#roadmap)

---

## Overview

Vocera AI is a full-stack SaaS application that allows users to convert text into high-quality, natural-sounding speech using ElevenLabs' voice synthesis API. The platform supports multiple voice personas, languages, output formats, and usage-tiered subscription plans.

**Key capabilities:**

- Text-to-speech synthesis with configurable voice settings (stability, similarity boost, style)
- Curated voice catalog synced daily from ElevenLabs
- Multi-tier subscription plans (Free → Pro → Business → Enterprise) with Stripe billing
- Background job processing for async TTS generation
- Request deduplication via SHA-256 content cache
- Granular rate limiting with Redis hot-path + PostgreSQL audit trail
- Aggregated daily usage analytics per user

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | Next.js (App Router) |
| **Language** | TypeScript |
| **Styling** | Tailwind CSS + shadcn/ui |
| **Database** | PostgreSQL via Neon (serverless) |
| **ORM** | Prisma |
| **Authentication** | BetterAuth |
| **TTS Provider** | ElevenLabs API |
| **File Storage** | Cloudflare R2 / AWS S3 |
| **Job Queue** | BullMQ / pg-boss |
| **Cache (hot-path)** | Redis (Upstash) |
| **Payments** | Stripe |
| **Animations** | GSAP |

---

## Project Structure

```
vocera-ai/
├── app/                    # Next.js App Router
│   ├── (auth)/             # Authentication routes
│   ├── (dashboard)/        # Protected user routes
│   ├── (marketing)/        # Public pages
│   └── api/                # API route handlers
├── components/             # Reusable UI components
├── lib/
│   ├── db/                 # Prisma client + helpers
│   ├── elevenlabs/         # EL API wrapper & sync jobs
│   ├── billing/            # Stripe helpers
│   ├── queue/              # Job queue setup
│   └── rate-limit/         # Rate limiting logic
├── prisma/
│   ├── schema.prisma       # Database schema
│   ├── migrations/         # Migration history
│   └── seed.ts             # Seed data (languages, plans)
└── docs/
    └── DOCUMENTATION.md    # Deep technical documentation
```

---

## Database Architecture

The database is organized into **7 functional domains**:

| Domain | Tables | Purpose |
|---|---|---|
| Identity & Auth | `user`, `session`, `account`, `verification` | User management, OAuth, sessions |
| ElevenLabs Sync | `el_speech_models`, `el_usage_sync`, `el_voice_sync_log` | EL API data mirroring |
| Voice Catalog | `languages`, `voice_models` | Available voices and languages |
| TTS Engine | `tts_requests`, `audio_files` | Core workload and storage metadata |
| Job Queue | `jobs` | Async background job tracking |
| Rate Limiting | `rate_limit_rules`, `rate_limit_events` | Throttling policy & audit |
| Billing | `plans`, `subscriptions`, `invoices`, `invoice_items` | SaaS subscription system |
| Analytics & Cache | `usage_analytics`, `request_cache` | Aggregated metrics & deduplication |

> See [`DOCUMENTATION.md`](./docs/DOCUMENTATION.md) for the full schema breakdown with entity-relationship diagrams, indexing strategy, and design decisions.

---

## ElevenLabs Integration

Vocera AI integrates with ElevenLabs at three sync levels:

**1. Model Catalog Sync** — Daily cron via `GET /v1/models`
Populates `el_speech_models` with supported TTS models, character limits, and cost factors.

**2. Voice Library Sync** — Daily cron via `GET /v1/voices`
Full or incremental sync into `voice_models`. Each run is logged in `el_voice_sync_log`.

**3. Usage Snapshot** — Hourly cron via `GET /v1/user/subscription`
Appends a snapshot to `el_usage_sync` for trend analysis and overage alerting.

---

## Environment Variables

Create a `.env.local` file at the project root:

```env
# Database (Neon)
DATABASE_URL="postgresql://..."

# BetterAuth
BETTER_AUTH_SECRET="..."
BETTER_AUTH_URL="http://localhost:3000"

# ElevenLabs
ELEVENLABS_API_KEY="..."

# Stripe
STRIPE_SECRET_KEY="sk_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# Storage (Cloudflare R2)
R2_ACCOUNT_ID="..."
R2_ACCESS_KEY_ID="..."
R2_SECRET_ACCESS_KEY="..."
R2_BUCKET_NAME="vocera-audio"
R2_PUBLIC_URL="https://..."

# Redis (Upstash)
UPSTASH_REDIS_URL="..."
UPSTASH_REDIS_TOKEN="..."
```

---

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm (recommended)
- A Neon PostgreSQL database
- ElevenLabs API key
- Stripe account (for billing)

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/vocera-ai.git
cd vocera-ai

# Install dependencies
pnpm install
```

---

## Database Setup

```bash
# Generate Prisma client
pnpm prisma generate

# Push schema to Neon (development)
pnpm prisma db push

# Run production migrations
pnpm prisma migrate deploy

# Apply manual SQL constraints (run after first migration)
# See docs/DOCUMENTATION.md → "Raw SQL Constraints" section

# Seed reference data (languages, plans)
pnpm prisma db seed
```

---

## Background Jobs

Vocera AI uses a durable job queue for async processing. All jobs are tracked in the `jobs` table regardless of the queue backend (BullMQ / pg-boss).

| Queue | Job Type | Trigger |
|---|---|---|
| `tts.generate` | `GENERATE_AUDIO` | User TTS submission |
| `tts.export` | `EXPORT_AUDIO` | Batch export request |
| `email.send` | `SEND_EMAIL` | Auth events, billing alerts |
| `sync.voices` | `SYNC_VOICES` | Daily EL voice sync cron |
| `sync.usage` | `SYNC_EL_USAGE` | Hourly EL usage snapshot |
| `cleanup` | `REFRESH_SIGNED_URLS` | Nightly URL refresh cron |
| `cleanup` | `PURGE_DELETED_FILES` | 30-day soft-delete purge |

---

## Billing & Subscriptions

Billing is powered by **Stripe** with a local plan configuration in the `plans` table.

**Plan tiers:**

| Plan | Characters/month | API Access | Premium Voices | Concurrent Jobs |
|---|---|---|---|---|
| Free | Limited | ✗ | ✗ | 1 |
| Pro | Higher quota | ✗ | ✓ | 3 |
| Business | Even higher | ✓ | ✓ | 10 |
| Enterprise | Unlimited | ✓ | ✓ | Unlimited |

A partial unique index enforces one active subscription per user:
```sql
CREATE UNIQUE INDEX uq_subscriptions_user_active
  ON subscriptions (user_id)
  WHERE status IN ('active', 'trialing');
```

---

## Rate Limiting

Rate limiting operates on two layers:

- **Hot path:** Redis sliding window counters (sub-millisecond enforcement)
- **Audit trail:** PostgreSQL `rate_limit_events` table (7-day retention, purged by cron)

Rules are defined per `scope` (`user` | `role` | `plan` | `global`) and `resource` (`tts_request` | `api_call` | `audio_download`) in `rate_limit_rules`.

---

## Caching Strategy

TTS requests are deduplicated using a SHA-256 content hash:

```
cache_key = SHA-256(inputText + elVoiceId + elModelId + languageCode + outputFormat)
```

On a **cache hit**, the existing `AudioFile` is returned immediately — no ElevenLabs API call is made, preserving character quota. Cache hits are tracked via `hit_count` and `last_hit_at` on the `request_cache` table.

---

## Analytics

Daily usage metrics are aggregated per user in `usage_analytics` by a background summarizer job. Tracked metrics include:

- Total / completed / failed / cached request counts
- Total characters consumed
- Total audio duration generated
- Total file size stored
- API call count and rate limit hits

This powers the user dashboard usage graph and admin analytics panel.

---

## Roadmap

- [ ] Voice cloning support (ElevenLabs Professional Voices)
- [ ] Batch TTS processing (upload CSV → bulk audio export)
- [ ] Webhook delivery system for API integrations
- [ ] Admin dashboard (usage monitoring, user management)
- [ ] SSML support for advanced text markup
- [ ] Multi-provider support (OpenAI TTS, Azure Cognitive Services)
- [ ] Audio post-processing (noise reduction, normalization)
- [ ] Team workspaces with shared voice libraries

---

> **Last updated:** 16 March, 2026 