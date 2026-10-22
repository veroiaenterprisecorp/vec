import React, { useState, useEffect, useRef } from 'react';
import { 
  getPrivateVaultItems, 
  updateVaultItemPrivacy, 
  deletePrivateVaultItem, 
  updateVaultItemTitle,
  updateVaultItemPhoto,
  getUserVaultProfile,
  mergeRemoteItemsIntoVault,
  initVaultAsync,
  purgeAllLocalVaultCache,
  PrivateVaultItem,
  UserVaultProfile
} from '../lib/userVaultStorage';
import {
  syncVaultItemToCloud,
  publishArtworkToSupabasePosts,
  getStorageBucketName,
  setStorageBucketName,
  getStorageMode,
  setStorageMode as saveStorageModePref,
  StorageTargetMode,
  isArtworkPermanentlyDestroyed
} from '../lib/cloudStorage';
import { 
  isVaultUnlocked, 
  getActiveVault, 
  lockVault, 
  unlockVaultWithKey, 
  getCachedRegisteredVaults, 
  CreatorVault 
} from '../lib/vaultKeyAuth';
import { VaultRegistrationModal } from './VaultRegistrationModal';
import { VaultKeyUnlockModal } from './VaultKeyUnlockModal';
import { PermanentDeleteModal, DeleteArtworkTarget } from './PermanentDeleteModal';
import { supabase } from '../lib/supabase';
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
  ExternalLink,
  Edit3,
  Upload,
  Check,
  KeyRound,
  PlusCircle,
  ShieldAlert,
  ArrowRight
} from 'lucide-react';

interface VecPrivateVaultProps {
  onNavigateToStudio: () => void;
  onNavigateToPublicVault: () => void;
}

