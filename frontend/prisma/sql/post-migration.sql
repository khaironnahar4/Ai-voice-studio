-- 1. Auto-update updated_at on every UPDATE
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attach trigger to every table with updated_at
CREATE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON user
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_voice_models_updated_at
  BEFORE UPDATE ON voice_models
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_tts_requests_updated_at
  BEFORE UPDATE ON tts_requests
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_el_speech_models_updated_at
  BEFORE UPDATE ON el_speech_models
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_plans_updated_at
  BEFORE UPDATE ON plans
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_usage_analytics_updated_at
  BEFORE UPDATE ON usage_analytics 
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- 2. One active subscription per user (partial unique index)
CREATE UNIQUE INDEX uq_subscriptions_user_active
  ON subscriptions (user_id)
  WHERE status IN ('active', 'trialing');

-- 3. Voice settings range CHECK constraints
ALTER TABLE tts_requests
  ADD CONSTRAINT chk_stability
    CHECK (stability BETWEEN 0.000 AND 1.000),
  ADD CONSTRAINT chk_similarity_boost
    CHECK (similarity_boost BETWEEN 0.000 AND 1.000),
  ADD CONSTRAINT chk_style
    CHECK (style BETWEEN 0.000 AND 1.000);

-- 4. Partial indexes (Prisma cannot express these)
CREATE INDEX idx_jobs_active_queue
  ON jobs (queue_name, priority DESC)
  WHERE status IN ('waiting', 'active');

CREATE INDEX idx_voice_models_active
  ON voice_models (language_id, sort_order)
  WHERE is_active = TRUE;

CREATE INDEX idx_users_active
  ON users (email)
  WHERE deleted_at IS NULL;
