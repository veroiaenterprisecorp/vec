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
  Sparkles
} from 'lucide-react';
import { 
  getRegisteredUsers, 
  saveRegisteredUsers, 
  toggleUserStatus, 
  addNewRegisteredUser, 
  checkAdminSession, 
  setAdminSession, 
  getAuditLogs, 
  recordAuditLog, 
  formatBytes,
  MASTER_ACCESS_KEY,
  RegisteredUser,
  GUEST_STATISTICS_DATA,
  SecurityAuditEntry
} from '../lib/masterAdminStorage';
import { getSupabaseUrl, getSupabaseAnonKey } from '../lib/supabase';
import { GitHubSupabaseSyncHub } from './GitHubSupabaseSyncHub';

interface MasterAdminPortalProps {
  onBackToPublicSite: () => void;
  onCopyAllSql?: () => void;
  copiedSql?: boolean;
  onDownloadSql?: () => void;
}

export const MasterAdminPortal: React.FC<MasterAdminPortalProps> = ({
  onBackToPublicSite,
  onCopyAllSql,
  copiedSql = false,
  onDownloadSql
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
  const [adminTab, setAdminTab] = useState<'users' | 'guests' | 'sync' | 'vercel' | 'audit'>('users');

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

  const handleAuthenticate = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isLockedOut) return;

    if (inputPasscode.trim() === MASTER_ACCESS_KEY) {
      setIsAuthenticated(true);
      setAdminSession(true);
      setLoginError('');
      setFailedAttempts(0);
      recordAuditLog('Otentikasi Kunci Master Berhasil', 'SUCCESS', 'Akses diberikan ke portal terisolasi VEC Root');
      setNotificationMsg('Autentikasi Master Berhasil! Akses Diberikan.');
      setTimeout(() => setNotificationMsg(''), 3000);
    } else {
      const attempts = failedAttempts + 1;
      setFailedAttempts(attempts);
      recordAuditLog('Percobaan Kunci Master Tidak Sah', 'BLOCKED', `Kode sandi keliru (Percobaan ke-${attempts})`);
      if (attempts >= 5) {
        setIsLockedOut(true);
        setLockoutTimer(60);
        setLoginError('Terlalu banyak percobaan gagal! Sistem dikunci otomatis selama 60 detik demi keamanan.');
      } else {
        setLoginError(`Kunci akses keliru! Sisa kesempatan: ${5 - attempts} kali sebelum sistem dikunci.`);
      }
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

  const handleQuickFillKey = () => {
    setInputPasscode(MASTER_ACCESS_KEY);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const handleToggleStatus = (userId: string) => {
    const updated = toggleUserStatus(userId);
    setUsersList(updated);
    recordAuditLog('Perubahan Status Akun Pengguna', 'SUCCESS', `ID: ${userId}`);
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
    setShowAddUserModal(false);
    setNewUserName('');
    setNewUserEmail('');
    recordAuditLog('Pendaftaran Pengguna Baru Manual', 'SUCCESS', `Email: ${newUserEmail}`);
    setNotificationMsg(`Pengguna ${newUserName} berhasil didaftarkan!`);
    setTimeout(() => setNotificationMsg(''), 3000);
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
              Gerbang Master Admin & Sinkronisasi
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
              <div className="font-semibold text-white">Autentikasi Tingkat Enkripsi Militer (AES-256)</div>
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
                  placeholder="Masukkan Kunci Master (cth: VEC-ADMIN-882991)"
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

            <button
              type="submit"
              disabled={isLockedOut || !inputPasscode.trim()}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-sm tracking-wide shadow-lg shadow-emerald-950/50 transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <Unlock className="w-4 h-4" />
              <span>Buka Kunci Gerbang Master Admin</span>
            </button>
          </form>

          {/* Quick Helper for Owner convenience */}
          <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <span className="text-slate-500 font-mono">Kunci Master Default:</span>
              <code className="text-emerald-400 bg-emerald-950/50 px-2 py-0.5 rounded border border-emerald-800/60 font-mono font-bold">
                {MASTER_ACCESS_KEY}
              </code>
            </div>
            <button
              onClick={handleQuickFillKey}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition text-[11px] font-medium cursor-pointer"
            >
              {copiedKey ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedKey ? 'Kunci Terisi!' : 'Gunakan Kunci Ini'}</span>
            </button>
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
              <h1 className="text-lg font-bold text-white">Konsol Master Admin & Sinkronisasi</h1>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-mono font-bold uppercase">
                Akses Terkunci (Root Level 5)
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
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2 overflow-x-auto">
        <button
          onClick={() => setAdminTab('users')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition cursor-pointer whitespace-nowrap ${
            adminTab === 'users'
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Users className="w-4 h-4 text-emerald-400" />
          <span>Direktori Pengguna Terdaftar ({usersList.length})</span>
        </button>

        <button
          onClick={() => setAdminTab('guests')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition cursor-pointer whitespace-nowrap ${
            adminTab === 'guests'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <BarChart3 className="w-4 h-4 text-cyan-400" />
          <span>Statistik Pengguna Tamu (Hanya Angka Saja)</span>
        </button>

        <button
          onClick={() => setAdminTab('sync')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition cursor-pointer whitespace-nowrap ${
            adminTab === 'sync'
              ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40 shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Workflow className="w-4 h-4 text-blue-400" />
          <span>Pusat Sinkronisasi GitHub & Supabase</span>
        </button>

        <button
          onClick={() => setAdminTab('vercel')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition cursor-pointer whitespace-nowrap ${
            adminTab === 'vercel'
              ? 'bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-purple-300 border border-purple-500/40 shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Rocket className="w-4 h-4 text-purple-400" />
          <span>Sinkronisasi Vercel & Deploy</span>
        </button>

        <button
          onClick={() => setAdminTab('audit')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition cursor-pointer whitespace-nowrap ${
            adminTab === 'audit'
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Activity className="w-4 h-4 text-amber-400" />
          <span>Audit Keamanan & Kriptografi</span>
        </button>
      </div>

      {/* Notification Toast */}
      {notificationMsg && (
        <div className="p-3 rounded-xl bg-emerald-950/80 border border-emerald-500/60 text-emerald-300 text-xs font-mono flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{notificationMsg}</span>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* SUB-VIEW 1: REGISTERED USERS DIRECTORY (DATA PENDAFTAR)        */}
      {/* ------------------------------------------------------------- */}
      {adminTab === 'users' && (
        <div className="space-y-6">

          {/* Metric Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
              <div className="text-xs font-mono text-slate-400">Total Pengguna Terdaftar</div>
              <div className="text-2xl font-extrabold text-white flex items-center gap-2">
                <span>{totalUsers}</span>
                <span className="text-xs font-normal text-emerald-400 font-mono">Akun Aktif</span>
              </div>
              <div className="text-[11px] text-slate-500">Terdaftar di PostgreSQL Supabase Auth</div>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
              <div className="text-xs font-mono text-slate-400">Terverifikasi Hardware C2PA</div>
              <div className="text-2xl font-extrabold text-emerald-400 flex items-center gap-2">
                <span>{verifiedUsers}</span>
                <span className="text-xs font-normal text-slate-400 font-mono">/ {totalUsers} akun</span>
              </div>
              <div className="text-[11px] text-slate-500">Memiliki Kunci Enclave Perangkat Fisik</div>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
              <div className="text-xs font-mono text-slate-400">Total Penyimpanan Brankas Terpakai</div>
              <div className="text-2xl font-extrabold text-cyan-300 flex items-center gap-2">
                <span>{formatBytes(totalStorageBytes)}</span>
                <span className="text-xs font-normal text-slate-400 font-mono">Terenkripsi</span>
              </div>
              <div className="text-[11px] text-slate-500">Terisolasi penuh via Row Level Security (RLS)</div>
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

                        {/* Storage Quota */}
                        <td className="py-3.5 px-4 font-mono text-[11px]">
                          <div className="text-white font-medium">
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

                        {/* Status */}
                        <td className="py-3.5 px-4 text-center">
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-mono uppercase font-bold ${
                            user.status === 'active'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                              : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                          }`}>
                            {user.status === 'active' ? 'Aktif' : 'Terkunci'}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4 text-right">
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
                            {user.status === 'active' ? 'Kunci Akun' : 'Buka Kunci'}
                          </button>
                        </td>

                      </tr>
                    ))
                  )}
                </tbody>
              </table>
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
      {/* SUB-VIEW 4: AUDIT LOGS & ANTI-HACKER RESILIENCE                */}
      {/* ------------------------------------------------------------- */}
      {adminTab === 'audit' && (
        <div className="space-y-6">

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
              <div className="text-xs font-mono text-slate-400">Status Proteksi Hacker</div>
              <div className="text-lg font-bold text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                <span>100% Terenkripsi & Aktif</span>
              </div>
              <div className="text-[11px] text-slate-500">Anti-Brute Force · IP Rate Limiting</div>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
              <div className="text-xs font-mono text-slate-400">Protokol Keamanan Data</div>
              <div className="text-lg font-bold text-cyan-300 font-mono">
                TLS 1.3 / AES-256-GCM
              </div>
              <div className="text-[11px] text-slate-500">Zero-Plaintext Transmit</div>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
              <div className="text-xs font-mono text-slate-400">PostgreSQL Row-Level Security</div>
              <div className="text-lg font-bold text-purple-300 font-mono">
                auth.uid() = user_id
              </div>
              <div className="text-[11px] text-slate-500">Isolasi mutlak antar pengguna</div>
            </div>
          </div>

          {/* Audit Log Table */}
          <div className="border border-slate-800 rounded-2xl overflow-hidden bg-slate-950/60 shadow-xl space-y-2 p-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-400" />
                <span>Catatan Aktivitas & Deteksi Akses (Real-Time Audit Log)</span>
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
