export interface RegisteredUser {
  id: string;
  name: string;
  email: string;
  role: 'Super Admin (Owner)' | 'Verified Creator' | 'Curator' | 'Standard Artist';
  c2paVerified: boolean;
  hardwareEnclaveId: string;
  storageUsedBytes: number;
  storageQuotaBytes: number;
  privatePhotoCount: number;
  registeredAt: string;
  lastLoginAt: string;
  status: 'active' | 'suspended' | 'locked';
}

export interface GuestStatistics {
  totalVisitorsToday: number;
  currentActiveGuests: number;
  anonymousCaptureTests: number;
  localVaultSaves: number;
  conversionRatePercent: number;
  avgSessionDurationSeconds: number;
  hourlyGuestTraffic: { hour: string; guestCount: number }[];
  privacyCompliances: {
    rule: string;
    description: string;
    status: 'ENFORCED' | 'VERIFIED';
  }[];
}

export interface SecurityAuditEntry {
  id: string;
  timestamp: string;
  action: string;
  source: string;
  status: 'SUCCESS' | 'BLOCKED' | 'RATE_LIMITED';
  details: string;
}

const REGISTERED_USERS_KEY = 'vec_registered_users_directory';
const ADMIN_SESSION_KEY = 'vec_admin_fortress_token';
const AUDIT_LOG_KEY = 'vec_admin_audit_logs';

export const MASTER_ACCESS_KEY = 'VEC-ADMIN-882991';

export const INITIAL_REGISTERED_USERS: RegisteredUser[] = [
  {
    id: 'usr_owner_001_c2pa',
    name: 'BK Arifullah',
    email: 'bk.arifullah@gmail.com',
    role: 'Super Admin (Owner)',
    c2paVerified: true,
    hardwareEnclaveId: 'TEE-SONY-A7RV-ROOT-9921',
    storageUsedBytes: 26004684, // ~24.8 MB
    storageQuotaBytes: 10737418240, // 10 GB
    privatePhotoCount: 14,
    registeredAt: '2026-10-15 08:30 UTC',
    lastLoginAt: 'Baru saja (Sesi Aktif)',
    status: 'active'
  },
  {
    id: 'usr_curator_002',
    name: 'Dian Sastro Wardoyo',
    email: 'dian.sastro@veroia.art',
    role: 'Curator',
    c2paVerified: true,
    hardwareEnclaveId: 'TEE-LEICA-M11-SEC-3312',
    storageUsedBytes: 149000000, // ~142 MB
    storageQuotaBytes: 5368709120, // 5 GB
    privatePhotoCount: 38,
    registeredAt: '2026-10-16 11:20 UTC',
    lastLoginAt: '2 jam yang lalu',
    status: 'active'
  },
  {
    id: 'usr_creator_003',
    name: 'Raden Saleh Syarif',
    email: 'raden.saleh@indonesia.art',
    role: 'Verified Creator',
    c2paVerified: true,
    hardwareEnclaveId: 'TEE-NIKON-Z9-PRO-8841',
    storageUsedBytes: 398800000, // ~380 MB
    storageQuotaBytes: 10737418240, // 10 GB
    privatePhotoCount: 62,
    registeredAt: '2026-10-17 14:15 UTC',
    lastLoginAt: '5 jam yang lalu',
    status: 'active'
  },
  {
    id: 'usr_creator_004',
    name: 'Siti Rahma Kencana',
    email: 'siti.rahma@visualtech.io',
    role: 'Standard Artist',
    c2paVerified: false,
    hardwareEnclaveId: 'PENDING_ATTESTATION',
    storageUsedBytes: 8598322, // ~8.2 MB
    storageQuotaBytes: 1073741824, // 1 GB
    privatePhotoCount: 4,
    registeredAt: '2026-10-19 09:40 UTC',
    lastLoginAt: 'Kemarin',
    status: 'active'
  },
  {
    id: 'usr_creator_005',
    name: 'Marcus Vance',
    email: 'm.vance@apnews-demo.org',
    role: 'Verified Creator',
    c2paVerified: true,
    hardwareEnclaveId: 'TEE-CANON-R5C-PRESS-1102',
    storageUsedBytes: 536870912, // 512 MB
    storageQuotaBytes: 10737418240, // 10 GB
    privatePhotoCount: 89,
    registeredAt: '2026-10-20 02:10 UTC',
    lastLoginAt: '30 menit yang lalu',
    status: 'active'
  }
];

export const GUEST_STATISTICS_DATA: GuestStatistics = {
  totalVisitorsToday: 18492,
  currentActiveGuests: 143,
  anonymousCaptureTests: 4219,
  localVaultSaves: 926,
  conversionRatePercent: 7.6,
  avgSessionDurationSeconds: 272, // 4m 32s
  hourlyGuestTraffic: [
    { hour: '00:00', guestCount: 412 },
    { hour: '03:00', guestCount: 230 },
    { hour: '06:00', guestCount: 680 },
    { hour: '09:00', guestCount: 1940 },
    { hour: '12:00', guestCount: 2840 },
    { hour: '15:00', guestCount: 3120 },
    { hour: '18:00', guestCount: 4210 },
    { hour: '21:00', guestCount: 3510 },
    { hour: 'Sekarang', guestCount: 1550 }
  ],
  privacyCompliances: [
    {
      rule: 'Tanpa Penyimpanan Identitas Pribadi (Zero PII)',
      description: 'Pengguna tamu tidak pernah dimintai nama, email, nomor telepon, atau data pribadi apapun.',
      status: 'ENFORCED'
    },
    {
      rule: 'Anonymized Traffic Only (Hanya Angka Numerik)',
      description: 'Seluruh interaksi tamu murni dihitung sebagai agregasi metrik angka untuk memantau performa server.',
      status: 'ENFORCED'
    },
    {
      rule: 'PostGIS Differential Privacy Fuzzing',
      description: 'Koordinat geolocation tamu secara otomatis difuzzing (diburamkan) sejauh 50-100km tanpa menyimpan koordinat asli.',
      status: 'VERIFIED'
    },
    {
      rule: 'Zero Third-Party Tracking Cookies',
      description: 'Sistem tidak menggunakan tracker pihak ketiga (Google Analytics/Facebook Pixel) yang membocorkan data pengunjung.',
      status: 'ENFORCED'
    }
  ]
};

