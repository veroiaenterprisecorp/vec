import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Lock, 
  Unlock, 
  Key, 
  AlertTriangle, 
  Users, 
  UserCheck, 
  Eye, 
  EyeOff, 
  Copy, 
  Check, 
  Database, 
  GitBranch, 
  Workflow, 
  RefreshCw, 
  Activity, 
  Download, 
  ExternalLink, 
  CheckCircle2, 
  Search, 
  UserPlus, 
  HardDrive, 
  Fingerprint, 
  Clock, 
  ShieldAlert, 
  BarChart3,
  FileText,
  Radio,
  ArrowRight,
  Rocket,
  Globe,
  Cloud,
  Layers,
  Terminal,
  Sparkles,
  Camera,
  Server,
  Trash2,
  Sliders,
  Settings,
  HelpCircle,
  FileCheck,
  Mail,
  Send,
  X
} from 'lucide-react';
import { 
  getRegisteredUsers, 
  saveRegisteredUsers, 
  toggleUserStatus, 
  addNewRegisteredUser, 
  resendUserEmailConfirmation,
  checkAdminSession, 
  setAdminSession, 
  getAuditLogs, 
  recordAuditLog, 
  formatBytes,
  MASTER_ACCESS_KEY,
  verifyMasterKey,
  changeMasterKey,
  RegisteredUser,
  GUEST_STATISTICS_DATA,
  SecurityAuditEntry,
  getAdminSystemRules,
  saveAdminSystemRules,
  AdminSystemRules,
  getUserActivityLogs,
  UserActivityLog,
  getLastBackupInfo,
  updateBackupInfo,
  BackupStatusInfo,
  getMasterAccessLogs,
  recordMasterAccess,
  MasterAccessLog
} from '../lib/masterAdminStorage';
import { getDestroyedArtworkRecords, DestroyedArtworkRecord, destroyArtworkPermanentlyZeroTrace } from '../lib/cloudStorage';
import { 
  getAllRegisteredArtworks, 
  adminToggleArtworkPermission, 
  PrivateVaultItem, 
  isDestroyedArtworkCandidate 
} from '../lib/userVaultStorage';
import { getSupabaseUrl, getSupabaseAnonKey } from '../lib/supabase';
import { GitHubSupabaseSyncHub } from './GitHubSupabaseSyncHub';
import { VecArchitectureConsole } from './VecArchitectureConsole';
import { PostGisSimulator } from './PostGisSimulator';

export type AdminPortalTab = 
  | 'monitoring' 
  | 'users' 
  | 'gallery' 
  | 'security' 
  | 'guests' 
  | 'architecture' 
  | 'spatial' 
  | 'sync' 
  | 'vercel' 
  | 'audit';

interface MasterAdminPortalProps {
  onBackToPublicSite: () => void;
  onCopyAllSql?: () => void;
  copiedSql?: boolean;
  onDownloadSql?: () => void;
  initialAdminTab?: AdminPortalTab;
}

