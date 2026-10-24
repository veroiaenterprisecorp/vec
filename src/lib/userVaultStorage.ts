import { supabase, getActiveSupabaseClient } from './supabase';
import { isVaultUnlocked, getActiveVault, getActiveVaultId, DEFAULT_MASTER_VAULT } from './vaultKeyAuth';

export interface PrivateVaultItem {
  id: string;
  title: string;
  photoUrl: string;
  digest: string;
  resolution: string;
  fileSize: string;
  captureDate: string;
  deviceInfo: string;
  isPrivate: boolean;
  isPublished: boolean;
  vaultId?: string;
  vaultName?: string;
  creatorName?: string;
  fuzzedLocation?: string;
  c2paSignature: string;
  sensorType: string;
  storageTarget?: 'cloud_supabase';
  cloudStorageUrl?: string;
  cloudBucket?: string;
  cloudPath?: string;
  uploadStatus?: 'uploaded' | 'uploading' | 'failed';
  uploadError?: string;
  createdAt?: number;
  description?: string;
}

export interface UserVaultProfile {
  userId: string;
  displayName: string;
  trustTier: string;
  authenticityScore: number;
  hardwareEnclaveId: string;
  encryptionMode: string;
  storageUsedBytes: number;
  maxStorageBytes: number;
  cloudStorageEnabled?: boolean;
}

const STORAGE_KEY = 'vec_user_private_vault_items';
const DESTROYED_STORAGE_KEY = 'vec_permanently_destroyed_artworks_v1';

const normalizeValue = (value?: string): string => (value || '').trim().toLowerCase();

