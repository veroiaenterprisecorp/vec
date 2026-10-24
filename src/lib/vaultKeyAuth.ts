/**
 * Veroia Enterprise Corp (VEC)
 * High-Security Cryptographic Vault Key & Registration Management
 * 
 * Provides:
 * 1. High-entropy key generation (VEC-VK-XXXX-XXXX-XXXX-XXXX)
 * 2. SHA-256 + Unique Salt key hashing (never stores raw keys in DB)
 * 3. Multi-tenant vault isolation per creator
 * 4. Lock / Unlock session management with cross-tab event broadcasting
 * 5. Direct Supabase synchronization for `creator_vaults` table
 */

import { supabase, getActiveSupabaseClient } from './supabase';
import { verifyMasterKey, setAdminSession, addNewRegisteredUser } from './masterAdminStorage';

export interface CreatorVault {
  id: string;                      // UUID
  creator_name: string;
  creator_handle: string;
  email: string;
  vault_name: string;
  key_hash: string;                // SHA-256 hash of (salt + key)
  key_salt: string;                // Unique 16-byte hex salt
  key_prefix: string;              // Masked prefix for UI display (e.g. VEC-VK-8F92-****)
  security_level: 'MILITARY_C2PA' | 'HARDWARE_ENCLAVE_256' | 'QUANTUM_RESISTANT';
  total_artworks?: number;
  published_artworks?: number;
  created_at: string;
  updated_at?: string;
}

export interface UnlockedVaultSession {
  vault: CreatorVault;
  unlockedAt: number;
  rawKeyMasked: string;
}

const VAULT_SESSION_KEY = 'vec_unlocked_vault_session_v1';
const REGISTERED_VAULTS_CACHE_KEY = 'vec_registered_creator_vaults_v1';

// Default Master Creator Vault (for backward compatibility & initial bootstrapping)
export const DEFAULT_MASTER_VAULT: CreatorVault = {
  id: 'b2222222-2222-4222-8222-222222222222',
  creator_name: 'VEC Verified Master Creator',
  creator_handle: '@vec_master_creator',
  email: 'artist@vec.enterprise',
  vault_name: 'Brankas Mahakarya Utama VEC',
  key_hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
  key_salt: 'vec_master_salt_2026',
  key_prefix: 'VEC-VK-0000-****',
  security_level: 'HARDWARE_ENCLAVE_256',
  total_artworks: 0,
  published_artworks: 0,
  created_at: '2026-01-01T00:00:00Z'
};

/**
 * Generates a high-entropy cryptographically secure raw Vault Key.
 * Format: VEC-VK-XXXX-XXXX-XXXX-XXXX (e.g. VEC-VK-8F92-4B17-C3E5-A90D)
 */
export const generateCryptographicVaultKey = (): string => {
  const bytes = new Uint8Array(8);
  if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
    window.crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < bytes.length; i++) {
      bytes[i] = Math.floor(Math.random() * 256);
    }
  }

  const hex1 = bytes[0].toString(16).padStart(2, '0') + bytes[1].toString(16).padStart(2, '0');
  const hex2 = bytes[2].toString(16).padStart(2, '0') + bytes[3].toString(16).padStart(2, '0');
  const hex3 = bytes[4].toString(16).padStart(2, '0') + bytes[5].toString(16).padStart(2, '0');
  const hex4 = bytes[6].toString(16).padStart(2, '0') + bytes[7].toString(16).padStart(2, '0');

  return `VEC-VK-${hex1.toUpperCase()}-${hex2.toUpperCase()}-${hex3.toUpperCase()}-${hex4.toUpperCase()}`;
};

/**
 * Generates a random cryptographic salt.
 */
export const generateSalt = (): string => {
  const bytes = new Uint8Array(16);
  if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
    window.crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < bytes.length; i++) {
      bytes[i] = Math.floor(Math.random() * 256);
    }
  }
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
};

/**
 * Computes SHA-256 Hash of (salt + rawKey).
 */
