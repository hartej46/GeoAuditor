-- GEO Auditor — Database Schema
-- Migration 001: Create scans + scan_results tables

CREATE TABLE IF NOT EXISTS scans (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    brand       VARCHAR(255) NOT NULL,
    query       TEXT NOT NULL,
    demo_mode   BOOLEAN DEFAULT false,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS scan_results (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scan_id         UUID REFERENCES scans(id) ON DELETE CASCADE,
    entity_name     VARCHAR(255) NOT NULL,
    entity_type     VARCHAR(20) NOT NULL CHECK (entity_type IN ('brand', 'competitor')),
    ai_overview     JSONB DEFAULT '{}',
    ai_mode         JSONB DEFAULT '{}',
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_scan_results_scan_id ON scan_results(scan_id);
CREATE INDEX IF NOT EXISTS idx_scans_created_at ON scans(created_at DESC);
