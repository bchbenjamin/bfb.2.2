-- BengaluruDuru Database Schema
-- PostgreSQL (Neon compatible)

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- USERS
-- ============================================
CREATE TABLE IF NOT EXISTS users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  aadhaar_id    VARCHAR(12) UNIQUE NOT NULL,
  name          VARCHAR(255) NOT NULL,
  email         VARCHAR(255),
  phone         VARCHAR(15),
  role          VARCHAR(20) NOT NULL DEFAULT 'citizen'
                CHECK (role IN ('citizen', 'officer', 'admin')),
  language_pref VARCHAR(5) NOT NULL DEFAULT 'en'
                CHECK (language_pref IN ('en', 'kn', 'tcy', 'kok')),
  ward          VARCHAR(100),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_aadhaar ON users(aadhaar_id);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- ============================================
-- GRIEVANCES
-- ============================================
CREATE TABLE IF NOT EXISTS grievances (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                 UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title                   VARCHAR(500),
  raw_description         TEXT NOT NULL,
  ai_category             VARCHAR(100),
  ai_subcategory          VARCHAR(100),
  ai_priority             SMALLINT CHECK (ai_priority BETWEEN 1 AND 5),
  ai_detected_location    TEXT,
  latitude                DOUBLE PRECISION NOT NULL,
  longitude               DOUBLE PRECISION NOT NULL,
  status                  VARCHAR(30) NOT NULL DEFAULT 'open'
                          CHECK (status IN (
                            'open', 'assigned', 'in_progress',
                            'resolved_pending', 'resolved_final', 'reopened'
                          )),
  media_url               TEXT,
  media_verified          BOOLEAN DEFAULT FALSE,
  officer_id              UUID REFERENCES users(id) ON DELETE SET NULL,
  verification_deadline   TIMESTAMPTZ,
  impact_count            INTEGER NOT NULL DEFAULT 1,
  ward                    VARCHAR(100),
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_grievances_spatial
  ON grievances(ai_category, created_at, latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_grievances_status ON grievances(status);
CREATE INDEX IF NOT EXISTS idx_grievances_officer ON grievances(officer_id);
CREATE INDEX IF NOT EXISTS idx_grievances_user ON grievances(user_id);
CREATE INDEX IF NOT EXISTS idx_grievances_ward ON grievances(ward);
CREATE INDEX IF NOT EXISTS idx_grievances_impact ON grievances(impact_count DESC);

-- ============================================
-- UPVOTES ("I'm affected too")
-- ============================================
CREATE TABLE IF NOT EXISTS upvotes (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  grievance_id  UUID NOT NULL REFERENCES grievances(id) ON DELETE CASCADE,
  user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(grievance_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_upvotes_grievance ON upvotes(grievance_id);

-- ============================================
-- RESOLUTION PROOFS
-- ============================================
CREATE TABLE IF NOT EXISTS resolution_proofs (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  grievance_id      UUID NOT NULL REFERENCES grievances(id) ON DELETE CASCADE,
  officer_id        UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  photo_url         TEXT NOT NULL,
  ai_match_score    REAL,
  citizen_verified  BOOLEAN,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_proofs_grievance ON resolution_proofs(grievance_id);

-- ============================================
-- ALERTS (Spatial anomaly detection)
-- ============================================
CREATE TABLE IF NOT EXISTS alerts (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category            VARCHAR(100) NOT NULL,
  radius_center_lat   DOUBLE PRECISION NOT NULL,
  radius_center_lng   DOUBLE PRECISION NOT NULL,
  grievance_count     INTEGER NOT NULL,
  message             TEXT,
  severity            VARCHAR(20) NOT NULL DEFAULT 'warning'
                      CHECK (severity IN ('info', 'warning', 'critical')),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at         TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_alerts_active
  ON alerts(resolved_at) WHERE resolved_at IS NULL;
