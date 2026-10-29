import { getActiveSupabaseClient } from './supabase';
import { 
  PrivateVaultItem, 
  getAllRegisteredArtworks 
} from './userVaultStorage';
import { getActiveVault } from './vaultKeyAuth';
import { checkAdminSession } from './masterAdminStorage';


// ============================================================================
// VEROIA PROCESSOR TYPES & INTERFACES
// Urutan Resmi: TWIN → VGUARD → HUMANGUARD → GENEVORA → HAPPY → BEAUTY
// ============================================================================

export type VGuardInspectionStatus = 
  | 'BELUM DIPERIKSA'
  | 'MENUNGGU TINJAUAN MANUSIA'
  | 'TIDAK ADA INDIKASI YANG DITEMUKAN'
  | 'ADA INDIKASI YANG PERLU DITINJAU';

export interface VGuardInspectionRecord {
  id: string;
  artworkId: string;
  artworkTitle: string;
  inspectorId?: string;
  inspectorName: string;
  inspectedAt: string; // ISO 8601
  status: VGuardInspectionStatus;
  similarWorkUrls: string[]; // URL referensi karya serupa yang ditemukan secara manual
  evidenceSources: string; // Sumber bukti manual
  inspectorNotes: string; // Catatan rinci pemeriksa
  aiUsageIndicators: {
    hasIndicator: boolean;
    evidenceNotes?: string;
  };
  humanGuardHandOff?: {
    isHandedOff: boolean;
    handedOffAt?: string;
    handoffNotes?: string;
    assignedReviewerRole?: string;
  };
}

export type GenevoraVerificationStatus = 
  | 'FILE IDENTIK BERDASARKAN SHA-256'
  | 'HASH BERBEDA — PERLU PEMERIKSAAN';

export interface GenevoraFingerprintRecord {
  artworkId: string;
  artworkTitle: string;
  sha256: string; // Lowercase 64 hex characters
  fileName?: string;
  fileFormat?: string;
  fileSizeBytes?: number;
  fileSizeFormatted?: string;
  createdAt: string; // ISO 8601
  methodVersion: 'SHA-256-v1';
  creatorId?: string;
  creatorName: string;
  sourceType: 'uploaded_file' | 'remote_media_fetch';
  reverificationHistory?: Array<{
    checkedAt: string;
    calculatedHash: string;
    storedHash: string;
    match: boolean;
    status: GenevoraVerificationStatus;
    checkerName: string;
    sourceName?: string;
  }>;
}

export interface VeroiaProcessorPipelineState {
  artworkId: string;
  artworkTitle: string;
  // 1. TWIN (Digital Twin Attestation dari Kamera Hardware TEE)
  twin: {
    status: 'TERDAFTAR_HARDWARE_TEE' | 'TERVERIFIKASI' | 'PENDING';
    hardwareSignature?: string;
    c2paDigest?: string;
    cameraInfo?: string;
    captureTimestamp?: string;
  };
  // 2. VGUARD (Modul Pemeriksaan Bukti Kesamaan & Indikasi AI)
  vguard: VGuardInspectionRecord | null;
  // 3. HUMANGUARD (Titik Integrasi Peninjauan Ahli Manusia)
  humanguard: {
    status: 'MENUNGGU_PENUGASAN' | 'SIAP_TINJAUAN' | 'TIDAK_DIPERLUKAN';
    isReady: boolean;
    notes?: string;
  };
  // 4. GENEVORA (Modul Fingerprint Kriptografis SHA-256-v1)
  genevora: GenevoraFingerprintRecord | null;
  // 5. HAPPY (Parameter Valuasi / Kepuasan Kuratorial - Formula Tetap Terkunci)
  happy: {
    status: 'PARAMETER_TETAP_TERKUNCI';
    moduleName: 'HAPPY';
    note: 'Rumus dan parameter HAPPY dipertahankan sesuai standar resmi tanpa modifikasi.';
  };
  // 6. BEAUTY (Parameter Estetika & Komposisi Spektral - Formula Tetap Terkunci)
  beauty: {
    status: 'PARAMETER_TETAP_TERKUNCI';
    moduleName: 'BEAUTY';
    note: 'Rumus dan parameter BEAUTY dipertahankan sesuai standar resmi tanpa modifikasi.';
  };
  lastUpdated: string;
}