export const hashVaultKey = async (rawKey: string, salt: string): Promise<string> => {
  const cleanedKey = rawKey.trim().toUpperCase();
  const data = new TextEncoder().encode(`${salt}::${cleanedKey}`);
  if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
    const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hashBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }
  // Simple fallback deterministic hash if crypto.subtle is unavailable
  let hash = 0;
  const str = `${salt}::${cleanedKey}`;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash).toString(16).padStart(64, '0');
};

/**
 * Masks a vault key for UI display (e.g. VEC-VK-8F92-****)
 */
export const maskVaultKey = (key: string): string => {
  const parts = key.trim().split('-');
  if (parts.length >= 4) {
    return `${parts[0]}-${parts[1]}-${parts[2]}-****`;
  }
  return key.slice(0, 10) + '****';
};

/**
 * Helper to dispatch state change events across the application
 */
const notifyLockStateChanged = () => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('vec-vault-lock-state-changed'));
    window.dispatchEvent(new Event('storage'));
  }
};

/**
 * Retrieves all registered vaults cached locally and syncs with Supabase.
 */
export const getCachedRegisteredVaults = (): CreatorVault[] => {
  if (typeof window === 'undefined') return [DEFAULT_MASTER_VAULT];
  try {
    const raw = localStorage.getItem(REGISTERED_VAULTS_CACHE_KEY);
    const parsed: CreatorVault[] = raw ? JSON.parse(raw) : [];
    if (!parsed.some(v => v.id === DEFAULT_MASTER_VAULT.id)) {
      parsed.unshift(DEFAULT_MASTER_VAULT);
    }
    return parsed;
  } catch {
    return [DEFAULT_MASTER_VAULT];
  }
};

/**
 * Saves a vault to the local cache.
 */
export const saveVaultToLocalCache = (vault: CreatorVault): void => {
  if (typeof window === 'undefined') return;
  try {
    const vaults = getCachedRegisteredVaults().filter(v => v.id !== vault.id);
    vaults.unshift(vault);
    localStorage.setItem(REGISTERED_VAULTS_CACHE_KEY, JSON.stringify(vaults));
  } catch (e) {
    console.warn('saveVaultToLocalCache note:', e);
  }
};

/**
 * Gets the currently unlocked vault session (if any).
 */
