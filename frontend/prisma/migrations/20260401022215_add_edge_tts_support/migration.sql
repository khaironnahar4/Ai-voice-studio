-- AlterTable
ALTER TABLE "audio_files" ADD COLUMN     "provider_cost" INTEGER,
ADD COLUMN     "provider_model_used" VARCHAR(100),
ADD COLUMN     "provider_request_id" VARCHAR(255),
ADD COLUMN     "provider_voice_used" VARCHAR(255);

-- AlterTable
ALTER TABLE "tts_requests" ADD COLUMN     "edge_speed" DECIMAL(4,2),
ADD COLUMN     "pitch" DECIMAL(5,1) DEFAULT 0,
ADD COLUMN     "speaking_rate" DECIMAL(4,2),
ADD COLUMN     "volume_gain_db" DECIMAL(5,1);

-- AlterTable
ALTER TABLE "voice_models" ADD COLUMN     "edge_friendly_name" VARCHAR(255),
ADD COLUMN     "edge_gender" VARCHAR(10),
ADD COLUMN     "edge_locale" VARCHAR(10),
ADD COLUMN     "edge_voice_name" VARCHAR(100),
ADD COLUMN     "gcp_language_code" VARCHAR(10),
ADD COLUMN     "gcp_ssml_gender" VARCHAR(10),
ADD COLUMN     "gcp_voice_name" VARCHAR(100),
ADD COLUMN     "gcp_voice_type" VARCHAR(30);