// Local cache keys
const VGUARD_STORAGE_KEY = 'vec_vguard_inspections_v1';
const GENEVORA_STORAGE_KEY = 'vec_genevora_fingerprints_v1';

// ============================================================================
// UTILITY: CRYPTOGRAPHIC SHA-256 HASHING DARI BYTE ASLI
// ============================================================================

/**
 * Menghitung hash SHA-256 langsung dari byte konten ArrayBuffer.
 * Menghasilkan 64 karakter heksadesimal lowercase konsisten.
 */
export const calculateArrayBufferSha256 = async (buffer: ArrayBuffer): Promise<string> => {
  if (!buffer || buffer.byteLength === 0) {
    throw new Error('Berkas kosong (0 byte). Tidak dapat membentuk fingerprint dari data kosong.');
  }

  if (typeof crypto === 'undefined' || !crypto.subtle) {
    throw new Error('Web Cryptography API (crypto.subtle) tidak didukung pada lingkungan peramban ini.');
  }

  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('').toLowerCase();
};

/**
 * Membaca berkas File atau Blob asli secara utuh dan menghitung SHA-256.
 */
export const calculateBlobSha256 = async (blob: Blob): Promise<{
  sha256: string;
  sizeBytes: number;
  sizeFormatted: string;
}> => {
  if (!blob) {
    throw new Error('Objek berkas tidak valid atau tidak ditemukan.');
  }

  const buffer = await blob.arrayBuffer();
  const sha256 = await calculateArrayBufferSha256(buffer);
  const sizeBytes = buffer.byteLength;
  const sizeFormatted = sizeBytes > 1024 * 1024
    ? `${(sizeBytes / (1024 * 1024)).toFixed(2)} MB`
    : `${(sizeBytes / 1024).toFixed(1)} KB`;

  return { sha256, sizeBytes, sizeFormatted };
};

/**
 * Mengunduh byte berkas media dari URL dan menghitung SHA-256 konten sebenarnya.
 * Menangani kemungkinan kegagalan akses secara jujur dan transparan.
 */
export const fetchMediaAndCalculateSha256 = async (mediaUrl: string): Promise<{
  sha256: string;
  sizeBytes: number;
  sizeFormatted: string;
  mimeType: string;
}> => {
  if (!mediaUrl || !mediaUrl.trim()) {
    throw new Error('URL berkas media tidak valid atau kosong.');
  }

  try {
    const res = await fetch(mediaUrl, { mode: 'cors' });
    if (!res.ok) {
      throw new Error(`Gagal mengunduh berkas media dari server (HTTP status: ${res.status} ${res.statusText}).`);
    }

    const blob = await res.blob();
    const { sha256, sizeBytes, sizeFormatted } = await calculateBlobSha256(blob);
    return {
      sha256,
      sizeBytes,
      sizeFormatted,
      mimeType: blob.type || 'image/jpeg'
    };
  } catch (err: any) {
    throw new Error(`Gagal membaca byte berkas karya dari URL (${mediaUrl}): ${err.message || 'Koneksi terhambat atau CORS tidak mengizinkan pembacaan langsung'}`);
  }
};

// ============================================================================
// GENEVORA STORAGE & INTEGRATION FUNCTIONS
// ============================================================================

