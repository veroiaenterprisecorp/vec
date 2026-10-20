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
}

const STORAGE_KEY = 'vec_user_private_vault_items';

const DEFAULT_ITEMS: PrivateVaultItem[] = [
  {
    id: 'vault-item-001',
    title: 'Studi Komposisi Lukisan Minyak - Silsilah Kanvas #01',
    photoUrl: '/src/assets/images/vec_vault_artwork_1792494925679.jpg',
    digest: '4a6b2c8e1d9f3a5b7c0e2d4f6a8b1c3d5e7f9a0b2c4d6e8f1a3b5c7d9e0f2a4b',
    resolution: '1920 × 1440 piksel',
    fileSize: '4.8 MB',
    captureDate: '2026-10-20 04:15:32 WIB',
    deviceInfo: 'Android Camera2 API • Sony IMX989 CMOS',
    isPrivate: true,
    isPublished: false,
    fuzzedLocation: 'Jakarta Pusat (Radius 500m)',
    c2paSignature: 'ECDSA_P256_TEE_SECURE_ENCLAVE_VALID',
    sensorType: 'Direct CMOS RAW (Zero-Bypass)'
  },
  {
    id: 'vault-item-002',
    title: 'Dokumentasi Microchip NFC NTAG424 DNA Fisik',
    photoUrl: '/src/assets/images/vec_chip_nfc_1792494926609.jpg',
    digest: '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08',
    resolution: '1080 × 1080 piksel',
    fileSize: '3.2 MB',
    captureDate: '2026-10-20 03:40:19 WIB',
    deviceInfo: 'Hardware Attested Sensor • Titan M2',
    isPrivate: true,
    isPublished: false,
    fuzzedLocation: 'Bandung Dago (Radius 500m)',
    c2paSignature: 'TEE_STRONG_BOX_ATTESTATION_PASS',
    sensorType: 'Cryptographic Hardware Module'
  }
];

export const getPrivateVaultItems = (): PrivateVaultItem[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_ITEMS));
      return DEFAULT_ITEMS;
    }
    return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to parse private vault items from storage:', e);
    return DEFAULT_ITEMS;
  }
};

export const savePrivateVaultItem = (item: PrivateVaultItem): PrivateVaultItem[] => {
  const current = getPrivateVaultItems();
  const updated = [item, ...current];
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.warn('Failed to save to localStorage:', e);
  }
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
      return {
        ...item,
        isPrivate,
        isPublished,
        title: newTitle !== undefined ? newTitle : item.title
      };
    }
    return item;
  });
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.warn('Failed to update storage item:', e);
  }
  return updated;
};

export const deletePrivateVaultItem = (id: string): PrivateVaultItem[] => {
  const current = getPrivateVaultItems();
  const updated = current.filter((item) => item.id !== id);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.warn('Failed to delete item from storage:', e);
  }
  return updated;
};

export const getUserVaultProfile = (): UserVaultProfile => {
  return {
    userId: 'usr_vec_78942a0c',
    displayName: 'Pengguna Terverifikasi VEC',
    trustTier: 'HARDWARE_ATTESTED',
    authenticityScore: 99.40,
    hardwareEnclaveId: 'TEE-KNOX-TITAN-0x8892FA1B',
    encryptionMode: 'AES-256-GCM + Postgres RLS Isolation',
    storageUsedBytes: 8.0 * 1024 * 1024, // 8.0 MB
    maxStorageBytes: 5 * 1024 * 1024 * 1024 // 5 GB
  };
};