export const getDestroyedRecords = (): Array<{ id?: string; digest?: string; title?: string; photoUrl?: string }> => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(DESTROYED_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

export const isDestroyedArtworkCandidate = (candidate: { id?: string; digest?: string; title?: string; photoUrl?: string }): boolean => {
  if (typeof window === 'undefined') return false;
  const destroyed = getDestroyedRecords();
  if (!destroyed || destroyed.length === 0) return false;

  const targetId = normalizeValue(candidate.id);
  const targetDigest = normalizeValue(candidate.digest);
  const targetTitle = normalizeValue(candidate.title);
  const targetUrl = normalizeValue(candidate.photoUrl);

  return destroyed.some((record) => {
    const recordId = normalizeValue(record.id);
    const recordDigest = normalizeValue(record.digest);
    const recordTitle = normalizeValue(record.title);
    const recordUrl = normalizeValue(record.photoUrl);

    if (targetId && recordId && (targetId === recordId || targetId.includes(recordId) || recordId.includes(targetId))) return true;
    if (targetDigest && recordDigest && targetDigest.length > 8 && recordDigest.length > 8 && targetDigest === recordDigest) return true;
    if (targetTitle && recordTitle && targetTitle.length > 2 && targetTitle === recordTitle) return true;
    if (targetUrl && recordUrl && targetUrl.length > 5 && (targetUrl === recordUrl || targetUrl.includes(recordUrl) || recordUrl.includes(targetUrl))) return true;
    if (targetUrl && recordUrl && targetUrl.includes('/captures/') && recordUrl.includes('/captures/')) {
      const file1 = targetUrl.split('/').pop()?.split('?')[0];
      const file2 = recordUrl.split('/').pop()?.split('?')[0];
      if (file1 && file2 && file1 === file2) return true;
    }
    return false;
  });
};

export const filterDestroyedItems = <T extends { id?: string; digest?: string; title?: string; photoUrl?: string }>(items: T[]): T[] => {
  return items.filter((item) => !isDestroyedArtworkCandidate({
    id: item.id,
    digest: item.digest,
    title: item.title,
    photoUrl: item.photoUrl
  }));
};

export const isVaultItemVisibleInPublicVault = (
  item?: Pick<PrivateVaultItem, 'id' | 'digest' | 'title' | 'photoUrl' | 'isPrivate' | 'isPublished'>
): boolean => {
  if (!item) return false;
  if (isDestroyedArtworkCandidate({
    id: item.id,
    digest: item.digest,
    title: item.title,
    photoUrl: item.photoUrl
  })) {
    return false;
  }
  // Gambar yang diizinkan: karya yang telah di-publish atau tidak bersifat privat
  return item.isPublished === true || item.isPrivate === false;
};

// Initial Authentic Master Curated Artworks
export const INITIAL_CURATED_ARTWORKS: PrivateVaultItem[] = [
  {
    id: 'vec-art-001-masterpiece',
    title: 'Simfoni Cahaya & Bayang Senja #01',
    photoUrl: '/assets/images/vec_vault_artwork_1792494925679.jpg',
    digest: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    resolution: '3840 × 2160 (4K UHD RAW)',
    fileSize: '4.8 MB',
    captureDate: '21 Okt 2026, 17:42 WIB',
    deviceInfo: 'Sony Alpha 7R V • Hardware TEE Enclave',
    isPrivate: false,
    isPublished: true, // DIIZINKAN DI VAULT PUBLIK
    vaultId: DEFAULT_MASTER_VAULT.id,
    vaultName: 'Brankas Mahakarya Veroia',
    creatorName: 'Arifullah B.K. (VEC Master Curator)',
    c2paSignature: 'ECDSA_P256_TEE_SECURE_ENCLAVE_VALID',
    sensorType: 'Direct CMOS RAW (Zero-Bypass)',
    storageTarget: 'cloud_supabase',
    cloudStorageUrl: '/assets/images/vec_vault_artwork_1792494925679.jpg',
    cloudBucket: 'vec-captures',
    uploadStatus: 'uploaded',
    createdAt: 1792488000000,
    description: 'Mahakarya kanvas terverifikasi perangkat keras dengan segel kriptografi C2PA asli.'
  },
  {
    id: 'vec-art-002-enclave-macro',
    title: 'Mikrostruktur Enclave Silikon & Segel C2PA',
    photoUrl: '/assets/images/vec_chip_nfc_1792494926609.jpg',
    digest: '8a9c3d2e1b4f5a6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c',
    resolution: '1920 × 1080 (FHD Attested)',
    fileSize: '3.2 MB',
    captureDate: '22 Okt 2026, 11:15 WIB',
    deviceInfo: 'Zeiss Macro 100mm • VEC Sensor Enclave',
    isPrivate: false,
    isPublished: true, // DIIZINKAN DI VAULT PUBLIK
    vaultId: DEFAULT_MASTER_VAULT.id,
    vaultName: 'Brankas Mahakarya Veroia',
    creatorName: 'Lab Sensor Kriptografi VEC',
    c2paSignature: 'ECDSA_P256_HARDWARE_ATTESTED_VALID',
    sensorType: 'Direct CMOS RAW (Zero-Bypass)',
    storageTarget: 'cloud_supabase',
    cloudStorageUrl: '/assets/images/vec_chip_nfc_1792494926609.jpg',
    cloudBucket: 'vec-captures',
    uploadStatus: 'uploaded',
    createdAt: 1792574400000,
    description: 'Foto makro sirkuit TEE dan chip NFC penyimpan kunci privat kurator karya seni.'
  },
  {
    id: 'vec-art-003-camera-rig',
    title: 'Rig Sensor Prototipe Zero-Trust VEC-01',
    photoUrl: '/assets/images/vec_hero_camera_1792494926035.jpg',
    digest: '5f4dcc3b5aa765d61d8327deb882cf992b9699aaf83497b71120464f1d4310d7',
    resolution: '2560 × 1440 (2K RAW)',
    fileSize: '3.9 MB',
    captureDate: '23 Okt 2026, 08:30 WIB',
    deviceInfo: 'Leica SL2-S • C2PA Zero-Trust Module',
    isPrivate: true,
    isPublished: false, // KHUSUS BRANKAS PRIVAT
    vaultId: DEFAULT_MASTER_VAULT.id,
    vaultName: 'Brankas Mahakarya Veroia',
    creatorName: 'Arifullah B.K. (VEC Master Curator)',
    c2paSignature: 'ECDSA_P256_TEE_SECURE_ENCLAVE_VALID',
    sensorType: 'Direct CMOS RAW (Zero-Bypass)',
    storageTarget: 'cloud_supabase',
    cloudStorageUrl: '/assets/images/vec_hero_camera_1792494926035.jpg',
    cloudBucket: 'vec-captures',
    uploadStatus: 'uploaded',
    createdAt: 1792660800000,
    description: 'Dokumentasi privat pengujian hardware capture kamera bersertifikasi C2PA.'
  }
];

export const getItemTimestamp = (item: PrivateVaultItem): number => {
  if (item.createdAt && item.createdAt > 0) return item.createdAt;
  const match = item.id.match(/\d{10,14}/);
  if (match) {
    const parsedIdTime = parseInt(match[0], 10);
    if (!isNaN(parsedIdTime) && parsedIdTime > 1600000000000) return parsedIdTime;
  }
  if (item.captureDate) {
    const parsed = Date.parse(item.captureDate);
    if (!isNaN(parsed)) return parsed;
  }
  return 0;
};

/**
 * Loads all locally stored artworks from localStorage.
 * Initializes with curated masterpieces if storage is empty.
 */
export const getStoredLocalItems = (): PrivateVaultItem[] => {
  if (typeof window === 'undefined') return INITIAL_CURATED_ARTWORKS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const initial = filterDestroyedItems(INITIAL_CURATED_ARTWORKS);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
      return initial;
    }
    const parsed: PrivateVaultItem[] = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      const initial = filterDestroyedItems(INITIAL_CURATED_ARTWORKS);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
      return initial;
    }
    return filterDestroyedItems(parsed);
  } catch (e) {
    console.warn('Error reading stored vault items:', e);
    return filterDestroyedItems(INITIAL_CURATED_ARTWORKS);
  }
};

