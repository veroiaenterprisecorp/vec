/**
 * Veroia Enterprise Corp (VEC) - Database Architecture
 * PostgreSQL 16 + PostGIS Schema for Supabase
 *
 * Designed for:
 * 1. users: Authenticity scores, hardware attestation, C2PA identity
 * 2. posts: Partitioned zero-trust camera captures with exact & fuzzed PostGIS coordinates
 * 3. art_certificates: Provenance, NTAG424 NFC hash, RAW checksum
 * 4. art_process_proofs: Chronological stages of artwork creation with telemetry
 * 5. interactions: Text comments, likes/reactions, and audio voice notes
 */

export const VEC_FULL_SQL_SCRIPT = `-- =====================================================================
-- VEROIA ENTERPRISE CORP (VEC) - DATABASE ARCHITECTURE
-- PostgreSQL 16 + PostGIS Extension Schema for Supabase
-- =====================================================================
-- Target Engine: PostgreSQL 16+
-- Platform: Supabase (SQL Editor Ready)
-- Extensions: postgis, pgcrypto, uuid-ossp
-- =====================================================================

-- ---------------------------------------------------------------------
-- 0. EXTENSIONS & PREPARATION
-- ---------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- ---------------------------------------------------------------------
-- 1. ENUMS & DOMAINS
-- ---------------------------------------------------------------------
DO $$ BEGIN
    CREATE TYPE user_trust_tier AS ENUM ('UNVERIFIED', 'COMMUNITY', 'CREATOR_PRO', 'ENTERPRISE_TRUSTED', 'HARDWARE_ATTESTED');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE verification_status AS ENUM (
        'PENDING',
        'VERIFIED_HARDWARE_TEE',
        'VERIFIED_C2PA',
        'MANIPULATION_DETECTED',
        'REJECTED_SYNTHETIC'
    );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE custody_status AS ENUM (
        'CREATOR_VAULT',
        'IN_TRANSIT',
        'GALLERY_EXHIBITION',
        'PRIVATE_COLLECTION',
        'SECURE_STORAGE',
        'DECOMMISSIONED'
    );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE interaction_type AS ENUM (
        'COMMENT',
        'REACTION',
        'VOICE_NOTE',
        'ATTESTATION_ENDORSEMENT'
    );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE reaction_type AS ENUM (
        'AUTHENTIC_SEAL',
        'APPLAUD',
        'VERIFY_VOTE',
        'INSPECTED',
        'FLAG_DISPUTE'
    );
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- ---------------------------------------------------------------------
-- 2. TABLE: users
-- Pengguna dan skor keaslian (Authenticity Score & Hardware Attestation)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username VARCHAR(64) UNIQUE NOT NULL,
    full_name VARCHAR(120),
    avatar_url TEXT,
    bio TEXT,
    
    -- Skor Keaslian (0.00 s/d 100.00)
    authenticity_score NUMERIC(5,2) NOT NULL DEFAULT 50.00 
        CHECK (authenticity_score >= 0.00 AND authenticity_score <= 100.00),
    
    -- Tingkat Kepercayaan & Verifikasi
    trust_tier user_trust_tier NOT NULL DEFAULT 'COMMUNITY',
    kyc_verified BOOLEAN NOT NULL DEFAULT FALSE,
    hardware_attestation_key_id TEXT, -- Public Key ID Secure Enclave / Android StrongBox
    c2pa_signer_dn TEXT,               -- Distinguished Name sertifikat C2PA
    
    -- Metrik Akun
    total_verified_captures INTEGER NOT NULL DEFAULT 0 CHECK (total_verified_captures >= 0),
    disputed_captures_count INTEGER NOT NULL DEFAULT 0 CHECK (disputed_captures_count >= 0),
    
    -- Metadata Fleksibel
    metadata JSONB DEFAULT '{}'::jsonb,
    
    -- Audit Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW())
);

-- Indeks users
CREATE INDEX IF NOT EXISTS idx_users_authenticity_score ON public.users (authenticity_score DESC);
CREATE INDEX IF NOT EXISTS idx_users_trust_tier ON public.users (trust_tier);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON public.users (created_at DESC);

-- ---------------------------------------------------------------------
-- 3. TABLE: posts (PARTITIONED)
-- Tangkapan kamera zero-trust terpartisi dengan koordinat PostGIS
-- exact_location (presisi tinggi) dan public_location (fuzzed GPS privacy)
-- ---------------------------------------------------------------------
-- CATATAN POSTGRESQL: Tabel terpartisi RANGE (created_at) HARUS menyertakan
-- kolom partisi di dalam PRIMARY KEY composite (id, created_at).
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.posts (
    id UUID DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    
    -- Konten Publik
    title VARCHAR(200) NOT NULL,
    caption TEXT,
    media_url TEXT NOT NULL,
    media_thumbnail_url TEXT,
    media_mime_type VARCHAR(64) NOT NULL DEFAULT 'image/jpeg',
    
    -- -----------------------------------------------------------------
    -- SPATIAL POSTGIS COORDINATES
    -- exact_location  : Titik koordinat asli presisi sensor (WGS84 SRID 4326)
    -- public_location : Titik ter-fuzz (acak dalam radius keamanan) untuk privasi publik
    -- -----------------------------------------------------------------
    exact_location GEOMETRY(Point, 4326) NOT NULL,
    public_location GEOMETRY(Point, 4326) NOT NULL,
    fuzz_radius_meters INTEGER NOT NULL DEFAULT 500 CHECK (fuzz_radius_meters >= 100 AND fuzz_radius_meters <= 5000),
    location_place_name TEXT,
    
    -- -----------------------------------------------------------------
    -- ZERO-TRUST HARDWARE ATTESTATION & C2PA PROOF
    -- -----------------------------------------------------------------
    c2pa_manifest_hash VARCHAR(64) NOT NULL,            -- SHA-256 Manifest C2PA
    hardware_tee_signature TEXT NOT NULL,               -- ECDSA Signature dari Secure Enclave Kamera
    camera_make VARCHAR(64),                            -- e.g. 'Sony', 'Leica', 'Apple'
    camera_model VARCHAR(64),                           -- e.g. 'Alpha 7 IV C2PA', 'M11-P'
    lens_serial_number VARCHAR(64),
    shutter_count INTEGER,
    raw_capture_digest VARCHAR(64),                     -- SHA-256 sensor raw stream digest
    
    -- Status Validasi VEC
    verification_status verification_status NOT NULL DEFAULT 'PENDING',
    authenticity_confidence NUMERIC(5,2) NOT NULL DEFAULT 98.50 
        CHECK (authenticity_confidence >= 0.00 AND authenticity_confidence <= 100.00),
    is_synthetic_detected BOOLEAN NOT NULL DEFAULT FALSE,
    
    -- Metadata Sensor
    sensor_telemetry JSONB DEFAULT '{}'::jsonb,         -- ISO, Aperture, Ambient Light, Accelerometer
    
    -- Partisi & Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW()),
    
    -- Primary Key Komposit untuk Partisi PostgreSQL
    CONSTRAINT pk_posts PRIMARY KEY (id, created_at)
) PARTITION BY RANGE (created_at);

-- ---------------------------------------------------------------------
-- 3.1 PARTISI TABEL posts (Berdasarkan Tahun / Range Kronologis)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.posts_y2025 PARTITION OF public.posts
    FOR VALUES FROM ('2025-01-01 00:00:00+00') TO ('2026-01-01 00:00:00+00');

CREATE TABLE IF NOT EXISTS public.posts_y2026 PARTITION OF public.posts
    FOR VALUES FROM ('2026-01-01 00:00:00+00') TO ('2027-01-01 00:00:00+00');

CREATE TABLE IF NOT EXISTS public.posts_y2027 PARTITION OF public.posts
    FOR VALUES FROM ('2027-01-01 00:00:00+00') TO ('2028-01-01 00:00:00+00');

-- Default Partition (Menampung tanggal di luar range yang telah ditentukan)
CREATE TABLE IF NOT EXISTS public.posts_default PARTITION OF public.posts DEFAULT;

-- ---------------------------------------------------------------------
-- 3.2 INDEKS SPATIAL & KINERJA PADA posts
-- ---------------------------------------------------------------------
-- PostGIS GiST Index untuk pencarian radius geospansial (ST_DWithin)
CREATE INDEX IF NOT EXISTS idx_posts_public_location_gist 
    ON public.posts USING GIST (public_location);

-- Indeks GiST lokasi exact (hanya untuk query internal/audit compliance)
CREATE INDEX IF NOT EXISTS idx_posts_exact_location_gist 
    ON public.posts USING GIST (exact_location);

-- Indeks relasi user dan status
CREATE INDEX IF NOT EXISTS idx_posts_user_id ON public.posts (user_id);
CREATE INDEX IF NOT EXISTS idx_posts_verification_status ON public.posts (verification_status);
CREATE INDEX IF NOT EXISTS idx_posts_c2pa_manifest ON public.posts (c2pa_manifest_hash);

-- ---------------------------------------------------------------------
-- 4. FUNCTION & TRIGGER: OTOMATISASI FUZZED GPS UNTUK PRIVASI
-- ST_Project & ST_SnapToGrid digunakan untuk mengaburkan koordinat exact
-- tanpa membocorkan lokasi presisi fotografer/kreator ke publik
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.fn_vec_fuzz_post_location()
RETURNS TRIGGER AS $$
DECLARE
    fuzz_dist_meters FLOAT;
    fuzz_angle_radians FLOAT;
    fuzz_seed_val BIGINT;
BEGIN
    -- Jika exact_location disediakan namun public_location tidak ditentukan atau sama persis
    IF NEW.exact_location IS NOT NULL THEN
        -- Gunakan hash deterministik dari post id dan exact location sebagai seed acak terkontrol
        fuzz_seed_val := ('x' || substr(md5(NEW.id::text || ST_AsText(NEW.exact_location)), 1, 8))::bit(32)::bigint;
        PERFORM setseed((abs(fuzz_seed_val) % 1000000)::float / 1000000.0);
        
        -- Jarak acak antara 50% hingga 100% dari fuzz_radius_meters
        fuzz_dist_meters := (NEW.fuzz_radius_meters * 0.5) + (random() * (NEW.fuzz_radius_meters * 0.5));
        -- Arah azimuth acak 0 s/d 360 derajat (2 * PI)
        fuzz_angle_radians := random() * 2.0 * pi();
        
        -- Proyeksikan titik fuzzed menggunakan PostGIS ST_Project
        NEW.public_location := ST_SetSRID(
            ST_Project(
                NEW.exact_location::geography, 
                fuzz_dist_meters, 
                fuzz_angle_radians
            )::geometry, 
            4326
        );
    END IF;
    
    NEW.updated_at := TIMEZONE('utc', NOW());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Pasang trigger pada tabel master posts
DROP TRIGGER IF EXISTS trg_vec_fuzz_post_location ON public.posts;
CREATE TRIGGER trg_vec_fuzz_post_location
    BEFORE INSERT OR UPDATE OF exact_location, fuzz_radius_meters
    ON public.posts
    FOR EACH ROW
    EXECUTE FUNCTION public.fn_vec_fuzz_post_location();

-- ---------------------------------------------------------------------
-- 5. TABLE: art_certificates
-- Silsilah karya seni (Provenance), Hash NFC fisik NTAG424, dan Checksum RAW
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.art_certificates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Pembuat asli & pemilik saat ini
    creator_id UUID NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
    current_owner_id UUID NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
    
    -- Identitas Karya Seni
    title VARCHAR(255) NOT NULL,
    description TEXT,
    physical_medium VARCHAR(120) NOT NULL,           -- e.g. 'Oil on Canvas', 'Cold Cast Bronze', 'Giclée Print'
    dimensions_cm JSONB NOT NULL DEFAULT '{"width": 0, "height": 0, "depth": 0}'::jsonb,
    edition_number INTEGER NOT NULL DEFAULT 1 CHECK (edition_number >= 1),
    total_editions INTEGER NOT NULL DEFAULT 1 CHECK (total_editions >= edition_number),
    
    -- -----------------------------------------------------------------
    -- VERIFIKASI FISIK & DIGITAL HARDWARE (NFC & RAW CHECKSUM)
    -- -----------------------------------------------------------------
    nfc_chip_uid_hash VARCHAR(64) UNIQUE NOT NULL,     -- SHA-256 Hash dari UID Chip NFC Fisik
    nfc_ntag424_dna_key TEXT,                          -- Public verification key untuk NTAG424 DNA Sun Cryptographic tag
    raw_file_checksum_sha256 VARCHAR(64) NOT NULL,     -- SHA-256 Checksum dari file master RAW (ARW/DNG/CR3)
    raw_file_format VARCHAR(16) NOT NULL DEFAULT 'DNG',
    raw_file_size_bytes BIGINT CHECK (raw_file_size_bytes > 0),
    
    -- Master C2PA Manifest
    c2pa_root_manifest_digest VARCHAR(64) NOT NULL,
    certificate_qr_payload TEXT,                       -- Signed payload string
    
    -- Status Kustodi & Silsilah
    custody_status custody_status NOT NULL DEFAULT 'CREATOR_VAULT',
    custody_history JSONB NOT NULL DEFAULT '[]'::jsonb,
    
    -- Opsional: Bridging Ledger Web3 / Enterprise Consortium
    blockchain_network VARCHAR(64),
    smart_contract_address VARCHAR(64),
    token_id VARCHAR(64),
    
    -- Timestamps
    minted_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW())
);

-- Indeks art_certificates
CREATE INDEX IF NOT EXISTS idx_art_cert_creator ON public.art_certificates (creator_id);
CREATE INDEX IF NOT EXISTS idx_art_cert_owner ON public.art_certificates (current_owner_id);
CREATE INDEX IF NOT EXISTS idx_art_cert_nfc_hash ON public.art_certificates (nfc_chip_uid_hash);
CREATE INDEX IF NOT EXISTS idx_art_cert_raw_checksum ON public.art_certificates (raw_file_checksum_sha256);
CREATE INDEX IF NOT EXISTS idx_art_cert_custody_status ON public.art_certificates (custody_status);

-- ---------------------------------------------------------------------
-- 6. TABLE: art_process_proofs
-- Tahap pembuatan karya kronologis (Chronological Proof-of-Creation)
-- Menyimpan bukti progress karya (sketsa, layering, finishing)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.art_process_proofs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    certificate_id UUID NOT NULL REFERENCES public.art_certificates(id) ON DELETE CASCADE,
    
    -- Urutan kronologis pembuatan (1, 2, 3...)
    sequence_order INTEGER NOT NULL CHECK (sequence_order >= 1),
    
    -- Deskripsi Tahapan
    stage_name VARCHAR(120) NOT NULL,                 -- e.g. 'Sketsa Awal', 'Pigmen Layer 1', 'Mastering VEC'
    description TEXT,
    
    -- Media Bukti & Verifikasi Kriptografis
    proof_media_url TEXT NOT NULL,
    proof_media_thumbnail_url TEXT,
    timelapse_frame_hash VARCHAR(64) NOT NULL,         -- Hash frame pembuktian
    device_hardware_signature TEXT NOT NULL,           -- TEE signature saat pengambilan bukti
    
    -- Koordinat PostGIS lokasi pengerjaan studio (Opsional)
    studio_location GEOMETRY(Point, 4326),
    
    -- Telemetri Sensor Pembuatan (e.g. Tekanan Stylus, Sensor Suhu, Kelembaban Studio)
    telemetry_data JSONB DEFAULT '{}'::jsonb,
    
    -- Waktu pengerjaan aktual & audit
    stage_captured_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW()),
    
    -- Pastikan urutan tahapan unik untuk setiap sertifikat karya seni
    CONSTRAINT uq_cert_stage_sequence UNIQUE (certificate_id, sequence_order)
);

-- Indeks art_process_proofs
CREATE INDEX IF NOT EXISTS idx_art_proofs_cert_seq 
    ON public.art_process_proofs (certificate_id, sequence_order ASC);
CREATE INDEX IF NOT EXISTS idx_art_proofs_captured_at 
    ON public.art_process_proofs (stage_captured_at ASC);

-- ---------------------------------------------------------------------
-- 7. TABLE: interactions
-- Komentar teks, like/reaction, dan voice note
-- Terhubung ke tabel terpartisi posts (id, created_at)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.interactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    
    -- Relasi ke tabel terpartisi posts menggunakan komposit Foreign Key
    post_id UUID NOT NULL,
    post_created_at TIMESTAMPTZ NOT NULL,
    CONSTRAINT fk_interaction_post 
        FOREIGN KEY (post_id, post_created_at) 
        REFERENCES public.posts(id, created_at) 
        ON DELETE CASCADE,
        
    -- Threading: Balasan terhadap interaksi lain
    parent_interaction_id UUID REFERENCES public.interactions(id) ON DELETE CASCADE,
    
    -- Tipe Interaksi
    interaction_type interaction_type NOT NULL,
    
    -- Data Komentar Teks (jika tipe COMMENT)
    comment_body TEXT,
    
    -- Data Reaksi / Stempel Validasi (jika tipe REACTION / ATTESTATION)
    reaction_type reaction_type,
    
    -- -----------------------------------------------------------------
    -- DATA VOICE NOTE (Audio URL, Durasi, Waveform JSON)
    -- -----------------------------------------------------------------
    voice_note_url TEXT,
    voice_duration_seconds NUMERIC(6,2) CHECK (voice_duration_seconds IS NULL OR voice_duration_seconds > 0),
    voice_waveform JSONB,                              -- Array amplitude [0.12, 0.45, 0.89, ...] untuk visualizer
    voice_transcription TEXT,                          -- Transkripsi teks otomatis
    
    -- Bobot Reputasi Interaksi (Anti-Spam / Sybil Resistance)
    author_authenticity_weight NUMERIC(5,2) NOT NULL DEFAULT 1.00,
    is_verified_human BOOLEAN NOT NULL DEFAULT TRUE,
    
    -- Audit Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW()),
    
    -- Validasi Konsistensi Kolom terhadap Tipe Interaksi
    CONSTRAINT chk_interaction_payload CHECK (
        (interaction_type = 'COMMENT' AND comment_body IS NOT NULL) OR
        (interaction_type = 'REACTION' AND reaction_type IS NOT NULL) OR
        (interaction_type = 'VOICE_NOTE' AND voice_note_url IS NOT NULL AND voice_duration_seconds IS NOT NULL) OR
        (interaction_type = 'ATTESTATION_ENDORSEMENT' AND reaction_type IS NOT NULL)
    )
);

-- Indeks interactions
CREATE INDEX IF NOT EXISTS idx_interactions_post 
    ON public.interactions (post_id, post_created_at, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_interactions_user 
    ON public.interactions (user_id);
CREATE INDEX IF NOT EXISTS idx_interactions_parent 
    ON public.interactions (parent_interaction_id);
CREATE INDEX IF NOT EXISTS idx_interactions_type 
    ON public.interactions (interaction_type);

-- ---------------------------------------------------------------------
-- 8. VIEW AMAN PUBLIK: v_posts_feed
-- Menyembunyikan exact_location dari konsumsi publik untuk kepatuhan privasi
-- ---------------------------------------------------------------------
CREATE OR REPLACE VIEW public.v_posts_feed AS
SELECT 
    p.id,
    p.user_id,
    u.username,
    u.full_name AS author_name,
    u.avatar_url AS author_avatar,
    u.authenticity_score AS author_score,
    u.trust_tier AS author_trust_tier,
    p.title,
    p.caption,
    p.media_url,
    p.media_thumbnail_url,
    p.media_mime_type,
    -- HANYA public_location yang di-expose ke publik
    p.public_location,
    ST_X(p.public_location::geometry) AS longitude_fuzzed,
    ST_Y(p.public_location::geometry) AS latitude_fuzzed,
    p.fuzz_radius_meters,
    p.location_place_name,
    p.c2pa_manifest_hash,
    p.camera_make,
    p.camera_model,
    p.verification_status,
    p.authenticity_confidence,
    p.is_synthetic_detected,
    p.created_at,
    (
        SELECT COUNT(*) 
        FROM public.interactions i 
        WHERE i.post_id = p.id AND i.post_created_at = p.created_at
    ) AS total_interactions
FROM public.posts p
JOIN public.users u ON p.user_id = u.id
WHERE p.verification_status IN ('VERIFIED_HARDWARE_TEE', 'VERIFIED_C2PA');

-- ---------------------------------------------------------------------
-- 9. FUNGSI PENELUSURAN GEOSPASIAL POSTGIS (Radius Search)
-- Mencari postingan otentik terdekat berdasarkan jarak kilometer
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.vec_fn_get_nearby_posts(
    center_longitude FLOAT8,
    center_latitude FLOAT8,
    radius_meters FLOAT8 DEFAULT 10000.0,
    min_author_score NUMERIC DEFAULT 60.00
)
RETURNS TABLE (
    post_id UUID,
    post_created_at TIMESTAMPTZ,
    title VARCHAR,
    media_url TEXT,
    author_username VARCHAR,
    author_score NUMERIC,
    distance_meters FLOAT8,
    fuzzed_coords JSON
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.created_at,
        p.title,
        p.media_url,
        u.username,
        u.authenticity_score,
        ST_Distance(
            p.public_location::geography, 
            ST_SetSRID(ST_MakePoint(center_longitude, center_latitude), 4326)::geography
        ) AS distance_meters,
        json_build_object(
            'lon', ST_X(p.public_location::geometry),
            'lat', ST_Y(p.public_location::geometry)
        ) AS fuzzed_coords
    FROM public.posts p
    JOIN public.users u ON p.user_id = u.id
    WHERE 
        u.authenticity_score >= min_author_score
        AND ST_DWithin(
            p.public_location::geography, 
            ST_SetSRID(ST_MakePoint(center_longitude, center_latitude), 4326)::geography, 
            radius_meters
        )
    ORDER BY distance_meters ASC
    LIMIT 100;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Alias kemudahan pemanggilan (latitude dahulu)
CREATE OR REPLACE FUNCTION public.fn_vec_query_nearby_posts(
    center_latitude FLOAT8,
    center_longitude FLOAT8,
    radius_meters FLOAT8 DEFAULT 10000.0,
    min_author_score NUMERIC DEFAULT 60.00
)
RETURNS TABLE (
    post_id UUID,
    post_created_at TIMESTAMPTZ,
    title VARCHAR,
    media_url TEXT,
    author_username VARCHAR,
    author_score NUMERIC,
    distance_meters FLOAT8,
    fuzzed_coords JSON
) AS $$
BEGIN
    RETURN QUERY
    SELECT * FROM public.vec_fn_get_nearby_posts(
        center_longitude,
        center_latitude,
        radius_meters,
        min_author_score
    );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- ---------------------------------------------------------------------
-- 10. ROW LEVEL SECURITY (RLS) POLICIES FOR SUPABASE
-- ---------------------------------------------------------------------
-- Aktifkan RLS di setiap tabel
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.art_certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.art_process_proofs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interactions ENABLE ROW LEVEL SECURITY;

-- Policies: users
CREATE POLICY "Public profiles are viewable by everyone" 
    ON public.users FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" 
    ON public.users FOR UPDATE USING (auth.uid() = id);

-- Policies: posts
-- Publik hanya dapat melihat postingan terverifikasi
CREATE POLICY "Public can view verified posts" 
    ON public.posts FOR SELECT 
    USING (verification_status IN ('VERIFIED_HARDWARE_TEE', 'VERIFIED_C2PA') OR auth.uid() = user_id);

CREATE POLICY "Authenticated users can create posts" 
    ON public.posts FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own posts" 
    ON public.posts FOR UPDATE 
    USING (auth.uid() = user_id);

-- Policies: art_certificates
CREATE POLICY "Art certificates are public" 
    ON public.art_certificates FOR SELECT USING (true);

CREATE POLICY "Creators can mint certificates" 
    ON public.art_certificates FOR INSERT 
    WITH CHECK (auth.uid() = creator_id);

-- Policies: art_process_proofs
CREATE POLICY "Proofs are viewable with certificate" 
    ON public.art_process_proofs FOR SELECT USING (true);

CREATE POLICY "Certificate creator can insert proofs" 
    ON public.art_process_proofs FOR INSERT 
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.art_certificates c 
            WHERE c.id = certificate_id AND c.creator_id = auth.uid()
        )
    );

-- Policies: interactions
CREATE POLICY "Interactions are viewable by all" 
    ON public.interactions FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create interactions" 
    ON public.interactions FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own interactions" 
    ON public.interactions FOR DELETE 
    USING (auth.uid() = user_id);

-- =====================================================================
-- SELESAI: Skema Veroia Enterprise Corp (VEC) Siap Dijalankan di Supabase
-- =====================================================================
`;