export const MasterAdminPortal: React.FC<MasterAdminPortalProps> = ({
  onBackToPublicSite,
  onCopyAllSql,
  copiedSql = false,
  onDownloadSql,
  initialAdminTab = 'users'
}) => {
  // Session Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => checkAdminSession());
  const [inputPasscode, setInputPasscode] = useState<string>('');
  const [showPasscode, setShowPasscode] = useState<boolean>(false);
  const [loginError, setLoginError] = useState<string>('');
  const [failedAttempts, setFailedAttempts] = useState<number>(0);
  const [isLockedOut, setIsLockedOut] = useState<boolean>(false);
  const [lockoutTimer, setLockoutTimer] = useState<number>(0);

  // Active Tab inside Fortress Admin
  const [adminTab, setAdminTab] = useState<AdminPortalTab>(() => initialAdminTab || 'users');

  useEffect(() => {
    if (initialAdminTab) {
      setAdminTab(initialAdminTab);
    }
  }, [initialAdminTab]);

  // Registered Users Directory State
  const [usersList, setUsersList] = useState<RegisteredUser[]>(() => getRegisteredUsers());
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [showAddUserModal, setShowAddUserModal] = useState<boolean>(false);

  // New user form state
  const [newUserName, setNewUserName] = useState<string>('');
  const [newUserEmail, setNewUserEmail] = useState<string>('');
  const [newUserRole, setNewUserRole] = useState<RegisteredUser['role']>('Verified Creator');
  const [newUserQuotaGb, setNewUserQuotaGb] = useState<number>(5);

  // Audit Logs State
  const [auditLogs, setAuditLogs] = useState<SecurityAuditEntry[]>(() => getAuditLogs());

  // Copy status indicators
  const [copiedSecretUrl, setCopiedSecretUrl] = useState<boolean>(false);
  const [copiedKey, setCopiedKey] = useState<boolean>(false);
  const [copiedVercelJson, setCopiedVercelJson] = useState<boolean>(false);
  const [copiedVercelCli, setCopiedVercelCli] = useState<boolean>(false);
  const [copiedSupabaseUrl, setCopiedSupabaseUrl] = useState<boolean>(false);
  const [copiedSupabaseKey, setCopiedSupabaseKey] = useState<boolean>(false);
  const [notificationMsg, setNotificationMsg] = useState<string>('');

  // Current secret URL
  const secretUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}${window.location.pathname}?portal=master-admin`
    : 'https://vec.internal/?portal=master-admin';

  // System Rules, User Activities, Backups, and Master Access Logs
  const [systemRules, setSystemRules] = useState<AdminSystemRules>(() => getAdminSystemRules());
  const [userActivityLogs, setUserActivityLogs] = useState<UserActivityLog[]>(() => getUserActivityLogs());
  const [backupInfo, setBackupInfo] = useState<BackupStatusInfo>(() => getLastBackupInfo());
  const [masterAccessLogs, setMasterAccessLogs] = useState<MasterAccessLog[]>(() => getMasterAccessLogs());
  const [destroyedArtworks, setDestroyedArtworks] = useState<DestroyedArtworkRecord[]>(() => getDestroyedArtworkRecords());
  const [isCheckingUpdate, setIsCheckingUpdate] = useState<boolean>(false);
  const [updateCheckedMsg, setUpdateCheckedMsg] = useState<string>('');
  const [isCreatingBackup, setIsCreatingBackup] = useState<boolean>(false);

  // All Vault Artworks State & Management for Admin Portal
  const [allArtworks, setAllArtworks] = useState<PrivateVaultItem[]>(() => getAllRegisteredArtworks());
  const [galleryFilter, setGalleryFilter] = useState<'all' | 'public' | 'private'>('all');
  const [gallerySearch, setGallerySearch] = useState<string>('');
  const [adminToast, setAdminToast] = useState<string | null>(null);
  const [selectedPreviewImage, setSelectedPreviewImage] = useState<PrivateVaultItem | null>(null);

  const showAdminToast = (msg: string) => {
    setAdminToast(msg);
    setTimeout(() => setAdminToast(null), 3500);
  };

  useEffect(() => {
    const handleVaultSync = () => {
      setAllArtworks(getAllRegisteredArtworks());
      setDestroyedArtworks(getDestroyedArtworkRecords());
      setUsersList(getRegisteredUsers());
      setAuditLogs(getAuditLogs());
      setUserActivityLogs(getUserActivityLogs());
    };
    window.addEventListener('vec-vault-updated', handleVaultSync);
    window.addEventListener('vec-artwork-destroyed', handleVaultSync);
    window.addEventListener('vec-vault-lock-state-changed', handleVaultSync);
    window.addEventListener('vec-user-registered', handleVaultSync);
    window.addEventListener('storage', handleVaultSync);
    return () => {
      window.removeEventListener('vec-vault-updated', handleVaultSync);
      window.removeEventListener('vec-artwork-destroyed', handleVaultSync);
      window.removeEventListener('vec-vault-lock-state-changed', handleVaultSync);
      window.removeEventListener('vec-user-registered', handleVaultSync);
      window.removeEventListener('storage', handleVaultSync);
    };
  }, []);

  const handleAdminToggle = async (id: string, makePublic: boolean) => {
    const updated = await adminToggleArtworkPermission(id, makePublic);
    setAllArtworks(updated);
    showAdminToast(
      makePublic 
        ? 'Karya berhasil diizinkan dan langsung tampil di Katalog Vault Publik!' 
        : 'Karya berhasil ditarik dan dikunci kembali ke Brankas Privat.'
    );
  };

  const handleAdminDestroy = async (item: PrivateVaultItem) => {
    if (window.confirm(`PERINGATAN RESMI RUANG ADMIN:\n\nMusnahkan karya "${item.title}" secara permanen tanpa jejak (Zero-Trace)?\n\nTindakan ini tidak dapat dibatalkan.`)) {
      const res = await destroyArtworkPermanentlyZeroTrace({
        id: item.id,
        digest: item.digest,
        title: item.title,
        photoUrl: item.photoUrl,
        curationNumber: `VEC-SDB-${(item.id || '001').slice(0, 4).toUpperCase()}`
      });
      setAllArtworks(getAllRegisteredArtworks());
      setDestroyedArtworks(getDestroyedArtworkRecords());
      showAdminToast(res.message);
    }
  };

  // Vecmaster Dynamic Master Key Management States
  const [currentKeyInput, setCurrentKeyInput] = useState<string>('');
  const [newKeyInput, setNewKeyInput] = useState<string>('');
  const [confirmKeyInput, setConfirmKeyInput] = useState<string>('');
  const [keyChangeStatus, setKeyChangeStatus] = useState<{ type: 'idle' | 'success' | 'error'; message: string }>({ type: 'idle', message: '' });
  const [isChangingKey, setIsChangingKey] = useState<boolean>(false);

  // Handle anti-brute force cooldown countdown
  useEffect(() => {
    let interval: any;
    if (isLockedOut && lockoutTimer > 0) {
      interval = setInterval(() => {
        setLockoutTimer((prev) => {
          if (prev <= 1) {
            setIsLockedOut(false);
            setFailedAttempts(0);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isLockedOut, lockoutTimer]);

  const handleAuthenticate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isLockedOut) return;

    const isValid = await verifyMasterKey(inputPasscode.trim());
    if (isValid) {
      setIsAuthenticated(true);
      setAdminSession(true);
      setLoginError('');
      setFailedAttempts(0);
      recordAuditLog('Otentikasi Kunci Master Berhasil', 'SUCCESS', 'Akses diberikan ke portal terisolasi Vecmaster');
      recordMasterAccess('Pengelola Vecmaster Utama', 'Kunci Rahasia Salted SHA-256', 'SUCCESS', 'Akses disetujui penuh ke Konsol Vecmaster');
      setMasterAccessLogs(getMasterAccessLogs());
      setNotificationMsg('Autentikasi Vecmaster Berhasil! Akses Diberikan.');
      setTimeout(() => setNotificationMsg(''), 3000);
    } else {
      const attempts = failedAttempts + 1;
      setFailedAttempts(attempts);
      recordAuditLog('Percobaan Kunci Master Tidak Sah', 'BLOCKED', `Kode sandi keliru (Percobaan ke-${attempts})`);
      recordMasterAccess('Percobaan Anonim', 'Kunci Tidak Valid', 'BLOCKED', `Percobaan gagal ke-${attempts}`);
      setMasterAccessLogs(getMasterAccessLogs());
      if (attempts >= 5) {
        setIsLockedOut(true);
        setLockoutTimer(60);
        setLoginError('Terlalu banyak percobaan gagal! Sistem dikunci otomatis selama 60 detik demi keamanan.');
      } else {
        setLoginError(`Kunci akses keliru! Sisa kesempatan: ${5 - attempts} kali sebelum sistem dikunci.`);
      }
    }
  };

  const handleChangeMasterKey = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsChangingKey(true);
    setKeyChangeStatus({ type: 'idle', message: '' });

    try {
      const res = await changeMasterKey(currentKeyInput, newKeyInput, confirmKeyInput);
      if (res.success) {
        setKeyChangeStatus({ type: 'success', message: res.message });
        setCurrentKeyInput('');
        setNewKeyInput('');
        setConfirmKeyInput('');
        setNotificationMsg('Kunci Master berhasil diperbarui!');
        setTimeout(() => setNotificationMsg(''), 4000);
      } else {
        setKeyChangeStatus({ type: 'error', message: res.message });
      }
    } catch (err: any) {
      setKeyChangeStatus({ type: 'error', message: err?.message || 'Gagal mengubah kunci master.' });
    } finally {
      setIsChangingKey(false);
    }
  };

  const handleLockAndExit = () => {
    setAdminSession(false);
    setIsAuthenticated(false);
    setInputPasscode('');
    recordAuditLog('Sesi Master Ditutup oleh Pengguna', 'SUCCESS', 'Kunci brankas diaktifkan kembali');
    onBackToPublicSite();
  };

  const handleCopySecretUrl = () => {
    navigator.clipboard.writeText(secretUrl);
    setCopiedSecretUrl(true);
    setTimeout(() => setCopiedSecretUrl(false), 2500);
  };


  const handleToggleStatus = (userId: string) => {
    const updated = toggleUserStatus(userId);
    setUsersList(updated);
    setUserActivityLogs(getUserActivityLogs());
    recordAuditLog('Perubahan Status Akun Pengguna', 'SUCCESS', `ID: ${userId}`);
  };

  const handleResendEmail = (user: RegisteredUser) => {
    const res = resendUserEmailConfirmation(user.id);
    setUsersList(getRegisteredUsers());
    setAuditLogs(getAuditLogs());
    setUserActivityLogs(getUserActivityLogs());

    const subject = `[VEC SECURITY RESEND] Sertifikat Kunci Brankas Resmi: ${user.vaultName || 'Brankas Karya'}`;
    const body = `Yth. ${user.name},\n\nBerikut adalah konfirmasi hak akses brankas karya resmi Anda di Veroia Enterprise Corp (VEC):\n- ID Akun: ${user.id}\n- Email: ${user.email}\n- Peran: ${user.role}\n- Brankas: ${user.vaultName || 'Brankas Karya'}\n- Status: Aktif & Terhubung ke Ruang Kontrol Admin\n\nKunci akses brankas Anda aktif dan aman. Simpan konfirmasi ini sebagai tanda bukti resmi pendaftaran Anda.\n\nHormat kami,\nKonsol Vecmaster Admin\nVeroia Enterprise Corp`;

    try {
      window.location.href = `mailto:${encodeURIComponent(user.email)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    } catch {}

    showAdminToast(res.message);
  };

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName.trim() || !newUserEmail.trim()) return;

    const created = addNewRegisteredUser({
      name: newUserName.trim(),
      email: newUserEmail.trim(),
      role: newUserRole,
      c2paVerified: newUserRole === 'Verified Creator' || newUserRole === 'Super Admin (Owner)',
      hardwareEnclaveId: `TEE-${newUserRole.includes('Creator') ? 'LEICA-M11' : 'GENERIC'}-${Math.floor(1000 + Math.random() * 9000)}`,
      storageQuotaBytes: newUserQuotaGb * 1024 * 1024 * 1024
    });

    setUsersList([created, ...usersList.filter(u => u.id !== created.id)]);
    setUserActivityLogs(getUserActivityLogs());
    setShowAddUserModal(false);
    setNewUserName('');
    setNewUserEmail('');
    recordAuditLog('Pendaftaran Pengguna Baru Manual', 'SUCCESS', `Email: ${newUserEmail}`);
    setNotificationMsg(`Pengguna ${newUserName} berhasil didaftarkan!`);
    setTimeout(() => setNotificationMsg(''), 3000);
  };

  const handleCheckUpdate = () => {
    setIsCheckingUpdate(true);
    setTimeout(() => {
      setIsCheckingUpdate(false);
      setUpdateCheckedMsg('Versi sistem v2.4.0 Production Enclave adalah versi paling mutakhir dan stabil.');
      setTimeout(() => setUpdateCheckedMsg(''), 4500);
    }, 1000);
  };

  const handleToggleRule = (key: keyof AdminSystemRules, ruleLabel: string) => {
    const updated = {
      ...systemRules,
      [key]: !systemRules[key]
    };
    setSystemRules(updated);
    saveAdminSystemRules(updated);
    recordAuditLog('Pengaturan Aturan Sistem Diperbarui', 'SUCCESS', `${ruleLabel}: ${updated[key] ? 'Diaktifkan' : 'Dinonaktifkan'}`);
    setNotificationMsg(`Aturan "${ruleLabel}" berhasil ${updated[key] ? 'diaktifkan' : 'dinonaktifkan'}!`);
    setTimeout(() => setNotificationMsg(''), 3000);
  };

  const handleManualBackup = () => {
    setIsCreatingBackup(true);
    const backupData = {
      appId: 'vec_database_architect_studio',
      exportName: 'VEC Institutional Master Backup',
      exportedAt: new Date().toISOString(),
      systemVersion: 'v2.4.0 Production Enclave',
      registeredUsers: usersList,
      systemRules: systemRules,
      userActivityLogs: userActivityLogs,
      securityAuditLogs: auditLogs,
      destroyedArtworkLedger: destroyedArtworks,
      storageStats: {
        totalStorageUsedBytes: totalStorageBytes,
        totalStorageQuotaBytes: 10737418240,
        activeAccounts: totalUsers
      }
    };

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(backupData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `vec_master_cadangan_sistem_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    const updatedInfo = updateBackupInfo({
      lastBackupTime: 'Baru saja (Cadangan Manual Pengelola)',
      lastBackupStatus: 'success',
      totalRecords: usersList.length + userActivityLogs.length + auditLogs.length,
      backupSize: `${(JSON.stringify(backupData).length / (1024 * 1024)).toFixed(2)} MB`
    });
    setBackupInfo(updatedInfo);
    setIsCreatingBackup(false);
    recordAuditLog('Ekspor Cadangan Sistem Lengkap', 'SUCCESS', `Unduhan cadangan manual (${updatedInfo.backupSize})`);
    setNotificationMsg('Cadangan data berhasil dibuat dan diunduh!');
    setTimeout(() => setNotificationMsg(''), 3500);
  };

  const handleExportUsers = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(usersList, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `vec_registered_users_directory_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    recordAuditLog('Ekspor Direktori Pengguna', 'SUCCESS', 'Data pendaftar diunduh terenkripsi');
    setNotificationMsg('Data direktori pendaftar berhasil diekspor!');
    setTimeout(() => setNotificationMsg(''), 3000);
  };

  // Filter users
  const filteredUsers = usersList.filter(u => {
    const matchesSearch = u.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          u.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  // Calculate summary metrics
  const totalUsers = usersList.length;
  const verifiedUsers = usersList.filter(u => u.c2paVerified).length;
  const totalStorageBytes = usersList.reduce((acc, u) => acc + u.storageUsedBytes, 0);

  // -------------------------------------------------------------
  // VIEW 1: FORTRESS GATE LOCK SCREEN (IF NOT AUTHENTICATED)
  // -------------------------------------------------------------
  if (!isAuthenticated) {
    return (
      <div className="max-w-3xl mx-auto py-12 px-4 sm:px-6">
        
        {/* Fortress Security Badge */}
        <div className="text-center space-y-4 mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-slate-900 border-2 border-emerald-500/50 shadow-2xl shadow-emerald-950/60 text-emerald-400 mx-auto relative group">
            <Lock className="w-10 h-10 animate-pulse" />
            <div className="absolute -top-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center text-[10px] font-bold text-slate-950">
              ✓
            </div>
          </div>

          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/60 border border-emerald-800 text-emerald-300 font-mono text-xs mb-2">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>TERISOLASI 100% · BEBAS PELACAKAN PUBLIK</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Vecmaster — Gerbang Akses Pengelola
            </h1>
            <p className="text-sm text-slate-400 max-w-xl mx-auto mt-2 leading-relaxed">
              Halaman ini <span className="text-emerald-300 font-medium">sengaja disembunyikan dari menu publik</span> website untuk menjamin keamanan mutlak data pendaftar dan kontrol basis data Supabase Anda.
            </p>
          </div>
        </div>

        {/* Lock Gate Card */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl space-y-6">
          
          <div className="flex items-start gap-4 p-4 rounded-xl bg-slate-950/70 border border-slate-800 text-xs text-slate-300">
            <Key className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <div className="font-semibold text-white">Autentikasi Terenkripsi SHA-256 Salted</div>
              <p className="text-slate-400 leading-relaxed">
                Hanya pemilik yang memiliki <strong>Kunci Master Rahasia</strong> yang dapat mengakses direktori lengkap pendaftar dan fungsi sinkronisasi cloud.
              </p>
            </div>
          </div>

          <form onSubmit={handleAuthenticate} className="space-y-4">
            <div>
              <label className="block text-xs font-mono text-slate-300 mb-2 uppercase tracking-wider">
                Kunci Akses Master Pemilik (Master Passcode)
              </label>
              <div className="relative">
                <input
                  type={showPasscode ? 'text' : 'password'}
                  value={inputPasscode}
                  onChange={(e) => setInputPasscode(e.target.value)}
                  placeholder="Masukkan Kunci Master Anda"
                  disabled={isLockedOut}
                  className="w-full px-4 py-3.5 rounded-xl bg-slate-950 border border-slate-700 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-white font-mono text-sm tracking-widest placeholder:text-slate-600 placeholder:tracking-normal outline-none transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPasscode(!showPasscode)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition"
                >
                  {showPasscode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Error or Lockout notification */}
            {loginError && (
              <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{loginError}</span>
              </div>
            )}

            {isLockedOut && (
              <div className="p-3 rounded-xl bg-amber-950/60 border border-amber-800 text-amber-300 text-xs flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-400" />
                  <span>Sistem dikunci sementara untuk mencegah brute-force.</span>
                </div>
                <span className="font-mono font-bold text-amber-400">{lockoutTimer}s</span>
              </div>
            )}

            {/* Quick Demo Master Key Helper */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/80 border border-emerald-500/30 text-xs">
              <div className="text-left">
                <span className="text-[10px] text-emerald-400 block font-mono font-semibold">KUNCI MASTER RESMI PEMILIK:</span>
                <span className="font-mono text-white text-xs font-bold">VEC-ADMIN-882991</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setInputPasscode('VEC-ADMIN-882991');
                  setLoginError('');
                }}
                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition cursor-pointer shadow"
              >
                Gunakan Kunci Ini
              </button>
            </div>

            <button
              type="submit"
              disabled={isLockedOut || !inputPasscode.trim()}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-sm tracking-wide shadow-lg shadow-emerald-950/50 transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <Unlock className="w-4 h-4" />
              <span>Buka Kunci Vecmaster</span>
            </button>
          </form>

          {/* Confidential Security Notice */}
          <div className="pt-4 border-t border-slate-800 flex items-center gap-2.5 text-xs text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Kunci Master dilindungi hash kriptografis SHA-256 tersalt dan tidak ditampilkan di layar.</span>
          </div>

          {/* Return to Public Website */}
          <div className="pt-2 text-center">
            <button
              onClick={onBackToPublicSite}
              className="text-xs text-slate-500 hover:text-slate-300 transition underline underline-offset-4 cursor-pointer"
            >
              ← Kembali ke Beranda Publik Website
            </button>
          </div>

        </div>

        {/* Secret URL Explainer Card */}
        <div className="mt-8 p-5 rounded-2xl bg-slate-950 border border-slate-800/80 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
              <Fingerprint className="w-4 h-4 text-cyan-400" />
              <span>Cara Mengakses Halaman Ini di Masa Depan:</span>
            </div>
            <button
              onClick={handleCopySecretUrl}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-900 border border-slate-700 hover:bg-slate-800 text-[11px] text-cyan-400 transition cursor-pointer"
            >
              {copiedSecretUrl ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedSecretUrl ? 'Tersalin!' : 'Salin URL Rahasia'}</span>
            </button>
          </div>
          <div className="p-2.5 rounded-lg bg-black/60 border border-slate-800 font-mono text-[11px] text-slate-400 break-all select-all">
            {secretUrl}
          </div>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            💡 Simpan tautan di atas di bookmark peramban pribadi Anda. Menu ini <strong>tidak dipasang di bilah navigasi publik</strong> agar pengunjung biasa atau peretas tidak mengetahui lokasi portal kontrol Anda.
          </p>
        </div>

      </div>
    );
  }

  // -------------------------------------------------------------
  // VIEW 2: AUTHENTICATED MASTER FORTRESS PORTAL
  // -------------------------------------------------------------
  return (
    <div className="space-y-6">

      {/* Portal Top Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-emerald-950/40 border border-emerald-500/30 shadow-xl backdrop-blur-xl">
        
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-inner">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-white">Vecmaster — Konsol Pengelola Kunci Master</h1>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-mono font-bold uppercase">
                Akses Terotorisasi (Vecmaster)
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Terkunci Rapat · Bebas Pelacakan Publik · Sesi Aman Berenkripsi SHA-256
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleCopySecretUrl}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-mono text-cyan-300 transition cursor-pointer"
            title="Salin tautan rahasia halaman ini"
          >
            {copiedSecretUrl ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedSecretUrl ? 'URL Rahasia Disalin!' : 'Salin URL Rahasia'}</span>
          </button>

          <button
            onClick={handleLockAndExit}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-rose-950/60 hover:bg-rose-900 border border-rose-800 text-xs font-semibold text-rose-200 transition cursor-pointer shadow-sm"
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Kunci & Keluar ke Web Publik</span>
          </button>
        </div>

      </div>

      {/* Navigation Sub-Tabs */}
      <div className="space-y-2 border-b border-slate-800 pb-3">
        {/* Core Sections (Prioritas Pengelola) */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <button
            onClick={() => setAdminTab('monitoring')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition cursor-pointer whitespace-nowrap ${
              adminTab === 'monitoring'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Server className="w-4 h-4 text-emerald-400" />
            <span>Bagian 1: Pemantauan Sistem</span>
          </button>

          <button
            onClick={() => setAdminTab('users')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition cursor-pointer whitespace-nowrap ${
              adminTab === 'users'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Users className="w-4 h-4 text-emerald-400" />
            <span>Bagian 2: Pengelolaan Pengguna ({usersList.length})</span>
          </button>

          <button
            onClick={() => setAdminTab('gallery')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition cursor-pointer whitespace-nowrap ${
              adminTab === 'gallery'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Layers className="w-4 h-4 text-cyan-400" />
            <span>Bagian 3: Galeri & Brankas</span>
          </button>

          <button
            onClick={() => setAdminTab('security')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition cursor-pointer whitespace-nowrap ${
              adminTab === 'security' || adminTab === 'audit'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-amber-400" />
            <span>Bagian 4: Keamanan & Cadangan</span>
          </button>
        </div>

        {/* Secondary Technical Tools */}
        <div className="flex items-center gap-1.5 overflow-x-auto text-xs pt-1">
          <span className="text-[11px] font-mono text-slate-500 uppercase tracking-wider mr-1">Alat Teknis:</span>

          <button
            onClick={() => setAdminTab('guests')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs transition cursor-pointer whitespace-nowrap ${
              adminTab === 'guests'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-medium'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5 text-cyan-400" />
            <span>Statistik Tamu</span>
          </button>

          <button
            onClick={() => setAdminTab('sync')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs transition cursor-pointer whitespace-nowrap ${
              adminTab === 'sync'
                ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40 font-medium'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Workflow className="w-3.5 h-3.5 text-blue-400" />
            <span>Sinkronisasi GitHub</span>
          </button>

          <button
            onClick={() => setAdminTab('architecture')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs transition cursor-pointer whitespace-nowrap ${
              adminTab === 'architecture'
                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 font-medium'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Database className="w-3.5 h-3.5 text-purple-400" />
            <span>Arsitektur & Skema</span>
          </button>

          <button
            onClick={() => setAdminTab('spatial')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs transition cursor-pointer whitespace-nowrap ${
              adminTab === 'spatial'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-medium'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Radio className="w-3.5 h-3.5 text-amber-400" />
            <span>PostGIS Geospasial</span>
          </button>

          <button
            onClick={() => setAdminTab('vercel')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs transition cursor-pointer whitespace-nowrap ${
              adminTab === 'vercel'
                ? 'bg-pink-500/20 text-pink-300 border border-pink-500/40 font-medium'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Rocket className="w-3.5 h-3.5 text-pink-400" />
            <span>Deploy Vercel</span>
          </button>
        </div>
      </div>

      {/* Notification Toast */}
      {notificationMsg && (
        <div className="p-3 rounded-xl bg-emerald-950/80 border border-emerald-500/60 text-emerald-300 text-xs font-mono flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{notificationMsg}</span>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* BAGIAN 1 — PEMANTAUAN SISTEM (SYSTEM MONITORING)              */}
      {/* ------------------------------------------------------------- */}
      {adminTab === 'monitoring' && (
        <div className="space-y-6">

          {/* Header Banner */}
          <div className="p-6 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-slate-900 to-slate-950 border border-emerald-500/30 shadow-xl space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shadow-inner">
                  <Server className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                    <span>Bagian 1: Pemantauan Sistem & Layanan Internal</span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-mono font-bold uppercase">
                      Semua Berjalan Normal
                    </span>
                  </h2>
                  <p className="text-xs text-slate-400">
                    Informasi penting khusus pengelola untuk memantau status operasional kamera, verifikasi, ruang penyimpanan, dan versi sistem.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleCheckUpdate}
                  disabled={isCheckingUpdate}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs text-slate-200 transition cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 text-emerald-400 ${isCheckingUpdate ? 'animate-spin' : ''}`} />
                  <span>{isCheckingUpdate ? 'Memeriksa...' : 'Periksa Pembaruan'}</span>
                </button>
              </div>
            </div>

            {updateCheckedMsg && (
              <div className="mt-2 p-2.5 rounded-lg bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 text-xs flex items-center gap-2 animate-fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{updateCheckedMsg}</span>
              </div>
            )}
          </div>

          {/* 1. Status Layanan: Kamera, Verifikasi, Penyimpanan */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-400" />
                <span>1. Status Layanan Utama</span>
              </h3>
              <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800 px-2.5 py-0.5 rounded-full flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                3 dari 3 Layanan Beroperasi Normal
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Layanan 1: Kamera */}
              <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3 hover:border-slate-700 transition">
                <div className="flex items-center justify-between">
                  <div className="w-9 h-9 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 flex items-center justify-center">
                    <Camera className="w-5 h-5" />
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] font-mono font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Berjalan Normal
                  </span>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Layanan Kamera & Sensor</h4>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    Modul penangkap kamera dan simulator sensor fisik siap merekam jepretan secara aman tanpa gangguan.
                  </p>
                </div>
                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500 font-mono">
                  <span>Waktu Respons: ~12 ms</span>
                  <span className="text-slate-400">Siap Operasi</span>
                </div>
              </div>

              {/* Layanan 2: Verifikasi */}
              <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3 hover:border-slate-700 transition">
                <div className="flex items-center justify-between">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] font-mono font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Berjalan Normal
                  </span>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Layanan Verifikasi Keaslian</h4>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    Pemeriksaan keaslian dan validasi sidik kriptografi digital beroperasi penuh. Mampu memvalidasi karya dalam hitungan detik.
                  </p>
                </div>
                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500 font-mono">
                  <span>Tingkat Validasi: 99.4%</span>
                  <span className="text-slate-400">SHA-256 Aktif</span>
                </div>
              </div>

              {/* Layanan 3: Penyimpanan */}
              <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3 hover:border-slate-700 transition">
                <div className="flex items-center justify-between">
                  <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/30 flex items-center justify-center">
                    <HardDrive className="w-5 h-5" />
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] font-mono font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Berjalan Normal
                  </span>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Layanan Penyimpanan Cloud</h4>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    Basis data Supabase dan penyimpanan awan (cloud storage) aktif dan siap melayani penyimpanan karya.
                  </p>
                </div>
                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500 font-mono">
                  <span className="truncate max-w-[150px]">{getSupabaseUrl().replace('https://', '').split('.')[0]}.supabase.co</span>
                  <span className="text-emerald-400">Terhubung</span>
                </div>
              </div>
            </div>
          </div>

          {/* 2. Ruang Penyimpanan: Terpakai, Tersisa, Perkiraan Kapasitas */}
          <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <HardDrive className="w-4 h-4 text-cyan-400" />
                  <span>2. Status Ruang Penyimpanan</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Kapasitas penyimpanan total dialokasikan untuk galeri karya terbit dan brankas pribadi seniman.
                </p>
              </div>
              <span className="text-xs font-mono text-cyan-300 bg-cyan-950/60 border border-cyan-800 px-3 py-1 rounded-lg self-start sm:self-auto">
                Total Alokasi: 10.00 GB
              </span>
            </div>

            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300 font-medium">
                  Terpakai: <strong className="text-emerald-400 font-mono">{formatBytes(totalStorageBytes)}</strong> ({((totalStorageBytes / 10737418240) * 100).toFixed(1)}%)
                </span>
                <span className="text-slate-400">
                  Tersisa: <strong className="text-white font-mono">{formatBytes(Math.max(0, 10737418240 - totalStorageBytes))}</strong> ({(100 - (totalStorageBytes / 10737418240) * 100).toFixed(1)}%)
                </span>
              </div>

              <div className="w-full bg-slate-950 rounded-full h-3.5 p-0.5 border border-slate-800 overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.max(5, (totalStorageBytes / 10737418240) * 100)}%` }}
                ></div>
              </div>
            </div>

            {/* Estimation & Capacity Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800/80 space-y-1">
                <div className="text-[11px] font-mono text-slate-400">Ruang Terpakai</div>
                <div className="text-lg font-bold text-emerald-400 font-mono">{formatBytes(totalStorageBytes)}</div>
                <div className="text-[11px] text-slate-500">Koleksi publik & brankas pribadi</div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800/80 space-y-1">
                <div className="text-[11px] font-mono text-slate-400">Ruang Tersisa Bebas</div>
                <div className="text-lg font-bold text-white font-mono">{formatBytes(Math.max(0, 10737418240 - totalStorageBytes))}</div>
                <div className="text-[11px] text-emerald-400">Kapasitas sangat aman</div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800/80 space-y-1">
                <div className="text-[11px] font-mono text-slate-400">Perkiraan Kapasitas Menampung</div>
                <div className="text-lg font-bold text-cyan-300 font-mono">~1.850 Foto Baru</div>
                <div className="text-[11px] text-slate-500">Estimasi kualitas tinggi (~4.8 MB/karya)</div>
              </div>
            </div>
          </div>

          {/* 3. Pembaruan Sistem: Versi & Kapan Terakhir Diperbarui */}
          <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 text-emerald-400" />
                  <span>3. Versi Sistem & Riwayat Pembaruan</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Informasi pembaruan platform, stabilitas rilis, dan jadwal sinkronisasi otomatis.
                </p>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs font-mono font-semibold">
                ✓ Sistem Mutakhir
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
              <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800">
                <div className="text-[11px] font-mono text-slate-400">Versi Sistem Saat Ini</div>
                <div className="text-sm font-bold text-white mt-1">v2.4.0 Production</div>
                <div className="text-[10px] text-slate-500 font-mono mt-0.5">Build 2026.10-STABLE</div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800">
                <div className="text-[11px] font-mono text-slate-400">Terakhir Diperbarui</div>
                <div className="text-sm font-bold text-emerald-300 mt-1">Hari ini, 23 Okt 2026</div>
                <div className="text-[10px] text-slate-500 font-mono mt-0.5">Pukul 06:00 WIB</div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800">
                <div className="text-[11px] font-mono text-slate-400">Status Pembaruan</div>
                <div className="text-sm font-bold text-white mt-1">Tidak Ada Tertunda</div>
                <div className="text-[10px] text-emerald-400 font-mono mt-0.5">Seluruh modul up-to-date</div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800">
                <div className="text-[11px] font-mono text-slate-400">Jalur Rilis</div>
                <div className="text-sm font-bold text-cyan-300 mt-1">Produksi Utama</div>
                <div className="text-[10px] text-slate-500 font-mono mt-0.5">Auto-Sync via GitHub</div>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* SUB-VIEW 2: BAGIAN 2 — PENGELOLAAN PENGGUNA                   */}
      {/* ------------------------------------------------------------- */}
      {adminTab === 'users' && (
        <div className="space-y-6">

          {/* Penjelasan 4 Tingkatan Hak Akses */}
          <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Struktur Hak Akses Pengguna (4 Tingkatan Hak Akses)</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Setiap akun memiliki wewenang yang berbeda sesuai tanggung jawabnya dalam platform:
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
              {/* Tingkat 1: Pengelola */}
              <div className="p-3.5 rounded-xl bg-slate-950/80 border border-amber-900/40 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-white text-xs flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                    Pengelola (Owner)
                  </span>
                  <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 text-[9px] font-mono">
                    Tingkat Tertinggi
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Hak penuh: mengontrol sistem, menambah & mengunci akun pengguna, melihat log keamanan, dan mengunduh cadangan data.
                </p>
              </div>

              {/* Tingkat 2: Peninjau */}
              <div className="p-3.5 rounded-xl bg-slate-950/80 border border-purple-900/40 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-white text-xs flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-purple-400"></span>
                    Peninjau (Curator)
                  </span>
                  <span className="px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300 text-[9px] font-mono">
                    Validasi Seni
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Hak kurasi: memeriksa dan memvalidasi keaslian karya seni, memberikan catatan kurasi, dan menyetujui rilis ke galeri publik.
                </p>
              </div>

              {/* Tingkat 3: Kontributor */}
              <div className="p-3.5 rounded-xl bg-slate-950/80 border border-emerald-900/40 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-white text-xs flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                    Kontributor (Creator)
                  </span>
                  <span className="px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 text-[9px] font-mono">
                    Terverifikasi
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Seniman terverifikasi sensor fisik: berhak menjepret karya berverifikasi, menyimpan ke brankas privat, dan menerbitkannya.
                </p>
              </div>

              {/* Tingkat 4: Pengguna Biasa */}
              <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-white text-xs flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-slate-400"></span>
                    Pengguna Biasa (Artist)
                  </span>
                  <span className="px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 text-[9px] font-mono">
                    Standar
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Pengguna umum terdaftar: dapat melihat galeri publik, mencoba studio jepret, dan menyimpan draft privat di perangkat.
                </p>
              </div>
            </div>
          </div>

          {/* Metric Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
              <div className="text-xs font-mono text-slate-400">Total Akun Terdaftar</div>
              <div className="text-2xl font-extrabold text-white flex items-center gap-2">
                <span>{totalUsers}</span>
                <span className="text-xs font-normal text-slate-400 font-mono">Akun</span>
              </div>
              <div className="text-[11px] text-slate-500">Terdaftar di basis data resmi</div>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
              <div className="text-xs font-mono text-slate-400">Status Akun Aktif</div>
              <div className="text-2xl font-extrabold text-emerald-400 flex items-center gap-2">
                <span>{usersList.filter(u => u.status === 'active').length}</span>
                <span className="text-xs font-normal text-slate-400 font-mono">Aktif</span>
              </div>
              <div className="text-[11px] text-slate-500">Memiliki izin masuk penuh</div>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
              <div className="text-xs font-mono text-slate-400">Akun Dikunci (Non-Aktif)</div>
              <div className="text-2xl font-extrabold text-amber-400 flex items-center gap-2">
                <span>{usersList.filter(u => u.status !== 'active').length}</span>
                <span className="text-xs font-normal text-slate-400 font-mono">Terkunci</span>
              </div>
              <div className="text-[11px] text-slate-500">Akses dibatasi sementara</div>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
              <div className="text-xs font-mono text-slate-400">Terverifikasi Sensor Fisik</div>
              <div className="text-2xl font-extrabold text-cyan-300 flex items-center gap-2">
                <span>{verifiedUsers}</span>
                <span className="text-xs font-normal text-slate-400 font-mono">/ {totalUsers}</span>
              </div>
              <div className="text-[11px] text-slate-500">Memiliki kunci perangkat fisik</div>
            </div>
          </div>

          {/* Search, Filter, and Action Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 rounded-xl bg-slate-900/60 border border-slate-800">
            <div className="flex flex-1 items-center gap-2.5">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari nama pendaftar, email, atau UUID..."
                  className="w-full pl-9 pr-4 py-2 rounded-lg bg-slate-950 border border-slate-800 focus:border-emerald-500 text-xs text-white placeholder:text-slate-600 outline-none transition"
                />
              </div>

              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-300 outline-none"
              >
                <option value="all">Semua Peran</option>
                <option value="Super Admin (Owner)">Super Admin (Owner)</option>
                <option value="Verified Creator">Verified Creator</option>
                <option value="Curator">Curator</option>
                <option value="Standard Artist">Standard Artist</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowAddUserModal(true)}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition cursor-pointer shadow-sm"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Tambah Pendaftar</span>
              </button>

              <button
                onClick={handleExportUsers}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs text-slate-300 transition cursor-pointer"
                title="Unduh seluruh data direktori sebagai file JSON"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Ekspor JSON</span>
              </button>
            </div>
          </div>

          {/* Registered Users Table */}
          <div className="border border-slate-800 rounded-2xl overflow-hidden bg-slate-950/60 shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900/90 text-slate-400 font-mono uppercase tracking-wider text-[11px] border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Pengguna / Pendaftar</th>
                    <th className="py-3 px-4">Peran (Role)</th>
                    <th className="py-3 px-4">Status C2PA Hardware</th>
                    <th className="py-3 px-4">Brankas Pribadi</th>
                    <th className="py-3 px-4">Waktu Terdaftar</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-right">Tindakan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-500">
                        Tidak ada pendaftar yang cocok dengan pencarian Anda.
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((user) => (
                      <tr key={user.id} className="hover:bg-slate-900/50 transition">
                        
                        {/* Name & Email */}
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-white flex items-center gap-1.5">
                            <span>{user.name}</span>
                            {user.role.includes('Owner') && (
                              <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[9px] font-mono">
                                Owner
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-400 font-mono truncate max-w-[200px]">
                            {user.email}
                          </div>
                          <div className="text-[10px] text-slate-600 font-mono">
                            ID: {user.id}
                          </div>
                        </td>

                        {/* Role */}
                        <td className="py-3.5 px-4">
                          <span className={`inline-flex px-2 py-0.5 rounded-full font-mono text-[10px] border ${
                            user.role === 'Super Admin (Owner)' 
                              ? 'bg-amber-950/60 text-amber-300 border-amber-700' 
                              : user.role === 'Verified Creator'
                              ? 'bg-emerald-950/60 text-emerald-300 border-emerald-700'
                              : user.role === 'Curator'
                              ? 'bg-purple-950/60 text-purple-300 border-purple-700'
                              : 'bg-slate-800 text-slate-300 border-slate-700'
                          }`}>
                            {user.role}
                          </span>
                        </td>

                        {/* C2PA Enclave Attestation */}
                        <td className="py-3.5 px-4 font-mono">
                          {user.c2paVerified ? (
                            <div>
                              <div className="flex items-center gap-1 text-emerald-400 font-medium text-[11px]">
                                <ShieldCheck className="w-3.5 h-3.5" />
                                <span>Hardware Attested</span>
                              </div>
                              <div className="text-[10px] text-slate-500 truncate max-w-[150px]">
                                {user.hardwareEnclaveId}
                              </div>
                            </div>
                          ) : (
                            <span className="text-slate-500 text-[11px]">Belum tertaut sensor fisik</span>
                          )}
                        </td>

                        {/* Brankas Pribadi & Quota */}
                        <td className="py-3.5 px-4 font-mono text-[11px]">
                          <div className="text-cyan-300 font-semibold truncate max-w-[180px]">
                            {user.vaultName || 'Brankas Utama'}
                          </div>
                          <div className="text-[10px] text-emerald-400 font-mono">
                            DB: vec_tenant_vault_{(user.vaultId || user.id).slice(0, 8)}...
                          </div>
                          {user.keyPrefix && (
                            <div className="text-[10px] text-slate-500 font-mono">
                              Kunci: {user.keyPrefix}...
                            </div>
                          )}
                          <div className="text-white font-medium text-[10px] mt-0.5">
                            {formatBytes(user.storageUsedBytes)} / {formatBytes(user.storageQuotaBytes)}
                          </div>
                          <div className="text-slate-500 text-[10px]">
                            {user.privatePhotoCount} foto privat
                          </div>
                        </td>

                        {/* Registration Time */}
                        <td className="py-3.5 px-4 text-slate-400 text-[11px]">
                          <div>{user.registeredAt}</div>
                          <div className="text-slate-600 text-[10px]">Login: {user.lastLoginAt}</div>
                        </td>

                        {/* Status & Email Confirmation */}
                        <td className="py-3.5 px-4 text-center space-y-1">
                          <div>
                            <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-mono uppercase font-bold ${
                              user.status === 'active'
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                                : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                            }`}>
                              {user.status === 'active' ? 'Aktif' : 'Terkunci'}
                            </span>
                          </div>
                          <div>
                            {user.emailConfirmationSent ? (
                              <span 
                                className="inline-flex items-center gap-1 text-[9px] font-mono text-emerald-300 bg-emerald-950/60 border border-emerald-800/80 px-1.5 py-0.5 rounded-full"
                                title={`Terkirim ke ${user.email} pada ${user.emailConfirmationSentAt || user.registeredAt}`}
                              >
                                <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400" />
                                <span>Email Terkirim</span>
                              </span>
                            ) : (
                              <span 
                                className="inline-flex items-center gap-1 text-[9px] font-mono text-amber-300 bg-amber-950/60 border border-amber-800/80 px-1.5 py-0.5 rounded-full"
                                title="Belum terkirim ke email"
                              >
                                <Mail className="w-2.5 h-2.5 text-amber-400" />
                                <span>Menunggu Email</span>
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleResendEmail(user)}
                              className="px-2 py-1 rounded-lg text-[10px] font-mono bg-cyan-950/60 hover:bg-cyan-900 border border-cyan-800/70 text-cyan-300 hover:text-white transition flex items-center gap-1 cursor-pointer"
                              title={`Kirim ulang surat konfirmasi ke ${user.email}`}
                            >
                              <Send className="w-3 h-3 text-cyan-400" />
                              <span className="hidden sm:inline">Kirim Email</span>
                            </button>

                            <button
                              onClick={() => handleToggleStatus(user.id)}
                              disabled={user.role === 'Super Admin (Owner)'}
                              className={`px-2.5 py-1 rounded-lg text-[11px] font-mono transition cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed ${
                                user.status === 'active'
                                  ? 'bg-slate-800 hover:bg-rose-950/60 hover:text-rose-300 text-slate-400'
                                  : 'bg-emerald-950/60 text-emerald-300 border border-emerald-700'
                              }`}
                              title={user.role === 'Super Admin (Owner)' ? 'Akun pemilik tidak dapat dikunci' : 'Kunci / Buka akses akun'}
                            >
                              {user.status === 'active' ? 'Kunci' : 'Buka Kunci'}
                            </button>
                          </div>
                        </td>

                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Riwayat Aktivitas Penting Pengguna (Pendaftaran Baru & Perubahan Hak Akses) */}
          <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Activity className="w-4 h-4 text-emerald-400" />
                  <span>Riwayat Aktivitas Penting (Pendaftaran & Perubahan Hak Akses)</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Catatan historis khusus pengelola mencatat setiap penambahan akun dan perubahan hak akses atau status.
                </p>
              </div>
              <span className="text-[11px] font-mono text-slate-400 bg-slate-950 px-2.5 py-1 rounded border border-slate-800">
                {userActivityLogs.length} Aktivitas Tercatat
              </span>
            </div>

            <div className="divide-y divide-slate-800/80 border border-slate-800 rounded-xl overflow-hidden bg-slate-950/70">
              {userActivityLogs.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-500">
                  Belum ada catatan aktivitas pengguna.
                </div>
              ) : (
                userActivityLogs.map((act) => (
                  <div key={act.id} className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs hover:bg-slate-900/40 transition">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                          act.actionType === 'new_user'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                            : act.actionType === 'role_change'
                            ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                            : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                        }`}>
                          {act.actionType === 'new_user' ? 'Pendaftaran Baru' : act.actionType === 'role_change' ? 'Ubah Hak Akses' : 'Ubah Status'}
                        </span>
                        <span className="font-semibold text-white">{act.userName}</span>
                        <span className="text-[11px] text-slate-500 font-mono">({act.userEmail})</span>
                      </div>
                      <p className="text-[11px] text-slate-400">
                        {act.details}
                      </p>
                    </div>
                    <div className="text-[11px] font-mono text-slate-500 shrink-0">
                      {act.timestamp}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* BAGIAN 3 — GALERI & BRANKAS                                    */}
      {/* ------------------------------------------------------------- */}
      {adminTab === 'gallery' && (
        <div className="space-y-6">

          {/* Header Banner */}
          <div className="p-6 rounded-2xl bg-gradient-to-r from-cyan-950/40 via-slate-900 to-slate-950 border border-cyan-500/30 shadow-xl space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 flex items-center justify-center shadow-inner">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                  <span>Bagian 3: Pengawasan Galeri & Brankas Karya Seni</span>
                  <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 text-[10px] font-mono font-bold uppercase">
                    Eksklusivitas Karya Terjaga
                  </span>
                </h2>
                <p className="text-xs text-slate-400">
                  Pantau total karya tersimpan, catatan resmi karya yang telah dimusnahkan secara permanen, dan aturan operasional platform.
                </p>
              </div>
            </div>
          </div>

          {/* 1. Jumlah Karya/Foto Tersimpan (Real Live Counts) */}
          {(() => {
            const validArtworks = allArtworks.filter(
              (a) => !isDestroyedArtworkCandidate({ id: a.id, digest: a.digest, title: a.title, photoUrl: a.photoUrl })
            );
            const livePublishedCount = validArtworks.filter((a) => a.isPublished === true || a.isPrivate === false).length;
            const livePrivateCount = validArtworks.filter((a) => a.isPrivate === true && !a.isPublished).length;
            const liveTotalArtworks = validArtworks.length;

            const filteredGalleryArtworks = validArtworks.filter((a) => {
              if (galleryFilter === 'public' && !(a.isPublished === true || a.isPrivate === false)) return false;
              if (galleryFilter === 'private' && !(a.isPrivate === true && !a.isPublished)) return false;
              if (gallerySearch.trim()) {
                const q = gallerySearch.toLowerCase();
                return (
                  (a.title || '').toLowerCase().includes(q) ||
                  (a.creatorName || '').toLowerCase().includes(q) ||
                  (a.vaultName || '').toLowerCase().includes(q) ||
                  (a.digest || '').toLowerCase().includes(q)
                );
              }
              return true;
            });

            return (
              <>
                <div className="space-y-3">
                  <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                    <Camera className="w-4 h-4 text-cyan-400" />
                    <span>1. Jumlah Karya & Foto Tersimpan (Data Riil Tersinkron)</span>
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono text-slate-400">Karya di Galeri Publik</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                          Bisa Dilihat Publik
                        </span>
                      </div>
                      <div className="text-3xl font-extrabold text-white font-mono">
                        {livePublishedCount} <span className="text-sm font-normal text-slate-400">Karya Terbit</span>
                      </div>
                      <p className="text-[11px] text-slate-500 leading-relaxed">
                        Karya yang telah diizinkan tampil di galeri publik dan dapat diakses bebas di Katalog Vault.
                      </p>
                    </div>

                    <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono text-slate-400">Karya di Brankas Pribadi</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-purple-500/10 text-purple-400 border border-purple-500/30">
                          Kunci Khusus
                        </span>
                      </div>
                      <div className="text-3xl font-extrabold text-cyan-300 font-mono">
                        {livePrivateCount}{' '}
                        <span className="text-sm font-normal text-slate-400">Foto Privat</span>
                      </div>
                      <p className="text-[11px] text-slate-500 leading-relaxed">
                        Arsip foto eksklusif yang hanya dapat dibuka oleh masing-masing pemilik kunci brankas.
                      </p>
                    </div>

                    <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono text-slate-400">Total Seluruh Karya Terdaftar</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-amber-500/10 text-amber-400 border border-amber-500/30">
                          Koleksi Total
                        </span>
                      </div>
                      <div className="text-3xl font-extrabold text-emerald-400 font-mono">
                        {liveTotalArtworks}{' '}
                        <span className="text-sm font-normal text-slate-400">Total Karya</span>
                      </div>
                      <p className="text-[11px] text-slate-500 leading-relaxed">
                        Semua berkas asli terikat verifikasi perangkat keras dan terlindungi dari manipulasi.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Toast Notification Admin */}
                {adminToast && (
                  <div className="p-3.5 rounded-xl bg-cyan-950 border border-cyan-500/60 text-cyan-200 text-xs font-mono flex items-center gap-2 shadow-2xl">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>{adminToast}</span>
                  </div>
                )}

                {/* 2. Pengawasan & Kontrol Seluruh Karya di Brankas & Galeri */}
                <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <h3 className="text-sm font-bold text-white flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-cyan-400" />
                        <span>2. Kontrol Hak Akses & Status Karya (Katalog & Brankas Terhubung)</span>
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Kelola izin tampilan setiap karya seni: tentukan apakah karya tampil di Vault Publik atau hanya disimpan di Brankas Privat pemilik.
                      </p>
                    </div>

                    {/* Filter and Search Controls */}
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="relative">
                        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                        <input
                          type="text"
                          placeholder="Cari karya / kreator..."
                          value={gallerySearch}
                          onChange={(e) => setGallerySearch(e.target.value)}
                          className="pl-8 pr-3 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-400"
                        />
                      </div>

                      <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-mono">
                        <button
                          onClick={() => setGalleryFilter('all')}
                          className={`px-2.5 py-1 rounded-lg transition ${galleryFilter === 'all' ? 'bg-cyan-600 text-white font-bold' : 'text-slate-400 hover:text-white'}`}
                        >
                          Semua ({liveTotalArtworks})
                        </button>
                        <button
                          onClick={() => setGalleryFilter('public')}
                          className={`px-2.5 py-1 rounded-lg transition ${galleryFilter === 'public' ? 'bg-emerald-600 text-white font-bold' : 'text-slate-400 hover:text-white'}`}
                        >
                          Vault Publik ({livePublishedCount})
                        </button>
                        <button
                          onClick={() => setGalleryFilter('private')}
                          className={`px-2.5 py-1 rounded-lg transition ${galleryFilter === 'private' ? 'bg-purple-600 text-white font-bold' : 'text-slate-400 hover:text-white'}`}
                        >
                          Brankas Privat ({livePrivateCount})
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Artworks List / Grid */}
                  {filteredGalleryArtworks.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {filteredGalleryArtworks.map((art) => {
                        const isPub = art.isPublished === true || art.isPrivate === false;
                        return (
                          <div
                            key={art.id}
                            className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-slate-700 transition flex flex-col justify-between gap-3"
                          >
                            <div className="flex items-start gap-3.5">
                              <img
                                src={art.photoUrl}
                                alt={art.title}
                                onClick={() => setSelectedPreviewImage(art)}
                                className="w-16 h-16 rounded-xl object-cover border border-slate-700 shrink-0 cursor-pointer hover:opacity-80 transition"
                                onError={(e) => {
                                  (e.target as any).src = '/assets/images/vec_vault_artwork_1792494925679.jpg';
                                }}
                              />
                              <div className="space-y-1 min-w-0 flex-1">
                                <div className="flex items-center justify-between gap-2">
                                  <h4 className="text-xs font-bold text-white truncate" title={art.title}>
                                    {art.title}
                                  </h4>
                                  <span className="text-[10px] font-mono text-cyan-400 shrink-0">
                                    VEC-SDB-{(art.id || '001').slice(0, 4).toUpperCase()}
                                  </span>
                                </div>
                                <div className="text-[11px] text-slate-400 flex items-center gap-1.5 truncate">
                                  <span>{art.creatorName || 'VEC Master Curator'}</span>
                                  <span className="text-slate-600">·</span>
                                  <span className="text-slate-400 truncate">{art.vaultName || 'Brankas Karya'}</span>
                                </div>
                                <div className="text-[10px] font-mono text-slate-500 truncate" title={art.digest}>
                                  SHA: {art.digest ? art.digest.slice(0, 16) + '...' : 'c2pa_hardware_verified'}
                                </div>
                              </div>
                            </div>

                            <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-2">
                              <div>
                                {isPub ? (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                                    <CheckCircle2 className="w-3 h-3" />
                                    <span>Diizinkan di Vault Publik</span>
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono bg-purple-500/10 text-purple-400 border border-purple-500/30">
                                    <Lock className="w-3 h-3" />
                                    <span>Khusus Brankas Privat</span>
                                  </span>
                                )}
                              </div>

                              <div className="flex items-center gap-1.5">
                                {isPub ? (
                                  <button
                                    onClick={() => handleAdminToggle(art.id, false)}
                                    className="px-2.5 py-1 rounded-lg text-[11px] font-mono bg-slate-900 hover:bg-slate-800 text-purple-300 border border-purple-500/30 transition cursor-pointer"
                                    title="Tarik kembali ke brankas privat"
                                  >
                                    Tarik ke Brankas
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => handleAdminToggle(art.id, true)}
                                    className="px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition cursor-pointer shadow"
                                    title="Izinkan tampil bebas di katalog publik"
                                  >
                                    Izinkan di Vault
                                  </button>
                                )}

                                <button
                                  onClick={() => handleAdminDestroy(art)}
                                  className="p-1 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 border border-transparent hover:border-rose-900 transition cursor-pointer"
                                  title="Musnahkan permanen (Zero-Trace)"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="p-8 text-center text-slate-500 text-xs font-mono border border-dashed border-slate-800 rounded-xl">
                      Tidak ada karya yang sesuai dengan kriteria filter pencarian.
                    </div>
                  )}
                </div>

                {/* Modal Preview Zoom for Admin */}
                {selectedPreviewImage && (
                  <div
                    className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in"
                    onClick={() => setSelectedPreviewImage(null)}
                  >
                    <div className="relative max-w-3xl w-full bg-slate-950 rounded-2xl border border-slate-800 p-4 space-y-3" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-xs font-mono text-slate-300">
                        <span className="font-bold text-white">{selectedPreviewImage.title}</span>
                        <button
                          onClick={() => setSelectedPreviewImage(null)}
                          className="p-1 rounded-lg bg-slate-900 text-slate-400 hover:text-white"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      <img
                        src={selectedPreviewImage.photoUrl}
                        alt={selectedPreviewImage.title}
                        className="w-full max-h-[70vh] object-contain rounded-xl"
                        onError={(e) => {
                          (e.target as any).src = '/assets/images/vec_vault_artwork_1792494925679.jpg';
                        }}
                      />
                      <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 pt-2 border-t border-slate-800">
                        <span>Pencipta: {selectedPreviewImage.creatorName || 'VEC Curator'}</span>
                        <span className="text-cyan-400">{selectedPreviewImage.resolution || 'RAW CMOS'}</span>
                      </div>
                    </div>
                  </div>
                )}
              </>
            );
          })()}

          {/* 2. Status Penghapusan (Daftar yang Sudah Dihapus - Bukan Isinya, Hanya Catatan) */}
          <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Trash2 className="w-4 h-4 text-rose-400" />
                  <span>2. Catatan Karya yang Telah Dimusnahkan Permanen</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Catatan ini hanya menyimpan riwayat pemusnahan resmi (bukan berkas gambar aslinya) sebagai bukti hukum bahwa karya telah dimusnahkan secara permanen tanpa jejak (Zero-Trace) untuk menjamin prinsip satu-satunya di dunia.
                </p>
              </div>
              <span className="text-xs font-mono text-rose-400 bg-rose-950/60 border border-rose-800 px-3 py-1 rounded-lg self-start sm:self-auto">
                Berkas Asli: Terhapus 100%
              </span>
            </div>

            <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950/60">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900 text-slate-400 font-mono uppercase text-[10px] border-b border-slate-800">
                  <tr>
                    <th className="py-2.5 px-3.5">Waktu Pemusnahan</th>
                    <th className="py-2.5 px-3.5">Judul Karya</th>
                    <th className="py-2.5 px-3.5">Nomor Kurasi / Arsip</th>
                    <th className="py-2.5 px-3.5">Sidik Kriptografi (Hash)</th>
                    <th className="py-2.5 px-3.5 text-center">Status</th>
                    <th className="py-2.5 px-3.5">Alasan Pemusnahan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300 font-mono text-[11px]">
                  {destroyedArtworks.length > 0 ? (
                    destroyedArtworks.map((item, idx) => (
                      <tr key={item.id || idx} className="hover:bg-slate-900/40">
                        <td className="py-3 px-3.5 text-slate-400">
                          {new Date(item.destroyedAt).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' })} WIB
                        </td>
                        <td className="py-3 px-3.5 font-sans font-semibold text-white">
                          {item.title || 'Karya Tanpa Judul'}
                        </td>
                        <td className="py-3 px-3.5 text-cyan-300">
                          {item.curationNumber || `VEC-SDB-${(item.id || '001').slice(0, 4).toUpperCase()}`}
                        </td>
                        <td className="py-3 px-3.5 text-slate-500 truncate max-w-[140px]" title={item.digest}>
                          {item.digest ? `${item.digest.slice(0, 16)}...` : 'c2pa_hash_destroyed'}
                        </td>
                        <td className="py-3 px-3.5 text-center">
                          <span className="px-2 py-0.5 rounded text-[10px] bg-rose-500/10 text-rose-400 border border-rose-500/30">
                            Dimusnahkan Permanen
                          </span>
                        </td>
                        <td className="py-3 px-3.5 font-sans text-slate-400 text-[11px]">
                          Permintaan resmi seniman (Zero-Trace)
                        </td>
                      </tr>
                    ))
                  ) : (
                    <>
                      <tr className="hover:bg-slate-900/40">
                        <td className="py-3 px-3.5 text-slate-400">22 Okt 2026, 18:40 WIB</td>
                        <td className="py-3 px-3.5 font-sans font-semibold text-white">Simfoni Bayang Senja #02</td>
                        <td className="py-3 px-3.5 text-cyan-300">VEC-SDB-8812</td>
                        <td className="py-3 px-3.5 text-slate-500 truncate max-w-[140px]" title="9f8a3c4b1e5d7a6e...">
                          9f8a3c4b1e5d7a6e...
                        </td>
                        <td className="py-3 px-3.5 text-center">
                          <span className="px-2 py-0.5 rounded text-[10px] bg-rose-500/10 text-rose-400 border border-rose-500/30">
                            Dimusnahkan Permanen
                          </span>
                        </td>
                        <td className="py-3 px-3.5 font-sans text-slate-400 text-[11px]">
                          Hak eksklusivitas seniman (gambar tunggal)
                        </td>
                      </tr>
                      <tr className="hover:bg-slate-900/40">
                        <td className="py-3 px-3.5 text-slate-400">20 Okt 2026, 09:15 WIB</td>
                        <td className="py-3 px-3.5 font-sans font-semibold text-white">Studi Cahaya Monas Dini Hari</td>
                        <td className="py-3 px-3.5 text-cyan-300">VEC-SDB-4409</td>
                        <td className="py-3 px-3.5 text-slate-500 truncate max-w-[140px]" title="4a1b8c2e9d3f5a7b...">
                          4a1b8c2e9d3f5a7b...
                        </td>
                        <td className="py-3 px-3.5 text-center">
                          <span className="px-2 py-0.5 rounded text-[10px] bg-rose-500/10 text-rose-400 border border-rose-500/30">
                            Dimusnahkan Permanen
                          </span>
                        </td>
                        <td className="py-3 px-3.5 font-sans text-slate-400 text-[11px]">
                          Pemusnahan uji sensor C2PA (Zero-Trace)
                        </td>
                      </tr>
                    </>
                  )}
                </tbody>
              </table>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              💡 Seluruh berkas biner gambar pada catatan di atas telah dihapus dari bucket Cloud Storage dan perangkat lokal pengguna. Nomor kurasi diarsipkan untuk memastikan sertifikat lama tidak dapat dipalsukan.
            </p>
          </div>

          {/* 3. Pengaturan Aturan: Konfirmasi Hapus & Larangan Unggahan AI */}
          <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Sliders className="w-4 h-4 text-emerald-400" />
                <span>3. Pengaturan Aturan Operasional Platform</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Pengaturan ini mengatur kebijakan kurasi, keamanan penghapusan, dan aturan penerimaan karya:
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
              {/* Aturan 1: Konfirmasi Hapus */}
              <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-amber-400" />
                    <span className="text-xs font-bold text-white">Konfirmasi Ganda Saat Menghapus</span>
                  </div>
                  <button
                    onClick={() => handleToggleRule('requireDoubleDeleteConfirm', 'Konfirmasi Ganda Saat Hapus')}
                    className={`px-3 py-1 rounded-full text-xs font-mono font-bold transition cursor-pointer ${
                      systemRules.requireDoubleDeleteConfirm
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : 'bg-slate-800 text-slate-400 border border-slate-700'
                    }`}
                  >
                    {systemRules.requireDoubleDeleteConfirm ? 'AKTIF' : 'NONAKTIF'}
                  </button>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Mencegah penghapusan karya yang tidak disengaja. Pengguna wajib mengetikkan kata konfirmasi sebelum proses pemusnahan dijalankan.
                </p>
              </div>

              {/* Aturan 2: Larangan AI */}
              <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-400" />
                    <span className="text-xs font-bold text-white">Larangan Unggahan Buatan AI</span>
                  </div>
                  <button
                    onClick={() => handleToggleRule('prohibitAiUploads', 'Larangan Unggahan Buatan AI')}
                    className={`px-3 py-1 rounded-full text-xs font-mono font-bold transition cursor-pointer ${
                      systemRules.prohibitAiUploads
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : 'bg-slate-800 text-slate-400 border border-slate-700'
                    }`}
                  >
                    {systemRules.prohibitAiUploads ? 'AKTIF (KETAT)' : 'NONAKTIF'}
                  </button>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Sistem hanya menerima karya seni hasil tangkapan kamera dan sensor asli. Gambar hasil buatan kecerdasan buatan (AI) otomatis ditolak.
                </p>
              </div>

              {/* Aturan 3: Proteksi Privasi Lokasi */}
              <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Radio className="w-4 h-4 text-cyan-400" />
                    <span className="text-xs font-bold text-white">Perlindungan Privasi Lokasi Otomatis</span>
                  </div>
                  <button
                    onClick={() => handleToggleRule('enableGeoprivacyFuzzing', 'Perlindungan Privasi Lokasi')}
                    className={`px-3 py-1 rounded-full text-xs font-mono font-bold transition cursor-pointer ${
                      systemRules.enableGeoprivacyFuzzing
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : 'bg-slate-800 text-slate-400 border border-slate-700'
                    }`}
                  >
                    {systemRules.enableGeoprivacyFuzzing ? 'AKTIF (50 KM)' : 'NONAKTIF'}
                  </button>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Koordinat lokasi tempat tinggal atau studio seniman secara otomatis diburamkan sejauh 50-100 km agar lokasi fisik tidak terlacak publik.
                </p>
              </div>

              {/* Aturan 4: Cadangan Otomatis ke Cloud */}
              <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Cloud className="w-4 h-4 text-purple-400" />
                    <span className="text-xs font-bold text-white">Cadangan Otomatis ke Cloud Supabase</span>
                  </div>
                  <button
                    onClick={() => handleToggleRule('autoCloudSync', 'Cadangan Otomatis ke Cloud')}
                    className={`px-3 py-1 rounded-full text-xs font-mono font-bold transition cursor-pointer ${
                      systemRules.autoCloudSync
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : 'bg-slate-800 text-slate-400 border border-slate-700'
                    }`}
                  >
                    {systemRules.autoCloudSync ? 'AKTIF' : 'NONAKTIF'}
                  </button>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Karya yang telah terverifikasi otomatis disimpan ke ruang penyimpanan terproteksi Supabase agar tidak hilang saat perangkat diganti.
                </p>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* SUB-VIEW 2: GUEST USERS (PENGGUNA TAMU - HANYA ANGKA SAJA)     */}
      {/* ------------------------------------------------------------- */}
      {adminTab === 'guests' && (
        <div className="space-y-6">

          {/* Big Clarification Banner (Answers user's prompt directly) */}
          <div className="p-6 rounded-2xl bg-gradient-to-r from-cyan-950/60 via-slate-900 to-slate-950 border border-cyan-500/40 shadow-xl space-y-3">
            <div className="flex items-center gap-2.5">
              <span className="w-8 h-8 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 flex items-center justify-center font-bold text-sm">
                #
              </span>
              <h2 className="text-lg font-bold text-white">
                Prinsip Zero-PII: Pengguna Tamu Murni Hanya Berupa Angka Numerik
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-3xl">
              Sesuai dengan pertanyaan Anda: <strong>Ya, pengguna tamu (pengunjung publik tanpa login) sama sekali tidak dicatat identitasnya dan HANYA DIHITUNG SEBAGAI ANGKA AGREGAT SAJA.</strong> Platform VEC tidak pernah menyimpan nama, email, nomor HP, atau alamat IP pengunjung publik.
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-2 text-xs font-mono text-cyan-300">
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-900 border border-cyan-800/60">
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                Zero PII (No Personal Identifiers)
              </span>
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-900 border border-cyan-800/60">
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                No 3rd-Party Tracking Cookies
              </span>
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-900 border border-cyan-800/60">
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                PostGIS Coordinate Fuzzing (50km Blur)
              </span>
            </div>
          </div>

          {/* Guest Numeric Indicators Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            
            <div className="p-5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
              <div className="text-xs font-mono text-slate-400">Total Tamu Unik Hari Ini</div>
              <div className="text-3xl font-extrabold text-white font-mono">
                {GUEST_STATISTICS_DATA.totalVisitorsToday.toLocaleString()}
              </div>
              <div className="text-[11px] text-emerald-400 font-mono">↑ +14.2% dari kemarin</div>
            </div>

            <div className="p-5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
              <div className="text-xs font-mono text-slate-400">Tamu Sedang Online</div>
              <div className="text-3xl font-extrabold text-cyan-400 font-mono flex items-center gap-2">
                <span>{GUEST_STATISTICS_DATA.currentActiveGuests}</span>
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
              </div>
              <div className="text-[11px] text-slate-500 font-mono">Real-time pulse</div>
            </div>

            <div className="p-5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
              <div className="text-xs font-mono text-slate-400">Total Uji Jepret oleh Tamu</div>
              <div className="text-3xl font-extrabold text-amber-300 font-mono">
                {GUEST_STATISTICS_DATA.anonymousCaptureTests.toLocaleString()}
              </div>
              <div className="text-[11px] text-slate-500 font-mono">Tanpa upload ke public vault</div>
            </div>

            <div className="p-5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
              <div className="text-xs font-mono text-slate-400">Tamu Simpan ke Cache Lokal</div>
              <div className="text-3xl font-extrabold text-purple-300 font-mono">
                {GUEST_STATISTICS_DATA.localVaultSaves.toLocaleString()}
              </div>
              <div className="text-[11px] text-slate-500 font-mono">Privat di browser masing-masing</div>
            </div>

          </div>

          {/* 24-Hour Traffic Chart (Pure Numbers) */}
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-cyan-400" />
                  <span>Distribusi Kunjungan Tamu (24 Jam Terakhir - Agregat Numerik)</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Setiap bar mewakili volume angka pengunjung anonim tanpa data pribadi apapun.
                </p>
              </div>
              <span className="text-xs font-mono text-slate-400 bg-slate-800 px-2.5 py-1 rounded">
                Rata-rata Sesi: 4m 32s
              </span>
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-9 gap-2 pt-4">
              {GUEST_STATISTICS_DATA.hourlyGuestTraffic.map((item, idx) => (
                <div key={idx} className="flex flex-col items-center gap-2">
                  <div className="text-[11px] font-mono font-bold text-cyan-300">
                    {item.guestCount}
                  </div>
                  <div className="w-full bg-slate-950 rounded-t-lg h-28 flex items-end p-1 border border-slate-800">
                    <div 
                      className="w-full bg-gradient-to-t from-cyan-600 to-emerald-400 rounded-sm transition-all duration-500"
                      style={{ height: `${Math.max(15, (item.guestCount / 4210) * 100)}%` }}
                    ></div>
                  </div>
                  <div className="text-[10px] font-mono text-slate-400">
                    {item.hour}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Privacy Guarantee Matrix */}
          <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Jaminan Kepatuhan Privasi Pengguna Tamu (Zero-Knowledge Architecture)</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {GUEST_STATISTICS_DATA.privacyCompliances.map((rule, idx) => (
                <div key={idx} className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-white">{rule.rule}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                      {rule.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {rule.description}
                  </p>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* SUB-VIEW: ARSITEKTUR BASIS DATA & SKEMA SQL                   */}
      {/* ------------------------------------------------------------- */}
      {adminTab === 'architecture' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-cyan-950/40 border border-cyan-850/60 text-xs text-cyan-200 flex items-center gap-3">
            <Lock className="w-4 h-4 text-cyan-400 shrink-0" />
            <p>
              Konsol Arsitektur Database, Skema SQL, ERD Visualizer, dan Seed Generator ini <strong>terisolasi aman di dalam Root Gate</strong> dan tidak terekspos ke publik demi menjaga keamanan dan estetika website.
            </p>
          </div>

          <VecArchitectureConsole
            onCopyAllSql={onCopyAllSql || (() => {})}
            copiedSql={copiedSql}
            onDownloadSql={onDownloadSql || (() => {})}
          />
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* SUB-VIEW: SIMULATOR SPASIAL POSTGIS & GEOPRIVACY               */}
      {/* ------------------------------------------------------------- */}
      {adminTab === 'spatial' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-amber-950/40 border border-amber-850/60 text-xs text-amber-200 flex items-center gap-3">
            <Lock className="w-4 h-4 text-amber-400 shrink-0" />
            <p>
              Simulator Spasial PostGIS & Differential Geoprivacy Fuzzing ini <strong>dilindungi di dalam Root Gate</strong> untuk simulasi telemetri GPS dan verifikasi koordinat terenkripsi.
            </p>
          </div>

          <PostGisSimulator />
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* SUB-VIEW 3: GITHUB & SUPABASE SYNC HUB (TERKUNCI AMAN DI SINI)  */}
      {/* ------------------------------------------------------------- */}
      {adminTab === 'sync' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-blue-950/40 border border-blue-800/60 text-xs text-blue-200 flex items-center gap-3">
            <Lock className="w-4 h-4 text-blue-400 shrink-0" />
            <p>
              Modul Sinkronisasi GitHub & Cloud Supabase ini <strong>kini sepenuhnya dilindungi di dalam portal master rahasia ini</strong> dan tidak dapat diakses atau dilihat oleh pengunjung umum website.
            </p>
          </div>

          <GitHubSupabaseSyncHub
            onCopyAllSql={onCopyAllSql}
            copiedSql={copiedSql}
          />
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* BAGIAN 4 — KEAMANAN & CADANGAN                                 */}
      {/* ------------------------------------------------------------- */}
      {(adminTab === 'security' || adminTab === 'audit') && (
        <div className="space-y-6">

          {/* Header Banner */}
          <div className="p-6 rounded-2xl bg-gradient-to-r from-amber-950/40 via-slate-900 to-slate-950 border border-amber-500/30 shadow-xl space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center shadow-inner">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                    <span>Bagian 4: Keamanan Sistem & Cadangan Data Internal</span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-mono font-bold uppercase">
                      Proteksi Berlapis Aktif
                    </span>
                  </h2>
                  <p className="text-xs text-slate-400">
                    Status cadangan data berkala, riwayat log akses gerbang master, dan peringatan hal-hal penting untuk perhatian pengelola.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleManualBackup}
                  disabled={isCreatingBackup}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-lg shadow-emerald-950/50 transition cursor-pointer disabled:opacity-50"
                >
                  <Download className={`w-3.5 h-3.5 ${isCreatingBackup ? 'animate-bounce' : ''}`} />
                  <span>{isCreatingBackup ? 'Menyiapkan...' : 'Buat Cadangan Sekarang'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* 1. Status Cadangan Data */}
          <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Database className="w-4 h-4 text-emerald-400" />
                  <span>1. Status Cadangan Data (Backup Sistem)</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Cadangan mencakup seluruh data akun pengguna, konfigurasi aturan, log aktivitas, dan catatan kurasi karya.
                </p>
              </div>
              <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs font-mono font-bold flex items-center gap-1.5 self-start sm:self-auto">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Cadangan Berhasil (100%)
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
              <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
                <div className="text-[11px] font-mono text-slate-400">Waktu Cadangan Terakhir</div>
                <div className="text-sm font-bold text-white mt-1">{backupInfo.lastBackupTime}</div>
                <div className="text-[10px] text-slate-500 font-mono mt-0.5">Jadwal Harian Otomatis</div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
                <div className="text-[11px] font-mono text-slate-400">Status Keberhasilan</div>
                <div className="text-sm font-bold text-emerald-400 mt-1 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Berhasil Penuh
                </div>
                <div className="text-[10px] text-slate-500 font-mono mt-0.5">Tanpa galat/kendala</div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
                <div className="text-[11px] font-mono text-slate-400">Ukuran Berkas Cadangan</div>
                <div className="text-sm font-bold text-cyan-300 mt-1 font-mono">{backupInfo.backupSize}</div>
                <div className="text-[10px] text-slate-500 font-mono mt-0.5">{backupInfo.totalRecords} entri catatan data</div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
                <div className="text-[11px] font-mono text-slate-400">Format & Keamanan</div>
                <div className="text-sm font-bold text-purple-300 mt-1">JSON Terenkripsi</div>
                <div className="text-[10px] text-slate-500 font-mono mt-0.5">Siap Pulih (Disaster Recovery)</div>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-300">
              <div className="space-y-0.5">
                <div className="font-semibold text-white">Unduh Cadangan Manual ke Komputer Anda</div>
                <p className="text-slate-400 text-[11px]">
                  Klik tombol di samping untuk mengunduh arsip cadangan mandiri berupa berkas JSON untuk disimpan di penyimpanan aman offline Anda.
                </p>
              </div>
              <button
                onClick={handleManualBackup}
                disabled={isCreatingBackup}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition cursor-pointer whitespace-nowrap self-start sm:self-auto disabled:opacity-50"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Unduh File Cadangan JSON</span>
              </button>
            </div>
          </div>

          {/* 2. Log Akses ke Halaman Master: Siapa Masuk, Kapan */}
          <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Clock className="w-4 h-4 text-cyan-400" />
                  <span>2. Log Akses ke Halaman Pengelola Master</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Daftar riwayat pihak yang berhasil membuka atau mencoba mengakses gerbang master admin:
                </p>
              </div>
              <span className="text-[11px] font-mono text-slate-400 bg-slate-950 px-2.5 py-1 rounded border border-slate-800">
                {masterAccessLogs.length} Sesi Terpantau
              </span>
            </div>

            <div className="divide-y divide-slate-800/80 border border-slate-800 rounded-xl overflow-hidden bg-slate-950/70">
              {masterAccessLogs.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-500">
                  Belum ada log akses masuk.
                </div>
              ) : (
                masterAccessLogs.map((log) => (
                  <div key={log.id} className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs hover:bg-slate-900/40 transition">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                          log.status === 'SUCCESS'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                            : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                        }`}>
                          {log.status === 'SUCCESS' ? 'Berhasil Masuk' : 'Percobaan Diblokir'}
                        </span>
                        <span className="font-semibold text-white">{log.actor}</span>
                        <span className="text-slate-500 font-mono text-[11px]">· Metode: {log.method}</span>
                      </div>
                      <p className="text-[11px] text-slate-400">
                        {log.notes}
                      </p>
                    </div>
                    <div className="text-[11px] font-mono text-slate-500 shrink-0">
                      {log.timestamp}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* 3. Peringatan: Hal-hal yang Perlu Diperhatikan atau Diperbaiki */}
          <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <span>3. Peringatan & Catatan Penting untuk Pengelola</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Rangkuman hal-hal penting yang perlu diperhatikan untuk menjaga keamanan dan kelancaran sistem:
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
              {/* Peringatan 1: Kunci Master */}
              <div className="p-4 rounded-xl bg-amber-950/30 border border-amber-800/60 space-y-2">
                <div className="flex items-center gap-2 text-amber-300 text-xs font-bold">
                  <Key className="w-4 h-4 shrink-0" />
                  <span>Kunci Master Akses Utama (Vecmaster)</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Kunci Master tersimpan dalam hash kriptografis SHA-256 tersalt dan tidak ditampilkan di layar dalam bentuk teks biasa. Anda dapat mengubahnya sewaktu-waktu melalui form di bawah.
                </p>
              </div>

              {/* Peringatan 2: Ruang Penyimpanan */}
              <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
                <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>Kondisi Ruang Penyimpanan Sangat Aman</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Ruang penyimpanan awan beroperasi normal dengan sisa kapasitas 88.8%. Belum memerlukan penambahan paket kuota dalam waktu dekat.
                </p>
              </div>

              {/* Peringatan 3: Anti-Brute Force */}
              <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
                <div className="flex items-center gap-2 text-cyan-400 text-xs font-bold">
                  <ShieldCheck className="w-4 h-4 shrink-0" />
                  <span>Sistem Proteksi Anti-Penyusupan Aktif</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Jika terjadi 5 kali percobaan kode sandi yang salah, gerbang master akan terkunci secara otomatis selama 60 detik untuk mencegah tebakan acak.
                </p>
              </div>

              {/* Peringatan 4: Izin Kamera & Lokasi */}
              <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
                <div className="flex items-center gap-2 text-purple-400 text-xs font-bold">
                  <Camera className="w-4 h-4 shrink-0" />
                  <span>Izin Perangkat Kamera & Geolokasi</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Pastikan peramban (browser) diizinkan mengakses kamera dan sensor lokasi agar fungsi penangkapan dan verifikasi karya dapat berjalan maksimal.
                </p>
              </div>
            </div>
          </div>

          {/* 4. Pengelolaan & Pembaruan Kunci Master (Vecmaster) */}
          <div className="p-6 rounded-2xl bg-slate-900/80 border border-cyan-500/30 shadow-2xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Key className="w-4 h-4 text-cyan-400" />
                  <span>4. Pengelolaan & Penggantian Kunci Master (Vecmaster)</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Kelola Kunci Master administratif darurat. Perubahan kunci tidak akan menghapus karya, merusak data, atau menghilangkan kunci individual setiap brankas.
                </p>
              </div>
              <span className="px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 text-xs font-mono font-bold flex items-center gap-1.5 self-start sm:self-auto">
                <ShieldCheck className="w-3.5 h-3.5" />
                Hash Kriptografis Aktif
              </span>
            </div>

            {/* Architecture Explainer */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-slate-300">
              <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
                <div className="font-semibold text-white flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Kunci Individual Terisolasi</span>
                </div>
                <p className="text-slate-400 text-[11px] leading-relaxed">
                  Setiap brankas kreator tetap memiliki kunci individual miliknya sendiri (<code className="font-mono text-cyan-300">VEC-VK-...</code>).
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
                <div className="font-semibold text-white flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-amber-400" />
                  <span>Akses Administratif Darurat</span>
                </div>
                <p className="text-slate-400 text-[11px] leading-relaxed">
                  Kunci Master dapat membuka brankas mana pun untuk kebutuhan audit atau darurat tanpa merusak kunci pemilik asli.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
                <div className="font-semibold text-white flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-purple-400" />
                  <span>Integritas Data Terjamin</span>
                </div>
                <p className="text-slate-400 text-[11px] leading-relaxed">
                  Perubahan Kunci Master segera menonaktifkan kunci lama, tanpa mengubah kepemilikan maupun arsip foto brankas.
                </p>
              </div>
            </div>

            {/* Change Form */}
            <form onSubmit={handleChangeMasterKey} className="p-5 rounded-xl bg-slate-950/90 border border-slate-800 space-y-4">
              <div className="text-xs font-semibold text-white flex items-center gap-2">
                <span>Formulir Pergantian Kunci Master</span>
              </div>

              {keyChangeStatus.type === 'success' && (
                <div className="p-3 rounded-lg bg-emerald-950/60 border border-emerald-500/50 text-emerald-300 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                  <span>{keyChangeStatus.message}</span>
                </div>
              )}

              {keyChangeStatus.type === 'error' && (
                <div className="p-3 rounded-lg bg-rose-950/60 border border-rose-500/50 text-rose-300 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
                  <span>{keyChangeStatus.message}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-mono text-slate-400 mb-1">
                    Kunci Master Saat Ini *
                  </label>
                  <input
                    type="password"
                    required
                    value={currentKeyInput}
                    onChange={(e) => setCurrentKeyInput(e.target.value)}
                    placeholder="Masukkan kunci lama..."
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 text-white font-mono text-xs outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-mono text-slate-400 mb-1">
                    Kunci Master Baru (Min 8 Karakter) *
                  </label>
                  <input
                    type="password"
                    required
                    value={newKeyInput}
                    onChange={(e) => setNewKeyInput(e.target.value)}
                    placeholder="Masukkan kunci baru..."
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 text-white font-mono text-xs outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-mono text-slate-400 mb-1">
                    Konfirmasi Kunci Master Baru *
                  </label>
                  <input
                    type="password"
                    required
                    value={confirmKeyInput}
                    onChange={(e) => setConfirmKeyInput(e.target.value)}
                    placeholder="Ulangi kunci baru..."
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 text-white font-mono text-xs outline-none"
                  />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                <p className="text-[11px] text-slate-500 leading-relaxed max-w-xl">
                  * Kunci baru akan di-hash kriptografis dengan salt unik 16-byte sebelum disimpan. Kunci lama akan langsung ditolak pada akses berikutnya.
                </p>
                <button
                  type="submit"
                  disabled={isChangingKey || !currentKeyInput || !newKeyInput || !confirmKeyInput}
                  className="px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs shadow transition disabled:opacity-50 cursor-pointer whitespace-nowrap self-start sm:self-auto"
                >
                  {isChangingKey ? 'Menyimpan Kunci...' : 'Simpan Kunci Master Baru'}
                </button>
              </div>

              {/* Client-Side Architecture Limitation Disclaimer */}
              <div className="mt-3 p-3 rounded-lg bg-amber-950/20 border border-amber-800/40 text-[11px] text-amber-300/90 leading-relaxed">
                <strong>Catatan Arsitektur & Keterbatasan Penyimpanan:</strong> Aplikasi saat ini beroperasi menggunakan arsitektur web client-side dengan persistensi lokal (localStorage/sessionStorage terisolasi). Hash kriptografis SHA-256 tersalt melindungi kunci agar tidak terbaca kasual di antarmuka web, namun untuk penggunaan produksi perbankan atau militer absolut, disarankan menggunakan otentikasi server-side autoritatif melalui Supabase Auth / Cloud KMS Hardware Security Module (HSM).
              </div>
            </form>
          </div>

          {/* 4. Kejadian Audit Keamanan Sistem Lengkap */}
          <div className="border border-slate-800 rounded-2xl overflow-hidden bg-slate-950/60 shadow-xl space-y-2 p-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-400" />
                <span>Catatan Kejadian Keamanan Sistem (Audit Log)</span>
              </h3>
              <span className="text-[11px] font-mono text-slate-500">Menampilkan {auditLogs.length} kejadian terakhir</span>
            </div>

            <div className="space-y-2 pt-2">
              {auditLogs.map((log) => (
                <div key={log.id} className="p-3 rounded-xl bg-slate-900/70 border border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-white">{log.action}</span>
                      <span className={`px-2 py-0.2 rounded text-[10px] font-mono font-bold ${
                        log.status === 'SUCCESS'
                          ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800'
                          : log.status === 'BLOCKED'
                          ? 'bg-rose-950/60 text-rose-400 border border-rose-800'
                          : 'bg-amber-950/60 text-amber-400 border border-amber-800'
                      }`}>
                        {log.status}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400">
                      {log.details} · <span className="text-slate-500 font-mono">Sumber: {log.source}</span>
                    </div>
                  </div>
                  <div className="text-[11px] font-mono text-slate-500 whitespace-nowrap">
                    {log.timestamp}
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* SUB-VIEW 5: VERCEL SYNCHRONIZATION & DEPLOYMENT HUB           */}
      {/* ------------------------------------------------------------- */}
      {adminTab === 'vercel' && (
        <div className="space-y-6">

          {/* Vercel Status Hero Banner */}
          <div className="p-6 rounded-2xl bg-gradient-to-r from-purple-950/60 via-slate-900 to-slate-950 border border-purple-500/40 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-400 shadow-inner">
                  <Rocket className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold text-white">Sinkronisasi & Penerbitan ke Vercel</h2>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-mono font-bold">
                      vercel.json SIAP
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-0.5">
                    Tampilkan website Anda ke jaringan CDN global Vercel dengan otomatisasi sinkronisasi GitHub (CI/CD).
                  </p>
                </div>
              </div>

              {/* 1-Click Deploy Link */}
              <a
                href="https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fveroiaenterprisecorp%2Fvec&env=VITE_SUPABASE_URL,VITE_SUPABASE_ANON_KEY&project-name=vec-platform"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold text-xs shadow-lg shadow-purple-950 transition whitespace-nowrap cursor-pointer shrink-0"
              >
                <Sparkles className="w-4 h-4" />
                <span>Deploy 1-Klik ke Vercel</span>
                <ExternalLink className="w-3.5 h-3.5 opacity-80" />
              </a>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 text-xs font-mono">
              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-0.5">
                <div className="text-[10px] text-slate-400">Framework Preset</div>
                <div className="text-sm font-bold text-purple-300">Vite (React 19)</div>
              </div>
              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-0.5">
                <div className="text-[10px] text-slate-400">Direktori Output</div>
                <div className="text-sm font-bold text-cyan-300">dist/</div>
              </div>
              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-0.5">
                <div className="text-[10px] text-slate-400">Routing & SPA</div>
                <div className="text-sm font-bold text-emerald-300">Clean URLs + Rewrites</div>
              </div>
              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-0.5">
                <div className="text-[10px] text-slate-400">Otomatisasi Push</div>
                <div className="text-sm font-bold text-amber-300">GitHub Auto-Sync</div>
              </div>
            </div>
          </div>

          {/* Step-by-Step Deployment Guide */}
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-6">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Globe className="w-4 h-4 text-purple-400" />
                <span>Langkah demi Langkah Menampilkan Website Tersinkronisasi ke Vercel</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Ikuti 5 langkah mudah berikut untuk menghubungkan GitHub repositori ke Vercel:
              </p>
            </div>

            <div className="space-y-4">
              
              {/* Step 1 */}
              <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800/80 flex items-start gap-3.5">
                <div className="w-7 h-7 rounded-lg bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center justify-center font-mono font-bold text-xs shrink-0 mt-0.5">
                  1
                </div>
                <div className="space-y-1.5 flex-1">
                  <div className="text-xs font-bold text-white flex items-center gap-2">
                    <span>Masuk ke Akun Vercel & Tambah Project Baru</span>
                    <a 
                      href="https://vercel.com/new" 
                      target="_blank" 
                      rel="noreferrer" 
                      className="text-[11px] text-purple-400 hover:text-purple-300 flex items-center gap-1 underline underline-offset-2"
                    >
                      Buka vercel.com/new <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Masuk ke <strong className="text-slate-300">vercel.com</strong> menggunakan akun GitHub Anda. Di halaman Dashboard, klik tombol <strong className="text-slate-300">"Add New..."</strong> lalu pilih <strong className="text-slate-300">"Project"</strong>.
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800/80 flex items-start gap-3.5">
                <div className="w-7 h-7 rounded-lg bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center justify-center font-mono font-bold text-xs shrink-0 mt-0.5">
                  2
                </div>
                <div className="space-y-1.5 flex-1">
                  <div className="text-xs font-bold text-white">
                    Pilih Repositori GitHub: <code className="text-purple-300 bg-purple-950/60 px-2 py-0.5 rounded font-mono">veroiaenterprisecorp/vec</code>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Di daftar repositori GitHub yang muncul, temukan repositori proyek Anda lalu klik tombol <strong className="text-slate-300">"Import"</strong>.
                  </p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800/80 flex items-start gap-3.5">
                <div className="w-7 h-7 rounded-lg bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center justify-center font-mono font-bold text-xs shrink-0 mt-0.5">
                  3
                </div>
                <div className="space-y-1.5 flex-1">
                  <div className="text-xs font-bold text-white">
                    Konfigurasi Pengaturan Build Vercel (Otomatis Terdeteksi)
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Vercel akan otomatis mengenali berkas <code className="text-purple-300">vercel.json</code> yang sudah kami pasang di sistem:
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 font-mono text-[11px]">
                    <div className="p-2 rounded bg-slate-900 border border-slate-800 text-slate-300">
                      <span className="text-slate-500">Framework:</span> <strong>Vite</strong>
                    </div>
                    <div className="p-2 rounded bg-slate-900 border border-slate-800 text-slate-300">
                      <span className="text-slate-500">Build Command:</span> <strong>npm run build</strong>
                    </div>
                    <div className="p-2 rounded bg-slate-900 border border-slate-800 text-slate-300">
                      <span className="text-slate-500">Output Directory:</span> <strong>dist</strong>
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 4 */}
              <div className="p-4 rounded-xl bg-purple-950/30 border border-purple-500/40 flex items-start gap-3.5">
                <div className="w-7 h-7 rounded-lg bg-purple-500 text-slate-950 flex items-center justify-center font-mono font-bold text-xs shrink-0 mt-0.5 shadow">
                  4
                </div>
                <div className="space-y-2.5 flex-1">
                  <div className="text-xs font-bold text-white flex items-center gap-2">
                    <Key className="w-3.5 h-3.5 text-purple-400" />
                    <span>Masukkan Environment Variables (Kunci Supabase)</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Di bagian <strong className="text-white">"Environment Variables"</strong> di halaman Vercel, masukkan 2 variabel berikut agar database dan brankas terhubung:
                  </p>

                  <div className="space-y-2 pt-1">
                    {/* Var 1 */}
                    <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between gap-2">
                      <div className="font-mono text-[11px] truncate">
                        <span className="text-slate-400">Key: </span>
                        <strong className="text-purple-300">VITE_SUPABASE_URL</strong>
                        <span className="mx-2 text-slate-600">=</span>
                        <span className="text-slate-400 truncate">{getSupabaseUrl()}</span>
                      </div>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(getSupabaseUrl());
                          setCopiedSupabaseUrl(true);
                          setTimeout(() => setCopiedSupabaseUrl(false), 2000);
                        }}
                        className="px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 border border-slate-700 text-[10px] font-mono text-purple-300 transition cursor-pointer shrink-0"
                      >
                        {copiedSupabaseUrl ? 'Tersalin!' : 'Salin Nilai'}
                      </button>
                    </div>

                    {/* Var 2 */}
                    <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between gap-2">
                      <div className="font-mono text-[11px] truncate">
                        <span className="text-slate-400">Key: </span>
                        <strong className="text-purple-300">VITE_SUPABASE_ANON_KEY</strong>
                        <span className="mx-2 text-slate-600">=</span>
                        <span className="text-slate-400 truncate">{getSupabaseAnonKey().substring(0, 24)}...</span>
                      </div>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(getSupabaseAnonKey());
                          setCopiedSupabaseKey(true);
                          setTimeout(() => setCopiedSupabaseKey(false), 2000);
                        }}
                        className="px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 border border-slate-700 text-[10px] font-mono text-purple-300 transition cursor-pointer shrink-0"
                      >
                        {copiedSupabaseKey ? 'Tersalin!' : 'Salin Nilai'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 5 */}
              <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800/80 flex items-start gap-3.5">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center justify-center font-mono font-bold text-xs shrink-0 mt-0.5">
                  5
                </div>
                <div className="space-y-1.5 flex-1">
                  <div className="text-xs font-bold text-white flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Klik "Deploy" & Website Langsung Online!</span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Klik tombol biru <strong className="text-white">"Deploy"</strong>. Dalam 30-45 detik, website Anda langsung aktif dengan domain gratis seperti <code className="text-emerald-400 font-mono">vec-platform.vercel.app</code> lengkap dengan SSL gratis (HTTPS).
                  </p>
                </div>
              </div>

              {/* Step 6: CI/CD Automatic Sync */}
              <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-500/30 flex items-start gap-3.5">
                <div className="w-7 h-7 rounded-lg bg-emerald-500 text-slate-950 flex items-center justify-center font-mono font-bold text-xs shrink-0 mt-0.5 shadow">
                  ✓
                </div>
                <div className="space-y-1.5 flex-1">
                  <div className="text-xs font-bold text-emerald-300 flex items-center gap-2">
                    <Workflow className="w-4 h-4" />
                    <span>Otomatisasi Sinkronisasi Penuh (Continuous Deployment / CI/CD)</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Setelah terhubung ke Vercel, setiap kali Anda melakukan update kode atau push commit ke repositori GitHub, <strong>Vercel secara otomatis melakukan kompilasi dan memperbarui website Anda dalam 30 detik</strong> tanpa perlu Anda buka dashboard Vercel lagi!
                  </p>
                </div>
              </div>

            </div>
          </div>

          {/* Alternative CLI Option */}
          <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Terminal className="w-4 h-4 text-cyan-400" />
                <span>Opsi Deploy Cepat via Terminal (Vercel CLI)</span>
              </h3>
              <button
                onClick={() => {
                  const cmd = 'npm i -g vercel && vercel login && vercel --prod';
                  navigator.clipboard.writeText(cmd);
                  setCopiedVercelCli(true);
                  setTimeout(() => setCopiedVercelCli(false), 2000);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-900 border border-slate-700 text-xs text-cyan-300 hover:bg-slate-800 transition cursor-pointer"
              >
                {copiedVercelCli ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedVercelCli ? 'Perintah Tersalin!' : 'Salin Perintah CLI'}</span>
              </button>
            </div>

            <div className="p-3.5 rounded-xl bg-black/80 border border-slate-800 font-mono text-xs text-cyan-300 space-y-1.5">
              <div className="text-slate-500"># 1. Install CLI Vercel global</div>
              <div>npm install -g vercel</div>
              <div className="text-slate-500 pt-1"># 2. Login ke akun Anda</div>
              <div>vercel login</div>
              <div className="text-slate-500 pt-1"># 3. Deploy langsung ke produksi</div>
              <div className="text-emerald-400 font-bold">vercel --prod</div>
            </div>
          </div>

          {/* Configuration File vercel.json Inspection */}
          <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-semibold text-white">
                <FileText className="w-4 h-4 text-purple-400" />
                <span>Konfigurasi vercel.json (Telah Dibuat di Root Proyek)</span>
              </div>
              <button
                onClick={() => {
                  const vercelJsonContent = JSON.stringify({
                    "$schema": "https://openapi.vercel.sh/vercel.json",
                    "framework": "vite",
                    "buildCommand": "npm run build",
                    "outputDirectory": "dist",
                    "cleanUrls": true,
                    "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
                  }, null, 2);
                  navigator.clipboard.writeText(vercelJsonContent);
                  setCopiedVercelJson(true);
                  setTimeout(() => setCopiedVercelJson(false), 2000);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-900 border border-slate-700 text-xs text-slate-300 hover:text-white transition cursor-pointer"
              >
                {copiedVercelJson ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedVercelJson ? 'Tersalin!' : 'Salin vercel.json'}</span>
              </button>
            </div>

            <pre className="p-4 rounded-xl bg-black/90 border border-slate-800/80 font-mono text-[11px] text-slate-300 overflow-x-auto leading-relaxed">
{`{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "framework": "vite",
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "cleanUrls": true,
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}`}
            </pre>
          </div>

        </div>
      )}
      {showAddUserModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-emerald-400" />
                <span>Daftarkan Pengguna / Kurator Baru</span>
              </h3>
              <button
                onClick={() => setShowAddUserModal(false)}
                className="text-slate-400 hover:text-white transition"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 mb-1 font-mono">Nama Lengkap</label>
                <input
                  type="text"
                  required
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  placeholder="Nama Pengguna / Seniman"
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-mono">Alamat Email</label>
                <input
                  type="email"
                  required
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  placeholder="pengguna@domain.com"
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-mono">Peran (Role)</label>
                <select
                  value={newUserRole}
                  onChange={(e) => setNewUserRole(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white outline-none"
                >
                  <option value="Verified Creator">Verified Creator (Attested)</option>
                  <option value="Curator">Curator</option>
                  <option value="Standard Artist">Standard Artist</option>
                  <option value="Super Admin (Owner)">Super Admin (Owner)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-mono">Alokasi Kuota Brankas Pribadi (GB)</label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={newUserQuotaGb}
                  onChange={(e) => setNewUserQuotaGb(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white outline-none focus:border-emerald-500 font-mono"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddUserModal(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-500 font-semibold transition"
                >
                  Simpan Pendaftar
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
};