let memoryCache: PrivateVaultItem[] = getStoredLocalItems();

const persistLocalVaultItems = (items: PrivateVaultItem[]): void => {
  const clean = filterDestroyedItems(items).sort((a, b) => getItemTimestamp(b) - getItemTimestamp(a));
  memoryCache = clean;
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(clean));
    } catch (e) {
      console.warn('Error persisting vault items to localStorage:', e);
    }
    window.dispatchEvent(new CustomEvent('vec-vault-updated', { detail: clean }));
    window.dispatchEvent(new Event('storage'));
  }
};

const notifyVaultChanged = (items: PrivateVaultItem[]) => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('vec-vault-updated', { detail: items }));
    window.dispatchEvent(new Event('storage'));
  }
};

/**
 * Mendapatkan seluruh karya seni yang terdaftar di sistem.
 * Digunakan oleh Ruang Admin (MasterAdminPortal) untuk pengawasan menyeluruh.
 */
export const getAllRegisteredArtworks = (): PrivateVaultItem[] => {
  const localItems = getStoredLocalItems();
  return filterDestroyedItems(localItems).sort((a, b) => getItemTimestamp(b) - getItemTimestamp(a));
};

/**
 * Mendapatkan karya yang diizinkan untuk tampil di Katalog / Vault Publik.
 * 
 * ATURAN MUTLAK:
 * Meskipun brankas terkunci, karya yang telah diizinkan (isPublished === true atau !isPrivate)
 * HARUS TETAP MUNCUL DI VAULT PUBLIK.
 */
export const getPublicVaultItems = (): PrivateVaultItem[] => {
  const all = getStoredLocalItems();
  return all.filter((item) => isVaultItemVisibleInPublicVault(item));
};

/**
 * Mendapatkan karya di Brankas Pribadi milik pengguna yang sedang membuka brankas.
 * Jika brankas terkunci (isVaultUnlocked() === false), mengembalikan array kosong
 * sehingga UI Brankas menampilkan layar terkunci, TANPA mempengaruhi galeri publik!
 */
export const getPrivateVaultItems = (): PrivateVaultItem[] => {
  const unlocked = isVaultUnlocked();
  const activeVault = getActiveVault();

  if (!unlocked || !activeVault) {
    return [];
  }

  const all = getStoredLocalItems();
  const isMasterVault = activeVault.id === DEFAULT_MASTER_VAULT.id;

  return all.filter((item) => {
    if (isMasterVault) return true;
    if (item.vaultId) return item.vaultId === activeVault.id;
    return true;
  });
};

/**
 * Sinkronisasi karya dari Supabase posts ke penyimpanan lokal
 */
