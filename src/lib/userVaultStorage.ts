import { getIdbAllItems, putIdbItem, deleteIdbItem } from './idbStorage';

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
  fuzzedLocation?: string;
  c2paSignature: string;
  sensorType: string;
  storageTarget?: 'cloud_supabase' | 'device_local';
  cloudStorageUrl?: string;
  cloudBucket?: string;
  cloudPath?: string;
  uploadStatus?: 'uploaded' | 'uploading' | 'failed' | 'local_only';
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

const getDestroyedRecords = (): Array<{ id?: string; digest?: string; title?: string; photoUrl?: string }> => {
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

const DEFAULT_ITEMS: PrivateVaultItem[] = [
  {
    id: 'vault-item-001',
    title: 'Studi Komposisi Lukisan Minyak - Silsilah Kanvas #01',
    photoUrl: '/assets/images/vec_vault_artwork_1792494925679.jpg',
    digest: '4a6b2c8e1d9f3a5b7c0e2d4f6a8b1c3d5e7f9a0b2c4d6e8f1a3b5c7d9e0f2a4b',
    resolution: '1920 × 1440 piksel',
    fileSize: '4.8 MB',
    captureDate: '2026-10-20 04:15:32 WIB',
    deviceInfo: 'Android Camera2 API • Sony IMX989 CMOS',
    isPrivate: true,
    isPublished: false,
    fuzzedLocation: 'Jakarta Pusat (Radius 500m)',
    c2paSignature: 'ECDSA_P256_TEE_SECURE_ENCLAVE_VALID',
    sensorType: 'Direct CMOS RAW (Zero-Bypass)',
    storageTarget: 'cloud_supabase',
    cloudBucket: 'vec-captures',
    cloudPath: 'captures/2026-10-20/c2pa_oil_painting_canvas.jpg',
    uploadStatus: 'uploaded'
  },
  {
    id: 'vault-item-002',
    title: 'Dokumentasi Microchip NFC NTAG424 DNA Fisik',
    photoUrl: '/assets/images/vec_chip_nfc_1792494926609.jpg',
    digest: '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08',
    resolution: '1080 × 1080 piksel',
    fileSize: '3.2 MB',
    captureDate: '2026-10-20 03:40:19 WIB',
    deviceInfo: 'Hardware Attested Sensor • Titan M2',
    isPrivate: true,
    isPublished: false,
    fuzzedLocation: 'Bandung Dago (Radius 500m)',
    c2paSignature: 'TEE_STRONG_BOX_ATTESTATION_PASS',
    sensorType: 'Cryptographic Hardware Module',
    storageTarget: 'cloud_supabase',
    cloudBucket: 'vec-captures',
    cloudPath: 'captures/2026-10-20/c2pa_nfc_chip_dna.jpg',
    uploadStatus: 'uploaded'
  }
];

let memoryCache: PrivateVaultItem[] | null = null;

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
  if (item.id === 'vault-item-001') return 1729400000000;
  if (item.id === 'vault-item-002') return 1729300000000;
  return 0;
};

const prepareItemsForLocalStorage = (items: PrivateVaultItem[]): PrivateVaultItem[] => {
  return items.slice(0, 50).map((item) => {
    const isLargeDataUrl = Boolean(item.photoUrl && (item.photoUrl.startsWith('data:') || item.photoUrl.length > 2048));
    return {
      ...item,
      photoUrl: isLargeDataUrl ? (item.cloudStorageUrl || '') : item.photoUrl
    };
  });
};

const safeSaveToLocalStorage = (items: PrivateVaultItem[]) => {
  if (typeof window === 'undefined') return;
  try {
    const compactItems = prepareItemsForLocalStorage(items);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(compactItems));
  } catch {
    try {
      localStorage.removeItem(STORAGE_KEY);
      const minimal = items.slice(0, 20).map((item) => ({
        ...item,
        photoUrl: item.cloudStorageUrl || ''
      }));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(minimal));
    } catch {
      // noop
    }
  }
};

const notifyVaultChanged = (items: PrivateVaultItem[]) => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('vec-vault-updated', { detail: items }));
    window.dispatchEvent(new Event('storage'));
  }
};