export function getRegisteredUsers(): RegisteredUser[] {
  try {
    const raw = localStorage.getItem(REGISTERED_USERS_KEY);
    if (!raw) {
      localStorage.setItem(REGISTERED_USERS_KEY, JSON.stringify(INITIAL_REGISTERED_USERS));
      return INITIAL_REGISTERED_USERS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_REGISTERED_USERS;
  }
}

export function saveRegisteredUsers(users: RegisteredUser[]): void {
  try {
    localStorage.setItem(REGISTERED_USERS_KEY, JSON.stringify(users));
  } catch (err) {
    console.warn('Gagal menyimpan direktori pengguna:', err);
  }
}

export function toggleUserStatus(userId: string): RegisteredUser[] {
  const users = getRegisteredUsers();
  const updated = users.map(u => {
    if (u.id === userId) {
      const nextStatus: 'active' | 'locked' = u.status === 'active' ? 'locked' : 'active';
      return { ...u, status: nextStatus };
    }
    return u;
  });
  saveRegisteredUsers(updated);
  return updated;
}

export function addNewRegisteredUser(user: Omit<RegisteredUser, 'id' | 'storageUsedBytes' | 'privatePhotoCount' | 'registeredAt' | 'lastLoginAt' | 'status'>): RegisteredUser {
  const users = getRegisteredUsers();
  const newUser: RegisteredUser = {
    ...user,
    id: `usr_${Date.now()}`,
    storageUsedBytes: 0,
    privatePhotoCount: 0,
    registeredAt: new Date().toISOString().replace('T', ' ').substring(0, 16) + ' UTC',
    lastLoginAt: 'Belum pernah login',
    status: 'active'
  };
  const updated = [newUser, ...users];
  saveRegisteredUsers(updated);
  return newUser;
}

export function checkAdminSession(): boolean {
  try {
    const token = sessionStorage.getItem(ADMIN_SESSION_KEY);
    return token === 'VEC_MASTER_AUTH_AUTHORIZED_SESSION';
  } catch {
    return false;
  }
}

export function setAdminSession(authorized: boolean): void {
  try {
    if (authorized) {
      sessionStorage.setItem(ADMIN_SESSION_KEY, 'VEC_MASTER_AUTH_AUTHORIZED_SESSION');
    } else {
      sessionStorage.removeItem(ADMIN_SESSION_KEY);
    }
  } catch (err) {
    console.warn('SessionStorage error:', err);
  }
}

export function getAuditLogs(): SecurityAuditEntry[] {
  try {
    const raw = localStorage.getItem(AUDIT_LOG_KEY);
    if (!raw) {
      const initial: SecurityAuditEntry[] = [
        {
          id: 'log_01',
          timestamp: new Date(Date.now() - 1000 * 60 * 12).toLocaleTimeString('id-ID'),
          action: 'Pemeriksaan Integritas Supabase RLS',
          source: 'System Daemon',
          status: 'SUCCESS',
          details: 'Row Level Security policy terverifikasi aktif pada 4 tabel'
        },
        {
          id: 'log_02',
          timestamp: new Date(Date.now() - 1000 * 60 * 45).toLocaleTimeString('id-ID'),
          action: 'Verifikasi Token Kriptografis Hardware C2PA',
          source: 'Sony A7RV Enclave',
          status: 'SUCCESS',
          details: 'Tanda tangan SHA-256 valid tanpa kompresi'
        },
        {
          id: 'log_03',
          timestamp: new Date(Date.now() - 1000 * 60 * 180).toLocaleTimeString('id-ID'),
          action: 'Percobaan Akses URL Terisolasi Tanpa Kunci',
          source: 'Anonymous Scanner',
          status: 'BLOCKED',
          details: 'Akses diblokir otomatis oleh Fortress Gate (Anti-Brute Force)'
        }
      ];
      localStorage.setItem(AUDIT_LOG_KEY, JSON.stringify(initial));
      return initial;
    }
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function recordAuditLog(action: string, status: 'SUCCESS' | 'BLOCKED' | 'RATE_LIMITED', details: string): void {
  try {
    const logs = getAuditLogs();
    const newEntry: SecurityAuditEntry = {
      id: `log_${Date.now()}`,
      timestamp: new Date().toLocaleTimeString('id-ID'),
      action,
      source: 'Admin Console',
      status,
      details
    };
    const updated = [newEntry, ...logs].slice(0, 50);
    localStorage.setItem(AUDIT_LOG_KEY, JSON.stringify(updated));
  } catch (err) {
    console.warn('Error recording audit log:', err);
  }
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}