export const loadVaultItemsFromSupabase = async (overrideVaultId?: string): Promise<PrivateVaultItem[]> => {
  const localItems = getStoredLocalItems();

  try {
    const client = getActiveSupabaseClient();
    const { data: posts, error } = await client
      .from('posts')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);

    if (error || !posts || posts.length === 0) {
      return localItems;
    }

    const remoteMapped: PrivateVaultItem[] = posts
      .filter((p: any) => {
        if (p.is_destroyed === true || p.destroyed_at) return false;
        const d = (p.c2pa_manifest_hash || p.raw_capture_digest || '').trim().toLowerCase();
        const t = (p.title || '').trim().toLowerCase();
        const u = (p.media_url || '').trim();
        return !isDestroyedArtworkCandidate({ id: p.id, digest: d, title: t, photoUrl: u });
      })
      .map((p: any) => {
        const telemetry = p.sensor_telemetry || {};
        const isPrivate = telemetry.is_private !== undefined ? Boolean(telemetry.is_private) : false;
        const isPublished = telemetry.is_published !== undefined ? Boolean(telemetry.is_published) : !isPrivate;

        return {
          id: p.id,
          title: p.title || 'Tangkapan C2PA',
          photoUrl: p.media_url,
          digest: p.c2pa_manifest_hash || p.raw_capture_digest || 'hash',
          resolution: telemetry.resolution || '1920 × 1080',
          fileSize: telemetry.fileSize || '3.4 MB',
          captureDate: new Date(p.created_at).toLocaleString('id-ID'),
          deviceInfo: p.camera_make ? `${p.camera_make} ${p.camera_model || ''}` : 'VEC Hardware Sensor Enclave',
          isPrivate,
          isPublished,
          vaultId: p.vault_id || telemetry.vault_id || DEFAULT_MASTER_VAULT.id,
          vaultName: telemetry.vault_name || 'Brankas Karya',
          creatorName: telemetry.creator_name || 'Kolektor Terverifikasi',
          c2paSignature: p.hardware_tee_signature || 'ECDSA_P256_TEE_SECURE_ENCLAVE_VALID',
          sensorType: 'Direct CMOS RAW (Zero-Bypass)',
          storageTarget: 'cloud_supabase',
          cloudStorageUrl: p.media_url,
          cloudBucket: 'vec-captures',
          uploadStatus: 'uploaded',
          createdAt: new Date(p.created_at).getTime(),
          description: p.caption
        };
      });

    // Merge remote items with local items (remote items override, new local items preserved)
    const remoteIdMap = new Map<string, PrivateVaultItem>();
    remoteMapped.forEach((r) => remoteIdMap.set(r.id, r));

    const merged: PrivateVaultItem[] = [...remoteMapped];
    localItems.forEach((loc) => {
      if (!remoteIdMap.has(loc.id)) {
        merged.push(loc);
      }
    });

    persistLocalVaultItems(merged);
    return merged;
  } catch (err) {
    console.warn('Error loading vault items from Supabase:', err);
    return localItems;
  }
};

export const initVaultAsync = async (onLoaded?: (items: PrivateVaultItem[]) => void): Promise<PrivateVaultItem[]> => {
  const items = await loadVaultItemsFromSupabase();
  if (onLoaded) onLoaded(items);
  return items;
};

export const mergeRemoteItemsIntoVault = (remoteItems: PrivateVaultItem[]): PrivateVaultItem[] => {
  const current = getStoredLocalItems();
  const remoteMap = new Map<string, PrivateVaultItem>();
  remoteItems.forEach((r) => remoteMap.set(r.id, r));

  const merged = [...remoteItems];
  current.forEach((c) => {
    if (!remoteMap.has(c.id)) {
      merged.push(c);
    }
  });

  persistLocalVaultItems(merged);
  return merged;
};

export const savePrivateVaultItem = (item: PrivateVaultItem): PrivateVaultItem[] => {
  if (isDestroyedArtworkCandidate({ id: item.id, digest: item.digest, title: item.title, photoUrl: item.photoUrl })) {
    return getStoredLocalItems();
  }

  const current = getStoredLocalItems();
  const filtered = current.filter((i) => i.id !== item.id);
  const updated = [item, ...filtered];

  persistLocalVaultItems(updated);
  return updated;
};

/**
 * Mengubah status privasi / penerbitan karya seni.
 * Menghubungkan Brankas dan Katalog secara langsung.
 */
export const updateVaultItemPrivacy = async (
  id: string, 
  isPrivate: boolean, 
  isPublished: boolean, 
  newTitle?: string
): Promise<PrivateVaultItem[]> => {
  const current = getStoredLocalItems();
  const updated = current.map((item) => {
    if (item.id === id) {
      return {
        ...item,
        isPrivate,
        isPublished,
        title: newTitle !== undefined ? newTitle : item.title
      };
    }
    return item;
  });

  persistLocalVaultItems(updated);

  // Sync perubahan status ke Supabase
  try {
    const client = getActiveSupabaseClient();
    const { data: post } = await client.from('posts').select('sensor_telemetry').eq('id', id).single();
    const existingTelemetry = post?.sensor_telemetry || {};
    const newTelemetry = {
      ...existingTelemetry,
      is_private: isPrivate,
      is_published: isPublished
    };

    const updatePayload: any = { 
      sensor_telemetry: newTelemetry,
      is_published: isPublished
    };
    if (newTitle) updatePayload.title = newTitle;

    await client.from('posts').update(updatePayload).eq('id', id);
  } catch (e) {
    console.warn('Supabase privacy update note:', e);
  }

  return updated;
};