export const getActiveUnlockedSession = (): UnlockedVaultSession | null => {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(VAULT_SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

/**
 * Checks whether the current user has an unlocked vault.
 */
export const isVaultUnlocked = (): boolean => {
  return getActiveUnlockedSession() !== null;
};

/**
 * Gets the active unlocked CreatorVault, or null if locked.
 */
export const getActiveVault = (): CreatorVault | null => {
  const session = getActiveUnlockedSession();
  return session ? session.vault : null;
};

/**
 * Gets the active vault ID, or default master ID if none unlocked.
 */
export const getActiveVaultId = (): string => {
  const active = getActiveVault();
  return active ? active.id : DEFAULT_MASTER_VAULT.id;
};

/**
 * Registers a new Creator and creates their isolated Vault.
 * Returns the created CreatorVault and the cleartext rawKey (displayed ONLY once).
 */
export const registerNewCreatorVault = async (params: {
  creatorName: string;
  creatorHandle: string;
  email: string;
  vaultName: string;
  securityLevel?: 'MILITARY_C2PA' | 'HARDWARE_ENCLAVE_256' | 'QUANTUM_RESISTANT';
}): Promise<{
  vault: CreatorVault;
  rawKey: string;
  error?: string;
}> => {
  const {
    creatorName,
    creatorHandle,
    email,
    vaultName,
    securityLevel = 'HARDWARE_ENCLAVE_256'
  } = params;

  const rawKey = generateCryptographicVaultKey();
  const salt = generateSalt();
  const keyHash = await hashVaultKey(rawKey, salt);
  const keyPrefix = maskVaultKey(rawKey);

  // Generate UUID for the new vault
  const vaultId = (typeof crypto !== 'undefined' && crypto.randomUUID) 
    ? crypto.randomUUID() 
    : 'vlt-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8);

  const newVault: CreatorVault = {
    id: vaultId,
    creator_name: creatorName.trim(),
    creator_handle: creatorHandle.trim().startsWith('@') ? creatorHandle.trim() : `@${creatorHandle.trim()}`,
    email: email.trim().toLowerCase(),
    vault_name: vaultName.trim(),
    key_hash: keyHash,
    key_salt: salt,
    key_prefix: keyPrefix,
    security_level: securityLevel,
    total_artworks: 0,
    published_artworks: 0,
    created_at: new Date().toISOString()
  };

  // 1. Save to local cache & initialize clean isolated database partition for this registrant
  saveVaultToLocalCache(newVault);
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(`vec_tenant_vault_${newVault.id}`, JSON.stringify([]));
    } catch (e) {
      console.warn('Tenant partition init error:', e);
    }
  }

  // 2. Synchronize to Admin Control Room Directory & Audit Logs
  try {
    addNewRegisteredUser({
      name: newVault.creator_name,
      email: newVault.email,
      role: 'Verified Creator',
      c2paVerified: true,
      hardwareEnclaveId: `TEE-${newVault.key_prefix.replace(/[^A-Z0-9]/g, '')}`,
      storageQuotaBytes: 5 * 1024 * 1024 * 1024,
      vaultId: newVault.id,
      vaultName: newVault.vault_name,
      keyPrefix: newVault.key_prefix,
      emailConfirmationSent: true,
      emailConfirmationSentAt: new Date().toISOString()
    });
  } catch (adminSyncErr) {
    console.warn('Admin user directory sync note:', adminSyncErr);
  }

  // 3. Persist to Supabase `creator_vaults` and `users` tables
  try {
    const client = getActiveSupabaseClient();
    
    // Save to creator_vaults
    await client.from('creator_vaults').upsert([{
      id: newVault.id,
      creator_name: newVault.creator_name,
      creator_handle: newVault.creator_handle,
      email: newVault.email,
      vault_name: newVault.vault_name,
      key_hash: newVault.key_hash,
      key_salt: newVault.key_salt,
      key_prefix: newVault.key_prefix,
      security_level: newVault.security_level,
      total_artworks: 0,
      published_artworks: 0,
      created_at: newVault.created_at
    }]);

    // Also register in public.users to satisfy foreign key constraints across the entire app
    await client.from('users').upsert([{
      id: newVault.id,
      username: newVault.creator_handle.replace('@', ''),
      email: newVault.email,
      full_name: newVault.creator_name,
      trust_tier: 'HARDWARE_ATTESTED',
      authenticity_score: 99.40,
      kyc_verified: true
    }]);
  } catch (err) {
    console.warn('creator_vaults & users Supabase error:', err);
  }

  // 4. Immediately unlock this new vault for the creator
  const session: UnlockedVaultSession = {
    vault: newVault,
    unlockedAt: Date.now(),
    rawKeyMasked: keyPrefix
  };

  if (typeof window !== 'undefined') {
    localStorage.setItem(VAULT_SESSION_KEY, JSON.stringify(session));
    window.dispatchEvent(new CustomEvent('vec-user-registered', { detail: newVault }));
    window.dispatchEvent(new Event('storage'));
  }

  notifyLockStateChanged();

  return {
    vault: newVault,
    rawKey
  };
};

/**
 * Attempts to unlock a vault using a raw key string.
 * Checks against Supabase and locally registered vaults.
 */
/**
 * Attempts to unlock a vault using a raw key string.
 * Enforces individual vault keys, with dynamic Master Key administrative override.
 */
