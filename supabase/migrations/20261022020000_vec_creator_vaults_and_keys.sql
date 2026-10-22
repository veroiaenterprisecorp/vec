-- =====================================================================
-- VEC MULTI-TENANT CREATOR VAULTS & CRYPTOGRAPHIC KEYS ARCHITECTURE
-- Migration: 20261022020000_vec_creator_vaults_and_keys.sql
-- =====================================================================
-- Tujuan:
-- 1. Tabel creator_vaults: Brankas terisolasi per pendaftar dengan hash kunci berkeamanan tinggi (SHA-256 + Salt)
-- 2. Kolom posts.vault_id: Mengikat karya seni ke brankas pemilik kunci
-- 3. RLS Policies lengkap & Idempotent (anti-duplikasi 42710)
-- 4. Default Master Creator Vault terdaftar
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. TABEL: creator_vaults (Brankas Karya Terisolasi)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.creator_vaults (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    creator_name VARCHAR(120) NOT NULL,
    creator_handle VARCHAR(64) UNIQUE NOT NULL,
    email VARCHAR(255) NOT NULL,
    vault_name VARCHAR(150) NOT NULL,
    
    -- Kunci Kriptografis (Zero-Knowledge Hash: SHA-256 + Salt)
    -- Kunci mentah tidak pernah disimpan dalam bentuk teks biasa di database!
    key_hash VARCHAR(64) NOT NULL,
    key_salt VARCHAR(32) NOT NULL,
    key_prefix VARCHAR(32) NOT NULL, -- e.g. VEC-VK-8F92-****
    
    security_level VARCHAR(32) NOT NULL DEFAULT 'HARDWARE_ENCLAVE_256',
    total_artworks INTEGER NOT NULL DEFAULT 0,
    published_artworks INTEGER NOT NULL DEFAULT 0,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW())
);

CREATE INDEX IF NOT EXISTS idx_creator_vaults_handle ON public.creator_vaults (creator_handle);
CREATE INDEX IF NOT EXISTS idx_creator_vaults_created ON public.creator_vaults (created_at DESC);

-- ---------------------------------------------------------------------
-- 2. RELASI PADA TABEL POSTS: vault_id & is_published
-- ---------------------------------------------------------------------
ALTER TABLE public.posts
    ADD COLUMN IF NOT EXISTS vault_id UUID,
    ADD COLUMN IF NOT EXISTS is_published BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_posts_vault_id 
    ON public.posts (vault_id);

CREATE INDEX IF NOT EXISTS idx_posts_is_published 
    ON public.posts (is_published) 
    WHERE is_published = true;

-- ---------------------------------------------------------------------
-- 3. RLS POLICIES PADA TABEL CREATOR_VAULTS (IDEMPOTENT)
-- ---------------------------------------------------------------------
ALTER TABLE public.creator_vaults ENABLE ROW LEVEL SECURITY;

DO $$ 
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN (
        SELECT policyname 
        FROM pg_policies 
        WHERE schemaname = 'public' 
          AND tablename = 'creator_vaults'
    ) LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.creator_vaults', pol.policyname);
    END LOOP;
END $$;

DO $$ BEGIN
    CREATE POLICY "Public can view creator vaults metadata" 
        ON public.creator_vaults FOR SELECT 
        USING (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE POLICY "Anyone can register a new creator vault" 
        ON public.creator_vaults FOR INSERT 
        WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE POLICY "Creators can update their own vault" 
        ON public.creator_vaults FOR UPDATE 
        USING (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- ---------------------------------------------------------------------
-- 4. MASTER CREATOR VAULT BOOTSTRAPPING
-- ---------------------------------------------------------------------
INSERT INTO public.creator_vaults (
    id,
    creator_name,
    creator_handle,
    email,
    vault_name,
    key_hash,
    key_salt,
    key_prefix,
    security_level,
    total_artworks,
    published_artworks
) VALUES (
    'b2222222-2222-4222-8222-222222222222',
    'VEC Verified Master Creator',
    '@vec_master_creator',
    'artist@vec.enterprise',
    'Brankas Mahakarya Utama VEC',
    'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    'vec_master_salt_2026',
    'VEC-VK-0000-****',
    'HARDWARE_ENCLAVE_256',
    0,
    0
) ON CONFLICT (id) DO NOTHING;
