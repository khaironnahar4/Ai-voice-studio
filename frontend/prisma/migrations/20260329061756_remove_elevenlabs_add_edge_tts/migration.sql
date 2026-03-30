/*
  Warnings:

  - You are about to drop the column `checksum_md5` on the `audio_files` table. All the data in the column will be lost.
  - You are about to drop the column `el_character_cost` on the `audio_files` table. All the data in the column will be lost.
  - You are about to drop the column `el_model_used` on the `audio_files` table. All the data in the column will be lost.
  - You are about to drop the column `el_request_id` on the `audio_files` table. All the data in the column will be lost.
  - You are about to drop the column `el_voice_id_used` on the `audio_files` table. All the data in the column will be lost.
  - You are about to drop the column `apply_text_normalization` on the `tts_requests` table. All the data in the column will be lost.
  - You are about to drop the column `el_speech_model_id` on the `tts_requests` table. All the data in the column will be lost.
  - You are about to drop the column `language_code` on the `tts_requests` table. All the data in the column will be lost.
  - You are about to drop the column `seed` on the `tts_requests` table. All the data in the column will be lost.
  - You are about to drop the column `similarity_boost` on the `tts_requests` table. All the data in the column will be lost.
  - You are about to drop the column `stability` on the `tts_requests` table. All the data in the column will be lost.
  - You are about to drop the column `style` on the `tts_requests` table. All the data in the column will be lost.
  - You are about to drop the column `use_speaker_boost` on the `tts_requests` table. All the data in the column will be lost.
  - You are about to alter the column `output_format` on the `tts_requests` table. The data in that column could be lost. The data in that column will be cast from `VarChar(30)` to `VarChar(10)`.
  - You are about to drop the column `el_available_for_tiers` on the `voice_models` table. All the data in the column will be lost.
  - You are about to drop the column `el_category` on the `voice_models` table. All the data in the column will be lost.
  - You are about to drop the column `el_description` on the `voice_models` table. All the data in the column will be lost.
  - You are about to drop the column `el_fine_tuning_status` on the `voice_models` table. All the data in the column will be lost.
  - You are about to drop the column `el_high_quality_model_ids` on the `voice_models` table. All the data in the column will be lost.
  - You are about to drop the column `el_labels` on the `voice_models` table. All the data in the column will be lost.
  - You are about to drop the column `el_preview_url` on the `voice_models` table. All the data in the column will be lost.
  - You are about to drop the column `el_safety_control` on the `voice_models` table. All the data in the column will be lost.
  - You are about to drop the column `el_sharing_enabled` on the `voice_models` table. All the data in the column will be lost.
  - You are about to drop the column `el_speech_model_id` on the `voice_models` table. All the data in the column will be lost.
  - You are about to drop the column `el_verified_languages` on the `voice_models` table. All the data in the column will be lost.
  - You are about to drop the column `el_voice_id` on the `voice_models` table. All the data in the column will be lost.
  - You are about to drop the column `sample_audio_url` on the `voice_models` table. All the data in the column will be lost.
  - You are about to alter the column `provider_voice_id` on the `voice_models` table. The data in that column could be lost. The data in that column will be cast from `VarChar(255)` to `VarChar(200)`.
  - You are about to drop the `el_speech_models` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `el_usage_sync` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `el_voice_sync_log` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[provider_voice_id]` on the table `voice_models` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "tts_requests" DROP CONSTRAINT "tts_requests_el_speech_model_id_fkey";

-- DropForeignKey
ALTER TABLE "voice_models" DROP CONSTRAINT "voice_models_el_speech_model_id_fkey";

-- DropIndex
DROP INDEX "idx_audio_files_el_request_id";

-- DropIndex
DROP INDEX "idx_voice_models_el_category";

-- DropIndex
DROP INDEX "idx_voice_models_el_speech_model_id";

-- DropIndex
DROP INDEX "idx_voice_models_el_voice_id";

-- DropIndex
DROP INDEX "uq_voice_models_provider_voice";

-- DropIndex
DROP INDEX "voice_models_el_voice_id_key";

-- AlterTable
ALTER TABLE "audio_files" DROP COLUMN "checksum_md5",
DROP COLUMN "el_character_cost",
DROP COLUMN "el_model_used",
DROP COLUMN "el_request_id",
DROP COLUMN "el_voice_id_used",
ADD COLUMN     "checksum_sha256" VARCHAR(64),
ADD COLUMN     "locale_used" VARCHAR(20),
ADD COLUMN     "voice_used" VARCHAR(200);

-- AlterTable
ALTER TABLE "tts_requests" DROP COLUMN "apply_text_normalization",
DROP COLUMN "el_speech_model_id",
DROP COLUMN "language_code",
DROP COLUMN "seed",
DROP COLUMN "similarity_boost",
DROP COLUMN "stability",
DROP COLUMN "style",
DROP COLUMN "use_speaker_boost",
ADD COLUMN     "locale" VARCHAR(20),
ADD COLUMN     "speed" DECIMAL(4,2) NOT NULL DEFAULT 1.00,
ALTER COLUMN "output_format" SET DEFAULT 'mp3',
ALTER COLUMN "output_format" SET DATA TYPE VARCHAR(10);

-- AlterTable
ALTER TABLE "voice_models" DROP COLUMN "el_available_for_tiers",
DROP COLUMN "el_category",
DROP COLUMN "el_description",
DROP COLUMN "el_fine_tuning_status",
DROP COLUMN "el_high_quality_model_ids",
DROP COLUMN "el_labels",
DROP COLUMN "el_preview_url",
DROP COLUMN "el_safety_control",
DROP COLUMN "el_sharing_enabled",
DROP COLUMN "el_speech_model_id",
DROP COLUMN "el_verified_languages",
DROP COLUMN "el_voice_id",
DROP COLUMN "sample_audio_url",
ADD COLUMN     "friendly_name" TEXT,
ADD COLUMN     "full_name" TEXT,
ADD COLUMN     "locale" VARCHAR(20) NOT NULL DEFAULT 'en-US',
ADD COLUMN     "preview_url" TEXT,
ADD COLUMN     "suggested_codec" VARCHAR(100),
ADD COLUMN     "voice_status" VARCHAR(20) NOT NULL DEFAULT 'GA',
ALTER COLUMN "slug" SET DATA TYPE VARCHAR(120),
ALTER COLUMN "provider" SET DEFAULT 'edge-tts',
ALTER COLUMN "provider_voice_id" SET DATA TYPE VARCHAR(200);

-- DropTable
DROP TABLE "el_speech_models";

-- DropTable
DROP TABLE "el_usage_sync";

-- DropTable
DROP TABLE "el_voice_sync_log";

-- CreateTable
CREATE TABLE "voice_sync_log" (
    "id" UUID NOT NULL,
    "sync_type" VARCHAR(30) NOT NULL,
    "status" VARCHAR(20) NOT NULL,
    "voices_fetched" INTEGER NOT NULL DEFAULT 0,
    "voices_added" INTEGER NOT NULL DEFAULT 0,
    "voices_updated" INTEGER NOT NULL DEFAULT 0,
    "voices_deactivated" INTEGER NOT NULL DEFAULT 0,
    "duration_ms" INTEGER,
    "error_message" TEXT,
    "started_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMPTZ(6),

    CONSTRAINT "voice_sync_log_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "voice_sync_log_started_at_idx" ON "voice_sync_log"("started_at");

-- CreateIndex
CREATE INDEX "voice_sync_log_status_idx" ON "voice_sync_log"("status");

-- CreateIndex
CREATE UNIQUE INDEX "voice_models_provider_voice_id_key" ON "voice_models"("provider_voice_id");

-- CreateIndex
CREATE INDEX "voice_models_locale_idx" ON "voice_models"("locale");

-- CreateIndex
CREATE INDEX "voice_models_gender_idx" ON "voice_models"("gender");

-- CreateIndex
CREATE INDEX "voice_models_provider_voice_id_idx" ON "voice_models"("provider_voice_id");

-- RenameIndex
ALTER INDEX "idx_languages_code" RENAME TO "languages_code_idx";

-- RenameIndex
ALTER INDEX "idx_languages_is_active" RENAME TO "languages_is_active_idx";

-- RenameIndex
ALTER INDEX "idx_tts_requests_input_text_hash" RENAME TO "tts_requests_input_text_hash_idx";

-- RenameIndex
ALTER INDEX "idx_tts_requests_status_created_at" RENAME TO "tts_requests_status_created_at_idx";

-- RenameIndex
ALTER INDEX "idx_tts_requests_user_created_at" RENAME TO "tts_requests_user_id_created_at_idx";

-- RenameIndex
ALTER INDEX "idx_tts_requests_user_status" RENAME TO "tts_requests_user_id_status_idx";

-- RenameIndex
ALTER INDEX "idx_voice_models_is_active" RENAME TO "voice_models_is_active_idx";

-- RenameIndex
ALTER INDEX "idx_voice_models_language_id" RENAME TO "voice_models_language_id_idx";
