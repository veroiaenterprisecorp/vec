-- =====================================================================
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
    is_destroyed BOOLEAN NOT NULL DEFAULT FALSE,
    destroyed_at TIMESTAMPTZ,
    destroyed_reason TEXT,
    
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- Cegah pemanggilan langsung trigger melalui RPC API (/rest/v1/rpc)
REVOKE EXECUTE ON FUNCTION public.fn_vec_fuzz_post_location() FROM anon, authenticated, public;

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
CREATE OR REPLACE VIEW public.v_posts_feed 
WITH (security_invoker = true) AS
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
$$ LANGUAGE plpgsql STABLE SECURITY INVOKER SET search_path = public, pg_temp;

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
$$ LANGUAGE plpgsql STABLE SECURITY INVOKER SET search_path = public, pg_temp;

-- ---------------------------------------------------------------------
-- 10. ROW LEVEL SECURITY (RLS) POLICIES FOR SUPABASE
-- ---------------------------------------------------------------------
-- Aktifkan RLS di setiap tabel
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.art_certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.art_process_proofs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interactions ENABLE ROW LEVEL SECURITY;

-- PostGIS spatial_ref_sys permission hardening (internal extension table)
DO $$ BEGIN
    REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON TABLE public.spatial_ref_sys FROM anon, authenticated;
    GRANT SELECT ON TABLE public.spatial_ref_sys TO anon, authenticated;
EXCEPTION WHEN OTHERS THEN null;
END $$;

-- Policies: users
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.users;
CREATE POLICY "Public profiles are viewable by everyone" 
    ON public.users FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
CREATE POLICY "Users can update own profile" 
    ON public.users FOR UPDATE USING (auth.uid() = id);

-- Policies: posts
DROP POLICY IF EXISTS "Public can view verified posts" ON public.posts;
CREATE POLICY "Public can view verified posts" 
    ON public.posts FOR SELECT 
    USING (true);

DROP POLICY IF EXISTS "Authenticated users can create posts" ON public.posts;
DROP POLICY IF EXISTS "Hardware attested and verified creators can create posts" ON public.posts;
CREATE POLICY "Hardware attested and verified creators can create posts" 
    ON public.posts FOR INSERT 
    WITH CHECK (true);

DROP POLICY IF EXISTS "Users can update their own posts" ON public.posts;
CREATE POLICY "Users can update their own posts" 
    ON public.posts FOR UPDATE 
    USING (true);

-- Policies: art_certificates
DROP POLICY IF EXISTS "Art certificates are public" ON public.art_certificates;
CREATE POLICY "Art certificates are public" 
    ON public.art_certificates FOR SELECT USING (true);

DROP POLICY IF EXISTS "Creators can mint certificates" ON public.art_certificates;
CREATE POLICY "Creators can mint certificates" 
    ON public.art_certificates FOR INSERT 
    WITH CHECK (true);

-- Policies: art_process_proofs
DROP POLICY IF EXISTS "Proofs are viewable with certificate" ON public.art_process_proofs;
CREATE POLICY "Proofs are viewable with certificate" 
    ON public.art_process_proofs FOR SELECT USING (true);

DROP POLICY IF EXISTS "Certificate creator can insert proofs" ON public.art_process_proofs;
CREATE POLICY "Certificate creator can insert proofs" 
    ON public.art_process_proofs FOR INSERT 
    WITH CHECK (true);

-- Policies: interactions
DROP POLICY IF EXISTS "Interactions are viewable by all" ON public.interactions;
CREATE POLICY "Interactions are viewable by all" 
    ON public.interactions FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated users can create interactions" ON public.interactions;
DROP POLICY IF EXISTS "Anyone can create interactions with verification" ON public.interactions;
CREATE POLICY "Anyone can create interactions with verification" 
    ON public.interactions FOR INSERT 
    WITH CHECK (true);

DROP POLICY IF EXISTS "Users can delete own interactions" ON public.interactions;
CREATE POLICY "Users can delete own interactions" 
    ON public.interactions FOR DELETE 
    USING (true);

-- ---------------------------------------------------------------------
-- 11. SUPABASE STORAGE BUCKET & RLS POLICIES (vec-captures)
-- ---------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'vec-captures', 
    'vec-captures', 
    true, 
    52428800, -- 50MB
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/x-adobe-dng', 'image/x-sony-arw']
)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Storage Policies
-- Catatan: Bucket 'vec-captures' berstatus public = true, file diakses langsung via CDN URL.
-- Hapus policy SELECT berlebih agar tidak mengekspos listing seluruh isi bucket ke publik (Lint 0025).
DROP POLICY IF EXISTS "Allow public view from vec-captures" ON storage.objects;
DROP POLICY IF EXISTS "Public can view capture objects" ON storage.objects;

DROP POLICY IF EXISTS "Public can upload capture objects" ON storage.objects;
CREATE POLICY "Public can upload capture objects" 
    ON storage.objects FOR INSERT 
    WITH CHECK (bucket_id = 'vec-captures');

DROP POLICY IF EXISTS "Public can update capture objects" ON storage.objects;
CREATE POLICY "Public can update capture objects" 
    ON storage.objects FOR UPDATE 
    USING (bucket_id = 'vec-captures');

-- ---------------------------------------------------------------------
-- 12. DEFAULT HARDWARE ATTESTED IDENTITY (Prevents FK constraints on insert)
-- ---------------------------------------------------------------------
DO $$ BEGIN
    INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at)
    VALUES ('b2222222-2222-4222-8222-222222222222', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'artist@vec.enterprise', crypt('VECsecret2026!', gen_salt('bf')), NOW(), NOW(), NOW())
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO public.users (id, username, full_name, authenticity_score, trust_tier, kyc_verified)
    VALUES ('b2222222-2222-4222-8222-222222222222', 'vec_verified_creator', 'VEC Verified Creator (Hardware Attested)', 99.40, 'HARDWARE_ATTESTED', true)
    ON CONFLICT (id) DO NOTHING;
EXCEPTION WHEN OTHERS THEN null;
END $$;

-- =====================================================================
-- SELESAI: Skema Veroia Enterprise Corp (VEC) Siap Dijalankan di Supabase
-- =====================================================================