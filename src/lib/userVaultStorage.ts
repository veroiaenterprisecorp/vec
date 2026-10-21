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
  // Cloud Supabase Storage Attributes
  storageTarget?: 'cloud_supabase' | 'device_local';
  cloudStorageUrl?: string;
  cloudBucket?: string;
  cloudPath?: string;
  uploadStatus?: 'uploaded' | 'uploading' | 'failed' | 'local_only';
  uploadError?: string;
  createdAt?: number;
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

// In-memory cache to guarantee synchronous access without dropouts
let memoryCache: PrivateVaultItem[] | null = null;

export const getItemTimestamp = (item: PrivateVaultItem): number => {
  if (item.createdAt && item.createdAt > 0) return item.createdAt;
  // If id is like 'cap-1729...' or 'cap-upload-1729...'
  const match = item.id.match(/\d{10,14}/);
  if (match) {
    const parsedIdTime = parseInt(match[0], 10);
    if (!isNaN(parsedIdTime) && parsedIdTime > 1600000000000) return parsedIdTime;
  }
  if (item.captureDate) {
    const parsed = Date.parse(item.captureDate);
    if (!isNaN(parsed)) return parsed;
  }
  // Default fallback for legacy demo items
  if (item.id === 'vault-item-001') return 1729400000000;
  if (item.id === 'vault-item-002') return 1729300000000;
  return 0;
};

// Safe localStorage saver that handles browser quota limits gracefully without corrupting user images
const safeSaveToLocalStorage = (items: PrivateVaultItem[]) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch (e: any) {
    console.warn('LocalStorage quota limit reached, saving metadata cache with IDB backing:', e?.message);
    try {
      // If quota exceeded, preserve the metadata and full item references
      // IndexedDB already stores the complete high-resolution captures safely
      const lightweightItems = items.slice(0, 30).map((item) => {
        // If dataUrl is extraordinarily large, retain it in IndexedDB and keep memoryCache intact
        if (item.photoUrl && item.photoUrl.length > 500000 && !item.photoUrl.startsWith('http')) {
          return {
            ...item,
            photoUrl: item.cloudStorageUrl || item.photoUrl
          };
        }
        return item;
      });
      localStorage.setItem(STORAGE_KEY, JSON.stringify(lightweightItems));
    } catch {
      // Memory cache and IndexedDB hold the items safely
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
      memoryCache = DEFAULT_ITEMS;
      safeSaveToLocalStorage(DEFAULT_ITEMS);
      return DEFAULT_ITEMS;
    }
    const items: PrivateVaultItem[] = JSON.parse(raw);
    const sanitized = items.map((i) => {
      if (i.photoUrl && i.photoUrl.startsWith('/src/assets/')) {
        return { ...i, photoUrl: i.photoUrl.replace('/src/assets/', '/assets/') };
      }
      return i;
    });
    // Sort so newest user captures are always on top
    sanitized.sort((a, b) => getItemTimestamp(b) - getItemTimestamp(a));
    memoryCache = sanitized;
    return sanitized;
  } catch (e) {
    console.error('Failed to parse private vault items from storage:', e);
    memoryCache = DEFAULT_ITEMS;
    return DEFAULT_ITEMS;
  }
};

/**
 * Initializes and hydrates vault from IndexedDB asynchronously.
 * Guarantees that high-resolution captures stored in IndexedDB are synced into memory.
 */
export const initVaultAsync = async (onLoaded?: (items: PrivateVaultItem[]) => void): Promise<PrivateVaultItem[]> => {
  const localItems = getPrivateVaultItems();
  try {
    const idbItems = await getIdbAllItems();
    if (idbItems && idbItems.length > 0) {
      // Merge idb items with local items (idb has full resolution photo data)
      const mergedMap = new Map<string, PrivateVaultItem>();
      localItems.forEach((item) => mergedMap.set(item.id, item));
      idbItems.forEach((item) => {
        // IDB item takes precedence for full photoUrl data
        mergedMap.set(item.id, {
          ...mergedMap.get(item.id),
          ...item
        });
      });
      
      const merged = Array.from(mergedMap.values()).sort((a, b) => {
        return getItemTimestamp(b) - getItemTimestamp(a);
      });
      
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

/**
 * Merges items fetched from Supabase cloud into the local vault
 */
export const mergeRemoteItemsIntoVault = (remoteItems: PrivateVaultItem[]): PrivateVaultItem[] => {
  const current = getPrivateVaultItems();
  const existingIds = new Set(current.map((item) => item.id));
  const existingDigests = new Set(current.map((item) => item.digest));

  const newItems: PrivateVaultItem[] = [];
  for (const r of remoteItems) {
    if (!existingIds.has(r.id) && !existingDigests.has(r.digest)) {
      newItems.push(r);
    }
  }

  if (newItems.length > 0) {
    // Merge remote items, then sort so user captures stay at the top if newest
    const merged = [...current, ...newItems].sort((a, b) => {
      return getItemTimestamp(b) - getItemTimestamp(a);
    });
    memoryCache = merged;
    safeSaveToLocalStorage(merged);
    newItems.forEach((item) => putIdbItem(item));
    notifyVaultChanged(merged);
    return merged;
  }
  return current;
};

export const savePrivateVaultItem = (item: PrivateVaultItem): PrivateVaultItem[] => {
  const current = getPrivateVaultItems();
  const enrichedItem: PrivateVaultItem = {
    ...item,
    createdAt: item.createdAt || Date.now()
  };
  // Avoid duplicate if same ID already exists
  const filtered = current.filter((i) => i.id !== enrichedItem.id);
  const updated = [enrichedItem, ...filtered].sort((a, b) => {
    return getItemTimestamp(b) - getItemTimestamp(a);
  });
  memoryCache = updated;

  // 1. Save to high-capacity IndexedDB (stores full resolution without size limits)
  putIdbItem(enrichedItem);

  // 2. Safe save to localStorage
  safeSaveToLocalStorage(updated);

  // 3. Notify listeners
  notifyVaultChanged(updated);
  return updated;
};

export const updateVaultItemPrivacy = (
  id: string, 
  isPrivate: boolean, 
  isPublished: boolean,
  newTitle?: string
): PrivateVaultItem[] => {
  const current = getPrivateVaultItems();
  const updated = current.map((item) => {
    if (item.id === id) {
      const changed = {
        ...item,
        isPrivate,
        isPublished,
        title: newTitle !== undefined ? newTitle : item.title
      };
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

export const updateVaultItemTitle = (
  id: string,
  newTitle: string
): PrivateVaultItem[] => {
  const current = getPrivateVaultItems();
  const updated = current.map((item) => {
    if (item.id === id) {
      const changed = {
        ...item,
        title: newTitle.trim() || item.title
      };
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

export const updateVaultItemPhoto = (
  id: string,
  newPhotoUrl: string,
  newDigest?: string
): PrivateVaultItem[] => {
  const current = getPrivateVaultItems();
  const updated = current.map((item) => {
    if (item.id === id) {
      const changed = {
        ...item,
        photoUrl: newPhotoUrl,
        digest: newDigest || item.digest
      };
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
      const changed = {
        ...item,
        ...cloudData
      };
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
