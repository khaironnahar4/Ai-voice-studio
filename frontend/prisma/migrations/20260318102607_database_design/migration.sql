-- CreateEnum
CREATE TYPE "request_status" AS ENUM ('pending', 'queued', 'processing', 'completed', 'failed', 'cancelled');

-- CreateEnum
CREATE TYPE "job_status" AS ENUM ('waiting', 'active', 'completed', 'failed', 'delayed', 'cancelled');

-- CreateEnum
CREATE TYPE "subscription_status" AS ENUM ('active', 'trialing', 'past_due', 'cancelled', 'expired');

-- CreateEnum
CREATE TYPE "invoice_status" AS ENUM ('draft', 'open', 'paid', 'void', 'uncollectible');

-- CreateTable
CREATE TABLE "user" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "image" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "role" TEXT,
    "banned" BOOLEAN,
    "banReason" TEXT,
    "banExpires" TIMESTAMP(3),

    CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "session" (
    "id" UUID NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "token" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "user_id" UUID NOT NULL,
    "impersonateBy" TEXT,

    CONSTRAINT "session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "account" (
    "id" UUID NOT NULL,
    "accountId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "user_id" UUID NOT NULL,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "idToken" TEXT,
    "accessTokenExpiresAt" TIMESTAMP(3),
    "refreshTokenExpiresAt" TIMESTAMP(3),
    "scope" TEXT,
    "password" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification" (
    "id" UUID NOT NULL,
    "identifier" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "verification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "el_speech_models" (
    "id" UUID NOT NULL,
    "el_model_id" VARCHAR(100) NOT NULL,
    "name" VARCHAR(150) NOT NULL,
    "description" TEXT,
    "can_do_tts" BOOLEAN NOT NULL DEFAULT true,
    "supported_languages" TEXT[],
    "max_characters_per_request" INTEGER NOT NULL,
    "is_flash" BOOLEAN NOT NULL DEFAULT false,
    "is_deprecated" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "token_cost_factor" DECIMAL(5,4),
    "last_synced_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "el_speech_models_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "el_usage_sync" (
    "id" BIGSERIAL NOT NULL,
    "characters_used" BIGINT NOT NULL,
    "character_limit" BIGINT NOT NULL,
    "characters_remaining" BIGINT NOT NULL,
    "voice_limit" INTEGER,
    "professional_voice_limit" INTEGER,
    "can_extend_character_limit" BOOLEAN NOT NULL DEFAULT false,
    "can_use_instant_voice_cloning" BOOLEAN NOT NULL DEFAULT false,
    "el_plan_tier" VARCHAR(50),
    "next_character_reset_at" TIMESTAMPTZ,
    "raw_response" JSONB,
    "synced_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "el_usage_sync_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "el_voice_sync_log" (
    "id" UUID NOT NULL,
    "sync_type" VARCHAR(30) NOT NULL,
    "status" VARCHAR(20) NOT NULL,
    "voices_fetched" INTEGER NOT NULL DEFAULT 0,
    "voices_added" INTEGER NOT NULL DEFAULT 0,
    "voices_updated" INTEGER NOT NULL DEFAULT 0,
    "voices_deactivated" INTEGER NOT NULL DEFAULT 0,
    "pages_fetched" SMALLINT NOT NULL DEFAULT 0,
    "duration_ms" INTEGER,
    "error_message" TEXT,
    "started_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMPTZ,

    CONSTRAINT "el_voice_sync_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "languages" (
    "id" SMALLSERIAL NOT NULL,
    "code" VARCHAR(10) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "native_name" VARCHAR(100),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "languages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "voice_models" (
    "id" UUID NOT NULL,
    "language_id" SMALLINT NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "slug" VARCHAR(100) NOT NULL,
    "provider" VARCHAR(50) NOT NULL,
    "provider_voice_id" VARCHAR(255) NOT NULL,
    "gender" VARCHAR(20),
    "accent" VARCHAR(50),
    "style_tags" TEXT[],
    "sample_audio_url" TEXT,
    "is_premium" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" SMALLINT NOT NULL DEFAULT 0,
    "el_voice_id" VARCHAR(255) NOT NULL,
    "el_category" VARCHAR(30) NOT NULL,
    "el_labels" JSONB DEFAULT '{}',
    "el_description" TEXT,
    "el_preview_url" TEXT,
    "el_available_for_tiers" TEXT[],
    "el_verified_languages" JSONB DEFAULT '[]',
    "el_high_quality_model_ids" TEXT[],
    "el_fine_tuning_status" VARCHAR(30),
    "el_safety_control" VARCHAR(30),
    "el_sharing_enabled" BOOLEAN NOT NULL DEFAULT false,
    "el_speech_model_id" UUID,
    "last_synced_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "voice_models_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tts_requests" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "voice_model_id" UUID NOT NULL,
    "el_speech_model_id" UUID NOT NULL,
    "input_text" TEXT NOT NULL,
    "input_text_hash" VARCHAR(64) NOT NULL,
    "char_count" INTEGER NOT NULL,
    "word_count" INTEGER,
    "status" "request_status" NOT NULL DEFAULT 'pending',
    "priority" SMALLINT NOT NULL DEFAULT 0,
    "output_format" VARCHAR(30) NOT NULL DEFAULT 'mp3_44100_128',
    "language_code" VARCHAR(5),
    "stability" DECIMAL(4,3) NOT NULL DEFAULT 0.500,
    "similarity_boost" DECIMAL(4,3) NOT NULL DEFAULT 0.750,
    "style" DECIMAL(4,3) NOT NULL DEFAULT 0.000,
    "use_speaker_boost" BOOLEAN NOT NULL DEFAULT true,
    "seed" INTEGER,
    "apply_text_normalization" VARCHAR(4) NOT NULL DEFAULT 'auto',
    "served_from_cache" BOOLEAN NOT NULL DEFAULT false,
    "options" JSONB DEFAULT '{}',
    "error_message" TEXT,
    "retry_count" SMALLINT NOT NULL DEFAULT 0,
    "completed_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "tts_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audio_files" (
    "id" UUID NOT NULL,
    "request_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "storage_bucket" VARCHAR(100) NOT NULL,
    "storage_key" TEXT NOT NULL,
    "file_name" VARCHAR(255) NOT NULL,
    "file_format" VARCHAR(10) NOT NULL,
    "file_size_bytes" BIGINT NOT NULL,
    "duration_seconds" DECIMAL(8,3),
    "sample_rate_hz" INTEGER,
    "bitrate_kbps" SMALLINT,
    "cdn_url" TEXT,
    "signed_url" TEXT,
    "signed_url_expires_at" TIMESTAMPTZ,
    "download_count" INTEGER NOT NULL DEFAULT 0,
    "is_public" BOOLEAN NOT NULL DEFAULT false,
    "checksum_md5" VARCHAR(32),
    "el_request_id" VARCHAR(100),
    "el_character_cost" INTEGER,
    "el_model_used" VARCHAR(100),
    "el_voice_id_used" VARCHAR(255),
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ,

    CONSTRAINT "audio_files_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "jobs" (
    "id" UUID NOT NULL,
    "queue_name" VARCHAR(100) NOT NULL,
    "job_type" VARCHAR(100) NOT NULL,
    "request_id" UUID,
    "user_id" UUID,
    "payload" JSONB NOT NULL DEFAULT '{}',
    "status" "job_status" NOT NULL DEFAULT 'waiting',
    "priority" SMALLINT NOT NULL DEFAULT 0,
    "attempts" SMALLINT NOT NULL DEFAULT 0,
    "max_attempts" SMALLINT NOT NULL DEFAULT 3,
    "worker_id" VARCHAR(100),
    "started_at" TIMESTAMPTZ,
    "completed_at" TIMESTAMPTZ,
    "scheduled_for" TIMESTAMPTZ,
    "result" JSONB,
    "error" JSONB,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rate_limit_rules" (
    "id" SMALLSERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "scope" VARCHAR(50) NOT NULL,
    "scope_id" TEXT,
    "resource" VARCHAR(100) NOT NULL,
    "max_requests" INTEGER NOT NULL,
    "window_seconds" INTEGER NOT NULL,
    "burst_allowance" SMALLINT NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rate_limit_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rate_limit_events" (
    "id" BIGSERIAL NOT NULL,
    "user_id" UUID NOT NULL,
    "rule_id" SMALLINT NOT NULL,
    "resource" VARCHAR(100) NOT NULL,
    "request_count" INTEGER NOT NULL DEFAULT 1,
    "window_start" TIMESTAMPTZ NOT NULL,
    "window_end" TIMESTAMPTZ NOT NULL,
    "blocked_at" TIMESTAMPTZ,
    "ip_address" VARCHAR(45),
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rate_limit_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "plans" (
    "id" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "slug" VARCHAR(50) NOT NULL,
    "description" TEXT,
    "price_monthly_cents" INTEGER NOT NULL DEFAULT 0,
    "price_yearly_cents" INTEGER NOT NULL DEFAULT 0,
    "char_limit_monthly" BIGINT,
    "request_limit_monthly" INTEGER,
    "storage_limit_mb" INTEGER,
    "max_file_duration_sec" INTEGER,
    "concurrent_jobs" SMALLINT NOT NULL DEFAULT 1,
    "has_premium_voices" BOOLEAN NOT NULL DEFAULT false,
    "has_api_access" BOOLEAN NOT NULL DEFAULT false,
    "features" JSONB DEFAULT '{}',
    "stripe_price_id_monthly" VARCHAR(255),
    "stripe_price_id_yearly" VARCHAR(255),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscriptions" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "plan_id" UUID NOT NULL,
    "status" "subscription_status" NOT NULL DEFAULT 'active',
    "billing_cycle" VARCHAR(10) NOT NULL DEFAULT 'monthly',
    "current_period_start" TIMESTAMPTZ NOT NULL,
    "current_period_end" TIMESTAMPTZ NOT NULL,
    "trial_ends_at" TIMESTAMPTZ,
    "cancelled_at" TIMESTAMPTZ,
    "stripe_subscription_id" VARCHAR(255),
    "stripe_customer_id" VARCHAR(255),
    "metadata" JSONB DEFAULT '{}',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoices" (
    "id" UUID NOT NULL,
    "subscription_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "status" "invoice_status" NOT NULL DEFAULT 'draft',
    "amount_cents" INTEGER NOT NULL,
    "currency" CHAR(3) NOT NULL DEFAULT 'USD',
    "period_start" TIMESTAMPTZ NOT NULL,
    "period_end" TIMESTAMPTZ NOT NULL,
    "paid_at" TIMESTAMPTZ,
    "stripe_invoice_id" VARCHAR(255),
    "pdf_url" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "invoices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoice_items" (
    "id" UUID NOT NULL,
    "invoice_id" UUID NOT NULL,
    "description" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "unit_price_cents" INTEGER NOT NULL,
    "total_cents" INTEGER NOT NULL,
    "type" VARCHAR(50) NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "invoice_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "usage_analytics" (
    "id" BIGSERIAL NOT NULL,
    "user_id" UUID NOT NULL,
    "date" DATE NOT NULL,
    "plan_id" UUID,
    "request_count" INTEGER NOT NULL DEFAULT 0,
    "completed_count" INTEGER NOT NULL DEFAULT 0,
    "failed_count" INTEGER NOT NULL DEFAULT 0,
    "cached_count" INTEGER NOT NULL DEFAULT 0,
    "total_chars" BIGINT NOT NULL DEFAULT 0,
    "total_duration_sec" DECIMAL(12,3) NOT NULL DEFAULT 0,
    "total_file_size_bytes" BIGINT NOT NULL DEFAULT 0,
    "api_calls" INTEGER NOT NULL DEFAULT 0,
    "rate_limit_hits" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "usage_analytics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "request_cache" (
    "id" UUID NOT NULL,
    "cache_key" VARCHAR(64) NOT NULL,
    "audio_file_id" UUID NOT NULL,
    "voice_model_id" UUID NOT NULL,
    "output_format" VARCHAR(10) NOT NULL,
    "char_count" INTEGER NOT NULL,
    "hit_count" INTEGER NOT NULL DEFAULT 0,
    "last_hit_at" TIMESTAMPTZ,
    "expires_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "request_cache_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_email_key" ON "user"("email");

-- CreateIndex
CREATE INDEX "session_user_id_idx" ON "session"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "session_token_key" ON "session"("token");

-- CreateIndex
CREATE INDEX "account_user_id_idx" ON "account"("user_id");

-- CreateIndex
CREATE INDEX "verification_identifier_idx" ON "verification"("identifier");

-- CreateIndex
CREATE UNIQUE INDEX "el_speech_models_el_model_id_key" ON "el_speech_models"("el_model_id");

-- CreateIndex
CREATE INDEX "idx_el_speech_models_el_model_id" ON "el_speech_models"("el_model_id");

-- CreateIndex
CREATE INDEX "idx_el_speech_models_is_active" ON "el_speech_models"("is_active");

-- CreateIndex
CREATE INDEX "idx_el_usage_sync_synced_at" ON "el_usage_sync"("synced_at");

-- CreateIndex
CREATE INDEX "idx_el_voice_sync_log_started_at" ON "el_voice_sync_log"("started_at");

-- CreateIndex
CREATE INDEX "idx_el_voice_sync_log_status" ON "el_voice_sync_log"("status");

-- CreateIndex
CREATE UNIQUE INDEX "languages_code_key" ON "languages"("code");

-- CreateIndex
CREATE INDEX "idx_languages_code" ON "languages"("code");

-- CreateIndex
CREATE INDEX "idx_languages_is_active" ON "languages"("is_active");

-- CreateIndex
CREATE UNIQUE INDEX "voice_models_slug_key" ON "voice_models"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "voice_models_el_voice_id_key" ON "voice_models"("el_voice_id");

-- CreateIndex
CREATE INDEX "idx_voice_models_language_id" ON "voice_models"("language_id");

-- CreateIndex
CREATE INDEX "idx_voice_models_el_voice_id" ON "voice_models"("el_voice_id");

-- CreateIndex
CREATE INDEX "idx_voice_models_el_category" ON "voice_models"("el_category");

-- CreateIndex
CREATE INDEX "idx_voice_models_is_active" ON "voice_models"("is_active");

-- CreateIndex
CREATE INDEX "idx_voice_models_el_speech_model_id" ON "voice_models"("el_speech_model_id");

-- CreateIndex
CREATE UNIQUE INDEX "uq_voice_models_provider_voice" ON "voice_models"("provider", "provider_voice_id");

-- CreateIndex
CREATE INDEX "idx_tts_requests_user_status" ON "tts_requests"("user_id", "status");

-- CreateIndex
CREATE INDEX "idx_tts_requests_input_text_hash" ON "tts_requests"("input_text_hash");

-- CreateIndex
CREATE INDEX "idx_tts_requests_status_created_at" ON "tts_requests"("status", "created_at");

-- CreateIndex
CREATE INDEX "idx_tts_requests_user_created_at" ON "tts_requests"("user_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "audio_files_request_id_key" ON "audio_files"("request_id");

-- CreateIndex
CREATE INDEX "idx_audio_files_user_id" ON "audio_files"("user_id");

-- CreateIndex
CREATE INDEX "idx_audio_files_storage_key" ON "audio_files"("storage_key");

-- CreateIndex
CREATE INDEX "idx_audio_files_signed_url_expires_at" ON "audio_files"("signed_url_expires_at");

-- CreateIndex
CREATE INDEX "idx_audio_files_el_request_id" ON "audio_files"("el_request_id");

-- CreateIndex
CREATE INDEX "idx_audio_files_deleted_at" ON "audio_files"("deleted_at");

-- CreateIndex
CREATE INDEX "idx_jobs_queue_status_priority" ON "jobs"("queue_name", "status", "priority");

-- CreateIndex
CREATE INDEX "idx_jobs_request_id" ON "jobs"("request_id");

-- CreateIndex
CREATE INDEX "idx_jobs_user_id" ON "jobs"("user_id");

-- CreateIndex
CREATE INDEX "idx_jobs_scheduled_for" ON "jobs"("scheduled_for");

-- CreateIndex
CREATE INDEX "idx_jobs_status_created_at" ON "jobs"("status", "created_at");

-- CreateIndex
CREATE INDEX "idx_rate_limit_rules_scope" ON "rate_limit_rules"("scope", "scope_id", "resource");

-- CreateIndex
CREATE INDEX "idx_rate_limit_events_user_rule_window" ON "rate_limit_events"("user_id", "rule_id", "window_start");

-- CreateIndex
CREATE INDEX "idx_rate_limit_events_blocked_at" ON "rate_limit_events"("blocked_at");

-- CreateIndex
CREATE INDEX "idx_rate_limit_events_created_at" ON "rate_limit_events"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "plans_slug_key" ON "plans"("slug");

-- CreateIndex
CREATE INDEX "idx_plans_slug" ON "plans"("slug");

-- CreateIndex
CREATE INDEX "idx_plans_is_active" ON "plans"("is_active");

-- CreateIndex
CREATE INDEX "idx_subscriptions_user_id" ON "subscriptions"("user_id");

-- CreateIndex
CREATE INDEX "idx_subscriptions_status" ON "subscriptions"("status");

-- CreateIndex
CREATE INDEX "idx_subscriptions_stripe_id" ON "subscriptions"("stripe_subscription_id");

-- CreateIndex
CREATE INDEX "idx_invoices_user_id" ON "invoices"("user_id");

-- CreateIndex
CREATE INDEX "idx_invoices_subscription_id" ON "invoices"("subscription_id");

-- CreateIndex
CREATE INDEX "idx_invoices_status" ON "invoices"("status");

-- CreateIndex
CREATE INDEX "idx_invoice_items_invoice_id" ON "invoice_items"("invoice_id");

-- CreateIndex
CREATE INDEX "idx_usage_analytics_user_date" ON "usage_analytics"("user_id", "date");

-- CreateIndex
CREATE INDEX "idx_usage_analytics_date" ON "usage_analytics"("date");

-- CreateIndex
CREATE UNIQUE INDEX "uq_usage_analytics_user_date" ON "usage_analytics"("user_id", "date");

-- CreateIndex
CREATE UNIQUE INDEX "request_cache_cache_key_key" ON "request_cache"("cache_key");

-- CreateIndex
CREATE INDEX "idx_request_cache_cache_key" ON "request_cache"("cache_key");

-- CreateIndex
CREATE INDEX "idx_request_cache_expires_at" ON "request_cache"("expires_at");

-- CreateIndex
CREATE INDEX "idx_request_cache_last_hit_at" ON "request_cache"("last_hit_at");

-- AddForeignKey
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "voice_models" ADD CONSTRAINT "voice_models_language_id_fkey" FOREIGN KEY ("language_id") REFERENCES "languages"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "voice_models" ADD CONSTRAINT "voice_models_el_speech_model_id_fkey" FOREIGN KEY ("el_speech_model_id") REFERENCES "el_speech_models"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tts_requests" ADD CONSTRAINT "tts_requests_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tts_requests" ADD CONSTRAINT "tts_requests_voice_model_id_fkey" FOREIGN KEY ("voice_model_id") REFERENCES "voice_models"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tts_requests" ADD CONSTRAINT "tts_requests_el_speech_model_id_fkey" FOREIGN KEY ("el_speech_model_id") REFERENCES "el_speech_models"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audio_files" ADD CONSTRAINT "audio_files_request_id_fkey" FOREIGN KEY ("request_id") REFERENCES "tts_requests"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audio_files" ADD CONSTRAINT "audio_files_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_request_id_fkey" FOREIGN KEY ("request_id") REFERENCES "tts_requests"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rate_limit_events" ADD CONSTRAINT "rate_limit_events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rate_limit_events" ADD CONSTRAINT "rate_limit_events_rule_id_fkey" FOREIGN KEY ("rule_id") REFERENCES "rate_limit_rules"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "plans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_subscription_id_fkey" FOREIGN KEY ("subscription_id") REFERENCES "subscriptions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoice_items" ADD CONSTRAINT "invoice_items_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "invoices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usage_analytics" ADD CONSTRAINT "usage_analytics_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usage_analytics" ADD CONSTRAINT "usage_analytics_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "plans"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "request_cache" ADD CONSTRAINT "request_cache_audio_file_id_fkey" FOREIGN KEY ("audio_file_id") REFERENCES "audio_files"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "request_cache" ADD CONSTRAINT "request_cache_voice_model_id_fkey" FOREIGN KEY ("voice_model_id") REFERENCES "voice_models"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