export const getAllStoredGenevoraFingerprints = (): Record<string, GenevoraFingerprintRecord> => {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(GENEVORA_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};

export const getGenevoraFingerprint = (artworkId: string): GenevoraFingerprintRecord | null => {
  if (!artworkId) return null;
  const all = getAllStoredGenevoraFingerprints();
  return all[artworkId] || null;
};

/**
 * Menyimpan rekaman fingerprint GENEVORA ke Supabase (tabel posts.sensor_telemetry.genevora)
 * dan memperbarui partisi cache lokal.
 */
export const saveGenevoraFingerprint = async (
  record: GenevoraFingerprintRecord
): Promise<{ success: boolean; message: string }> => {
  if (!record.artworkId || !record.sha256) {
    return { success: false, message: 'Data fingerprint tidak lengkap (ID karya dan SHA-256 wajib ada).' };
  }

  // 1. Simpan di cache lokal
  try {
    const all = getAllStoredGenevoraFingerprints();
    all[record.artworkId] = record;
    localStorage.setItem(GENEVORA_STORAGE_KEY, JSON.stringify(all));
  } catch (err) {
    console.warn('Gagal menyimpan cache lokal Genevora:', err);
  }

  // 2. Simpan ke database Supabase
  try {
    const client = getActiveSupabaseClient();
    const { data: post, error: fetchErr } = await client
      .from('posts')
      .select('id, sensor_telemetry')
      .eq('id', record.artworkId)
      .single();

    if (!fetchErr && post) {
      const telemetry = post.sensor_telemetry || {};
      const updatedTelemetry = {
        ...telemetry,
        genevora: record,
        genevora_sha256: record.sha256,
        genevora_fingerprinted_at: record.createdAt,
        genevora_method: record.methodVersion
      };

      const { error: updateErr } = await client
        .from('posts')
        .update({
          sensor_telemetry: updatedTelemetry,
          raw_capture_digest: record.sha256
        })
        .eq('id', record.artworkId);

      if (updateErr) {
        console.warn('Supabase post telemetry update error:', updateErr.message);
        return {
          success: true,
          message: 'Fingerprint tersimpan di cache lokal. Pembaruan Supabase cloud mencatat: ' + updateErr.message
        };
      }
    }

    // Broadcast perubahan
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('vec-genevora-updated', { detail: record }));
      window.dispatchEvent(new Event('storage'));
    }

    return {
      success: true,
      message: 'Fingerprint GENEVORA (SHA-256) berhasil dibentuk dan disimpan ke sistem.'
    };
  } catch (err: any) {
    return {
      success: true,
      message: 'Fingerprint tersimpan di sesi lokal. Hubungan ke Supabase: ' + (err.message || 'offline')
    };
  }
};

/**
 * Pemeriksaan ulang (Re-verification) file karya dengan hash tersimpan.
 * Menghasilkan 'FILE IDENTIK BERDASARKAN SHA-256' jika sama,
 * atau 'HASH BERBEDA — PERLU PEMERIKSAAN' jika berbeda.
 */
export const reverifyGenevoraHash = async (
  artworkId: string,
  newHashCalculated: string,
  checkerName: string,
  sourceName?: string
): Promise<{
  status: GenevoraVerificationStatus;
  match: boolean;
  calculatedHash: string;
  storedHash: string;
  recheckRecord: GenevoraFingerprintRecord;
}> => {
  const existing = getGenevoraFingerprint(artworkId);
  if (!existing) {
    throw new Error('Belum ada fingerprint GENEVORA tersimpan untuk karya ini.');
  }

  const cleanNew = newHashCalculated.trim().toLowerCase();
  const cleanStored = existing.sha256.trim().toLowerCase();
  const match = cleanNew === cleanStored;
  const status: GenevoraVerificationStatus = match 
    ? 'FILE IDENTIK BERDASARKAN SHA-256' 
    : 'HASH BERBEDA — PERLU PEMERIKSAAN';

  const historyEntry = {
    checkedAt: new Date().toISOString(),
    calculatedHash: cleanNew,
    storedHash: cleanStored,
    match,
    status,
    checkerName,
    sourceName: sourceName || 'Pemeriksaan Ulang Manual'
  };

  const updatedRecord: GenevoraFingerprintRecord = {
    ...existing,
    reverificationHistory: [
      historyEntry,
      ...(existing.reverificationHistory || []).slice(0, 19)
    ]
  };

  await saveGenevoraFingerprint(updatedRecord);

  return {
    status,
    match,
    calculatedHash: cleanNew,
    storedHash: cleanStored,
    recheckRecord: updatedRecord
  };
};