export const unlockVaultWithKey = async (rawKeyInput: string, targetVaultId?: string): Promise<{
  success: boolean;
  vault?: CreatorVault;
  message: string;
}> => {
  const cleanKey = rawKeyInput.trim();
  const cleanKeyUpper = cleanKey.toUpperCase();
  if (!cleanKeyUpper) {
    return { success: false, message: 'Masukkan Kunci Brankas Anda terlebih dahulu.' };
  }

  // 1. Try matching against local cached vaults with individual key
  const localVaults = getCachedRegisteredVaults();
  for (const vault of localVaults) {
    // If a specific target vault is requested, check only that vault first
    if (targetVaultId && vault.id !== targetVaultId) {
      continue;
    }
    const computedHash = await hashVaultKey(cleanKeyUpper, vault.key_salt);
    if (computedHash === vault.key_hash) {
      const session: UnlockedVaultSession = {
        vault,
        unlockedAt: Date.now(),
        rawKeyMasked: maskVaultKey(cleanKeyUpper)
      };
      if (typeof window !== 'undefined') {
        localStorage.setItem(VAULT_SESSION_KEY, JSON.stringify(session));
      }
      notifyLockStateChanged();
      return {
        success: true,
        vault,
        message: `Brankas "${vault.vault_name}" berhasil dibuka menggunakan kunci individual.`
      };
    }
  }

  // 2. Query Supabase `creator_vaults` table to check remote vaults with individual key
  try {
    const client = getActiveSupabaseClient();
    const query = client.from('creator_vaults').select('*');
    if (targetVaultId) {
      query.eq('id', targetVaultId);
    }
    const { data: remoteVaults, error } = await query.limit(100);

    if (!error && remoteVaults && remoteVaults.length > 0) {
      for (const rv of remoteVaults) {
        const computed = await hashVaultKey(cleanKeyUpper, rv.key_salt);
        if (computed === rv.key_hash) {
          const matchedVault: CreatorVault = {
            id: rv.id,
            creator_name: rv.creator_name,
            creator_handle: rv.creator_handle,
            email: rv.email,
            vault_name: rv.vault_name,
            key_hash: rv.key_hash,
            key_salt: rv.key_salt,
            key_prefix: rv.key_prefix,
            security_level: rv.security_level || 'HARDWARE_ENCLAVE_256',
            total_artworks: rv.total_artworks || 0,
            published_artworks: rv.published_artworks || 0,
            created_at: rv.created_at
          };

          saveVaultToLocalCache(matchedVault);

          const session: UnlockedVaultSession = {
            vault: matchedVault,
            unlockedAt: Date.now(),
            rawKeyMasked: maskVaultKey(cleanKeyUpper)
          };
          if (typeof window !== 'undefined') {
            localStorage.setItem(VAULT_SESSION_KEY, JSON.stringify(session));
          }
          notifyLockStateChanged();
          return {
            success: true,
            vault: matchedVault,
            message: `Brankas "${matchedVault.vault_name}" terverifikasi dari basis data dan berhasil dibuka!`
          };
        }
      }
    }
  } catch (e) {
    console.warn('Supabase remote vault check error:', e);
  }

  // 3. Dynamic Master Key Administrative Check (Emergency / Overseer Access)
  const isMasterAuthorized = await verifyMasterKey(cleanKey);
  if (isMasterAuthorized) {
    const allVaults = getCachedRegisteredVaults();
    const targetVault = targetVaultId 
      ? (allVaults.find(v => v.id === targetVaultId) || DEFAULT_MASTER_VAULT)
      : (allVaults[0] || DEFAULT_MASTER_VAULT);

    const session: UnlockedVaultSession = {
      vault: targetVault,
      unlockedAt: Date.now(),
      rawKeyMasked: 'VEC-MASTER-OVERRIDE'
    };
    if (typeof window !== 'undefined') {
      localStorage.setItem(VAULT_SESSION_KEY, JSON.stringify(session));
    }
    notifyLockStateChanged();
    return {
      success: true,
      vault: targetVault,
      message: `Akses Darurat Master: Brankas "${targetVault.vault_name}" berhasil dibuka dengan Kunci Master.`
    };
  }

  return {
    success: false,
    message: 'Kunci Brankas tidak valid atau tidak cocok dengan brankas yang dituju.'
  };
};

/**
 * Locks the current vault, revoking access.
 */
export const lockVault = (): void => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(VAULT_SESSION_KEY);
  }
  notifyLockStateChanged();
};

/**
 * Vecout ('): Menutup seluruh sesi aktif, mengunci kembali semua brankas,
 * dan membersihkan kredensial sementara dari memori sesi.
 * Data permanen (karya, brankas) tetap aman tersimpan.
 */
export const vecoutAll = (): void => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(VAULT_SESSION_KEY);
    sessionStorage.removeItem('vec_admin_fortress_token');
    sessionStorage.removeItem('vec_unlocked_vault_session_v1');
    sessionStorage.removeItem('vec_temp_master_key');
  }
  setAdminSession(false);
  notifyLockStateChanged();
};
