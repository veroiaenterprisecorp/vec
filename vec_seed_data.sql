-- =====================================================================
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