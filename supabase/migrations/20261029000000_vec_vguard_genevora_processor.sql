-- =====================================================================
-- VEROIA ENTERPRISE CORP (VEC) - VEROIA PROCESSOR ALIGNMENT
-- Migration: 20261029000000_vec_vguard_genevora_processor.sql
-- Pipeline Resmi: TWIN → VGUARD → HUMANGUARD → GENEVORA → HAPPY → BEAUTY
-- =====================================================================
-- Tujuan:
-- 1. Menyediakan kolom terindeks opsional pada tabel public.posts untuk
--    modul VGUARD (status pemeriksaan awal) dan GENEVORA (SHA-256 fingerprint).
-- 2. Mempertahankan 100% kompatibilitas dan keamanan tanpa perubahan destruktif.
-- 3. Semua operasi dibuat 100% IDEMPOTENT (aman dijalankan berulang kali).
-- =====================================================================

-- 1. Kolom indeks VGUARD pada public.posts
ALTER TABLE public.posts
    ADD COLUMN IF NOT EXISTS vguard_status VARCHAR(64) DEFAULT 'BELUM DIPERIKSA',
    ADD COLUMN IF NOT EXISTS vguard_inspected_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS vguard_inspector VARCHAR(120);

-- Indeks parsial untuk query status pemeriksaan VGUARD
CREATE INDEX IF NOT EXISTS idx_posts_vguard_status 
    ON public.posts (vguard_status);

-- 2. Kolom indeks GENEVORA (SHA-256 Fingerprint Konten Berkas)
ALTER TABLE public.posts
    ADD COLUMN IF NOT EXISTS genevora_sha256 VARCHAR(64),
    ADD COLUMN IF NOT EXISTS genevora_fingerprinted_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS genevora_method VARCHAR(32) DEFAULT 'SHA-256-v1';

-- Indeks pencarian cepat kesamaan fingerprint GENEVORA
CREATE INDEX IF NOT EXISTS idx_posts_genevora_sha256 
    ON public.posts (genevora_sha256);

-- Komentar dokumentasi arsitektur resmi
COMMENT ON COLUMN public.posts.vguard_status IS 'Status pemeriksaan awal bukti kesamaan dan indikasi AI oleh modul VGUARD (Urutan: TWIN -> VGUARD -> HUMANGUARD -> GENEVORA -> HAPPY -> BEAUTY)';
COMMENT ON COLUMN public.posts.genevora_sha256 IS 'Fingerprint digital SHA-256 berbasis byte aktual file karya oleh modul GENEVORA (SHA-256-v1)';