export const getPrivateVaultItems = (): PrivateVaultItem[] => {
  if (memoryCache && memoryCache.length > 0) {
    return memoryCache;
  }

  try {
    const raw = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
    if (!raw) {
      memoryCache = filterDestroyedItems(DEFAULT_ITEMS);
      safeSaveToLocalStorage(memoryCache);
      return memoryCache;
    }
    const items: PrivateVaultItem[] = JSON.parse(raw);
    const sanitized = items
      .map((i) => {
        if (i.photoUrl && i.photoUrl.startsWith('/src/assets/')) {
          return { ...i, photoUrl: i.photoUrl.replace('/src/assets/', '/assets/') };
        }
        return i;
      })
      .filter((item) => !isDestroyedArtworkCandidate({ id: item.id, digest: item.digest, title: item.title, photoUrl: item.photoUrl }));
    sanitized.sort((a, b) => getItemTimestamp(b) - getItemTimestamp(a));
    memoryCache = sanitized;
    return sanitized;
  } catch (e) {
    console.error('Failed to parse private vault items from storage:', e);
    memoryCache = filterDestroyedItems(DEFAULT_ITEMS);
    return memoryCache;
  }
};

export const initVaultAsync = async (onLoaded?: (items: PrivateVaultItem[]) => void): Promise<PrivateVaultItem[]> => {
  const localItems = getPrivateVaultItems();
  try {
    const idbItems = await getIdbAllItems();
    if (idbItems && idbItems.length > 0) {
      const mergedMap = new Map<string, PrivateVaultItem>();
      localItems.forEach((item) => mergedMap.set(item.id, item));
      const safeIdbItems = filterDestroyedItems(idbItems);
      safeIdbItems.forEach((item) => {
        mergedMap.set(item.id, {
          ...mergedMap.get(item.id),
          ...item
        });
      });

      const merged = Array.from(mergedMap.values())
        .filter((item) => !isDestroyedArtworkCandidate({ id: item.id, digest: item.digest, title: item.title, photoUrl: item.photoUrl }))
        .sort((a, b) => getItemTimestamp(b) - getItemTimestamp(a));

      memoryCache = merged;
      safeSaveToLocalStorage(merged);
      if (onLoaded) onLoaded(merged);
      notifyVaultChanged(merged);
      return merged;
    }
  } catch (e) {
    console.warn('IDB hydration note:', e);
  }
  if (onLoaded) onLoaded(localItems);
  return localItems;
};

export const mergeRemoteItemsIntoVault = (remoteItems: PrivateVaultItem[]): PrivateVaultItem[] => {
  const current = getPrivateVaultItems().filter((item) => !isDestroyedArtworkCandidate({
    id: item.id,
    digest: item.digest,
    title: item.title,
    photoUrl: item.photoUrl
  }));
  const safeRemoteItems = filterDestroyedItems(remoteItems);
  const existingIds = new Set(current.map((item) => item.id));
  const existingDigests = new Set(current.filter((i) => i.digest).map((item) => item.digest.trim().toLowerCase()));
  const existingTitles = new Set(current.filter((i) => i.title).map((item) => item.title.trim().toLowerCase()));

  const newItems: PrivateVaultItem[] = [];
  for (const r of safeRemoteItems) {
    const rd = (r.digest || '').trim().toLowerCase();
    const rt = (r.title || '').trim().toLowerCase();
    const isDup = existingIds.has(r.id) ||
      (rd.length > 8 && existingDigests.has(rd)) ||
      (rt.length > 0 && existingTitles.has(rt));
    if (!isDup) {
      newItems.push(r);
    }
  }

  if (newItems.length > 0) {
    const merged = [...current, ...newItems].sort((a, b) => getItemTimestamp(b) - getItemTimestamp(a));
    memoryCache = merged;
    safeSaveToLocalStorage(merged);
    newItems.forEach((item) => putIdbItem(item));
    notifyVaultChanged(merged);
    return merged;
  }
  return current;
};