export interface TableColumn {
  name: string;
  type: string;
  isPk?: boolean;
  isFk?: boolean;
  fkTarget?: string;
  isUnique?: boolean;
  isNullable?: boolean;
  description: string;
  securityBadge?: 'PUBLIC' | 'RESTRICTED_FUZZED' | 'ZERO_TRUST_PRIVATE' | 'CRYPTOGRAPHIC';
}

export interface SchemaTableDef {
  name: string;
  title: string;
  tagline: string;
  partitionStrategy?: string;
  columns: TableColumn[];
  indexes: string[];
  keyFeatures: string[];
}

export const VEC_TABLE_SCHEMAS: SchemaTableDef[] = [
  {
    name: 'users',
    title: '1. Users & Authenticity Reputation',
    tagline: 'Pengguna, skor keaslian, TEE hardware attestation, dan C2PA identity',
    columns: [
      { name: 'id', type: 'UUID', isPk: true, isFk: true, fkTarget: 'auth.users(id)', description: 'Terkoneksi langsung ke Supabase Auth dengan ON DELETE CASCADE', securityBadge: 'PUBLIC' },
      { name: 'username', type: 'VARCHAR(64)', isUnique: true, description: 'Handle unik identitas kreator/verifikator', securityBadge: 'PUBLIC' },
      { name: 'full_name', type: 'VARCHAR(120)', description: 'Nama lengkap resmi atau nama panggung seniman', securityBadge: 'PUBLIC' },
      { name: 'authenticity_score', type: 'NUMERIC(5,2)', description: 'Skor keaslian 0.00 - 100.00 dihitung dari validasi C2PA & rasio dispute', securityBadge: 'PUBLIC' },
      { name: 'trust_tier', type: 'user_trust_tier (ENUM)', description: 'Tingkatan trust: COMMUNITY, CREATOR_PRO, ENTERPRISE_TRUSTED, HARDWARE_ATTESTED', securityBadge: 'PUBLIC' },
      { name: 'kyc_verified', type: 'BOOLEAN', description: 'Status verifikasi identitas dunia nyata', securityBadge: 'PUBLIC' },
      { name: 'hardware_attestation_key_id', type: 'TEXT', description: 'Public Key Secure Enclave / StrongBox untuk memvalidasi tanda tangan hardware', securityBadge: 'CRYPTOGRAPHIC' },
      { name: 'c2pa_signer_dn', type: 'TEXT', description: 'Distinguished Name sertifikat C2PA yang diakui VEC', securityBadge: 'CRYPTOGRAPHIC' },
      { name: 'total_verified_captures', type: 'INTEGER', description: 'Akumulasi jepretan kamera zero-trust yang lolos verifikasi', securityBadge: 'PUBLIC' },
      { name: 'disputed_captures_count', type: 'INTEGER', description: 'Total postingan yang terkena dispute / flagging AI sintetis', securityBadge: 'PUBLIC' },
      { name: 'created_at / updated_at', type: 'TIMESTAMPTZ', description: 'Audit trail waktu pendaftaran dan pembaruan profil', securityBadge: 'PUBLIC' },
    ],
    indexes: [
      'CREATE INDEX idx_users_authenticity_score ON public.users (authenticity_score DESC);',
      'CREATE INDEX idx_users_trust_tier ON public.users (trust_tier);',
      'CREATE INDEX idx_users_created_at ON public.users (created_at DESC);'
    ],
    keyFeatures: [
      'Reputasi anti-sybil berbobot keaslian',
      'Integrasi Secure Enclave & C2PA Trust List',
      'Cascading auto-sync dengan Supabase auth.users'
    ]
  },
  {
    name: 'posts',
    title: '2. Posts (Partitioned Zero-Trust Captures)',
    tagline: 'Tangkapan kamera zero-trust terpartisi range dengan PostGIS exact_location & public_location',
    partitionStrategy: 'RANGE (created_at) -> posts_y2025, posts_y2026, posts_y2027, posts_default',
    columns: [
      { name: 'id', type: 'UUID', isPk: true, description: 'UUID unik postingan (Komposit PK bersama created_at)', securityBadge: 'PUBLIC' },
      { name: 'created_at', type: 'TIMESTAMPTZ', isPk: true, description: 'Waktu jepretan kamera (Partition Key wajib PostgreSQL)', securityBadge: 'PUBLIC' },
      { name: 'user_id', type: 'UUID', isFk: true, fkTarget: 'public.users(id)', description: 'ID fotografer/kreator pemilik tangkapan', securityBadge: 'PUBLIC' },
      { name: 'title', type: 'VARCHAR(200)', description: 'Judul dokumentasi tangkapan', securityBadge: 'PUBLIC' },
      { name: 'media_url', type: 'TEXT', description: 'URL aset foto resolusi tinggi terverifikasi', securityBadge: 'PUBLIC' },
      { name: 'exact_location', type: 'GEOMETRY(Point, 4326)', description: 'Koordinat GPS presisi centimeter dari sensor kamera. TERKUNCI & DILINDUNGI RLS!', securityBadge: 'ZERO_TRUST_PRIVATE' },
      { name: 'public_location', type: 'GEOMETRY(Point, 4326)', description: 'Koordinat ter-fuzz otomatis oleh PostGIS ST_Project untuk privasi publik', securityBadge: 'RESTRICTED_FUZZED' },
      { name: 'fuzz_radius_meters', type: 'INTEGER', description: 'Radius pengaburan lokasi (default 500m s/d 5000m)', securityBadge: 'PUBLIC' },
      { name: 'c2pa_manifest_hash', type: 'VARCHAR(64)', description: 'SHA-256 Manifest C2PA kriptografis tidak dapat dipalsukan', securityBadge: 'CRYPTOGRAPHIC' },
      { name: 'hardware_tee_signature', type: 'TEXT', description: 'Signature ECDSA dari Trusted Execution Environment kamera', securityBadge: 'CRYPTOGRAPHIC' },
      { name: 'camera_make / model', type: 'VARCHAR(64)', description: 'Model kamera teruji (e.g. Sony A7IV C2PA, Leica M11-P)', securityBadge: 'PUBLIC' },
      { name: 'lens_serial_number', type: 'VARCHAR(64)', description: 'Serial number lensa optik yang terdeteksi hardware', securityBadge: 'PUBLIC' },
      { name: 'verification_status', type: 'verification_status (ENUM)', description: 'VERIFIED_HARDWARE_TEE, VERIFIED_C2PA, MANIPULATION_DETECTED, REJECTED_SYNTHETIC', securityBadge: 'PUBLIC' },
      { name: 'authenticity_confidence', type: 'NUMERIC(5,2)', description: 'Tingkat keyakinan sensor (default 98.50%)', securityBadge: 'PUBLIC' },
    ],
    indexes: [
      'CREATE INDEX idx_posts_public_location_gist ON public.posts USING GIST (public_location);',
      'CREATE INDEX idx_posts_exact_location_gist ON public.posts USING GIST (exact_location);',
      'CREATE INDEX idx_posts_user_id ON public.posts (user_id);',
      'CREATE INDEX idx_posts_verification_status ON public.posts (verification_status);'
    ],
    keyFeatures: [
      'Partisi RANGE per tahun untuk skalabilitas miliaran baris data',
      'Dual-layer PostGIS: exact_location (Private) vs public_location (Fuzzed)',
      'Otomatisasi pengacakan koordinat dengan Trigger PostGIS ST_Project',
      'Integrasi C2PA Manifest & Hardware TEE Signature'
    ]
  },
  {
    name: 'art_certificates',
    title: '3. Art Certificates (Provenance & NFC)',
    tagline: 'Silsilah karya seni, Hash NFC NTAG424 DNA, Checksum RAW master, dan status kustodi',
    columns: [
      { name: 'id', type: 'UUID', isPk: true, description: 'ID unik sertifikat keaslian karya (CoA)', securityBadge: 'PUBLIC' },
      { name: 'creator_id', type: 'UUID', isFk: true, fkTarget: 'public.users(id)', description: 'Seniman / kreator asli pembuat karya', securityBadge: 'PUBLIC' },
      { name: 'current_owner_id', type: 'UUID', isFk: true, fkTarget: 'public.users(id)', description: 'Kolektor / pemilik hak fisik saat ini', securityBadge: 'PUBLIC' },
      { name: 'title', type: 'VARCHAR(255)', description: 'Judul resmi karya seni rupa / fotografi master', securityBadge: 'PUBLIC' },
      { name: 'physical_medium', type: 'VARCHAR(120)', description: 'Medium fisik: Oil on Canvas, Cold Cast Bronze, Fine Art Print', securityBadge: 'PUBLIC' },
      { name: 'edition_number / total_editions', type: 'INTEGER', description: 'Nomor edisi cetak (e.g. 1 dari 10 edisi terbatas)', securityBadge: 'PUBLIC' },
      { name: 'nfc_chip_uid_hash', type: 'VARCHAR(64)', isUnique: true, description: 'SHA-256 Hash unik dari UID Chip NFC Fisik yang tertanam di karya', securityBadge: 'CRYPTOGRAPHIC' },
      { name: 'nfc_ntag424_dna_key', type: 'TEXT', description: 'Public verification key untuk challenge-response anti-kloning NTAG424', securityBadge: 'CRYPTOGRAPHIC' },
      { name: 'raw_file_checksum_sha256', type: 'VARCHAR(64)', description: 'Checksum SHA-256 file master sensor RAW asli (DNG/ARW/NEF)', securityBadge: 'CRYPTOGRAPHIC' },
      { name: 'raw_file_format', type: 'VARCHAR(16)', description: 'Format file kamera mentah (DNG, ARW, CR3, NEF)', securityBadge: 'PUBLIC' },
      { name: 'c2pa_root_manifest_digest', type: 'VARCHAR(64)', description: 'Digest manifest root C2PA yang mengunci metadata awal karya', securityBadge: 'CRYPTOGRAPHIC' },
      { name: 'custody_status', type: 'custody_status (ENUM)', description: 'CREATOR_VAULT, IN_TRANSIT, GALLERY_EXHIBITION, PRIVATE_COLLECTION', securityBadge: 'PUBLIC' },
      { name: 'custody_history', type: 'JSONB', description: 'Catatan jejak perpindahan tangan (audit trail silsilah kepemilikan)', securityBadge: 'PUBLIC' },
      { name: 'blockchain_network / token_id', type: 'VARCHAR(64)', description: 'Bridging opsional ke smart contract enterprise blockchain', securityBadge: 'PUBLIC' },
    ],
    indexes: [
      'CREATE INDEX idx_art_cert_creator ON public.art_certificates (creator_id);',
      'CREATE INDEX idx_art_cert_owner ON public.art_certificates (current_owner_id);',
      'CREATE INDEX idx_art_cert_nfc_hash ON public.art_certificates (nfc_chip_uid_hash);',
      'CREATE INDEX idx_art_cert_raw_checksum ON public.art_certificates (raw_file_checksum_sha256);'
    ],
    keyFeatures: [
      'Dual Proof: Verifikasi fisik (NFC NTAG424) & digital (RAW Checksum)',
      'Riwayat kustodi terstruktur dalam JSONB immutable audit log',
      'C2PA Root Manifest anchoring'
    ]
  },
  {
    name: 'art_process_proofs',
    title: '4. Art Process Proofs (Chronological Proof-of-Creation)',
    tagline: 'Tahap pembuatan karya kronologis dari sketsa hingga finishing dengan bukti sensor',
    columns: [
      { name: 'id', type: 'UUID', isPk: true, description: 'ID bukti tahapan pengerjaan', securityBadge: 'PUBLIC' },
      { name: 'certificate_id', type: 'UUID', isFk: true, fkTarget: 'public.art_certificates(id)', description: 'Sertifikat karya induk (CASCADE delete)', securityBadge: 'PUBLIC' },
      { name: 'sequence_order', type: 'INTEGER', description: 'Urutan kronologis progres pembuatan (1, 2, 3...) [UNIQUE per cert]', securityBadge: 'PUBLIC' },
      { name: 'stage_name', type: 'VARCHAR(120)', description: 'Nama tahap: Sketsa Pensil, Layering Cat Minyak, Pemindaian 3D', securityBadge: 'PUBLIC' },
      { name: 'timelapse_frame_hash', type: 'VARCHAR(64)', description: 'Hash SHA-256 dari frame foto/video pembuktian proses', securityBadge: 'CRYPTOGRAPHIC' },
      { name: 'device_hardware_signature', type: 'TEXT', description: 'Tanda tangan TEE kamera/perangkat saat perekaman bukti', securityBadge: 'CRYPTOGRAPHIC' },
      { name: 'studio_location', type: 'GEOMETRY(Point, 4326)', description: 'Titik koordinat PostGIS studio seniman tempat pembuatan', securityBadge: 'RESTRICTED_FUZZED' },
      { name: 'telemetry_data', type: 'JSONB', description: 'Data telemetri: tekanan kuas stylus, lux cahaya ambient, sensor suhu', securityBadge: 'PUBLIC' },
      { name: 'stage_captured_at', type: 'TIMESTAMPTZ', description: 'Waktu aktual pengerjaan tahap karya seni', securityBadge: 'PUBLIC' },
    ],
    indexes: [
      'CREATE INDEX idx_art_proofs_cert_seq ON public.art_process_proofs (certificate_id, sequence_order ASC);',
      'CREATE INDEX idx_art_proofs_captured_at ON public.art_process_proofs (stage_captured_at ASC);',
      'CONSTRAINT uq_cert_stage_sequence UNIQUE (certificate_id, sequence_order);'
    ],
    keyFeatures: [
      'Integritas kronologis tak terpatahkan (sequence_order constrained)',
      'Pembuktian karya asli manusia non-AI generatif',
      'Dukungan telemetri studio dan koordinat spasial PostGIS'
    ]
  },
  {
    name: 'interactions',
    title: '5. Interactions (Comments, Reactions & Voice Notes)',
    tagline: 'Komentar teks, stempel like/reaction, dan rekaman voice note dengan waveform audio',
    columns: [
      { name: 'id', type: 'UUID', isPk: true, description: 'ID interaksi sosial unik', securityBadge: 'PUBLIC' },
      { name: 'user_id', type: 'UUID', isFk: true, fkTarget: 'public.users(id)', description: 'Pengirim interaksi', securityBadge: 'PUBLIC' },
      { name: 'post_id & post_created_at', type: 'UUID & TIMESTAMPTZ', isFk: true, fkTarget: 'public.posts(id, created_at)', description: 'Foreign Key Komposit wajib menuju tabel partisi posts', securityBadge: 'PUBLIC' },
      { name: 'parent_interaction_id', type: 'UUID', isFk: true, fkTarget: 'public.interactions(id)', description: 'Mendukung nested replies / thread komentar bertingkat', securityBadge: 'PUBLIC' },
      { name: 'interaction_type', type: 'interaction_type (ENUM)', description: 'COMMENT, REACTION, VOICE_NOTE, ATTESTATION_ENDORSEMENT', securityBadge: 'PUBLIC' },
      { name: 'comment_body', type: 'TEXT', description: 'Isi teks komentar (wajib jika interaction_type = COMMENT)', securityBadge: 'PUBLIC' },
      { name: 'reaction_type', type: 'reaction_type (ENUM)', description: 'AUTHENTIC_SEAL, APPLAUD, VERIFY_VOTE, INSPECTED, FLAG_DISPUTE', securityBadge: 'PUBLIC' },
      { name: 'voice_note_url', type: 'TEXT', description: 'URL file rekaman audio WebM/Opus terkompresi', securityBadge: 'PUBLIC' },
      { name: 'voice_duration_seconds', type: 'NUMERIC(6,2)', description: 'Durasi audio voice note dalam detik', securityBadge: 'PUBLIC' },
      { name: 'voice_waveform', type: 'JSONB', description: 'Array amplitudo normalisasi [0.12, 0.45, 0.82] untuk wave visualizer', securityBadge: 'PUBLIC' },
      { name: 'voice_transcription', type: 'TEXT', description: 'Transkripsi otomatis suara-ke-teks untuk aksesibilitas', securityBadge: 'PUBLIC' },
      { name: 'author_authenticity_weight', type: 'NUMERIC(5,2)', description: 'Bobot suara dihitung dari skor keaslian profil pengguna (Anti-Sybil)', securityBadge: 'PUBLIC' },
    ],
    indexes: [
      'CREATE INDEX idx_interactions_post ON public.interactions (post_id, post_created_at, created_at DESC);',
      'CREATE INDEX idx_interactions_user ON public.interactions (user_id);',
      'CREATE INDEX idx_interactions_parent ON public.interactions (parent_interaction_id);'
    ],
    keyFeatures: [
      'Mendukung voice notes native dengan metadata waveform JSONB',
      'Foreign Key komposit teruji terhadap tabel partisi PostgreSQL',
      'Constraint pemeriksaan integritas tipe (chk_interaction_payload)'
    ]
  }
];

