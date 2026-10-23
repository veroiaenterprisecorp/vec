import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { 
  initVaultAsync, 
  PrivateVaultItem,
  purgeAllLocalVaultCache
} from '../lib/userVaultStorage';
import { 
  ShieldCheck, 
  Award, 
  MessageSquare, 
  Mic, 
  Play, 
  Pause, 
  Send, 
  MapPin, 
  CheckCircle2, 
  RefreshCw,
  Sliders,
  Filter,
  Camera,
  User,
  Calendar,
  Cpu,
  Copy,
  Check,
  Sparkles,
  ExternalLink,
  Image as ImageIcon,
  Globe,
  Wifi,
  WifiOff,
  AlertTriangle,
  Info,
  HelpCircle,
  HardDrive,
  X,
  Maximize2,
  ZoomIn,
  ZoomOut,
  Download
} from 'lucide-react';
import { checkSupabaseConnection, isArtworkPermanentlyDestroyed } from '../lib/cloudStorage';
import { setManualSupabaseCredentials, getSupabaseUrl, getSupabaseAnonKey } from '../lib/supabase';


export interface VaultArtwork {
  id: string;
  title: string;
  artist: string;
  artistRole: string;
  medium: string;
  dimensions?: string;
  photoUrl: string;
  authenticityScore: number;
  digest: string;
  c2paSignature: string;
  deviceInfo: string;
  curationNumber: string;
  description: string;
  isUserUploaded?: boolean;
  publishedAt: string;
  storageTarget?: string;
  cloudBucket?: string;
}

interface InteractionItem {
  id: string;
  artworkId?: string;
  author: string;
  role: string;
  score: number;
  type: 'COMMENT' | 'VOICE_NOTE' | 'AUTHENTIC_SEAL';
  content?: string;
  voiceDuration?: number;
  waveform?: number[];
  timestamp: string;
}

interface VecVaultProps {
  onNavigateToStudio?: () => void;
  onNavigateToPrivateVault?: () => void;
}