export const savePrivateVaultItem = (item: PrivateVaultItem): PrivateVaultItem[] => {
  if (isDestroyedArtworkCandidate({ id: item.id, digest: item.digest, title: item.title, photoUrl: item.photoUrl })) {
    return getPrivateVaultItems();
  }
  const current = getPrivateVaultItems();
  const enrichedItem: PrivateVaultItem = { ...item, createdAt: item.createdAt || Date.now() };
  const filtered = current.filter((i) => i.id !== enrichedItem.id);
  const updated = [enrichedItem, ...filtered].sort((a, b) => getItemTimestamp(b) - getItemTimestamp(a));
  memoryCache = updated;
  putIdbItem(enrichedItem);
  safeSaveToLocalStorage(updated);
  notifyVaultChanged(updated);
  return updated;
};

export const updateVaultItemPrivacy = (id: string, isPrivate: boolean, isPublished: boolean, newTitle?: string): PrivateVaultItem[] => {
  const current = getPrivateVaultItems();
  const updated = current.map((item) => {
    if (item.id === id) {
      const changed = { ...item, isPrivate, isPublished, title: newTitle !== undefined ? newTitle : item.title };
      putIdbItem(changed);
      return changed;
    }
    return item;
  });
  memoryCache = updated;
  safeSaveToLocalStorage(updated);
  notifyVaultChanged(updated);
  return updated;
};

export const updateVaultItemTitle = (id: string, newTitle: string): PrivateVaultItem[] => {
  const current = getPrivateVaultItems();
  const updated = current.map((item) => {
    if (item.id === id) {
      const changed = { ...item, title: newTitle.trim() || item.title };
      putIdbItem(changed);
      return changed;
    }
    return item;
  });
  memoryCache = updated;
  safeSaveToLocalStorage(updated);
  notifyVaultChanged(updated);
  return updated;
};

export const updateVaultItemPhoto = (id: string, newPhotoUrl: string, newDigest?: string): PrivateVaultItem[] => {
  const current = getPrivateVaultItems();
  const updated = current.map((item) => {
    if (item.id === id) {
      const changed = { ...item, photoUrl: newPhotoUrl, digest: newDigest || item.digest };
      putIdbItem(changed);
      return changed;
    }
    return item;
  });
  memoryCache = updated;
  safeSaveToLocalStorage(updated);
  notifyVaultChanged(updated);
  return updated;
};

export const deletePrivateVaultItem = (id: string): PrivateVaultItem[] => {
  const current = getPrivateVaultItems();
  const updated = current.filter((item) => item.id !== id);
  memoryCache = updated;
  deleteIdbItem(id);
  safeSaveToLocalStorage(updated);
  notifyVaultChanged(updated);
  return updated;
};

export const updateVaultItemCloudStatus = (
  id: string,
  cloudData: Partial<Pick<PrivateVaultItem, 'storageTarget' | 'cloudStorageUrl' | 'cloudBucket' | 'cloudPath' | 'uploadStatus' | 'uploadError'>>
): PrivateVaultItem[] => {
  const current = getPrivateVaultItems();
  const updated = current.map((item) => {
    if (item.id === id) {
      const changed = { ...item, ...cloudData };
      putIdbItem(changed);
      return changed;
    }
    return item;
  });
  memoryCache = updated;
  safeSaveToLocalStorage(updated);
  notifyVaultChanged(updated);
  return updated;
};

export const getUserVaultProfile = (): UserVaultProfile => {
  return {
    userId: 'usr_vec_78942a0c',
    displayName: 'Pengguna Terverifikasi VEC',
    trustTier: 'HARDWARE_ATTESTED',
    authenticityScore: 99.40,
    hardwareEnclaveId: 'TEE-KNOX-TITAN-0x8892FA1B',
    encryptionMode: 'AES-256-GCM + Supabase Storage Vault',
    storageUsedBytes: 8.0 * 1024 * 1024,
    maxStorageBytes: 5 * 1024 * 1024 * 1024,
    cloudStorageEnabled: true
  };
};

if (typeof window !== 'undefined') {
  initVaultAsync().catch(() => {});
}