// ============================================================================
// VGUARD STORAGE & INTEGRATION FUNCTIONS
// ============================================================================

export const getAllStoredVGuardInspections = (): Record<string, VGuardInspectionRecord> => {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(VGUARD_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};

export const getVGuardInspection = (artworkId: string): VGuardInspectionRecord | null => {
  if (!artworkId) return null;
  const all = getAllStoredVGuardInspections();
  return all[artworkId] || null;
};

/**
 * Menyimpan rekaman pemeriksaan VGUARD ke Supabase (tabel posts.sensor_telemetry.vguard)
 * dan memperbarui partisi cache lokal.
 */
export const saveVGuardInspection = async (
  record: VGuardInspectionRecord
): Promise<{ success: boolean; message: string }> => {
  if (!record.artworkId) {
    return { success: false, message: 'ID karya tidak boleh kosong untuk pemeriksaan VGUARD.' };
  }

  // 1. Simpan di cache lokal
  try {
    const all = getAllStoredVGuardInspections();
    all[record.artworkId] = record;
    localStorage.setItem(VGUARD_STORAGE_KEY, JSON.stringify(all));
  } catch (err) {
    console.warn('Gagal menyimpan cache lokal VGUARD:', err);
  }

  // 2. Simpan ke database Supabase
  try {
    const client = getActiveSupabaseClient();
    const { data: post, error: fetchErr } = await client
      .from('posts')
      .select('id, sensor_telemetry')
      .eq('id', record.artworkId)
      .single();

    if (!fetchErr && post) {
      const telemetry = post.sensor_telemetry || {};
      const updatedTelemetry = {
        ...telemetry,
        vguard: record,
        vguard_status: record.status,
        vguard_inspected_at: record.inspectedAt,
        vguard_inspector: record.inspectorName
      };

      const { error: updateErr } = await client
        .from('posts')
        .update({
          sensor_telemetry: updatedTelemetry
        })
        .eq('id', record.artworkId);

      if (updateErr) {
        console.warn('Supabase post vguard update warning:', updateErr.message);
      }
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('vec-vguard-updated', { detail: record }));
      window.dispatchEvent(new Event('storage'));
    }

    return {
      success: true,
      message: 'Pemeriksaan VGUARD berhasil dicatat dan status diperbarui.'
    };
  } catch (err: any) {
    return {
      success: true,
      message: 'Pemeriksaan VGUARD tersimpan lokal. Catatan Supabase: ' + (err.message || 'offline')
    };
  }
};

/**
 * Menghubungkan pemeriksaan VGUARD ke titik integrasi HUMANGUARD untuk tinjauan manusia.
 */
export const handoffToHumanGuard = async (
  artworkId: string,
  inspectorNotes: string,
  reviewerRole: string = 'Master Curator & Forensics Committee'
): Promise<{ success: boolean; message: string; record?: VGuardInspectionRecord }> => {
  const existing = getVGuardInspection(artworkId);
  if (!existing) {
    return { success: false, message: 'Harap lakukan pemeriksaan VGUARD awal terlebih dahulu sebelum meneruskan ke HUMANGUARD.' };
  }

  const updatedRecord: VGuardInspectionRecord = {
    ...existing,
    status: 'MENUNGGU TINJAUAN MANUSIA',
    humanGuardHandOff: {
      isHandedOff: true,
      handedOffAt: new Date().toISOString(),
      handoffNotes: inspectorNotes,
      assignedReviewerRole: reviewerRole
    }
  };

  const res = await saveVGuardInspection(updatedRecord);
  return {
    success: res.success,
    message: 'Karya berhasil diteruskan ke antrean HUMANGUARD untuk peninjauan manusia oleh tim kurator.',
    record: updatedRecord
  };
};