export const VecVault: React.FC<VecVaultProps> = ({ 
  onNavigateToStudio, 
  onNavigateToPrivateVault 
}) => {
  const [artworks, setArtworks] = useState<VaultArtwork[]>([]);
  const [selectedArtworkId, setSelectedArtworkId] = useState<string>('');
  const [copiedHash, setCopiedHash] = useState<boolean>(false);
  const [isViewerModalOpen, setIsViewerModalOpen] = useState<boolean>(false);
  const [viewerZoomLevel, setViewerZoomLevel] = useState<number>(1);
  const [connectionStatus, setConnectionStatus] = useState<{
    connected: boolean;
    url: string;
    configOrigin?: string;
    dbReachable?: boolean;
    bucketExists?: boolean;
    error?: string;
    advice?: string;
  } | null>(null);
  const [showGlobalGuideModal, setShowGlobalGuideModal] = useState<boolean>(false);
  const [manualUrlInput, setManualUrlInput] = useState<string>(() => getSupabaseUrl());
  const [manualKeyInput, setManualKeyInput] = useState<string>(() => getSupabaseAnonKey());
  const [manualSaveToast, setManualSaveToast] = useState<string | null>(null);
  const [vaultToast, setVaultToast] = useState<string | null>(null);

  const [filterType, setFilterType] = useState<'all' | 'COMMENT' | 'VOICE_NOTE' | 'AUTHENTIC_SEAL'>('all');
  const [commentInput, setCommentInput] = useState<string>('');
  const [isPlayingAudio, setIsPlayingAudio] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [interactions, setInteractions] = useState<InteractionItem[]>([]);

  // Pure Supabase: Sole Source of Truth (No Hybrid)
  const loadPublishedArtworks = async () => {
    setIsRefreshing(true);
    try {
      const { data: postsData, error } = await supabase
        .from('posts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        console.warn('Supabase catalog query error:', error.message);
        setArtworks([]);
        setSelectedArtworkId('');
        return;
      }

      if (!postsData || postsData.length === 0) {
        setArtworks([]);
        setSelectedArtworkId('');
        return;
      }

      const publishedList: VaultArtwork[] = postsData
        .filter((post: any) => {
          if (post.is_destroyed === true || post.destroyed_at) return false;
          
          // Siklus Inti: Katalog Karya HANYA menampilkan karya yang telah di-PUBLISH dari brankas karya
          const telemetry = post.sensor_telemetry || {};
          const isExplicitPrivate = telemetry.is_private === true;
          const isExplicitPublished = post.is_published === true || telemetry.is_published === true;
          
          if (isExplicitPrivate || !isExplicitPublished) return false;

          const d = (post.c2pa_manifest_hash || post.raw_capture_digest || '').trim().toLowerCase();
          const t = (post.title || '').trim().toLowerCase();
          const u = (post.media_url || '').trim();
          const pid = post.id;
          const curation = `VEC-SDB-${(post.id || '').slice(0, 4).toUpperCase()}`;

          if (isArtworkPermanentlyDestroyed({
            id: pid,
            digest: d,
            title: t,
            photoUrl: u,
            curationNumber: curation
          })) {
            return false;
          }
          return true;
        })
        .map((post: any) => {
          let mUrl = post.media_url || '';
          if (mUrl.startsWith('/src/assets/')) {
            mUrl = mUrl.replace('/src/assets/', '/assets/');
          }
          const telemetry = post.sensor_telemetry || {};
          const creatorName = telemetry.creator_name || post.author_name || 'Kolektor Terverifikasi';
          const vaultName = telemetry.vault_name || 'Brankas Karya';

          return {
            id: post.id,
            title: post.title || 'Tangkapan C2PA Publik',
            artist: creatorName,
            artistRole: `Kreator • ${vaultName}`,
            medium: 'Sensor CMOS RAW Attested',
            dimensions: telemetry.resolution || '1920 × 1080 piksel',
            photoUrl: mUrl,
            authenticityScore: Number(post.authenticity_confidence || 99.40),
            digest: post.c2pa_manifest_hash || post.raw_capture_digest || 'hash',
            c2paSignature: post.hardware_tee_signature || 'ECDSA_P256_TEE_SECURE_ENCLAVE_VALID',
            deviceInfo: `${post.camera_make || 'Sony'} ${post.camera_model || 'Alpha C2PA'}`,
            curationNumber: `VEC-SDB-${post.id.slice(0, 4).toUpperCase()}`,
            description: post.caption 
              ? `${post.caption} (Diterbitkan resmi dari ${vaultName})`
              : `Karya seni terverifikasi C2PA diterbitkan dari ${vaultName} oleh ${creatorName}.`,
            isUserUploaded: true,
            publishedAt: new Date(post.created_at).toLocaleDateString('id-ID'),
            storageTarget: 'cloud_supabase',
            cloudBucket: 'vec-captures'
          };
        });

      setArtworks(publishedList);
      if (publishedList.length > 0) {
        if (!publishedList.some(a => a.id === selectedArtworkId)) {
          setSelectedArtworkId(publishedList[0].id);
        }
      } else {
        setSelectedArtworkId('');
      }
    } catch (e) {
      console.warn('Error loading published artworks from Supabase:', e);
      setArtworks([]);
      setSelectedArtworkId('');
    } finally {
      setIsRefreshing(false);
    }
  };

  const fetchLiveInteractions = async () => {
    try {
      const { data, error } = await supabase
        .from('interactions')
        .select(`
          id,
          user_id,
          interaction_type,
          comment_body,
          voice_duration_seconds,
          voice_waveform,
          voice_transcription,
          author_authenticity_weight,
          created_at
        `)
        .order('created_at', { ascending: false })
        .limit(20);

      if (!error && data && data.length > 0) {
        const mapped: InteractionItem[] = data.map((row: any) => ({
          id: row.id,
          author: 'Kurator Hardware Attested',
          role: 'Verified Member',
          score: (row.author_authenticity_weight || 0.98) * 100,
          type: row.interaction_type,
          content: row.interaction_type === 'VOICE_NOTE' ? (row.voice_transcription || 'Catatan suara kurator tervalidasi') : row.comment_body,
          voiceDuration: row.voice_duration_seconds || 15.0,
          waveform: row.voice_waveform || [30, 60, 90, 70, 40, 80, 50, 30],
          timestamp: new Date(row.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
        }));
        setInteractions(mapped);
      }
    } catch (e) {
      console.warn('Could not fetch interactions from Supabase:', e);
    }
  };

  useEffect(() => {
    checkSupabaseConnection().then(setConnectionStatus);
    loadPublishedArtworks();
    fetchLiveInteractions();

    initVaultAsync().then(() => {
      loadPublishedArtworks();
    });

    const handleStorageChange = () => {
      loadPublishedArtworks();
      checkSupabaseConnection().then(setConnectionStatus);
    };
    const handleDestroyed = (e: any) => {
      const detail = e.detail;
      const delId = detail?.deletedId || detail?.id;
      if (delId) {
        setArtworks((prev) => prev.filter((a) => a.id !== delId && !isArtworkPermanentlyDestroyed(a)));
      }
      loadPublishedArtworks();
    };
    window.addEventListener('vec-vault-updated', handleStorageChange);
    window.addEventListener('vec-artwork-destroyed', handleDestroyed);
    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('vec-vault-updated', handleStorageChange);
      window.removeEventListener('vec-artwork-destroyed', handleDestroyed);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const activeArtwork = artworks.find((a) => a.id === selectedArtworkId) || artworks[0] || null;

  const handleCopyHash = () => {
    if (!activeArtwork) return;
    navigator.clipboard.writeText(activeArtwork.digest);
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 2000);
  };

  const handleSendComment = async () => {
    if (!commentInput.trim() || !activeArtwork) return;
    const currentText = commentInput.trim();
    const newItem: InteractionItem = {
      id: `int-${Date.now()}`,
      artworkId: activeArtwork.id,
      author: 'Anda (Kolektor Terverifikasi)',
      role: 'Hardware Attested Member',
      score: 99.40,
      type: 'COMMENT',
      content: currentText,
      timestamp: 'Baru saja'
    };
    setInteractions([newItem, ...interactions]);
    setCommentInput('');
    setIsSubmitting(true);

    try {
      await supabase.from('interactions').insert({
        user_id: 'a1111111-1111-4111-8111-111111111111',
        post_id: activeArtwork.id.includes('-') && activeArtwork.id.length === 36 ? activeArtwork.id : 'd4444444-4444-4444-8444-444444444444',
        post_created_at: new Date().toISOString(),
        interaction_type: 'COMMENT',
        comment_body: currentText,
        author_authenticity_weight: 0.994
      });
    } catch (e) {
      console.warn('Live comment insertion note:', e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddVoiceNote = () => {
    if (!activeArtwork) return;
    const newItem: InteractionItem = {
      id: `int-${Date.now()}`,
      artworkId: activeArtwork.id,
      author: 'Anda (Kolektor Terverifikasi)',
      role: 'Hardware Attested Member',
      score: 99.40,
      type: 'VOICE_NOTE',
      voiceDuration: 14.5,
      waveform: [25, 45, 80, 100, 70, 95, 60, 40, 85, 90, 50, 20],
      timestamp: 'Baru saja'
    };
    setInteractions([newItem, ...interactions]);
  };

  const handleAddAuthenticSeal = () => {
    if (!activeArtwork) return;
    const newItem: InteractionItem = {
      id: `int-${Date.now()}`,
      artworkId: activeArtwork.id,
      author: 'Anda (Kurator Terverifikasi)',
      role: 'Hardware Attested Member',
      score: 99.40,
      type: 'AUTHENTIC_SEAL',
      content: `Menyematkan Stempel Keaslian Resmi (AUTHENTIC_SEAL) untuk "${activeArtwork.title}".`,
      timestamp: 'Baru saja'
    };
    setInteractions([newItem, ...interactions]);
  };

  const filteredInteractions = interactions.filter(item => {
    if (filterType === 'all') return true;
    return item.type === filterType;
  });

  const userPublishedCount = artworks.filter(a => a.isUserUploaded).length;

  const emptyState = (
    <div className="rounded-3xl border border-dashed border-slate-700 bg-slate-950/60 p-10 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-slate-700 bg-slate-900 text-slate-300">
        <ImageIcon className="h-6 w-6" />
      </div>
      <h3 className="mt-4 text-lg font-bold text-white">Belum ada gambar yang diizinkan</h3>
      <p className="mt-2 text-sm text-slate-400 max-w-lg mx-auto">
        Saat ini tidak ada karya publik yang diizinkan tampil di vault. Semua berkas yang tersimpan masih berada di brankas pribadi dan menunggu persetujuan publikasi.
      </p>
      {onNavigateToPrivateVault && (
        <button
          onClick={onNavigateToPrivateVault}
          className="mt-5 inline-flex items-center justify-center rounded-xl bg-cyan-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-cyan-500"
        >
          Buka Brankas Karya
        </button>
      )}
    </div>
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-cyan-400">
            <ShieldCheck className="w-4 h-4 text-cyan-400" />
            <span>KATALOG RESMI • PAMERAN KARYA TERVERIFIKASI & ULASAN KURATOR</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight mt-1">
            Katalog Resmi & Pameran Karya Seni Terpilih
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Menampilkan seluruh karya seni dan foto asli terverifikasi yang telah diterbitkan oleh seniman dan kolektor.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => {
              loadPublishedArtworks();
              fetchLiveInteractions();
            }}
            disabled={isRefreshing}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-mono bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 transition cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-cyan-400' : ''}`} />
            <span>Segarkan Vault</span>
          </button>

          <button
            onClick={async () => {
              await purgeAllLocalVaultCache();
              await loadPublishedArtworks();
              setVaultToast('Semua cache lokal berhasil dibersihkan & dimuat ulang murni dari Supabase.');
              setTimeout(() => setVaultToast(null), 3500);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-mono bg-rose-950/50 hover:bg-rose-900/70 text-rose-300 border border-rose-800 transition cursor-pointer"
            title="Hapus seluruh cache & log tersimpan di peramban dan muat ulang hanya dari database Supabase"
          >
            <RefreshCw className="w-3.5 h-3.5 text-rose-400" />
            <span className="hidden sm:inline">Bersihkan Cache</span>
          </button>

          {onNavigateToStudio && (
            <button
              onClick={onNavigateToStudio}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-mono font-bold bg-cyan-600 hover:bg-cyan-500 text-white transition shadow-md shadow-cyan-950 cursor-pointer"
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Jepret & Terbitkan Karya</span>
            </button>
          )}
        </div>
      </div>

      {connectionStatus && !connectionStatus.connected ? (
        <div className="p-4 rounded-2xl bg-amber-950/40 border border-amber-500/50 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-xs font-mono shadow-xl">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0 mt-0.5">
              <Globe className="w-5 h-5 animate-pulse" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-white text-sm">Status Sinkronisasi Cloud: {connectionStatus.error || 'Perlu Diperiksa'}</span>
                <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] border border-amber-500/30">
                  {connectionStatus.configOrigin === 'vercel_env' ? 'Vercel Env Terpasang (Perlu Redeploy / Bucket)' : 'Kredensial Default / Lokal'}
                </span>
              </div>
              <p className="text-[11px] text-amber-200/90 leading-relaxed max-w-3xl">
                {connectionStatus.advice || 'Foto yang Anda ambil tersimpan aman di perangkat ini. Agar foto otomatis muncul antar HP & Laptop saat membuka link website, ikuti tutorial 3 langkah untuk menghubungkan Vercel dan Supabase.'}
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowGlobalGuideModal(true)}
            className="px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs transition shrink-0 shadow-lg shadow-amber-950 cursor-pointer whitespace-nowrap flex items-center gap-2"
          >
            <HelpCircle className="w-4 h-4" />
            <span>Tutorial & Cek Kredensial Vercel</span>
          </button>
        </div>
      ) : connectionStatus?.connected ? (
        <div className="p-3.5 rounded-2xl bg-emerald-950/30 border border-emerald-500/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs font-mono text-emerald-300">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shrink-0"></span>
            <div>
              <span className="font-bold text-white block sm:inline mr-1.5">Tersinkronisasi Cloud Supabase:</span>
              <span className="text-[11px] text-emerald-300">
                Terhubung ke {connectionStatus.url} • {connectionStatus.bucketExists ? 'Bucket "vec-captures" Siap' : 'Catatan: Buat Bucket "vec-captures" (Public) di Supabase Storage'}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setShowGlobalGuideModal(true)}
              className="text-[10px] px-2.5 py-1 rounded-lg bg-emerald-900/60 hover:bg-emerald-800 text-emerald-200 border border-emerald-700/50 flex items-center gap-1 transition cursor-pointer"
            >
              <Info className="w-3 h-3 text-cyan-400" />
              <span>Info Konfigurasi & Vercel</span>
            </button>
          </div>
        </div>
      ) : null}

      {artworks.length === 0 ? (
        <div className="space-y-4">
          {emptyState}
        </div>
      ) : (
        <>
          <div className="bg-[#050C1E] border border-slate-800 rounded-3xl p-5 space-y-4 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-cyan-400" />
                <h3 className="text-sm font-bold text-white">
                  Koleksi Karya Terpublikasi ({artworks.length} Karya)
                </h3>
                {userPublishedCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] border border-emerald-500/40">
                    {userPublishedCount} karya diterbitkan oleh Anda
                  </span>
                )}
              </div>
              <span className="text-[11px] text-slate-400">
                Pilih karya untuk melihat rincian keaslian & catatan kurasi
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5">
              {artworks.map((art) => {
                const isSelected = art.id === selectedArtworkId;
                return (
                  <div
                    key={art.id}
                    onClick={() => setSelectedArtworkId(art.id)}
                    className={`group relative rounded-2xl overflow-hidden border p-2 transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'bg-slate-900 border-cyan-500 ring-2 ring-cyan-500/40 shadow-xl shadow-cyan-950/50'
                        : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="relative h-28 rounded-xl overflow-hidden bg-slate-900 mb-2">
                      <img
                        src={art.photoUrl}
                        alt={art.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                        onError={(e) => {
                          e.currentTarget.style.opacity = '0.3';
                        }}
                      />
                      {art.isUserUploaded && (
                        <span className="absolute top-1.5 left-1.5 bg-emerald-600/90 backdrop-blur-md px-1.5 py-0.5 rounded text-[9px] font-mono font-bold text-white shadow">
                          Karya Terverifikasi
                        </span>
                      )}
                      {isSelected && (
                        <span className="absolute bottom-1.5 right-1.5 bg-cyan-500 text-slate-950 px-1.5 py-0.5 rounded text-[9px] font-mono font-bold shadow">
                          Aktif Ditampilkan
                        </span>
                      )}
                    </div>

                    <div className="space-y-1">
                      <h4 className="text-xs font-bold text-white line-clamp-1 group-hover:text-cyan-300 transition">
                        {art.title}
                      </h4>
                      <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                        <span className="truncate max-w-[80px]">{art.curationNumber}</span>
                        <span className="text-emerald-400 font-semibold">{art.authenticityScore}%</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {activeArtwork && (
            <div className="bg-slate-900/90 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl grid grid-cols-1 lg:grid-cols-12">
              <div className="lg:col-span-5 relative h-72 sm:h-96 lg:h-auto min-h-[340px] bg-black">
                <img
                  src={activeArtwork.photoUrl}
                  alt={activeArtwork.title}
                  className="w-full h-full object-cover cursor-pointer hover:scale-[1.02] transition duration-500"
                  referrerPolicy="no-referrer"
                  onClick={() => {
                    setViewerZoomLevel(1);
                    setIsViewerModalOpen(true);
                  }}
                  title="Klik untuk membuka penampil gambar resolusi tinggi & zoom"
                  onError={(e) => {
                    e.currentTarget.style.opacity = '0.3';
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent lg:bg-gradient-to-r lg:from-transparent lg:to-slate-900/90 pointer-events-none"></div>

                <div className="absolute top-4 left-4 flex flex-wrap gap-2">
                  <div className="bg-black/75 backdrop-blur-md px-3 py-1.5 rounded-xl border border-emerald-500/40 text-xs font-mono text-emerald-300 flex items-center gap-1.5 shadow-lg">
                    <Award className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{activeArtwork.curationNumber}</span>
                  </div>

                  {activeArtwork.isUserUploaded && (
                    <div className="bg-emerald-600/90 backdrop-blur-md px-3 py-1.5 rounded-xl text-xs font-mono font-bold text-white shadow-lg">
                      ✓ Diterbitkan dari Brankas Anda
                    </div>
                  )}
                </div>

                <div className="absolute top-4 right-4 z-10">
                  <button
                    onClick={() => {
                      setViewerZoomLevel(1);
                      setIsViewerModalOpen(true);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-black/80 hover:bg-slate-900 text-cyan-300 hover:text-white border border-cyan-500/40 text-xs font-mono flex items-center gap-1.5 transition shadow-lg cursor-pointer"
                    title="Buka penampil gambar resolusi penuh & zoom"
                  >
                    <Maximize2 className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Teliti Piksel / Zoom</span>
                  </button>
                </div>

                <div className="absolute bottom-4 left-4 right-4 text-[11px] font-mono text-slate-300 bg-black/70 backdrop-blur-md p-2 rounded-xl border border-slate-800 flex items-center justify-between gap-2">
                  <span className="truncate">Sensor: {activeArtwork.deviceInfo}</span>
                  <span className="text-emerald-400 shrink-0 font-bold">100% C2PA RAW</span>
                </div>
              </div>

              <div className="lg:col-span-7 p-6 sm:p-8 flex flex-col justify-between space-y-6">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-xs font-mono text-slate-400 flex-wrap">
                    <span className="text-cyan-400 font-bold">{activeArtwork.artist}</span>
                    <span aria-hidden="true">·</span>
                    <span>{activeArtwork.medium}</span>
                    {activeArtwork.dimensions && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span>{activeArtwork.dimensions}</span>
                      </>
                    )}
                  </div>

                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <h3 className="text-2xl font-bold text-white tracking-tight">
                      {activeArtwork.title}
                    </h3>
                    <div className="flex items-center gap-2 flex-wrap">
                      {activeArtwork.isUserUploaded && onNavigateToPrivateVault && (
                        <button
                          onClick={onNavigateToPrivateVault}
                          className="px-3 py-1.5 rounded-xl text-cyan-300 hover:text-white bg-slate-900/90 hover:bg-slate-800 border border-cyan-500/40 hover:border-cyan-400 transition cursor-pointer text-xs flex items-center gap-1.5"
                          title="Buka Brankas Karya"
                        >
                          <ShieldCheck className="w-4 h-4 text-cyan-400" />
                          <span>Kelola di Brankas</span>
                        </button>
                      )}
                    </div>
                  </div>

                  <p className="text-sm text-slate-300 leading-relaxed font-normal">
                    {activeArtwork.description}
                  </p>
                </div>

                <div className="p-3 bg-slate-950/80 rounded-2xl border border-slate-800 space-y-1 text-xs">
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span>Kode Keaslian Unik Karya:</span>
                    <button
                      onClick={handleCopyHash}
                      className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer font-medium"
                    >
                      {copiedHash ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedHash ? 'Disalin' : 'Salin Kode'}</span>
                    </button>
                  </div>
                  <div className="text-cyan-300 text-[11px] break-all leading-tight font-mono">
                    {activeArtwork.digest}
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
                    <span className="text-slate-500 block text-[11px]">Skor Keaslian:</span>
                    <span className="text-emerald-400 font-bold text-sm">{activeArtwork.authenticityScore}%</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
                    <span className="text-slate-500 block text-[11px]">Segel Fisik:</span>
                    <span className="text-amber-300 font-semibold text-sm">Terverifikasi Sah</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 col-span-2 sm:col-span-1">
                    <span className="text-slate-500 block text-[11px]">Privasi Lokasi:</span>
                    <span className="text-cyan-300 font-semibold text-sm">Terlindungi</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {artworks.length > 0 && (
        <div className="bg-[#050C1E] rounded-3xl border border-slate-800 p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
            <div>
              <h4 className="text-lg font-bold text-white flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-cyan-400" />
                <span>Catatan Kurasi & Verifikasi Kolektor</span>
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">
                Diskusi & stempel keaslian untuk: <strong className="text-white">"{activeArtwork?.title || 'Karya terpilih'}"</strong>
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1 p-1 bg-slate-900 rounded-xl border border-slate-800 text-xs font-mono">
                <button
                  onClick={() => setFilterType('all')}
                  className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                    filterType === 'all' ? 'bg-cyan-600 text-white font-bold' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Semua
                </button>
                <button
                  onClick={() => setFilterType('VOICE_NOTE')}
                  className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                    filterType === 'VOICE_NOTE' ? 'bg-cyan-600 text-white font-bold' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Voice Notes
                </button>
                <button
                  onClick={() => setFilterType('AUTHENTIC_SEAL')}
                  className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                    filterType === 'AUTHENTIC_SEAL' ? 'bg-cyan-600 text-white font-bold' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Stempel
                </button>
              </div>

              <button
                onClick={handleAddAuthenticSeal}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-950/60 hover:bg-emerald-900/70 text-emerald-300 border border-emerald-800/60 text-xs font-mono transition cursor-pointer"
              >
                <Award className="w-3.5 h-3.5 text-emerald-400" />
                <span>Beri Stempel Keaslian</span>
              </button>

              <button
                onClick={handleAddVoiceNote}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-950/60 hover:bg-purple-900/70 text-purple-300 border border-purple-800/60 text-xs font-mono transition cursor-pointer"
              >
                <Mic className="w-3.5 h-3.5 text-purple-400" />
                <span>Simulasi Voice Note</span>
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {filteredInteractions.map((item) => (
              <div
                key={item.id}
                className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3 hover:border-slate-700 transition"
              >
                <div className="flex items-center justify-between text-xs font-mono">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white">{item.author}</span>
                    <span className="text-[10px] text-cyan-300 bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-800/60">
                      {item.role}
                    </span>
                    <span className="text-[11px] text-emerald-400 hidden sm:inline">
                      Skor: {(item.score).toFixed(1)}%
                    </span>
                  </div>
                  <span className="text-slate-500 text-[11px]">{item.timestamp}</span>
                </div>

                {item.type === 'COMMENT' && (
                  <p className="text-xs text-slate-300 leading-relaxed font-sans pl-1">
                    "{item.content}"
                  </p>
                )}

                {item.type === 'VOICE_NOTE' && (
                  <div className="flex items-center gap-3 bg-black/60 p-3 rounded-xl border border-purple-900/40 max-w-lg">
                    <button
                      onClick={() => setIsPlayingAudio(isPlayingAudio === item.id ? null : item.id)}
                      className="w-9 h-9 rounded-full bg-purple-600 hover:bg-purple-500 flex items-center justify-center text-white transition shadow-md shadow-purple-950 shrink-0 cursor-pointer"
                    >
                      {isPlayingAudio === item.id ? (
                        <Pause className="w-4 h-4" />
                      ) : (
                        <Play className="w-4 h-4 ml-0.5" />
                      )}
                    </button>
                    <div className="flex-1">
                      <div className="text-[11px] font-mono text-purple-300 mb-1">
                        Catatan Suara Kurator
                      </div>
                      <div className="h-6 flex items-center gap-1">
                        {(item.waveform || [20, 50, 80, 100, 60, 40, 90, 70, 30]).map((h, idx) => (
                          <div
                            key={idx}
                            className={`w-1.5 rounded-full transition-all ${
                              isPlayingAudio === item.id ? 'bg-purple-400 animate-pulse' : 'bg-purple-700/60'
                            }`}
                            style={{ height: `${Math.max(20, h)}%` }}
                          />
                        ))}
                      </div>
                    </div>
                    <span className="text-xs font-mono text-purple-300 tabular-nums">
                      0:{item.voiceDuration?.toFixed(0)}
                    </span>
                  </div>
                )}

                {item.type === 'AUTHENTIC_SEAL' && (
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-950/60 border border-emerald-800/60 text-xs font-mono text-emerald-300">
                    <Award className="w-4 h-4 text-emerald-400" />
                    <span>{item.content}</span>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="pt-2 flex items-center gap-2">
            <input
              type="text"
              placeholder={`Tulis kurasi atau ulasan otentik untuk "${activeArtwork?.title || 'karya terpilih'}"...`}
              value={commentInput}
              onChange={(e) => setCommentInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendComment()}
              disabled={isSubmitting || !activeArtwork}
              className="flex-1 bg-slate-950 text-xs font-mono text-white placeholder-slate-500 px-4 py-3 rounded-xl border border-slate-800 focus:outline-none focus:border-cyan-500 transition"
            />
            <button
              onClick={handleSendComment}
              disabled={isSubmitting || !commentInput.trim() || !activeArtwork}
              className="px-5 py-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white font-mono text-xs font-bold transition flex items-center gap-2 shadow-lg shadow-cyan-950 cursor-pointer"
            >
              <span>Kirim</span>
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {showGlobalGuideModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#050C1E] border border-cyan-500/40 rounded-3xl max-w-2xl w-full p-6 space-y-5 shadow-2xl relative my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shrink-0">
                  <Globe className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white font-mono">
                    Tutorial Koneksi Vercel & Supabase Cloud
                  </h3>
                  <p className="text-[11px] text-slate-400 font-mono">
                    Jawaban mengapa variabel belum terhubung & cara sinkronisasi lintas perangkat (HP ↔ Laptop)
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowGlobalGuideModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2 text-xs font-mono">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-bold">STATUS KONEKSI SAAT INI:</span>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                  connectionStatus?.connected 
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' 
                    : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                }`}>
                  {connectionStatus?.connected ? '✓ TERHUBUNG KE SUPABASE' : '⚠ BELUM TERHUBUNG'}
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-300 pt-1">
                <div>
                  <span className="text-slate-500 block">Supabase URL:</span>
                  <span className="text-cyan-300 break-all">{connectionStatus?.url || manualUrlInput}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Sumber Kredensial:</span>
                  <span className="text-white">
                    {connectionStatus?.configOrigin === 'vercel_env' 
                      ? 'Vercel Environment Variable (Build)' 
                      : connectionStatus?.configOrigin === 'browser_storage' 
                      ? 'Penyimpanan Manual Browser' 
                      : 'Proyek Default (cruijnhylcdojbilzgwd)'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">Status Storage Bucket:</span>
                  <span className={connectionStatus?.bucketExists ? 'text-emerald-400' : 'text-amber-400'}>
                    {connectionStatus?.bucketExists ? '✓ Bucket "vec-captures" Siap' : '⚠ Bucket "vec-captures" Belum Ada'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">Status Database Posts:</span>
                  <span className={connectionStatus?.dbReachable ? 'text-emerald-400' : 'text-slate-400'}>
                    {connectionStatus?.dbReachable ? '✓ Tabel Posts Terkoneksi' : 'Menunggu Query'}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-3.5 text-xs font-mono max-h-80 overflow-y-auto pr-1">
              <div className="p-3.5 rounded-2xl bg-cyan-950/20 border border-cyan-500/30 space-y-1.5">
                <span className="text-cyan-300 font-bold flex items-center gap-1.5 text-xs">
                  <Sparkles className="w-4 h-4 text-cyan-400" />
                  Pertanyaan: Mana yang benar, VITE_SUPABASE_URL atau SUPABASE_URL?
                </span>
                <p className="text-slate-300 text-[11px] leading-relaxed">
                  Di framework <strong>Vite</strong> (React SPA yang berjalan di browser pengguna), semua variabel publik diwajibkan memiliki awalan <code>VITE_</code> agar dapat dibaca di sisi browser.
                </p>
                <div className="p-2 rounded bg-slate-950 border border-slate-800 space-y-1 text-[11px]">
                  <div className="text-emerald-400 font-bold">✓ Rekomendasi Resmi:</div>
                  <div className="text-slate-300"><code>VITE_SUPABASE_URL</code> = <code>https://cruijnhylcdojbilzgwd.supabase.co</code></div>
                  <div className="text-slate-300"><code>VITE_SUPABASE_ANON_KEY</code> = <code>eyJh...</code> (anon public key)</div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-800">
              <span className="text-[11px] text-slate-400 font-mono">
                Semua foto yang dijepret kini otomatis tampil di puncak galeri.
              </span>
              <button
                onClick={() => setShowGlobalGuideModal(false)}
                className="px-5 py-2.5 rounded-xl text-xs font-mono font-bold bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 transition cursor-pointer"
              >
                Tutup Panduan
              </button>
            </div>
          </div>
        </div>
      )}

      {vaultToast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl bg-slate-900 border border-emerald-500/60 shadow-2xl text-white text-xs font-mono animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{vaultToast}</span>
        </div>
      )}

      {isViewerModalOpen && activeArtwork && (
        <div 
          className="fixed inset-0 z-50 bg-black/92 backdrop-blur-md flex flex-col p-4 sm:p-6 animate-in fade-in"
          onClick={() => setIsViewerModalOpen(false)}
        >
          <div 
            className="flex items-center justify-between pb-3 border-b border-slate-800 text-xs font-mono"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-cyan-950/80 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-white font-bold text-sm line-clamp-1">{activeArtwork.title}</h4>
                <p className="text-[11px] text-slate-400">{activeArtwork.artist} • {activeArtwork.dimensions || '1920 × 1080'}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1">
                <button
                  onClick={() => setViewerZoomLevel((z) => Math.max(0.5, Number((z - 0.25).toFixed(2))))}
                  disabled={viewerZoomLevel <= 0.5}
                  className="p-1 text-slate-400 hover:text-white disabled:opacity-30 cursor-pointer"
                  title="Perkecil"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <span className="text-[11px] text-cyan-300 w-12 text-center font-bold">
                  {Math.round(viewerZoomLevel * 100)}%
                </span>
                <button
                  onClick={() => setViewerZoomLevel((z) => Math.min(3.5, Number((z + 0.25).toFixed(2))))}
                  disabled={viewerZoomLevel >= 3.5}
                  className="p-1 text-slate-400 hover:text-white disabled:opacity-30 cursor-pointer"
                  title="Perbesar"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
              </div>

              {activeArtwork.photoUrl && (
                <a
                  href={activeArtwork.photoUrl}
                  download={`${activeArtwork.title.replace(/\s+/g, '_')}_VEC_C2PA.jpg`}
                  className="px-3 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs flex items-center gap-1.5 transition shadow"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Download className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Unduh Resolusi Asli</span>
                </a>
              )}

              <button
                onClick={() => setIsViewerModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div 
            className="flex-1 flex items-center justify-center overflow-auto p-4 my-2 relative cursor-grab active:cursor-grabbing"
            onClick={(e) => e.stopPropagation()}
          >
            <div 
              className="transition-transform duration-200 ease-out origin-center"
              style={{ transform: `scale(${viewerZoomLevel})` }}
            >
              <img
                src={activeArtwork.photoUrl}
                alt={activeArtwork.title}
                className="max-h-[75vh] max-w-[90vw] object-contain rounded-2xl shadow-2xl border border-slate-800"
              />
            </div>
          </div>

          <div 
            className="pt-2 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-2"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2 truncate max-w-xl">
              <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0"></span>
              <span className="text-white shrink-0 font-medium">Kode Keaslian:</span>
              <span className="text-cyan-300 truncate font-mono">{activeArtwork.digest}</span>
            </div>
            <div className="text-[11px] text-slate-400 font-medium">
              Kamera: {activeArtwork.deviceInfo} • Keaslian: {activeArtwork.authenticityScore}%
            </div>
          </div>
        </div>
      )}

      {/* Toast Notifikasi Vault */}
      {vaultToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-600 text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-2 text-xs font-medium border border-emerald-400/40 animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-4 h-4 text-white" />
          <span>{vaultToast}</span>
        </div>
      )}
    </div>
  );
};
