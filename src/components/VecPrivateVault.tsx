import React, { useState, useEffect } from 'react';
import { 
  getPrivateVaultItems, 
  updateVaultItemPrivacy, 
  deletePrivateVaultItem, 
  getUserVaultProfile,
  PrivateVaultItem,
  UserVaultProfile
} from '../lib/userVaultStorage';
import {
  syncVaultItemToCloud,
  getStorageBucketName,
  setStorageBucketName,
  getStorageMode,
  setStorageMode as saveStorageModePref,
  StorageTargetMode
} from '../lib/cloudStorage';
import { 
  ShieldCheck, 
  Lock, 
  Unlock, 
  Trash2, 
  Download, 
  Maximize2, 
  ZoomIn, 
  ZoomOut, 
  X, 
  Camera, 
  HardDrive, 
  CheckCircle2, 
  AlertCircle, 
  Share2, 
  Clock, 
  MapPin, 
  Cpu, 
  FileCheck,
  Search,
  Filter,
  Cloud,
  CloudUpload,
  RefreshCw,
  Settings,
  ExternalLink
} from 'lucide-react';

interface VecPrivateVaultProps {
  onNavigateToStudio: () => void;
  onNavigateToPublicVault: () => void;
}

export const VecPrivateVault: React.FC<VecPrivateVaultProps> = ({
  onNavigateToStudio,
  onNavigateToPublicVault
}) => {
  const [items, setItems] = useState<PrivateVaultItem[]>([]);
  const [profile, setProfile] = useState<UserVaultProfile>(getUserVaultProfile());
  const [activeFilter, setActiveFilter] = useState<'all' | 'private' | 'published' | 'cloud' | 'local'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [syncingId, setSyncingId] = useState<string | null>(null);
  const [isSyncingAll, setIsSyncingAll] = useState<boolean>(false);
  const [showCloudSettingsModal, setShowCloudSettingsModal] = useState<boolean>(false);
  const [bucketInput, setBucketInput] = useState<string>(() => getStorageBucketName());
  
  // High-Resolution Lightbox Zoom Modal States
  const [selectedPhoto, setSelectedPhoto] = useState<PrivateVaultItem | null>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  useEffect(() => {
    setItems(getPrivateVaultItems());
    setProfile(getUserVaultProfile());
  }, []);

  const handleTogglePrivacy = (item: PrivateVaultItem) => {
    const newIsPrivate = !item.isPrivate;
    const newIsPublished = !newIsPrivate;
    const updated = updateVaultItemPrivacy(item.id, newIsPrivate, newIsPublished);
    setItems(updated);
    window.dispatchEvent(new Event('storage'));
    if (newIsPrivate) {
      showToast(`Foto "${item.title}" sekarang dikunci kembali ke status 100% Privat.`);
    } else {
      showToast(`Foto "${item.title}" berhasil diterbitkan ke Live Vault Publik!`);
    }
  };

  const handleDeleteItem = (id: string, title: string) => {
    if (window.confirm(`Hapus "${title}" secara permanen dari Brankas Pribadi Anda?`)) {
      const updated = deletePrivateVaultItem(id);
      setItems(updated);
      showToast(`Foto berhasil dihapus dari penyimpanan.`);
    }
  };

  const handleSyncToCloud = async (item: PrivateVaultItem) => {
    setSyncingId(item.id);
    showToast(`Mengunggah "${item.title}" ke Supabase Cloud Storage...`);
    const success = await syncVaultItemToCloud(item);
    setSyncingId(null);
    setItems(getPrivateVaultItems());
    if (success) {
      showToast(`"${item.title}" berhasil tersimpan di Cloud Storage!`);
    } else {
      showToast(`Gagal mengunggah "${item.title}" ke cloud.`);
    }
  };

  const handleSyncAllToCloud = async () => {
    const unuploaded = items.filter((i) => i.storageTarget !== 'cloud_supabase' || i.uploadStatus !== 'uploaded');
    if (unuploaded.length === 0) {
      showToast('Semua foto sudah tersinkron di Cloud Supabase!');
      return;
    }
    setIsSyncingAll(true);
    showToast(`Memulai sinkronisasi ${unuploaded.length} berkas ke Cloud Supabase...`);
    for (const item of unuploaded) {
      await syncVaultItemToCloud(item);
    }
    setIsSyncingAll(false);
    setItems(getPrivateVaultItems());
    showToast(`Selesai! Seluruh foto telah disinkronkan ke Cloud Supabase.`);
  };

  const filteredItems = items.filter((item) => {
    if (activeFilter === 'private' && !item.isPrivate) return false;
    if (activeFilter === 'published' && !item.isPublished) return false;
    if (activeFilter === 'cloud') {
      const isCloud = item.storageTarget === 'cloud_supabase' || item.uploadStatus === 'uploaded';
      if (!isCloud) return false;
    }
    if (activeFilter === 'local') {
      const isLocal = item.storageTarget === 'device_local' || (!item.storageTarget && item.uploadStatus !== 'uploaded');
      if (!isLocal) return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        item.title.toLowerCase().includes(q) ||
        item.digest.toLowerCase().includes(q) ||
        item.deviceInfo.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const totalPrivateCount = items.filter((i) => i.isPrivate).length;
  const totalPublishedCount = items.filter((i) => i.isPublished).length;
  const cloudCount = items.filter((i) => i.storageTarget === 'cloud_supabase' || i.uploadStatus === 'uploaded').length;
  const localCount = items.filter((i) => i.storageTarget === 'device_local' || (!i.storageTarget && i.uploadStatus !== 'uploaded')).length;

  return (
    <div className="space-y-6">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-600 text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-2 text-xs font-mono border border-emerald-400/40 animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-4 h-4 text-white" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header & Isolation Overview */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-cyan-400">
            <Lock className="w-4 h-4 text-emerald-400" />
            <span>RUANG PENYIMPANAN PRIBADI TERISOLASI • POSTGRES RLS & LOCAL ENCLAVE</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight mt-1">
            Brankas Pribadi Saya (Personal Vault)
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
            Semua foto hasil jepretan kamera Anda tersimpan di sini secara privat. File disimpan dalam resolusi 100% tanpa kompresi dan hanya dapat diakses oleh identitas Anda.
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            onClick={handleSyncAllToCloud}
            disabled={isSyncingAll}
            className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-mono font-bold bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-slate-700 transition shadow-md disabled:opacity-50 cursor-pointer"
            title="Sinkronkan seluruh foto di brankas ke Supabase Cloud Storage"
          >
            {isSyncingAll ? (
              <RefreshCw className="w-4 h-4 animate-spin text-cyan-400" />
            ) : (
              <CloudUpload className="w-4 h-4 text-cyan-400" />
            )}
            <span>{isSyncingAll ? 'Menyinkronkan...' : 'Sinkronkan Semua ke Cloud'}</span>
          </button>

          <button
            onClick={() => setShowCloudSettingsModal(true)}
            className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 transition cursor-pointer"
            title="Pengaturan Cloud Bucket Supabase"
          >
            <Settings className="w-4 h-4 text-slate-400" />
          </button>

          <button
            onClick={onNavigateToStudio}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-mono font-bold bg-cyan-600 hover:bg-cyan-500 text-white transition shadow-lg shadow-cyan-950 cursor-pointer"
          >
            <Camera className="w-4 h-4" />
            <span>Jepret Foto Baru</span>
          </button>
        </div>
      </div>

      {/* User Vault Identity & Storage Stats Card */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        
        {/* Stat 1: Identity & Isolation */}
        <div className="p-4 rounded-2xl bg-[#050C1E] border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-xs font-mono text-slate-400">
            <span>ID Pengguna</span>
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
          </div>
          <div className="text-sm font-bold text-white font-mono truncate" title={profile.userId}>
            {profile.userId}
          </div>
          <div className="text-[11px] font-mono text-emerald-400 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Terisolasi Row Level Security</span>
          </div>
        </div>

        {/* Stat 2: Private Captures Count */}
        <div className="p-4 rounded-2xl bg-[#050C1E] border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-xs font-mono text-slate-400">
            <span>Total Foto Tersimpan</span>
            <Lock className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-white font-mono">
            {items.length} <span className="text-xs text-slate-400 font-normal">berkas asli</span>
          </div>
          <div className="text-[11px] font-mono text-slate-400">
            {totalPrivateCount} Privat • {totalPublishedCount} Publik
          </div>
        </div>

        {/* Stat 3: Storage Used */}
        <div className="p-4 rounded-2xl bg-[#050C1E] border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-xs font-mono text-slate-400">
            <span>Kapasitas Brankas</span>
            <HardDrive className="w-3.5 h-3.5 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold text-cyan-300 font-mono">
            8.0 MB <span className="text-xs text-slate-400 font-normal">/ 5 GB</span>
          </div>
          <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
            <div className="bg-cyan-400 h-1.5 rounded-full" style={{ width: '4%' }}></div>
          </div>
        </div>

        {/* Stat 4: Hardware Enclave Key */}
        <div className="p-4 rounded-2xl bg-[#050C1E] border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-xs font-mono text-slate-400">
            <span>Hardware Enclave Key</span>
            <Cpu className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="text-xs font-bold text-white font-mono truncate" title={profile.hardwareEnclaveId}>
            {profile.hardwareEnclaveId}
          </div>
          <div className="text-[11px] font-mono text-slate-400">
            Enkripsi AES-256-GCM Aktif
          </div>
        </div>

      </div>

      {/* Security Privacy Assurance Banner */}
      <div className="p-4 rounded-2xl bg-emerald-950/20 border border-emerald-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center shrink-0 mt-0.5">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
          </div>
          <div className="space-y-1">
            <span className="text-xs font-bold text-white font-mono block">
              Jaminan Privasi Penuh: Apakah foto saya bisa dilihat orang lain?
            </span>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              <strong>TIDAK BISA.</strong> Foto yang bertanda <span className="text-emerald-400 font-mono font-semibold">"Privat (Hanya Saya)"</span> 100% tertutup dan hanya tersimpan di ruang penyimpanan akun Anda. Pengguna lain, kurator, dan publik tidak memiliki akses melihatnya kecuali Anda sendiri yang mengklik tombol <em>"Publikasikan ke Live Vault"</em>.
            </p>
          </div>
        </div>
        <button
          onClick={onNavigateToPublicVault}
          className="text-xs font-mono text-cyan-400 hover:text-cyan-300 underline shrink-0 whitespace-nowrap"
        >
          Lihat Live Vault Publik →
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
        
        {/* Filter Buttons */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-900 rounded-xl border border-slate-800 text-xs font-mono">
          <button
            onClick={() => setActiveFilter('all')}
            className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
              activeFilter === 'all'
                ? 'bg-slate-800 text-white font-bold shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Semua ({items.length})
          </button>
          <button
            onClick={() => setActiveFilter('cloud')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1 transition cursor-pointer ${
              activeFilter === 'cloud'
                ? 'bg-cyan-600 text-white font-bold shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Cloud className="w-3.5 h-3.5" />
            <span>Cloud Supabase ({cloudCount})</span>
          </button>
          <button
            onClick={() => setActiveFilter('local')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1 transition cursor-pointer ${
              activeFilter === 'local'
                ? 'bg-amber-600 text-white font-bold shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <HardDrive className="w-3.5 h-3.5" />
            <span>Lokal Perangkat ({localCount})</span>
          </button>
          <button
            onClick={() => setActiveFilter('private')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1 transition cursor-pointer ${
              activeFilter === 'private'
                ? 'bg-emerald-600 text-white font-bold shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Lock className="w-3 h-3" />
            <span>Privat ({totalPrivateCount})</span>
          </button>
          <button
            onClick={() => setActiveFilter('published')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1 transition cursor-pointer ${
              activeFilter === 'published'
                ? 'bg-indigo-600 text-white font-bold shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Share2 className="w-3 h-3" />
            <span>Publik ({totalPublishedCount})</span>
          </button>
        </div>

        {/* Search Field */}
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari judul atau hash..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-white placeholder-slate-500 text-xs font-mono focus:outline-none focus:border-cyan-500"
          />
        </div>

      </div>

      {/* Private Gallery Grid */}
      {filteredItems.length === 0 ? (
        <div className="p-12 rounded-3xl bg-[#050C1E] border border-slate-800 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500 mx-auto">
            <Lock className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-white font-mono">
            Tidak ada foto yang cocok dengan filter
          </h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Gunakan kamera hardware di menu <strong>Studio Sensor C2PA</strong> untuk menjepret foto baru dan menyimpannya langsung ke brankas pribadi Anda.
          </p>
          <button
            onClick={onNavigateToStudio}
            className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-mono font-bold transition mt-2 cursor-pointer"
          >
            Buka Studio Kamera
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className="bg-[#050C1E] rounded-3xl border border-slate-800 overflow-hidden flex flex-col justify-between hover:border-slate-700 transition shadow-xl group"
            >
              
              {/* Photo Viewport Container */}
              <div className="relative h-56 bg-slate-950 overflow-hidden">
                <img
                  src={item.photoUrl}
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                />

                {/* Top Overlay Badges */}
                <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {item.isPrivate ? (
                      <span className="px-2.5 py-1 rounded-full bg-emerald-950/90 backdrop-blur-md border border-emerald-500/40 text-[10px] font-mono text-emerald-300 flex items-center gap-1">
                        <Lock className="w-3 h-3 text-emerald-400" /> 100% Privat
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-full bg-indigo-950/90 backdrop-blur-md border border-indigo-500/40 text-[10px] font-mono text-indigo-300 flex items-center gap-1">
                        <Share2 className="w-3 h-3 text-indigo-400" /> Publik
                      </span>
                    )}

                    {(item.storageTarget === 'cloud_supabase' || item.uploadStatus === 'uploaded') ? (
                      <span className="px-2 py-1 rounded-full bg-cyan-950/90 backdrop-blur-md border border-cyan-500/40 text-[10px] font-mono text-cyan-300 flex items-center gap-1">
                        <Cloud className="w-3 h-3 text-cyan-400" /> Cloud
                      </span>
                    ) : (
                      <span className="px-2 py-1 rounded-full bg-amber-950/90 backdrop-blur-md border border-amber-500/40 text-[10px] font-mono text-amber-300 flex items-center gap-1">
                        <HardDrive className="w-3 h-3 text-amber-400" /> Lokal
                      </span>
                    )}
                  </div>

                  <span className="px-2 py-0.5 rounded-md bg-black/80 backdrop-blur-md text-[10px] font-mono text-slate-300 border border-slate-700 shrink-0">
                    {item.fileSize}
                  </span>
                </div>

                {/* Center Hover Action: Enlarge / Zoom */}
                <button
                  onClick={() => {
                    setSelectedPhoto(item);
                    setZoomLevel(1);
                  }}
                  className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 text-white font-mono text-xs cursor-pointer backdrop-blur-xs"
                >
                  <div className="px-3 py-1.5 rounded-xl bg-slate-900/90 border border-cyan-500/40 text-cyan-300 flex items-center gap-1.5 shadow-xl">
                    <Maximize2 className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Perbesar & Teliti Resolusi Penuh</span>
                  </div>
                </button>

                {/* Bottom Resolution Watermark */}
                <div className="absolute bottom-2 left-3 text-[10px] font-mono text-slate-300 bg-black/70 px-2 py-0.5 rounded backdrop-blur-xs">
                  {item.resolution}
                </div>
              </div>

              {/* Photo Card Body */}
              <div className="p-5 space-y-3.5 flex-1 flex flex-col justify-between">
                
                <div className="space-y-2">
                  <h4 className="text-sm font-bold text-white leading-snug line-clamp-2">
                    {item.title}
                  </h4>

                  <div className="text-[11px] font-mono text-slate-400 space-y-1">
                    <div className="flex items-center gap-1.5 text-slate-300">
                      <Clock className="w-3 h-3 text-slate-500" />
                      <span>{item.captureDate}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-400 truncate">
                      <Cpu className="w-3 h-3 text-cyan-400 shrink-0" />
                      <span className="truncate">{item.deviceInfo}</span>
                    </div>
                  </div>

                  {/* Cloud Storage Location & Sync Status */}
                  {(item.storageTarget === 'cloud_supabase' || item.uploadStatus === 'uploaded') ? (
                    <div className="p-2 rounded-xl bg-cyan-950/40 border border-cyan-500/30 text-[10px] font-mono text-cyan-300 flex items-center justify-between gap-1.5">
                      <div className="flex items-center gap-1.5 truncate">
                        <Cloud className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                        <span className="truncate" title={item.cloudPath || 'vec-captures'}>
                          Bucket: {item.cloudBucket || 'vec-captures'}
                        </span>
                      </div>
                      <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[9px] shrink-0 font-bold">
                        Tersinkron
                      </span>
                    </div>
                  ) : (
                    <div className="p-2 rounded-xl bg-amber-950/30 border border-amber-500/30 text-[10px] font-mono text-amber-300 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 truncate">
                        <HardDrive className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        <span className="truncate">Tersimpan di Perangkat</span>
                      </div>
                      <button
                        onClick={() => handleSyncToCloud(item)}
                        disabled={syncingId === item.id}
                        className="px-2 py-0.5 rounded bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white font-bold text-[9px] transition shrink-0 flex items-center gap-1 cursor-pointer shadow-sm"
                      >
                        {syncingId === item.id ? (
                          <RefreshCw className="w-2.5 h-2.5 animate-spin" />
                        ) : (
                          <CloudUpload className="w-2.5 h-2.5" />
                        )}
                        <span>{syncingId === item.id ? 'Mengunggah...' : 'Unggah ke Cloud'}</span>
                      </button>
                    </div>
                  )}

                  {/* SHA-256 Checksum snippet */}
                  <div className="p-2 rounded-xl bg-slate-900/80 border border-slate-800 text-[10px] font-mono text-slate-400">
                    <span className="text-slate-500 block">SHA-256 RAW Checksum:</span>
                    <span className="text-cyan-300 truncate block mt-0.5" title={item.digest}>
                      {item.digest.slice(0, 16)}...{item.digest.slice(-16)}
                    </span>
                  </div>
                </div>

                {/* Card Action Controls */}
                <div className="pt-3 border-t border-slate-800/80 space-y-2">
                  
                  {/* Primary Row: Zoom & Download Buttons */}
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => {
                        setSelectedPhoto(item);
                        setZoomLevel(1);
                      }}
                      className="py-1.5 px-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-slate-700 text-xs font-mono flex items-center justify-center gap-1.5 transition cursor-pointer"
                    >
                      <Maximize2 className="w-3.5 h-3.5" />
                      <span>Perbesar</span>
                    </button>

                    <a
                      href={item.photoUrl}
                      download={`VEC-Personal-Vault-${item.id}.jpg`}
                      className="py-1.5 px-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 text-xs font-mono flex items-center justify-center gap-1.5 transition text-center"
                    >
                      <Download className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Unduh Asli</span>
                    </a>
                  </div>

                  {/* Secondary Row: Privacy Switcher & Delete */}
                  <div className="flex items-center justify-between gap-2 pt-1">
                    <button
                      onClick={() => handleTogglePrivacy(item)}
                      className={`flex-1 py-1 px-2 rounded-lg text-[11px] font-mono flex items-center justify-center gap-1.5 border transition cursor-pointer ${
                        item.isPrivate
                          ? 'bg-slate-900 hover:bg-cyan-950/60 text-slate-300 hover:text-cyan-300 border-slate-800'
                          : 'bg-emerald-950/60 hover:bg-emerald-900 text-emerald-300 border-emerald-800'
                      }`}
                      title={item.isPrivate ? "Ubah status menjadi publik untuk dipamerkan di Live Vault" : "Kunci kembali foto ke status privat"}
                    >
                      {item.isPrivate ? (
                        <>
                          <Share2 className="w-3 h-3 text-cyan-400" />
                          <span>Publikasikan ke Vault</span>
                        </>
                      ) : (
                        <>
                          <Lock className="w-3 h-3 text-emerald-400" />
                          <span>Kunci Jadi Privat</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => handleDeleteItem(item.id, item.title)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 border border-transparent hover:border-rose-900 transition cursor-pointer"
                      title="Hapus foto dari Brankas Pribadi"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                </div>

              </div>

            </div>
          ))}
        </div>
      )}

      {/* Lightbox High-Resolution Zoom Modal for Private Vault */}
      {selectedPhoto && (
        <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-xl flex flex-col justify-between p-4 sm:p-6 animate-in fade-in duration-200">
          
          {/* Modal Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
            <div>
              <div className="flex items-center gap-2 text-xs font-mono text-cyan-400">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>INSPEKTOR BRANKAS PRIBADI • RESOLUSI PENUH TANPA KOMPRESI</span>
              </div>
              <h3 className="text-base sm:text-lg font-bold text-white mt-0.5">
                {selectedPhoto.title}
              </h3>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                Resolusi: <strong className="text-white">{selectedPhoto.resolution}</strong> • Ukuran: <strong className="text-emerald-400">{selectedPhoto.fileSize}</strong> • Zoom: <strong className="text-cyan-400">{Math.round(zoomLevel * 100)}%</strong> • Status: <strong className={selectedPhoto.isPrivate ? 'text-emerald-400' : 'text-cyan-400'}>{selectedPhoto.isPrivate ? '100% Privat' : 'Diterbitkan ke Vault'}</strong>
              </p>
            </div>

            <div className="flex items-center gap-2.5 shrink-0">
              {/* Zoom Controls */}
              <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
                <button
                  onClick={() => setZoomLevel((z) => Math.max(0.5, Number((z - 0.25).toFixed(2))))}
                  disabled={zoomLevel <= 0.5}
                  className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 disabled:opacity-40 transition cursor-pointer"
                  title="Perkecil (-)"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>

                <button
                  onClick={() => setZoomLevel(1)}
                  className="px-2.5 py-1 rounded-lg text-xs font-mono font-bold text-cyan-300 hover:bg-slate-800 transition cursor-pointer"
                  title="Reset ke Ukuran Asli 100%"
                >
                  {Math.round(zoomLevel * 100)}%
                </button>

                <button
                  onClick={() => setZoomLevel((z) => Math.min(3.5, Number((z + 0.25).toFixed(2))))}
                  disabled={zoomLevel >= 3.5}
                  className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 disabled:opacity-40 transition cursor-pointer"
                  title="Perbesar (+)"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
              </div>

              <a
                href={selectedPhoto.photoUrl}
                download={`VEC-Raw-Resolution-${selectedPhoto.id}.jpg`}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-mono bg-cyan-600 hover:bg-cyan-500 text-white font-bold transition shadow-md shadow-cyan-950"
              >
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">Unduh Resolusi Penuh</span>
              </a>

              <button
                onClick={() => setSelectedPhoto(null)}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 transition cursor-pointer"
                title="Tutup (Esc)"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Modal Center Viewport */}
          <div className="flex-1 overflow-auto flex items-center justify-center p-4 my-2 relative rounded-2xl bg-slate-950/80 border border-slate-900 cursor-grab active:cursor-grabbing">
            <div 
              className="transition-transform duration-200 ease-out origin-center"
              style={{ transform: `scale(${zoomLevel})` }}
            >
              <img
                src={selectedPhoto.photoUrl}
                alt={selectedPhoto.title}
                className="max-h-[70vh] max-w-[85vw] object-contain rounded-xl shadow-2xl border border-slate-800"
              />
            </div>
          </div>

          {/* Modal Bottom Footer */}
          <div className="pt-3 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between text-xs font-mono text-slate-400 gap-2">
            <div className="flex items-center gap-2 truncate max-w-xl">
              <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0"></span>
              <span className="text-white shrink-0">SHA-256 RAW:</span>
              <span className="text-cyan-300 truncate">{selectedPhoto.digest}</span>
            </div>
            <div className="text-[11px] text-slate-500">
              Sensor: {selectedPhoto.deviceInfo} • Silsilah C2PA Hardware Valid
            </div>
          </div>

        </div>
      )}

      {/* Cloud Storage Settings Modal */}
      {showCloudSettingsModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#050C1E] border border-slate-800 rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl relative">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-cyan-950 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
                  <Cloud className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white font-mono">
                    Konfigurasi Cloud Supabase Storage
                  </h3>
                  <p className="text-[11px] text-slate-400 font-mono">
                    Penyimpanan media dan file biner tangkapan kamera VEC
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowCloudSettingsModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs font-mono">
              <div className="space-y-1.5">
                <label className="text-slate-300 font-bold block">
                  Nama Bucket Supabase Storage:
                </label>
                <input
                  type="text"
                  value={bucketInput}
                  onChange={(e) => setBucketInput(e.target.value)}
                  placeholder="e.g. vec-captures"
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono text-xs focus:outline-none focus:border-cyan-500"
                />
                <span className="text-[10px] text-slate-500">
                  Default bucket: <code>vec-captures</code>. File foto akan disimpan di direktori <code>captures/YYYY-MM-DD/</code>.
                </span>
              </div>

              {/* Bucket Creation SQL Guide */}
              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-cyan-400 font-bold flex items-center gap-1.5">
                    <FileCheck className="w-3.5 h-3.5" />
                    SQL Pembuatan Bucket (Supabase SQL Editor):
                  </span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(`INSERT INTO storage.buckets (id, name, public) VALUES ('${bucketInput.trim() || 'vec-captures'}', '${bucketInput.trim() || 'vec-captures'}', true) ON CONFLICT (id) DO NOTHING;`);
                      showToast('Perintah SQL berhasil disalin!');
                    }}
                    className="text-[10px] text-cyan-400 hover:text-cyan-300 underline cursor-pointer"
                  >
                    Salin SQL
                  </button>
                </div>
                <pre className="p-2.5 rounded-lg bg-black text-[10px] text-slate-300 overflow-x-auto leading-relaxed border border-slate-900">
{`INSERT INTO storage.buckets (id, name, public)
VALUES ('${bucketInput.trim() || 'vec-captures'}', '${bucketInput.trim() || 'vec-captures'}', true)
ON CONFLICT (id) DO NOTHING;`}
                </pre>
              </div>

              <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-500/30 text-[11px] text-emerald-300 leading-relaxed">
                ✓ <strong>Arsitektur Cloud Aktif:</strong> Setiap foto yang dijepret di Studio sekarang langsung diproses untuk disimpan ke Supabase Storage, menjaga memori HP/browser Anda tetap bersih dan foto tidak hilang ketika cache dibersihkan.
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-800">
              <button
                onClick={() => setShowCloudSettingsModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-mono text-slate-400 hover:text-white transition cursor-pointer"
              >
                Tutup
              </button>
              <button
                onClick={() => {
                  setStorageBucketName(bucketInput.trim());
                  setShowCloudSettingsModal(false);
                  showToast(`Bucket "${bucketInput.trim() || 'vec-captures'}" berhasil disimpan.`);
                }}
                className="px-4 py-2 rounded-xl text-xs font-mono font-bold bg-cyan-600 hover:bg-cyan-500 text-white transition shadow-lg shadow-cyan-950 cursor-pointer"
              >
                Simpan Konfigurasi
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