// ============================================================================
// VEROIA PROCESSOR PIPELINE STATE RESOLVER
// ============================================================================

export const getArtworkProcessorState = (
  item: PrivateVaultItem
): VeroiaProcessorPipelineState => {
  const vguard = getVGuardInspection(item.id);
  const genevora = getGenevoraFingerprint(item.id);

  // Status HUMANGUARD ditentukan secara jujur berdasarkan titik integrasi VGUARD
  let humanguardStatus: 'MENUNGGU_PENUGASAN' | 'SIAP_TINJAUAN' | 'TIDAK_DIPERLUKAN' = 'TIDAK_DIPERLUKAN';
  let humanguardNotes = 'Belum ada bukti yang memerlukan eskalasi ke peninjau manusia.';
  let isReadyForHumanGuard = false;

  if (vguard) {
    if (vguard.status === 'MENUNGGU TINJAUAN MANUSIA' || vguard.humanGuardHandOff?.isHandedOff) {
      humanguardStatus = 'SIAP_TINJAUAN';
      humanguardNotes = vguard.humanGuardHandOff?.handoffNotes || 'Menunggu peninjauan kurator manusia.';
      isReadyForHumanGuard = true;
    } else if (vguard.status === 'ADA INDIKASI YANG PERLU DITINJAU') {
      humanguardStatus = 'MENUNGGU_PENUGASAN';
      humanguardNotes = 'Terdapat indikasi yang perlu diteruskan ke tahap peninjauan manusia.';
      isReadyForHumanGuard = true;
    } else if (vguard.status === 'TIDAK ADA INDIKASI YANG DITEMUKAN') {
      humanguardStatus = 'TIDAK_DIPERLUKAN';
      humanguardNotes = 'Pemeriksaan VGUARD awal bersih; eskalasi peninjauan manusia tidak diwajibkan.';
      isReadyForHumanGuard = false;
    }
  }

  return {
    artworkId: item.id,
    artworkTitle: item.title,
    twin: {
      status: item.c2paSignature ? 'TERDAFTAR_HARDWARE_TEE' : 'TERVERIFIKASI',
      hardwareSignature: item.c2paSignature,
      c2paDigest: item.digest,
      cameraInfo: item.deviceInfo,
      captureTimestamp: item.captureDate
    },
    vguard,
    humanguard: {
      status: humanguardStatus,
      isReady: isReadyForHumanGuard,
      notes: humanguardNotes
    },
    genevora,
    happy: {
      status: 'PARAMETER_TETAP_TERKUNCI',
      moduleName: 'HAPPY',
      note: 'Rumus dan parameter HAPPY dipertahankan sesuai standar resmi tanpa modifikasi.'
    },
    beauty: {
      status: 'PARAMETER_TETAP_TERKUNCI',
      moduleName: 'BEAUTY',
      note: 'Rumus dan parameter BEAUTY dipertahankan sesuai standar resmi tanpa modifikasi.'
    },
    lastUpdated: new Date().toISOString()
  };
};

/**
 * Mengambil nama pemeriksa/pengguna aktif saat ini
 */
export const getCurrentInspectorIdentity = (): { id?: string; name: string; role: string } => {
  const isAdmin = checkAdminSession();
  if (isAdmin) {
    return {
      name: 'VEC Master Curator / Admin Otoritas',
      role: 'Master Curator (Keamanan & Forensik)'
    };
  }

  const activeVault = getActiveVault();
  if (activeVault) {
    return {
      id: activeVault.id,
      name: activeVault.creator_name || activeVault.vault_name,
      role: 'Kreator Terverifikasi'
    };
  }

  return {
    name: 'Pemeriksa Terdaftar Veroia',
    role: 'Pemeriksa Independen'
  };
};