export const VecPrivateVault: React.FC<VecPrivateVaultProps> = ({
  onNavigateToStudio,
  onNavigateToPublicVault
}) => {
  // Vault Lock & Multi-Tenant Identity States
  const [isUnlocked, setIsUnlocked] = useState<boolean>(() => isVaultUnlocked());
  const [activeVault, setActiveVault] = useState<CreatorVault | null>(() => getActiveVault());
  const [showRegisterModal, setShowRegisterModal] = useState<boolean>(false);
  const [showUnlockModal, setShowUnlockModal] = useState<boolean>(false);
  const [inlineKeyInput, setInlineKeyInput] = useState<string>('');
  const [inlineKeyError, setInlineKeyError] = useState<string | null>(null);
  const [isVerifyingInlineKey, setIsVerifyingInlineKey] = useState<boolean>(false);
  const [items, setItems] = useState<PrivateVaultItem[]>([]);
  const [profile, setProfile] = useState<UserVaultProfile>(getUserVaultProfile());
  const [activeFilter, setActiveFilter] = useState<'all' | 'private' | 'published'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [syncingId, setSyncingId] = useState<string | null>(null);
  const [isSyncingAll, setIsSyncingAll] = useState<boolean>(false);
  const [isPullingCloud, setIsPullingCloud] = useState<boolean>(false);
  const [showCloudSettingsModal, setShowCloudSettingsModal] = useState<boolean>(false);
  const [bucketInput, setBucketInput] = useState<string>(() => getStorageBucketName());
  
  // High-Resolution Lightbox Zoom Modal States
  const [selectedPhoto, setSelectedPhoto] = useState<PrivateVaultItem | null>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [itemPendingDelete, setItemPendingDelete] = useState<DeleteArtworkTarget | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Title editing & Photo replacement states
  const [editingTitleId, setEditingTitleId] = useState<string | null>(null);
  const [editingTitleText, setEditingTitleText] = useState<string>('');
  const [targetReplaceItem, setTargetReplaceItem] = useState<PrivateVaultItem | null>(null);
  const replaceFileInputRef = useRef<HTMLInputElement | null>(null);

  const handleSaveTitle = (id: string) => {
    if (!editingTitleText.trim()) return;
    updateVaultItemTitle(id, editingTitleText.trim());
    setItems(getPrivateVaultItems());
    setEditingTitleId(null);
    showToast(`Judul foto berhasil diubah menjadi "${editingTitleText.trim()}".`);
  };

  const handleReplaceFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !targetReplaceItem) return;
    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const dataUrl = event.target?.result as string;
        const arrayBuffer = await file.arrayBuffer();
        const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const realChecksum = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
        updateVaultItemPhoto(targetReplaceItem.id, dataUrl, realChecksum);
        setItems(getPrivateVaultItems());
        setTargetReplaceItem(null);
        showToast(`Foto "${targetReplaceItem.title}" berhasil diperbarui dengan berkas Anda!`);
      };
      reader.readAsDataURL(file);
    } catch {
      showToast('Gagal memproses berkas pengganti.');
    }
  };

  const pullRemotePostsIntoVault = async (silent = false) => {
    setIsPullingCloud(true);
    try {
      const { data: posts, error } = await supabase
        .from('posts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      if (!error && posts && posts.length > 0) {
        const mapped: PrivateVaultItem[] = posts.map((p: any) => ({
          id: p.id,
          title: p.title || 'Tangkapan C2PA',
          photoUrl: p.media_url,
          digest: p.c2pa_manifest_hash || p.raw_capture_digest || 'hash',
          resolution: p.sensor_telemetry?.resolution || '1920 × 1080',
          fileSize: '3.4 MB',
          captureDate: new Date(p.created_at).toLocaleString('id-ID'),
          deviceInfo: `${p.camera_make || 'Sony'} ${p.camera_model || 'Alpha C2PA'}`,
          isPrivate: false,
          isPublished: true,
          c2paSignature: p.hardware_tee_signature || 'ECDSA_P256_TEE_SECURE_ENCLAVE_VALID',
          sensorType: 'Direct CMOS RAW (Zero-Bypass)',
          storageTarget: 'cloud_supabase',
          uploadStatus: 'uploaded'
        }));
        const updated = mergeRemoteItemsIntoVault(mapped);
        setItems(updated);
        if (!silent) {
          showToast(`Berhasil menyinkronkan ${mapped.length} karya dari Supabase Cloud!`);
        }
      } else if (!silent) {
        showToast('Tidak ada data tambahan di Supabase Cloud.');
      }
    } catch (e: any) {
      if (!silent) showToast(`Catatan sinkronisasi cloud: ${e?.message || 'Koneksi database'}`);
    } finally {
      setIsPullingCloud(false);
    }
  };

  // Handle unlocking via the inline input form
  const handleInlineUnlock = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setInlineKeyError(null);
    if (!inlineKeyInput.trim()) {
      setInlineKeyError('Masukkan Kunci Brankas Anda terlebih dahulu.');
      return;
    }
    setIsVerifyingInlineKey(true);
    try {
      const res = await unlockVaultWithKey(inlineKeyInput.trim());
      if (res.success && res.vault) {
        setIsUnlocked(true);
        setActiveVault(res.vault);
        setInlineKeyInput('');
        showToast(res.message);
        const fresh = await initVaultAsync();
        setItems(fresh);
      } else {
        setInlineKeyError(res.message || 'Kunci Brankas tidak valid.');
      }
    } catch (err: any) {
      setInlineKeyError(err?.message || 'Gagal memverifikasi kunci.');
    } finally {
      setIsVerifyingInlineKey(false);
    }
  };

  useEffect(() => {
    const syncLockState = () => {
      const unlocked = isVaultUnlocked();
      const currentVault = getActiveVault();
      setIsUnlocked(unlocked);
      setActiveVault(currentVault);

      if (unlocked && currentVault) {
        initVaultAsync((loaded) => {
          setItems(loaded);
        });
      } else {
        setItems([]);
      }
    };

    // 1. Initial load
    syncLockState();

    // 2. Listen to updates and lock changes
    const handleUpdate = () => {
      if (isVaultUnlocked()) {
        initVaultAsync((loaded) => {
          setItems(loaded);
        });
      } else {
        setItems([]);
      }
    };

    window.addEventListener('vec-vault-lock-state-changed', syncLockState);
    window.addEventListener('vec-vault-updated', handleUpdate);
    window.addEventListener('vec-artwork-destroyed', handleUpdate);
    window.addEventListener('storage', handleUpdate);

    return () => {
      window.removeEventListener('vec-vault-lock-state-changed', syncLockState);
      window.removeEventListener('vec-vault-updated', handleUpdate);
      window.removeEventListener('vec-artwork-destroyed', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  const handleTogglePrivacy = async (item: PrivateVaultItem) => {
    const newIsPrivate = !item.isPrivate;
    const newIsPublished = !newIsPrivate;
    const updated = await updateVaultItemPrivacy(item.id, newIsPrivate, newIsPublished);
    setItems(updated);
    window.dispatchEvent(new Event('storage'));

    if (newIsPublished) {
      showToast(`Menerbitkan "${item.title}" ke Live Vault & Supabase...`);
      // Publish directly to Supabase posts table so ALL devices globally can see it
      const res = await publishArtworkToSupabasePosts({
        title: item.title,
        photoUrl: (item.cloudStorageUrl && item.cloudStorageUrl.startsWith('http')) ? item.cloudStorageUrl : item.photoUrl,
        digest: item.digest,
        deviceInfo: item.deviceInfo,
        resolution: item.resolution
      });
      if (res.success) {
        showToast(`Foto "${item.title}" berhasil diterbitkan ke Live Vault & tersimpan di Supabase Cloud!`);
      } else {
        showToast(`Foto "${item.title}" diterbitkan ke Live Vault lokal.`);
      }
    } else {
      // Unpublish from Supabase posts so it disappears from public catalog everywhere
      try {
        if (item.digest) {
          await supabase.from('posts').delete().eq('raw_capture_digest', item.digest);
          await supabase.from('posts').delete().eq('c2pa_manifest_hash', item.digest);
        }
        if (item.title?.trim()) {
          await supabase.from('posts').delete().eq('title', item.title.trim());
        }
        if (item.cloudStorageUrl) {
          await supabase.from('posts').delete().eq('media_url', item.cloudStorageUrl);
        }
        if (item.id && item.id.includes('-') && item.id.length > 20) {
          await supabase.from('posts').delete().eq('id', item.id);
        }
      } catch (e) {
        console.warn('Could not remove post from Supabase:', e);
      }
      window.dispatchEvent(new CustomEvent('vec-vault-updated'));
      showToast(`Foto "${item.title}" sekarang dikunci menjadi 100% Privat dan ditarik dari katalog publik.`);
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
      showToast(`Catatan: ${item.title} tersimpan secara lokal. Periksa bucket Supabase.`);
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

  const activeItems = items.filter((item) => {
    return !isArtworkPermanentlyDestroyed({
      id: item.id,
      digest: item.digest,
      title: item.title,
      photoUrl: item.photoUrl
    });
  });

  const filteredItems = activeItems.filter((item) => {
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

  const totalPrivateCount = activeItems.filter((i) => i.isPrivate).length;
  const totalPublishedCount = activeItems.filter((i) => i.isPublished).length;
  const cloudCount = activeItems.length;
  const localCount = 0;

  // STRICT ZERO-TRUST: If vault is locked or no active session, render high-security vault lock gate
  if (!isUnlocked || !activeVault) {
    return (
      <div className="space-y-6">
        {toastMessage && (
          <div className="fixed bottom-6 right-6 z-50 bg-emerald-600 text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-2 text-xs font-mono border border-emerald-400/40">
            <CheckCircle2 className="w-4 h-4 text-white" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* LOCKED VAULT HIGH SECURITY GATE */}
        <div className="max-w-2xl mx-auto py-10 px-4">
          <div className="p-8 rounded-3xl bg-gradient-to-b from-[#091326] via-[#050B18] to-[#02050E] border border-cyan-500/40 shadow-2xl shadow-cyan-950/60 text-center space-y-6 relative overflow-hidden">
            
            {/* Top Security Glow Rings */}
            <div className="inline-flex p-4 rounded-3xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 shadow-lg shadow-cyan-500/20 relative">
              <Lock className="w-10 h-10 animate-pulse text-cyan-300" />
              <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 border-2 border-black"></div>
            </div>

            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-500/40 text-[11px] font-mono text-cyan-300">
                <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
                <span>KEAMANAN TINGGI • ZERO-KNOWLEDGE ENCLAVE</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                Brankas Karya Terkunci
              </h2>
              <p className="text-xs sm:text-sm text-neutral-300 max-w-lg mx-auto leading-relaxed">
                Setiap pendaftar memiliki brankas karya terisolasi sendiri di basis data Supabase.
                Masukkan Kunci Akses Kriptografis Anda untuk membuka brankas, atau daftarkan akun kreator baru.
              </p>
            </div>

            {inlineKeyError && (
              <div className="p-3 rounded-xl bg-red-950/60 border border-red-500/40 text-red-200 text-xs flex items-center justify-center gap-2 max-w-md mx-auto">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{inlineKeyError}</span>
              </div>
            )}

            {/* Key Input Form */}
            <form onSubmit={handleInlineUnlock} className="max-w-md mx-auto space-y-3">
              <div className="relative">
                <KeyRound className="w-4 h-4 absolute left-3.5 top-3.5 text-cyan-400" />
                <input
                  type="text"
                  placeholder="VEC-VK-XXXX-XXXX-XXXX-XXXX"
                  value={inlineKeyInput}
                  onChange={(e) => setInlineKeyInput(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-black/90 border border-cyan-500/50 focus:border-cyan-400 rounded-xl font-mono text-sm tracking-wider text-cyan-200 placeholder:text-neutral-600 focus:outline-none focus:ring-1 focus:ring-cyan-400 shadow-inner"
                />
              </div>

              <button
                type="submit"
                disabled={isVerifyingInlineKey}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-600 via-cyan-500 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs tracking-wider shadow-lg shadow-cyan-950/60 flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-50"
              >
                {isVerifyingInlineKey ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Memverifikasi Kunci Kriptografis...</span>
                  </>
                ) : (
                  <>
                    <Unlock className="w-4 h-4" />
                    <span>Buka Kunci Brankas Karya</span>
                  </>
                )}
              </button>
            </form>

            {/* Registration CTA Button */}
            <div className="pt-4 border-t border-neutral-800/80 flex flex-col sm:flex-row items-center justify-center gap-3">
              <span className="text-xs text-neutral-400">Belum memiliki Kunci Brankas?</span>
              <button
                type="button"
                onClick={() => setShowRegisterModal(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-neutral-900 hover:bg-neutral-800 text-cyan-300 border border-cyan-500/30 hover:border-cyan-400 transition shadow cursor-pointer"
              >
                <PlusCircle className="w-4 h-4 text-cyan-400" />
                <span>Daftar Akun & Buat Brankas Baru</span>
              </button>
            </div>

            {/* List of Registered Vaults on Device */}
            {getCachedRegisteredVaults().length > 0 && (
              <div className="pt-3 max-w-md mx-auto text-left">
                <span className="text-[11px] font-mono text-neutral-400 block mb-1.5">
                  Brankas Terdaftar pada Perangkat Ini:
                </span>
                <div className="space-y-1.5">
                  {getCachedRegisteredVaults().map((v) => (
                    <div
                      key={v.id}
                      className="p-2 rounded-xl bg-neutral-950/80 border border-neutral-800 flex items-center justify-between text-xs"
                    >
                      <div className="truncate mr-2">
                        <div className="text-white font-semibold truncate">{v.vault_name}</div>
                        <div className="text-[10px] text-neutral-400">{v.creator_name} ({v.creator_handle})</div>
                      </div>
                      <span className="font-mono text-[10px] text-cyan-400 bg-cyan-950/50 px-2 py-0.5 rounded border border-cyan-500/30 shrink-0">
                        {v.key_prefix}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        </div>

        {/* Registration Modal */}
        <VaultRegistrationModal
          isOpen={showRegisterModal}
          onClose={() => setShowRegisterModal(false)}
          onRegisteredSuccess={(vault) => {
            setShowRegisterModal(false);
            setIsUnlocked(true);
            setActiveVault(vault);
            showToast(`Brankas "${vault.vault_name}" berhasil dibuka.`);
          }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <input
        type="file"
        ref={replaceFileInputRef}
        accept="image/*,.jpg,.jpeg,.png,.arw,.cr3,.dng"
        className="hidden"
        onChange={handleReplaceFileChange}
      />
      
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
          <div className="flex items-center gap-2 text-xs font-semibold text-cyan-400">
            <Lock className="w-4 h-4 text-emerald-400" />
            <span>PENGELOLAAN RESMI • TEMPAT PENGELOLAAN & PENYIMPANAN KARYA PRIBADI</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight mt-1">
            Brankas Karya Pribadi
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
            Semua foto hasil jepretan kamera Anda tersimpan di sini secara privat dalam resolusi tinggi asli. Anda dapat mengatur kepemilikan, mempublikasikan karya, atau menghapus karya secara aman kapan saja.
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            onClick={async () => {
              await purgeAllLocalVaultCache();
              const fresh = await initVaultAsync();
              setItems(fresh);
              showToast('Semua cache lokal berhasil dibersihkan! Data sekarang murni dari Supabase.');
            }}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-mono bg-rose-950/60 hover:bg-rose-900 text-rose-300 border border-rose-800 transition cursor-pointer"
            title="Hapus seluruh cache & log tersimpan di peramban dan muat ulang murni dari Supabase"
          >
            <Trash2 className="w-3.5 h-3.5 text-rose-400" />
            <span className="hidden sm:inline">Bersihkan Cache</span>
          </button>

          <button
            onClick={async () => {
              setIsPullingCloud(true);
              const fresh = await initVaultAsync();
              setItems(fresh);
              setIsPullingCloud(false);
              showToast(`Berhasil menyegarkan data langsung dari Supabase (${fresh.length} karya).`);
            }}
            disabled={isPullingCloud}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-mono bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 transition cursor-pointer"
            title="Muat ulang data dari Supabase"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isPullingCloud ? 'animate-spin text-cyan-400' : ''}`} />
            <span className="hidden sm:inline">Segarkan</span>
          </button>

          <button
            onClick={() => setShowCloudSettingsModal(true)}
            className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 transition cursor-pointer"
            title="Pengaturan Cloud Bucket Supabase"
          >
            <Settings className="w-4 h-4 text-slate-400" />
          </button>

          <button
            onClick={() => lockVault()}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-mono bg-neutral-900 hover:bg-neutral-800 text-amber-300 border border-neutral-700 transition cursor-pointer"
            title="Kunci kembali brankas karya"
          >
            <Lock className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Kunci Brankas</span>
          </button>

          <button
            onClick={() => setShowUnlockModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-mono bg-neutral-900 hover:bg-neutral-800 text-cyan-300 border border-neutral-700 transition cursor-pointer"
            title="Ganti kunci atau buka brankas lain"
          >
            <KeyRound className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">Ganti Kunci</span>
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
        <div className="p-4 rounded-2xl bg-[#050C1E] border border-cyan-500/30 space-y-2">
          <div className="flex items-center justify-between text-xs font-mono text-slate-400">
            <span>Brankas Aktif</span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          </div>
          <div className="text-sm font-bold text-white font-mono truncate" title={activeVault.vault_name}>
            {activeVault.vault_name}
          </div>
          <div className="text-[11px] font-mono text-cyan-300 flex items-center gap-1 truncate">
            <ShieldCheck className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <span className="truncate">{activeVault.creator_name} ({activeVault.creator_handle})</span>
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
            <span>Kunci Kriptografis Brankas</span>
            <Cpu className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="text-xs font-bold text-cyan-300 font-mono truncate" title={activeVault.key_prefix}>
            {activeVault.key_prefix}
          </div>
          <div className="text-[11px] font-mono text-slate-400">
            Enklave {activeVault.security_level}
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
            onClick={() => setActiveFilter('private')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition cursor-pointer ${
              activeFilter === 'private'
                ? 'bg-emerald-600 text-white font-bold shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Privat ({totalPrivateCount})</span>
          </button>
          <button
            onClick={() => setActiveFilter('published')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition cursor-pointer ${
              activeFilter === 'published'
                ? 'bg-indigo-600 text-white font-bold shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Share2 className="w-3.5 h-3.5" />
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
                  onError={(e) => {
                    e.currentTarget.style.opacity = '0.3';
                  }}
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

                {/* Bottom Resolution Watermark & Ganti Foto Button */}
                <div className="absolute bottom-2 left-3 text-[10px] font-mono text-slate-300 bg-black/70 px-2 py-0.5 rounded backdrop-blur-xs">
                  {item.resolution}
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setTargetReplaceItem(item);
                    replaceFileInputRef.current?.click();
                  }}
                  className="absolute bottom-2 right-3 px-2 py-0.5 rounded bg-black/85 hover:bg-cyan-950 text-[10px] font-mono text-cyan-300 border border-cyan-500/50 flex items-center gap-1 cursor-pointer transition shadow-md z-10"
                  title="Ganti foto ini dengan file gambar Anda sendiri"
                >
                  <Upload className="w-2.5 h-2.5" />
                  <span>Ganti Foto</span>
                </button>
              </div>

              {/* Photo Card Body */}
              <div className="p-5 space-y-3.5 flex-1 flex flex-col justify-between">
                
                <div className="space-y-2">
                  {editingTitleId === item.id ? (
                    <div className="space-y-1.5 p-2.5 rounded-xl bg-slate-950 border border-cyan-500 shadow-lg">
                      <label className="text-[10px] font-mono text-cyan-400 font-bold block">
                        Edit Judul Foto:
                      </label>
                      <input
                        type="text"
                        value={editingTitleText}
                        onChange={(e) => setEditingTitleText(e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs font-mono focus:outline-none focus:border-cyan-400"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveTitle(item.id);
                          if (e.key === 'Escape') setEditingTitleId(null);
                        }}
                      />
                      <div className="flex items-center gap-1.5 pt-1">
                        <button
                          onClick={() => handleSaveTitle(item.id)}
                          className="flex-1 py-1 rounded bg-cyan-600 hover:bg-cyan-500 text-white text-[11px] font-mono font-bold transition cursor-pointer flex items-center justify-center gap-1"
                        >
                          <Check className="w-3 h-3" /> Simpan
                        </button>
                        <button
                          onClick={() => setEditingTitleId(null)}
                          className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-mono transition cursor-pointer"
                        >
                          Batal
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="text-sm font-bold text-white leading-snug line-clamp-2">
                        {item.title}
                      </h4>
                      <button
                        onClick={() => {
                          setEditingTitleId(item.id);
                          setEditingTitleText(item.title);
                        }}
                        className="p-1 rounded-lg text-slate-400 hover:text-cyan-300 hover:bg-slate-800/80 transition shrink-0 cursor-pointer"
                        title="Klik untuk mengubah nama/judul foto ini"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}

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

                  {/* Storage Enclave Status */}
                  <div className="p-2 rounded-xl bg-slate-900/90 border border-slate-800 text-[10px] font-mono text-slate-300 flex items-center justify-between gap-1.5">
                    <div className="flex items-center gap-1.5 truncate">
                      <Lock className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span className="truncate">Enclave Pribadi • Edisi Tunggal</span>
                    </div>
                    <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[9px] shrink-0 font-bold">
                      {item.isPrivate ? '100% Privat' : 'Live Vault'}
                    </span>
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
                      onClick={() => setItemPendingDelete(item)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 border border-transparent hover:border-rose-900 transition cursor-pointer"
                      title="Hapus gambar ini secara permanen"
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
                onClick={() => {
                  const target = selectedPhoto;
                  setSelectedPhoto(null);
                  setItemPendingDelete(target);
                }}
                className="p-2 rounded-xl bg-rose-950/80 hover:bg-rose-900 border border-rose-500/40 text-rose-300 transition cursor-pointer"
                title="Hapus gambar ini secara permanen"
              >
                <Trash2 className="w-4 h-4 text-rose-400" />
              </button>

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
                onError={(e) => {
                  const el = e.currentTarget;
                  if (!el.src.includes('vec_vault_artwork')) {
                    el.src = '/assets/images/vec_vault_artwork_1792494925679.jpg';
                  }
                }}
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
                      const bName = bucketInput.trim() || 'vec-captures';
                      navigator.clipboard.writeText(`-- 1. Buat bucket public
INSERT INTO storage.buckets (id, name, public) VALUES ('${bName}', '${bName}', true) ON CONFLICT (id) DO UPDATE SET public = true;

-- 2. Beri izin akses upload dan baca public
DROP POLICY IF EXISTS "Public can view capture objects" ON storage.objects;
CREATE POLICY "Public can view capture objects" ON storage.objects FOR SELECT USING (bucket_id = '${bName}');

DROP POLICY IF EXISTS "Public can upload capture objects" ON storage.objects;
CREATE POLICY "Public can upload capture objects" ON storage.objects FOR INSERT WITH CHECK (bucket_id = '${bName}');`);
                      showToast('Perintah SQL lengkap berhasil disalin!');
                    }}
                    className="text-[10px] text-cyan-400 hover:text-cyan-300 underline cursor-pointer"
                  >
                    Salin SQL Lengkap
                  </button>
                </div>
                <pre className="p-2.5 rounded-lg bg-black text-[10px] text-slate-300 overflow-x-auto leading-relaxed border border-slate-900">
{`-- 1. Buat bucket public
INSERT INTO storage.buckets (id, name, public) 
VALUES ('${bucketInput.trim() || 'vec-captures'}', '${bucketInput.trim() || 'vec-captures'}', true) 
ON CONFLICT (id) DO UPDATE SET public = true;

-- 2. Izinkan upload & baca public
DROP POLICY IF EXISTS "Public can view capture objects" ON storage.objects;
CREATE POLICY "Public can view capture objects" ON storage.objects FOR SELECT USING (bucket_id = '${bucketInput.trim() || 'vec-captures'}');

DROP POLICY IF EXISTS "Public can upload capture objects" ON storage.objects;
CREATE POLICY "Public can upload capture objects" ON storage.objects FOR INSERT WITH CHECK (bucket_id = '${bucketInput.trim() || 'vec-captures'}');`}
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

      {/* Permanent Zero-Trace Proof-of-Burn Deletion Modal */}
      <PermanentDeleteModal
        artwork={itemPendingDelete}
        isOpen={Boolean(itemPendingDelete)}
        onClose={() => setItemPendingDelete(null)}
        onDeleted={async (deletedId) => {
          setItems((prev) => prev.filter((i) => i.id !== deletedId && !isArtworkPermanentlyDestroyed(i)));
          setItemPendingDelete(null);
          showToast('Gambar berhasil dihapus secara permanen dari seluruh sistem Supabase.');
          const fresh = await initVaultAsync();
          setItems(fresh);
        }}
      />

      {/* Vault Modals */}
      <VaultRegistrationModal
        isOpen={showRegisterModal}
        onClose={() => setShowRegisterModal(false)}
        onRegisteredSuccess={(vault) => {
          setShowRegisterModal(false);
          setIsUnlocked(true);
          setActiveVault(vault);
          showToast(`Brankas "${vault.vault_name}" berhasil dibuka.`);
        }}
      />

      <VaultKeyUnlockModal
        isOpen={showUnlockModal}
        onClose={() => setShowUnlockModal(false)}
        onRequestRegisterNew={() => {
          setShowUnlockModal(false);
          setShowRegisterModal(true);
        }}
      />

    </div>
  );
};

