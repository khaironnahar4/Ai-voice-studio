-- DropForeignKey
ALTER TABLE "tts_requests" DROP CONSTRAINT "tts_requests_el_speech_model_id_fkey";

-- AlterTable
ALTER TABLE "tts_requests" ALTER COLUMN "el_speech_model_id" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "tts_requests" ADD CONSTRAINT "tts_requests_el_speech_model_id_fkey" FOREIGN KEY ("el_speech_model_id") REFERENCES "el_speech_models"("id") ON DELETE SET NULL ON UPDATE CASCADE;