/**
 * Fungsi Pengawasan Admin untuk mengubah izin karya seni dari Ruang Admin
 */
export const adminToggleArtworkPermission = async (id: string, makePublic: boolean): Promise<PrivateVaultItem[]> => {
  return updateVaultItemPrivacy(id, !makePublic, makePublic);
};

export const updateVaultItemTitle = async (id: string, newTitle: string): Promise<PrivateVaultItem[]> => {
  const cleanTitle = newTitle.trim();
  const current = getStoredLocalItems();
  const updated = current.map((item) => {
    if (item.id === id) {
      return { ...item, title: cleanTitle || item.title };
    }
    return item;
  });

  persistLocalVaultItems(updated);

  try {
    const client = getActiveSupabaseClient();
    await client.from('posts').update({ title: cleanTitle }).eq('id', id);
  } catch (e) {
    console.warn('Supabase title update note:', e);
  }

  return updated;
};

export const updateVaultItemPhoto = (id: string, newPhotoUrl: string, newDigest?: string): PrivateVaultItem[] => {
  const current = getStoredLocalItems();
  const updated = current.map((item) => {
    if (item.id === id) {
      return { ...item, photoUrl: newPhotoUrl, digest: newDigest || item.digest };
    }
    return item;
  });

  persistLocalVaultItems(updated);
  return updated;
};

export const deletePrivateVaultItem = (id: string, digest?: string, photoUrl?: string): PrivateVaultItem[] => {
  const cleanId = (id || '').trim().toLowerCase();
  const cleanDigest = (digest || '').trim().toLowerCase();
  const cleanUrl = (photoUrl || '').trim();

  const current = getStoredLocalItems();
  const idsToDelete = new Set<string>();
  if (id) idsToDelete.add(id);

  current.forEach((item) => {
    if (item.id === id) idsToDelete.add(item.id);
    if (cleanId && item.id.toLowerCase() === cleanId) idsToDelete.add(item.id);
    if (cleanDigest && cleanDigest.length > 8 && item.digest && item.digest.trim().toLowerCase() === cleanDigest) idsToDelete.add(item.id);
    if (cleanUrl && item.photoUrl === cleanUrl) idsToDelete.add(item.id);
  });

  const updated = current.filter((item) => !idsToDelete.has(item.id));
  persistLocalVaultItems(updated);
  return updated;
};

export const updateVaultItemCloudStatus = (
  id: string,
  cloudData: Partial<Pick<PrivateVaultItem, 'storageTarget' | 'cloudStorageUrl' | 'cloudBucket' | 'cloudPath' | 'uploadStatus' | 'uploadError'>>
): PrivateVaultItem[] => {
  const current = getStoredLocalItems();
  const updated = current.map((item) => {
    if (item.id === id) {
      return { ...item, ...cloudData };
    }
    return item;
  });

  persistLocalVaultItems(updated);
  return updated;
};

export const getUserVaultProfile = (): UserVaultProfile => {
  const items = getStoredLocalItems();
  return {
    userId: 'usr_vec_78942a0c',
    displayName: 'Pengguna Terverifikasi VEC',
    trustTier: 'HARDWARE_ATTESTED',
    authenticityScore: 99.40,
    hardwareEnclaveId: 'TEE-KNOX-TITAN-0x8892FA1B',
    encryptionMode: 'AES-256-GCM + Supabase Cloud Storage',
    storageUsedBytes: items.length * 3.5 * 1024 * 1024,
    maxStorageBytes: 5 * 1024 * 1024 * 1024,
    cloudStorageEnabled: true
  };
};

export const purgeAllLocalVaultCache = async (): Promise<void> => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(DESTROYED_STORAGE_KEY);
    memoryCache = [];
    window.dispatchEvent(new CustomEvent('vec-vault-updated', { detail: [] }));
    window.dispatchEvent(new Event('storage'));
  } catch (err) {
    console.warn('Error purging local vault cache:', err);
  }
};

if (typeof window !== 'undefined') {
  initVaultAsync().catch(() => {});
}