export const VEC_SAMPLE_SEED_SQL = `-- =====================================================================
-- VEC DEMO SEED DATA (Supabase SQL Editor Ready)
-- Data simulasi zero-trust camera, PostGIS GPS, NFC art & voice notes
-- =====================================================================

-- 0. Masukkan Akun Mock ke auth.users (Mencegah Error FK users_id_fkey)
INSERT INTO auth.users (
  id,
  instance_id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at
)
VALUES 
  ('a1111111-1111-4111-8111-111111111111', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'budi@vec.enterprise', crypt('VECsecret2026!', gen_salt('bf')), NOW(), '{"provider":"email","providers":["email"]}', '{"full_name":"Budi Hartono"}', NOW(), NOW()),
  ('b2222222-2222-4222-8222-222222222222', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'sarah@vec.enterprise', crypt('VECsecret2026!', gen_salt('bf')), NOW(), '{"provider":"email","providers":["email"]}', '{"full_name":"Sarah Jenkins"}', NOW(), NOW()),
  ('c3333333-3333-4333-8333-333333333333', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'galeri@vec.enterprise', crypt('VECsecret2026!', gen_salt('bf')), NOW(), '{"provider":"email","providers":["email"]}', '{"full_name":"Galeri Seni Nusantara"}', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 1. Insert Mock Users
INSERT INTO public.users (id, username, full_name, authenticity_score, trust_tier, kyc_verified, total_verified_captures)
VALUES 
  ('a1111111-1111-4111-8111-111111111111', 'budi_hartono_vec', 'Budi Hartono (VEC Master Curator)', 99.20, 'HARDWARE_ATTESTED', true, 142),
  ('b2222222-2222-4222-8222-222222222222', 'sarah_leica_artist', 'Sarah Jenkins (Fine Art Photographer)', 96.80, 'CREATOR_PRO', true, 89),
  ('c3333333-3333-4333-8333-333333333333', 'galeri_nusantara', 'Galeri Seni Nusantara (Verified Vault)', 98.50, 'ENTERPRISE_TRUSTED', true, 210)
ON CONFLICT (id) DO UPDATE SET authenticity_score = EXCLUDED.authenticity_score;

-- 2. Insert Zero-Trust Camera Posts with PostGIS Coordinates
-- Koordinat exact: Monas Jakarta (106.827153, -6.175392)
-- Trigger trg_vec_fuzz_post_location akan otomatis membuat public_location ter-fuzz!
INSERT INTO public.posts (
  id,
  user_id,
  title,
  caption,
  media_url,
  media_thumbnail_url,
  exact_location,
  public_location,
  fuzz_radius_meters,
  location_place_name,
  c2pa_manifest_hash,
  hardware_tee_signature,
  camera_make,
  camera_model,
  lens_serial_number,
  verification_status,
  authenticity_confidence,
  created_at
)
VALUES (
  'd4444444-4444-4444-8444-444444444444',
  'b2222222-2222-4222-8222-222222222222',
  'Golden Hour over Batavia Heritage',
  'Captured with Sony Alpha 7R V with hardware C2PA cryptographic seal. Zero synthetic AI intervention.',
  'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1600&q=80',
  'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=400&q=80',
  ST_SetSRID(ST_MakePoint(106.827153, -6.175392), 4326),
  ST_SetSRID(ST_MakePoint(106.827153, -6.175392), 4326), -- Akan otomatis di-fuzz oleh trigger
  750,
  'Kawasan Monas & Cagar Budaya, DKI Jakarta',
  '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08',
  'MEQCIC7m2m6h+K4eQ3p0K7vA...HardwareSecureEnclaveSignature...',
  'Sony',
  'Alpha 7R V (C2PA Firmware)',
  'SN-SEL2470GM2-892110',
  'VERIFIED_HARDWARE_TEE',
  99.80,
  TIMESTAMPTZ '2026-06-15 10:30:00+00'
)
ON CONFLICT (id, created_at) DO NOTHING;

-- 3. Insert Art Certificate (CoA) dengan NFC Hash & RAW Checksum
INSERT INTO public.art_certificates (
  id,
  creator_id,
  current_owner_id,
  title,
  description,
  physical_medium,
  edition_number,
  total_editions,
  nfc_chip_uid_hash,
  nfc_ntag424_dna_key,
  raw_file_checksum_sha256,
  raw_file_format,
  c2pa_root_manifest_digest,
  custody_status
)
VALUES (
  'e5555555-5555-4555-8555-555555555555',
  'b2222222-2222-4222-8222-222222222222',
  'c3333333-3333-4333-8333-333333333333',
  'Simfoni Jiwa Borneo No. 03',
  'Karya fine art print museum grade dengan pigmen arsip tahan 200 tahun. Dilengkapi chip fisik NFC NTAG424 DNA.',
  'Hahnemühle Photo Rag 308gsm with Archival Pigment',
  1,
  5,
  'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
  'NTAG424-SUN-KEY-PUB-88192019-VEC-VERIFY',
  '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8',
  'ARW',
  '7d793037a0760186574b0282f2f435e70aa3c3e38c7f9991207d5705a2e586c0',
  'GALLERY_EXHIBITION'
)
ON CONFLICT (id) DO NOTHING;

-- 4. Insert Chronological Art Process Proofs (Tahapan Kronologis)
INSERT INTO public.art_process_proofs (
  certificate_id,
  sequence_order,
  stage_name,
  description,
  proof_media_url,
  timelapse_frame_hash,
  device_hardware_signature,
  stage_captured_at
)
VALUES 
  (
    'e5555555-5555-4555-8555-555555555555',
    1,
    'Tahap 1: Kalibrasi RAW & Sensor Profiling',
    'Pengambilan baseline sensor temperature dan pencahayaan studio 5500K.',
    'https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&w=800&q=80',
    'a1b2c3d4e5f60718293a4b5c6d7e8f90123456789abcdef0123456789abcdef0',
    'TEE-SIG-STAGE-1-X99281',
    TIMESTAMPTZ '2026-05-10 08:15:00+00'
  ),
  (
    'e5555555-5555-4555-8555-555555555555',
    2,
    'Tahap 2: Pengaplikasian Pigmen & Proof Print',
    'Verifikasi spektrum warna fisik dan inspeksi serat kertas Hahnemühle.',
    'https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?auto=format&fit=crop&w=800&q=80',
    'b2c3d4e5f60718293a4b5c6d7e8f90123456789abcdef0123456789abcdef01a',
    'TEE-SIG-STAGE-2-X99282',
    TIMESTAMPTZ '2026-05-12 14:40:00+00'
  ),
  (
    'e5555555-5555-4555-8555-555555555555',
    3,
    'Tahap 3: Penyematan Chip NFC Fisik & Kunci Enkripsi VEC',
    'Pemasangan chip NTAG424 DNA di sudut kanan bawah pigura dan enkripsi SHA-256.',
    'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=800&q=80',
    'c3d4e5f60718293a4b5c6d7e8f90123456789abcdef0123456789abcdef01a2b',
    'TEE-SIG-STAGE-3-X99283',
    TIMESTAMPTZ '2026-05-15 16:00:00+00'
  )
ON CONFLICT (certificate_id, sequence_order) DO NOTHING;

-- 5. Insert Interactions (Komentar, Stempel Keaslian, dan Voice Note)
INSERT INTO public.interactions (
  user_id,
  post_id,
  post_created_at,
  interaction_type,
  comment_body,
  author_authenticity_weight
)
VALUES (
  'a1111111-1111-4111-8111-111111111111',
  'd4444444-4444-4444-8444-444444444444',
  TIMESTAMPTZ '2026-06-15 10:30:00+00',
  'COMMENT',
  'Manifest C2PA tervalidasi sempurna. Spektrum cahaya dan telemetry sensor kamera Sony A7RV terbukti murni tanpa rekonstruksi AI.',
  1.00
);

-- Voice Note Interaction dengan Waveform
INSERT INTO public.interactions (
  user_id,
  post_id,
  post_created_at,
  interaction_type,
  voice_note_url,
  voice_duration_seconds,
  voice_waveform,
  voice_transcription,
  author_authenticity_weight
)
VALUES (
  'c3333333-3333-4333-8333-333333333333',
  'd4444444-4444-4444-8444-444444444444',
  TIMESTAMPTZ '2026-06-15 10:30:00+00',
  'VOICE_NOTE',
  'https://storage.googleapis.com/vec-vault-audio/voice_notes/audit_voice_9912.opus',
  24.50,
  '[0.12, 0.25, 0.68, 0.95, 0.74, 0.43, 0.88, 0.61, 0.32, 0.55, 0.78, 0.92, 0.45, 0.18]'::jsonb,
  'Halo rekan kurator VEC, kami dari Galeri Nusantara telah memeriksa chip fisik NFC NTAG424 dan sensor RAW. Semua checksum identik 100 persen.',
  0.98
);
`;
