-- 010_private_login_logs.sql
-- Basic password wall for strategy concealment
-- Tracks login attempts for competitive intelligence

CREATE TABLE IF NOT EXISTS private_login_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ip_address TEXT,
  user_agent TEXT,
  success BOOLEAN NOT NULL DEFAULT FALSE,
  fingerprint TEXT,                        -- sha256(ip + user_agent) for unique visitor count
  attempted_password_hash TEXT,            -- first 8 chars of hash only (for pattern detection, not storage)
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_login_created ON private_login_logs(created_at DESC);
CREATE INDEX idx_login_success ON private_login_logs(success);
CREATE INDEX idx_login_fingerprint ON private_login_logs(fingerprint);

-- Quick view: daily login summary
CREATE OR REPLACE VIEW v_login_summary AS
SELECT
  DATE(created_at) AS login_date,
  COUNT(*) AS total_attempts,
  COUNT(*) FILTER (WHERE success = true) AS successful,
  COUNT(*) FILTER (WHERE success = false) AS failed,
  COUNT(DISTINCT fingerprint) AS unique_visitors
FROM private_login_logs
GROUP BY DATE(created_at)
ORDER BY DATE(created_at) DESC;
