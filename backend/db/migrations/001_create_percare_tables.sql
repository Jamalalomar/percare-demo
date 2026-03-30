-- PerCare Module Database Migration
-- Version: 001
-- Description: Creates all tables for the PerCare Requests Module

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- ENUM TYPES
-- ============================================

DO $$ BEGIN
  CREATE TYPE percare_request_status AS ENUM (
    'DRAFT', 'ACTIVE', 'COMPLETED', 'CANCELLED', 'ON_HOLD'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE percare_slot_status AS ENUM (
    'PENDING', 'COMPLETED', 'DELAYED', 'SKIPPED', 'CANCELLED'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE percare_log_action AS ENUM (
    'CREATED', 'STATUS_CHANGED', 'SLOT_UPDATED', 'RESCHEDULED',
    'CANCELLED', 'DELAYED_MARKED', 'NOTE_ADDED', 'BULK_UPDATED'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================
-- TABLE: percare_requests
-- ============================================

CREATE TABLE IF NOT EXISTS percare_requests (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  external_request_id VARCHAR(255),
  external_patient_id VARCHAR(255),
  provider_id         VARCHAR(255),
  patient_name        VARCHAR(500),
  start_date          DATE NOT NULL,
  end_date            DATE NOT NULL,
  status              percare_request_status NOT NULL DEFAULT 'DRAFT',
  notes               TEXT,
  -- Rollup counts
  total_slots         INTEGER NOT NULL DEFAULT 0,
  completed_slots     INTEGER NOT NULL DEFAULT 0,
  delayed_slots       INTEGER NOT NULL DEFAULT 0,
  pending_slots       INTEGER NOT NULL DEFAULT 0,
  skipped_slots       INTEGER NOT NULL DEFAULT 0,
  completion_pct      NUMERIC(5,2) NOT NULL DEFAULT 0.00,
  -- Metadata
  created_by          VARCHAR(255),
  updated_by          VARCHAR(255),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- TABLE: percare_request_items
-- ============================================

CREATE TABLE IF NOT EXISTS percare_request_items (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  request_id        UUID NOT NULL REFERENCES percare_requests(id) ON DELETE CASCADE,
  service_code      VARCHAR(100) NOT NULL,
  service_name      VARCHAR(500) NOT NULL,
  weekly_frequency  INTEGER NOT NULL CHECK (weekly_frequency > 0),
  -- Rollup counts per service
  total_slots       INTEGER NOT NULL DEFAULT 0,
  completed_slots   INTEGER NOT NULL DEFAULT 0,
  delayed_slots     INTEGER NOT NULL DEFAULT 0,
  pending_slots     INTEGER NOT NULL DEFAULT 0,
  skipped_slots     INTEGER NOT NULL DEFAULT 0,
  completion_pct    NUMERIC(5,2) NOT NULL DEFAULT 0.00,
  -- Metadata
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(request_id, service_code)
);

-- ============================================
-- TABLE: percare_schedule_slots
-- ============================================

CREATE TABLE IF NOT EXISTS percare_schedule_slots (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  request_id      UUID NOT NULL REFERENCES percare_requests(id) ON DELETE CASCADE,
  item_id         UUID NOT NULL REFERENCES percare_request_items(id) ON DELETE CASCADE,
  service_code    VARCHAR(100) NOT NULL,
  service_name    VARCHAR(500) NOT NULL,
  scheduled_date  DATE NOT NULL,
  day_number      INTEGER NOT NULL CHECK (day_number BETWEEN 1 AND 7),
  slot_index      INTEGER NOT NULL DEFAULT 1,
  status          percare_slot_status NOT NULL DEFAULT 'PENDING',
  completed_at    TIMESTAMPTZ,
  completed_by    VARCHAR(255),
  notes           TEXT,
  -- Metadata
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- TABLE: percare_status_logs
-- ============================================

CREATE TABLE IF NOT EXISTS percare_status_logs (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  request_id      UUID NOT NULL REFERENCES percare_requests(id) ON DELETE CASCADE,
  slot_id         UUID REFERENCES percare_schedule_slots(id) ON DELETE SET NULL,
  item_id         UUID REFERENCES percare_request_items(id) ON DELETE SET NULL,
  action          percare_log_action NOT NULL,
  old_status      VARCHAR(50),
  new_status      VARCHAR(50),
  performed_by    VARCHAR(255),
  note            TEXT,
  metadata        JSONB,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_percare_requests_status ON percare_requests(status);
CREATE INDEX IF NOT EXISTS idx_percare_requests_provider ON percare_requests(provider_id);
CREATE INDEX IF NOT EXISTS idx_percare_requests_patient ON percare_requests(external_patient_id);
CREATE INDEX IF NOT EXISTS idx_percare_requests_external ON percare_requests(external_request_id);
CREATE INDEX IF NOT EXISTS idx_percare_requests_start_date ON percare_requests(start_date);
CREATE INDEX IF NOT EXISTS idx_percare_requests_created_at ON percare_requests(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_percare_items_request ON percare_request_items(request_id);
CREATE INDEX IF NOT EXISTS idx_percare_items_service ON percare_request_items(service_code);

CREATE INDEX IF NOT EXISTS idx_percare_slots_request ON percare_schedule_slots(request_id);
CREATE INDEX IF NOT EXISTS idx_percare_slots_item ON percare_schedule_slots(item_id);
CREATE INDEX IF NOT EXISTS idx_percare_slots_date ON percare_schedule_slots(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_percare_slots_status ON percare_schedule_slots(status);
CREATE INDEX IF NOT EXISTS idx_percare_slots_request_date ON percare_schedule_slots(request_id, scheduled_date);

CREATE INDEX IF NOT EXISTS idx_percare_logs_request ON percare_status_logs(request_id);
CREATE INDEX IF NOT EXISTS idx_percare_logs_slot ON percare_status_logs(slot_id);
CREATE INDEX IF NOT EXISTS idx_percare_logs_created ON percare_status_logs(created_at DESC);

-- ============================================
-- TRIGGERS: updated_at auto-update
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_percare_requests_updated_at ON percare_requests;
CREATE TRIGGER trg_percare_requests_updated_at
  BEFORE UPDATE ON percare_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_percare_items_updated_at ON percare_request_items;
CREATE TRIGGER trg_percare_items_updated_at
  BEFORE UPDATE ON percare_request_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_percare_slots_updated_at ON percare_schedule_slots;
CREATE TRIGGER trg_percare_slots_updated_at
  BEFORE UPDATE ON percare_schedule_slots
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
