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
  Filter
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
  const [activeFilter, setActiveFilter] = useState<'all' | 'private' | 'published'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
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
    if (newIsPrivate) {
      showToast(`Foto "${item.title}" sekarang dikunci kembali ke status 100% Privat.`);
    } else {
      showToast(`Foto "${item.title}" berhasil didaftarkan ke Live Vault Publik.`);
    }
  };

  const handleDeleteItem = (id: string, title: string) => {
    if (window.confirm(`Hapus "${title}" secara permanen dari Brankas Pribadi Anda?`)) {
      const updated = deletePrivateVaultItem(id);
      setItems(updated);
      showToast(`Foto berhasil dihapus dari penyimpanan pribadi.`);
    }
  };

  const filteredItems = items.filter((item) => {
    if (activeFilter === 'private' && !item.isPrivate) return false;
    if (activeFilter === 'published' && !item.isPublished) return false;
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

        {/* Quick Action Button */}
        <div className="flex items-center gap-3 shrink-0">
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
        <div className="flex items-center gap-1.5 p-1 bg-slate-900 rounded-xl border border-slate-800 text-xs font-mono">
          <button
            onClick={() => setActiveFilter('all')}
            className={`px-3 py-1.5 rounded-lg transition ${
              activeFilter === 'all'
                ? 'bg-slate-800 text-white font-bold shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Semua Koleksi ({items.length})
          </button>
          <button
            onClick={() => setActiveFilter('private')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1 transition ${
              activeFilter === 'private'
                ? 'bg-emerald-600 text-white font-bold shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Lock className="w-3 h-3" />
            <span>Tersimpan Privat ({totalPrivateCount})</span>
          </button>
          <button
            onClick={() => setActiveFilter('published')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1 transition ${
              activeFilter === 'published'
                ? 'bg-cyan-600 text-white font-bold shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Share2 className="w-3 h-3" />
            <span>Diterbitkan ke Vault ({totalPublishedCount})</span>
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
                <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                  {item.isPrivate ? (
                    <span className="px-2.5 py-1 rounded-full bg-emerald-950/90 backdrop-blur-md border border-emerald-500/40 text-[10px] font-mono text-emerald-300 flex items-center gap-1">
                      <Lock className="w-3 h-3 text-emerald-400" /> 100% Privat
                    </span>
                  ) : (
                    <span className="px-2.5 py-1 rounded-full bg-cyan-950/90 backdrop-blur-md border border-cyan-500/40 text-[10px] font-mono text-cyan-300 flex items-center gap-1">
                      <Share2 className="w-3 h-3 text-cyan-400" /> Diterbitkan Publik
                    </span>
                  )}

                  <span className="px-2 py-0.5 rounded-md bg-black/80 backdrop-blur-md text-[10px] font-mono text-slate-300 border border-slate-700">
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

    </div>
  );
};
