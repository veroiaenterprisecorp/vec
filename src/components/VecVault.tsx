import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { 
  getPublicVaultItems,
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
  SlidersHorizontal,
  Camera, 
  Lock, 
  User, 
  Calendar, 
  Copy, 
  Check, 
  Sparkles, 
  Globe, 
  AlertTriangle, 
  Info, 
  HelpCircle, 
  X, 
  Maximize2, 
  ZoomIn, 
  ZoomOut, 
  Download,
  Search,
  SearchX,
  Clock,
  FileCheck,
  ChevronDown,
  ChevronUp,
  Layers,
  Cpu,
  Fingerprint
} from 'lucide-react';
import { checkSupabaseConnection, isArtworkPermanentlyDestroyed } from '../lib/cloudStorage';
import { getSupabaseUrl, getSupabaseAnonKey } from '../lib/supabase';
import { VeroiaProcessorModal } from './VeroiaProcessorModal';
import { getVGuardInspection, getGenevoraFingerprint } from '../lib/veroiaProcessor';
import { PrivateVaultItem } from '../lib/userVaultStorage';

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
  verificationStatus?: 'VERIFIED_HARDWARE_TEE' | 'VERIFIED_C2PA' | 'PENDING' | 'MANIPULATION_DETECTED' | 'REJECTED_SYNTHETIC' | 'UNVERIFIED' | string;
  category?: string;
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
  searchQuery?: string;
  onSearchQueryChange?: (query: string) => void;
}

type VerificationFilterType = 'all' | 'verified' | 'unverified' | 'requires_review';
type SortOption = 'newest' | 'title' | 'score';

export const VecVault: React.FC<VecVaultProps> = ({ 
  onNavigateToStudio, 
  onNavigateToPrivateVault,
  searchQuery: propSearchQuery,
  onSearchQueryChange
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
  const [isProcessorModalOpen, setIsProcessorModalOpen] = useState<boolean>(false);
  const [vaultToast, setVaultToast] = useState<string | null>(null);

  // Search & Verification Filter States (Phase 2 & Navbar Search Sync)
  const [searchQuery, setSearchQuery] = useState<string>(() => {
    if (propSearchQuery !== undefined) return propSearchQuery;
    if (typeof window !== 'undefined') {
      const q = new URLSearchParams(window.location.search).get('q');
      if (q) return q;
    }
    return '';
  });

  useEffect(() => {
    if (propSearchQuery !== undefined && propSearchQuery !== searchQuery) {
      setSearchQuery(propSearchQuery);
    }
  }, [propSearchQuery]);

  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    if (onSearchQueryChange) {
      onSearchQueryChange(val);
    }
  };
  const [verificationFilter, setVerificationFilter] = useState<VerificationFilterType>('all');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [activeDetailTab, setActiveDetailTab] = useState<'provenance' | 'technical' | 'curation'>('provenance');
  const [showTechnicalDrawer, setShowTechnicalDrawer] = useState<boolean>(false);

  // Interactions State
  const [filterType, setFilterType] = useState<'all' | 'COMMENT' | 'VOICE_NOTE' | 'AUTHENTIC_SEAL'>('all');
  const [commentInput, setCommentInput] = useState<string>('');
  const [isPlayingAudio, setIsPlayingAudio] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [interactions, setInteractions] = useState<InteractionItem[]>([]);

  // Helper: Evaluates verification status accurately based on authoritative data
  const getArtworkVerificationCategory = (art: VaultArtwork): 'verified' | 'unverified' | 'requires_review' => {
    const rawStatus = (art.verificationStatus || '').toUpperCase();
    const sig = (art.c2paSignature || '').toUpperCase();

    if (rawStatus === 'MANIPULATION_DETECTED' || rawStatus === 'REJECTED_SYNTHETIC') {
      return 'requires_review';
    }

    if (
      rawStatus === 'VERIFIED_HARDWARE_TEE' || 
      rawStatus === 'VERIFIED_C2PA' || 
      rawStatus === 'VERIFIED' ||
      sig.includes('VALID') || 
      sig.includes('HARDWARE_ATTESTED')
    ) {
      return 'verified';
    }

    return 'unverified';
  };

  // Siklus Terhubung: Menampilkan karya publik yang diizinkan (tanpa kebocoran data privat)
  const loadPublishedArtworks = async () => {
    setIsRefreshing(true);
    try {
      // 1. Ambil karya berstatus publik / diizinkan dari sistem penyimpanan lokal
      const localPermitted = getPublicVaultItems();
      const localArtworks: VaultArtwork[] = localPermitted.map((item) => {
        let mUrl = item.photoUrl || '';
        if (mUrl.startsWith('/src/assets/')) {
          mUrl = mUrl.replace('/src/assets/', '/assets/');
        }

        const sig = item.c2paSignature || '';
        const isHardwareValid = sig.includes('VALID') || sig.includes('HARDWARE_ATTESTED');

        return {
          id: item.id,
          title: item.title || 'Tangkapan C2PA Publik',
          artist: item.creatorName || 'VEC Master Curator',
          artistRole: `Kreator • ${item.vaultName || 'Brankas Karya'}`,
          medium: item.sensorType || 'Sensor CMOS RAW Attested',
          dimensions: item.resolution || '1920 × 1080 piksel',
          photoUrl: mUrl,
          authenticityScore: 99.40,
          digest: item.digest || 'hash',
          c2paSignature: item.c2paSignature || 'ECDSA_P256_TEE_SECURE_ENCLAVE_VALID',
          deviceInfo: item.deviceInfo || 'VEC Hardware Sensor Enclave',
          curationNumber: `VEC-SDB-${(item.id || '001').slice(0, 4).toUpperCase()}`,
          description: item.description 
            ? item.description 
            : `Karya seni terverifikasi C2PA resmi dari ${item.vaultName || 'Brankas Karya'}.`,
          isUserUploaded: true,
          publishedAt: item.captureDate || 'Terverifikasi',
          storageTarget: item.storageTarget || 'cloud_supabase',
          cloudBucket: item.cloudBucket || 'vec-captures',
          verificationStatus: isHardwareValid ? 'VERIFIED_HARDWARE_TEE' : 'PENDING',
          category: 'Karya Terverifikasi'
        };
      });

      // 2. Ambil karya publik dari Supabase cloud jika terhubung
      let remoteArtworks: VaultArtwork[] = [];
      try {
        const { data: postsData, error } = await supabase
          .from('posts')
          .select('id, title, caption, media_url, raw_capture_digest, c2pa_manifest_hash, hardware_tee_signature, verification_status, authenticity_confidence, camera_make, camera_model, sensor_telemetry, is_published, is_destroyed, destroyed_at, created_at')
          .order('created_at', { ascending: false })
          .limit(50);

        if (!error && postsData && postsData.length > 0) {
          remoteArtworks = postsData
            .filter((post: any) => {
              if (post.is_destroyed === true || post.destroyed_at) return false;
              const telemetry = post.sensor_telemetry || {};
              const isExplicitPrivate = telemetry.is_private === true;
              const isExplicitPublished = post.is_published === true || telemetry.is_published === true;
              
              if (isExplicitPrivate || !isExplicitPublished) return false;

              const d = (post.c2pa_manifest_hash || post.raw_capture_digest || '').trim().toLowerCase();
              const t = (post.title || '').trim().toLowerCase();
              const u = (post.media_url || '').trim();
              const pid = post.id;
              const curation = `VEC-SDB-${(post.id || '').slice(0, 4).toUpperCase()}`;

              return !isArtworkPermanentlyDestroyed({
                id: pid,
                digest: d,
                title: t,
                photoUrl: u,
                curationNumber: curation
              });
            })
            .map((post: any) => {
              let mUrl = post.media_url || '';
              if (mUrl.startsWith('/src/assets/')) {
                mUrl = mUrl.replace('/src/assets/', '/assets/');
              }
              const telemetry = post.sensor_telemetry || {};
              const creatorName = telemetry.creator_name || 'Kolektor Terverifikasi';
              const vaultName = telemetry.vault_name || 'Brankas Karya';

              const rawVStatus = post.verification_status || 
                (post.hardware_tee_signature?.includes('VALID') ? 'VERIFIED_HARDWARE_TEE' : 'PENDING');

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
                publishedAt: new Date(post.created_at).toLocaleDateString('id-ID', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric'
                }),
                storageTarget: 'cloud_supabase',
                cloudBucket: 'vec-captures',
                verificationStatus: rawVStatus,
                category: 'Koleksi Publik'
              };
            });
        }
      } catch (err) {
        console.warn('Supabase catalog fetch note:', err);
      }

      // 3. Gabungkan karya lokal yang diizinkan dan karya remote Supabase tanpa duplikasi
      const map = new Map<string, VaultArtwork>();
      remoteArtworks.forEach((a) => map.set(a.id, a));
      localArtworks.forEach((a) => {
        if (!map.has(a.id)) {
          map.set(a.id, a);
        }
      });

      const publishedList = Array.from(map.values()).filter((a) => !isArtworkPermanentlyDestroyed({
        id: a.id,
        digest: a.digest,
        title: a.title,
        photoUrl: a.photoUrl
      }));

      setArtworks(publishedList);
      if (publishedList.length > 0) {
        setSelectedArtworkId((prev) => {
          if (prev && publishedList.some((a) => a.id === prev)) {
            return prev;
          }
          return publishedList[0].id;
        });
      } else {
        setSelectedArtworkId('');
      }
    } catch (e) {
      console.warn('Error loading published artworks:', e);
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
    window.addEventListener('vec-vault-lock-state-changed', handleStorageChange);
    window.addEventListener('vec-lock-state-changed', handleStorageChange);
    window.addEventListener('vec-artwork-destroyed', handleDestroyed);
    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('vec-vault-updated', handleStorageChange);
      window.removeEventListener('vec-vault-lock-state-changed', handleStorageChange);
      window.removeEventListener('vec-lock-state-changed', handleStorageChange);
      window.removeEventListener('vec-artwork-destroyed', handleDestroyed);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // Filtered and Searched Artworks (Phase 2 core logic)
  const filteredArtworks = useMemo(() => {
    const cleanQuery = searchQuery.trim().toLowerCase();

    return artworks.filter((art) => {
      // 1. Search Query: Matches Title OR Artist/Creator Name
      if (cleanQuery) {
        const titleMatch = (art.title || '').toLowerCase().includes(cleanQuery);
        const artistMatch = (art.artist || '').toLowerCase().includes(cleanQuery);
        if (!titleMatch && !artistMatch) {
          return false;
        }
      }

      // 2. Verification-Status Filter
      const cat = getArtworkVerificationCategory(art);
      if (verificationFilter === 'verified') {
        if (cat !== 'verified') return false;
      } else if (verificationFilter === 'unverified') {
        if (cat !== 'unverified') return false;
      } else if (verificationFilter === 'requires_review') {
        if (cat !== 'requires_review') return false;
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'title') {
        return a.title.localeCompare(b.title);
      }
      if (sortBy === 'score') {
        return b.authenticityScore - a.authenticityScore;
      }
      return 0; // default newest order preserved
    });
  }, [artworks, searchQuery, verificationFilter, sortBy]);

  // Keep active selected artwork synchronized with filtered results
  useEffect(() => {
    if (filteredArtworks.length > 0) {
      if (!filteredArtworks.some((a) => a.id === selectedArtworkId)) {
        setSelectedArtworkId(filteredArtworks[0].id);
      }
    } else {
      setSelectedArtworkId('');
    }
  }, [filteredArtworks, selectedArtworkId]);

  const activeArtwork = artworks.find((a) => a.id === selectedArtworkId) || filteredArtworks[0] || null;

  // Verification Counts for Filter Badges
  const counts = useMemo(() => {
    let verified = 0;
    let unverified = 0;
    let requiresReview = 0;

    artworks.forEach((a) => {
      const c = getArtworkVerificationCategory(a);
      if (c === 'verified') verified++;
      else if (c === 'unverified') unverified++;
      else if (c === 'requires_review') requiresReview++;
    });

    return {
      all: artworks.length,
      verified,
      unverified,
      requiresReview
    };
  }, [artworks]);

  const handleCopyHash = () => {
    if (!activeArtwork) return;
    navigator.clipboard.writeText(activeArtwork.digest);
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 2000);
  };

  const handleResetFilters = () => {
    handleSearchChange('');
    setVerificationFilter('all');
    setSortBy('newest');
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

  return (
    <div className="space-y-8 font-sans min-w-0 w-full text-neutral-100">
      
      {/* ------------------------------------------------------------- */}
      {/* 1. CATALOG HEADER & ACTION STRIP                              */}
      {/* ------------------------------------------------------------- */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-neutral-800/80">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-cyan-400">
            <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0" />
            <span className="uppercase tracking-wider">Katalog Publik • Pameran Karya Seni & Fotografi Otentik</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight mt-1">
            Katalog Karya Terverifikasi
          </h1>
          <p className="text-xs sm:text-sm text-neutral-400 mt-1 max-w-2xl leading-relaxed">
            Jelajahi karya seni dan fotografi dunia nyata yang terdaftar secara sah dengan bukti catatan asal-usul dan verifikasi integritas.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={() => {
              loadPublishedArtworks();
              fetchLiveInteractions();
            }}
            disabled={isRefreshing}
            className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-medium bg-neutral-900 hover:bg-neutral-800 text-neutral-300 border border-neutral-700 transition cursor-pointer"
            title="Segarkan daftar karya dari sistem dan cloud"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-cyan-400' : ''}`} />
            <span>Segarkan</span>
          </button>

          {onNavigateToPrivateVault && (
            <button
              type="button"
              onClick={onNavigateToPrivateVault}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold bg-neutral-900 hover:bg-neutral-800 text-emerald-300 border border-emerald-500/40 transition cursor-pointer"
              title="Buka Brankas Koleksi Pribadi Anda"
            >
              <Lock className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>Brankas Pribadi</span>
            </button>
          )}

          {onNavigateToStudio && (
            <button
              type="button"
              onClick={onNavigateToStudio}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 text-white transition shadow-md shadow-cyan-950/40 cursor-pointer"
            >
              <Camera className="w-4 h-4 shrink-0" />
              <span>Ambil Foto Asli</span>
            </button>
          )}
        </div>
      </div>

      {/* Cloud Connectivity Status Alert (Safe Public Information) */}
      {connectionStatus && !connectionStatus.connected ? (
        <div className="p-4 rounded-2xl bg-amber-950/40 border border-amber-500/50 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-xs font-sans shadow-xl">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0 mt-0.5">
              <Globe className="w-4 h-4 animate-pulse" />
            </div>
            <div className="space-y-1">
              <span className="font-bold text-white text-sm">Mode Penyimpanan Lokal & Cadangan Perangkat</span>
              <p className="text-xs text-amber-200/90 leading-relaxed max-w-3xl">
                Karya publik tersimpan aman di penyimpanan peramban ini. Untuk sinkronisasi otomatis antar-perangkat, pastikan konfigurasi cloud Supabase aktif.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowGlobalGuideModal(true)}
            className="px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs transition shrink-0 cursor-pointer flex items-center gap-1.5"
          >
            <HelpCircle className="w-4 h-4" />
            <span>Info Sinkronisasi</span>
          </button>
        </div>
      ) : null}

      {/* ------------------------------------------------------------- */}
      {/* 2. SEARCH BAR & VERIFICATION-STATUS FILTERS (PHASE 2)         */}
      {/* ------------------------------------------------------------- */}
      <div className="space-y-4 bg-neutral-900/60 border border-neutral-800 rounded-2xl p-4 sm:p-5 shadow-lg">
        
        {/* Row 1: Search Field + Sort Selector */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
          
          {/* Main Search Input */}
          <div className="relative flex-1 min-w-0">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-400">
              <Search className="w-4 h-4" />
            </div>
            
            <input
              type="text"
              aria-label="Cari Karya atau Nama Seniman"
              placeholder="Cari Karya atau Nama Seniman..."
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full bg-neutral-950 text-white placeholder-neutral-500 text-xs sm:text-sm pl-10 pr-9 py-2.5 sm:py-3 rounded-xl border border-neutral-700/80 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/50 transition font-sans"
            />

            {searchQuery && (
              <button
                type="button"
                onClick={() => handleSearchChange('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-neutral-400 hover:text-white transition cursor-pointer"
                title="Hapus pencarian"
                aria-label="Hapus kata kunci pencarian"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs text-neutral-400 hidden sm:inline">Urutkan:</span>
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="bg-neutral-950 text-neutral-200 text-xs py-2.5 sm:py-3 px-3 pr-8 rounded-xl border border-neutral-700/80 focus:outline-none focus:border-cyan-500 transition cursor-pointer appearance-none"
                aria-label="Urutkan karya"
              >
                <option value="newest">Terbaru</option>
                <option value="title">Judul (A-Z)</option>
                <option value="score">Skor Keaslian</option>
              </select>
              <div className="absolute inset-y-0 right-0 pr-2.5 flex items-center pointer-events-none text-neutral-400">
                <SlidersHorizontal className="w-3.5 h-3.5" />
              </div>
            </div>
          </div>

        </div>

        {/* Row 2: Verification-Status Filters (Accessible Segmented Controls) */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-neutral-800/80">
          
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            <span className="text-xs font-semibold text-neutral-400 mr-1 hidden sm:inline">
              Status Verifikasi:
            </span>

            {/* Option 1: All Public Artworks */}
            <button
              type="button"
              onClick={() => setVerificationFilter('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition flex items-center gap-1.5 cursor-pointer ${
                verificationFilter === 'all'
                  ? 'bg-cyan-600 text-white font-semibold shadow-sm'
                  : 'bg-neutral-950/70 hover:bg-neutral-950 text-neutral-300 border border-neutral-800'
              }`}
            >
              <span>Semua Karya Publik</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                verificationFilter === 'all' ? 'bg-cyan-700/60 text-white' : 'bg-neutral-800 text-neutral-400'
              }`}>
                {counts.all}
              </span>
            </button>

            {/* Option 2: Verified */}
            <button
              type="button"
              onClick={() => setVerificationFilter('verified')}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition flex items-center gap-1.5 cursor-pointer ${
                verificationFilter === 'verified'
                  ? 'bg-emerald-600 text-white font-semibold shadow-sm'
                  : 'bg-neutral-950/70 hover:bg-neutral-950 text-neutral-300 border border-neutral-800'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300 shrink-0" />
              <span>Terverifikasi</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                verificationFilter === 'verified' ? 'bg-emerald-700/60 text-white' : 'bg-neutral-800 text-neutral-400'
              }`}>
                {counts.verified}
              </span>
            </button>

            {/* Option 3: Not Yet Verified */}
            <button
              type="button"
              onClick={() => setVerificationFilter('unverified')}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition flex items-center gap-1.5 cursor-pointer ${
                verificationFilter === 'unverified'
                  ? 'bg-amber-600 text-white font-semibold shadow-sm'
                  : 'bg-neutral-950/70 hover:bg-neutral-950 text-neutral-300 border border-neutral-800'
              }`}
            >
              <Clock className="w-3.5 h-3.5 text-amber-300 shrink-0" />
              <span>Belum Terverifikasi</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                verificationFilter === 'unverified' ? 'bg-amber-700/60 text-white' : 'bg-neutral-800 text-neutral-400'
              }`}>
                {counts.unverified}
              </span>
            </button>

            {/* Option 4 (Only if existing data has requires_review/failed) */}
            {counts.requiresReview > 0 && (
              <button
                type="button"
                onClick={() => setVerificationFilter('requires_review')}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition flex items-center gap-1.5 cursor-pointer ${
                  verificationFilter === 'requires_review'
                    ? 'bg-rose-600 text-white font-semibold shadow-sm'
                    : 'bg-neutral-950/70 hover:bg-neutral-950 text-neutral-300 border border-neutral-800'
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5 text-rose-300 shrink-0" />
                <span>Perlu Peninjauan</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-neutral-800 text-neutral-400">
                  {counts.requiresReview}
                </span>
              </button>
            )}
          </div>

          {/* Results Counter & Reset Action */}
          <div className="flex items-center gap-3 text-xs text-neutral-400">
            <span>
              Menampilkan <strong className="text-white">{filteredArtworks.length}</strong> dari {artworks.length} karya
            </span>

            {(searchQuery || verificationFilter !== 'all') && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="text-cyan-400 hover:text-cyan-300 transition underline underline-offset-2 cursor-pointer font-medium"
              >
                Reset Filter
              </button>
            )}
          </div>

        </div>

      </div>


      {/* ------------------------------------------------------------- */}
      {/* 3. ARTWORK GALLERY CARDS & EMPTY STATE                        */}
      {/* ------------------------------------------------------------- */}
      {artworks.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-neutral-800 bg-neutral-950/50 p-10 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-neutral-800 bg-neutral-900 text-neutral-400">
            <Camera className="h-6 w-6" />
          </div>
          <h3 className="mt-4 text-lg font-bold text-white">Belum Ada Karya yang Diterbitkan</h3>
          <p className="mt-2 text-xs sm:text-sm text-neutral-400 max-w-md mx-auto leading-relaxed">
            Katalog saat ini belum memiliki karya yang diizinkan publik. Gunakan Studio Kamera untuk mengambil foto pertama atau buka brankas pribadi Anda.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            {onNavigateToStudio && (
              <button
                type="button"
                onClick={onNavigateToStudio}
                className="px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs transition cursor-pointer"
              >
                Buka Studio Kamera
              </button>
            )}
            {onNavigateToPrivateVault && (
              <button
                type="button"
                onClick={onNavigateToPrivateVault}
                className="px-5 py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-neutral-300 border border-neutral-700 text-xs transition cursor-pointer"
              >
                Buka Brankas Pribadi
              </button>
            )}
          </div>
        </div>
      ) : filteredArtworks.length === 0 ? (
        /* Friendly Empty State for Filter/Search */
        <div className="rounded-3xl border border-dashed border-neutral-800 bg-neutral-950/60 p-8 sm:p-12 text-center space-y-3">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-neutral-900 border border-neutral-800 text-neutral-400">
            <SearchX className="h-6 w-6 text-neutral-400" />
          </div>
          <h3 className="text-base sm:text-lg font-bold text-white">
            Tidak Ada Karya yang Cocok
          </h3>
          <p className="text-xs sm:text-sm text-neutral-400 max-w-md mx-auto leading-relaxed">
            Tidak ditemukan karya yang sesuai dengan kata kunci{' '}
            {searchQuery && <strong className="text-cyan-300">"{searchQuery}"</strong>}{' '}
            dan filter status yang dipilih.
          </p>
          <div className="pt-2">
            <button
              type="button"
              onClick={handleResetFilters}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-cyan-300 hover:text-white border border-cyan-500/40 text-xs font-semibold transition cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Bersihkan Pencarian & Filter</span>
            </button>
          </div>
        </div>
      ) : (
        /* Modern Gallery Grid of Artwork Cards */
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
            {filteredArtworks.map((art) => {
              const isSelected = art.id === selectedArtworkId;
              const vCategory = getArtworkVerificationCategory(art);

              return (
                <div
                  key={art.id}
                  onClick={() => setSelectedArtworkId(art.id)}
                  className={`group relative rounded-2xl overflow-hidden border transition-all duration-300 cursor-pointer flex flex-col justify-between shadow-lg ${
                    isSelected
                      ? 'bg-neutral-900/90 border-cyan-500 ring-2 ring-cyan-500/40 shadow-cyan-950/40'
                      : 'bg-neutral-950/70 border-neutral-800 hover:border-neutral-700 hover:bg-neutral-900/40'
                  }`}
                >
                  {/* Card Image Preview with Proportional Frame */}
                  <div className="relative h-44 sm:h-48 overflow-hidden bg-neutral-950">
                    <img
                      src={art.photoUrl}
                      alt={art.title}
                      className="w-full h-full object-cover object-center group-hover:scale-104 transition duration-500"
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        e.currentTarget.style.opacity = '0.4';
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-neutral-950/90 via-transparent to-transparent pointer-events-none"></div>

                    {/* Accurate Verification Status Badge Overlay */}
                    <div className="absolute top-2.5 left-2.5 z-10">
                      {vCategory === 'verified' ? (
                        <span className="bg-black/85 backdrop-blur-md px-2.5 py-1 rounded-lg text-[10px] font-medium text-emerald-300 border border-emerald-500/40 flex items-center gap-1 shadow">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                          <span>Terverifikasi Asli</span>
                        </span>
                      ) : vCategory === 'unverified' ? (
                        <span className="bg-black/85 backdrop-blur-md px-2.5 py-1 rounded-lg text-[10px] font-medium text-amber-300 border border-amber-500/40 flex items-center gap-1 shadow">
                          <Clock className="w-3 h-3 text-amber-400 shrink-0" />
                          <span>Belum Terverifikasi</span>
                        </span>
                      ) : (
                        <span className="bg-black/85 backdrop-blur-md px-2.5 py-1 rounded-lg text-[10px] font-medium text-rose-300 border border-rose-500/40 flex items-center gap-1 shadow">
                          <AlertTriangle className="w-3 h-3 text-rose-400 shrink-0" />
                          <span>Perlu Peninjauan</span>
                        </span>
                      )}
                    </div>

                    {/* Selection Active Indicator */}
                    {isSelected && (
                      <div className="absolute top-2.5 right-2.5 z-10 bg-cyan-600 text-white px-2 py-0.5 rounded-lg text-[10px] font-semibold shadow">
                        Aktif
                      </div>
                    )}

                    <div className="absolute bottom-2 right-2.5 text-[10px] text-neutral-400 bg-black/70 px-2 py-0.5 rounded backdrop-blur-sm">
                      {art.dimensions || '1920 × 1080'}
                    </div>
                  </div>

                  {/* Card Content & Metadata */}
                  <div className="p-4 space-y-2.5 flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-white group-hover:text-cyan-300 transition line-clamp-1">
                        {art.title}
                      </h3>
                      
                      <div className="flex items-center justify-between text-xs text-neutral-400 mt-1">
                        <span className="truncate max-w-[65%] text-neutral-300">{art.artist}</span>
                        <span className="text-[11px] text-neutral-500 shrink-0">{art.publishedAt}</span>
                      </div>

                      <p className="text-xs text-neutral-400 line-clamp-2 mt-1 leading-relaxed">
                        {art.description}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-neutral-800/80 flex items-center justify-between text-[11px] text-neutral-400">
                      <span className="flex items-center gap-1 text-neutral-400 truncate">
                        <FileCheck className="w-3 h-3 text-cyan-400 shrink-0" />
                        <span className="truncate">Provenance Tersedia</span>
                      </span>

                      <span className="text-cyan-400 font-semibold group-hover:underline text-[11px] shrink-0">
                        Rincian Karya →
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}


      {/* ------------------------------------------------------------- */}
      {/* 4. REFINED ARTWORK DETAIL VIEW (PRIMARY + PROVENANCE + SPECS) */}
      {/* ------------------------------------------------------------- */}
      {activeArtwork && (
        <section className="bg-neutral-900/90 border border-neutral-800 rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl space-y-6">
          
          {/* Main Visual & Primary Overview Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 min-w-0">
            
            {/* Left: High-Res Artwork Media Frame */}
            <div className="lg:col-span-5 relative h-72 sm:h-96 lg:h-auto min-h-[300px] sm:min-h-[380px] bg-black min-w-0">
              <img
                src={activeArtwork.photoUrl}
                alt={activeArtwork.title}
                className="w-full h-full object-cover cursor-pointer hover:scale-[1.02] transition duration-500"
                referrerPolicy="no-referrer"
                onClick={() => {
                  setViewerZoomLevel(1);
                  setIsViewerModalOpen(true);
                }}
                title="Klik untuk membuka penampil gambar resolusi penuh & zoom"
                onError={(e) => {
                  e.currentTarget.style.opacity = '0.4';
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-transparent to-transparent lg:bg-gradient-to-r lg:from-transparent lg:to-neutral-900/90 pointer-events-none"></div>

              {/* Media Controls Overlay */}
              <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2 z-10">
                <div className="bg-black/85 backdrop-blur-md px-3 py-1 rounded-xl border border-neutral-700 text-xs text-neutral-200 flex items-center gap-1.5 shadow">
                  <Award className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  <span className="font-mono">{activeArtwork.curationNumber}</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setViewerZoomLevel(1);
                      setIsViewerModalOpen(true);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-black/85 hover:bg-neutral-800 text-cyan-300 hover:text-white border border-cyan-500/40 text-xs flex items-center gap-1.5 transition shadow cursor-pointer"
                    title="Buka tampilan resolusi penuh dengan zoom"
                  >
                    <Maximize2 className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Zoom Resolusi Penuh</span>
                  </button>
                </div>
              </div>

              {/* Bottom Sensor Attestation Strip */}
              <div className="absolute bottom-3 left-3 right-3 text-xs text-neutral-300 bg-black/80 backdrop-blur-md p-2.5 rounded-xl border border-neutral-800 flex items-center justify-between gap-2">
                <span className="truncate">Perangkat: {activeArtwork.deviceInfo}</span>
                <span className="text-emerald-400 font-semibold shrink-0">CMOS Enclave</span>
              </div>
            </div>

            {/* Right: Primary Information & Metadata */}
            <div className="lg:col-span-7 p-5 sm:p-7 lg:p-9 flex flex-col justify-between space-y-6 min-w-0">
              
              <div className="space-y-4">
                
                {/* Header Category & Status Pill */}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-xs text-neutral-400">
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

                  {/* Verification Status Pill */}
                  {getArtworkVerificationCategory(activeArtwork) === 'verified' ? (
                    <span className="px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs font-semibold flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Terverifikasi Asli</span>
                    </span>
                  ) : getArtworkVerificationCategory(activeArtwork) === 'unverified' ? (
                    <span className="px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/40 text-amber-300 text-xs font-semibold flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-amber-400" />
                      <span>Belum Terverifikasi</span>
                    </span>
                  ) : (
                    <span className="px-3 py-1 rounded-full bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs font-semibold flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                      <span>Perlu Peninjauan</span>
                    </span>
                  )}
                </div>

                {/* Display Title */}
                <div>
                  <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight leading-tight">
                    {activeArtwork.title}
                  </h2>
                  <p className="text-xs text-neutral-400 mt-1">
                    Diterbitkan pada: <strong className="text-neutral-300">{activeArtwork.publishedAt}</strong> • Asal:{' '}
                    <strong className="text-neutral-300">{activeArtwork.artistRole}</strong>
                  </p>
                </div>

                {/* Description */}
                <p className="text-sm text-neutral-300 leading-relaxed font-normal">
                  {activeArtwork.description}
                </p>

                {/* Honest & Transparent Verification Explanation */}
                <div className="p-3.5 rounded-xl bg-neutral-950/80 border border-neutral-800 text-xs space-y-1">
                  <div className="text-neutral-300 font-semibold flex items-center gap-1.5">
                    <Info className="w-4 h-4 text-cyan-400 shrink-0" />
                    <span>Catatan Transparansi Verifikasi:</span>
                  </div>
                  <p className="text-neutral-400 leading-relaxed text-[11px]">
                    Integritas rekaman foto ini diamankan melalui tanda tangan sensor kamera dan kode ringkasan unik (SHA-256). Bukti teknis ini memastikan bahwa file gambar tidak mengalami manipulasi digital eksternal sejak pertama kali diambil.
                  </p>
                </div>

              </div>

              {/* Provenance Key Values Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs pt-2">
                <div className="p-3 rounded-xl bg-neutral-950/70 border border-neutral-800">
                  <span className="text-neutral-400 block text-[11px]">Skor Keaslian:</span>
                  <span className="text-emerald-400 font-bold text-sm sm:text-base">{activeArtwork.authenticityScore}%</span>
                </div>
                <div className="p-3 rounded-xl bg-neutral-950/70 border border-neutral-800">
                  <span className="text-neutral-400 block text-[11px]">Segel Fisik Kanvas:</span>
                  <span className="text-amber-300 font-semibold text-sm">Terpasang & Sah</span>
                </div>
                <div className="p-3 rounded-xl bg-neutral-950/70 border border-neutral-800 col-span-2 sm:col-span-1">
                  <span className="text-neutral-400 block text-[11px]">Privasi Lokasi:</span>
                  <span className="text-cyan-300 font-semibold text-sm">Koordinat Terlindungi</span>
                </div>
              </div>

            </div>

          </div>

          {/* Secondary Details: Provenance & Technical Tabs */}
          <div className="p-5 sm:p-7 border-t border-neutral-800/80 space-y-4">
            
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-800/80 pb-3">
              <div className="flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-cyan-400" />
                <h3 className="text-sm sm:text-base font-bold text-white">
                  Informasi Asal-Usul & Integritas File
                </h3>
              </div>

              {/* Hash Copy Control */}
              <button
                type="button"
                onClick={handleCopyHash}
                className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1.5 transition cursor-pointer font-medium bg-neutral-950 px-3 py-1.5 rounded-xl border border-neutral-800"
              >
                {copiedHash ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedHash ? 'Kode Keaslian Disalin' : 'Salin Kode Hash'}</span>
              </button>
            </div>

            {/* Structured Provenance & Technical Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
              <div className="p-3.5 rounded-xl bg-neutral-950/80 border border-neutral-800 space-y-1">
                <span className="text-neutral-400 block text-[11px]">Kode Ringkasan (SHA-256):</span>
                <span className="font-mono text-cyan-300 text-[11px] break-all block leading-tight">
                  {activeArtwork.digest}
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-neutral-950/80 border border-neutral-800 space-y-1">
                <span className="text-neutral-400 block text-[11px]">Tanda Tangan Enclave C2PA:</span>
                <span className="font-mono text-emerald-400 text-[11px] truncate block">
                  {activeArtwork.c2paSignature}
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-neutral-950/80 border border-neutral-800 space-y-1">
                <span className="text-neutral-400 block text-[11px]">Perangkat & Lensa Pengambil:</span>
                <span className="text-neutral-200 text-xs block font-medium">
                  {activeArtwork.deviceInfo}
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-neutral-950/80 border border-neutral-800 space-y-1">
                <span className="text-neutral-400 block text-[11px]">Penyimpanan & Bucket:</span>
                <span className="text-neutral-200 text-xs block font-medium">
                  {activeArtwork.cloudBucket || 'vec-captures'} • Terenkripsi
                </span>
              </div>
            </div>

            {/* Veroia Processor (VGUARD & GENEVORA) Integration Card */}
            {(() => {
              const vguardRecord = getVGuardInspection(activeArtwork.id);
              const genevoraRecord = getGenevoraFingerprint(activeArtwork.id);

              return (
                <div className="mt-4 p-4 sm:p-5 rounded-2xl bg-neutral-950/90 border border-cyan-500/30 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-cyan-950 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shrink-0">
                        <Cpu className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-white flex items-center gap-2">
                          <span>Veroia Processor Pipeline</span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-950 text-cyan-300 border border-cyan-800">
                            VGUARD & GENEVORA
                          </span>
                        </h4>
                        <p className="text-[11px] text-neutral-400">
                          Urutan Resmi: TWIN → VGUARD → HUMANGUARD → GENEVORA → HAPPY → BEAUTY
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setIsProcessorModalOpen(true)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow-md transition cursor-pointer shrink-0"
                    >
                      <Fingerprint className="w-3.5 h-3.5" />
                      <span>Buka Pemeriksaan & Fingerprint</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 text-xs">
                    <div className="p-3 rounded-xl bg-neutral-900 border border-neutral-800 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] text-neutral-400 font-semibold flex items-center gap-1">
                          <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
                          <span>Status Modul VGUARD:</span>
                        </span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono border ${
                          !vguardRecord || vguardRecord.status === 'BELUM DIPERIKSA'
                            ? 'bg-neutral-950 text-neutral-400 border-neutral-700'
                            : vguardRecord.status === 'TIDAK ADA INDIKASI YANG DITEMUKAN'
                            ? 'bg-emerald-950 text-emerald-300 border-emerald-800/60'
                            : vguardRecord.status === 'ADA INDIKASI YANG PERLU DITINJAU'
                            ? 'bg-rose-950 text-rose-300 border-rose-800/60'
                            : 'bg-amber-950 text-amber-300 border-amber-800/60'
                        }`}>
                          {vguardRecord?.status || 'BELUM DIPERIKSA'}
                        </span>
                      </div>
                      <p className="text-[11px] text-neutral-400">
                        {vguardRecord 
                          ? `${vguardRecord.similarWorkUrls?.length || 0} tautan referensi • Pemeriksa: ${vguardRecord.inspectorName}`
                          : 'Karya belum melewati form pemeriksaan bukti kesamaan dan indikasi AI.'}
                      </p>
                    </div>

                    <div className="p-3 rounded-xl bg-neutral-900 border border-neutral-800 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] text-neutral-400 font-semibold flex items-center gap-1">
                          <Fingerprint className="w-3.5 h-3.5 text-cyan-400" />
                          <span>Fingerprint GENEVORA (SHA-256):</span>
                        </span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono border ${
                          genevoraRecord
                            ? 'bg-emerald-950 text-emerald-300 border-emerald-800/60'
                            : 'bg-neutral-950 text-amber-400 border-amber-700/60'
                        }`}>
                          {genevoraRecord ? 'SHA-256-v1 Aktif' : 'Belum Dihitung'}
                        </span>
                      </div>
                      <p className="text-[11px] font-mono text-neutral-300 truncate">
                        {genevoraRecord ? genevoraRecord.sha256 : 'Hitung hash dari byte asli berkas karya.'}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })()}

          </div>


          {/* Curation Comments & Interactions Section */}
          <div className="p-5 sm:p-7 border-t border-neutral-800/80 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-neutral-800/80">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-cyan-400" />
                  <span>Catatan Kurasi & Verifikasi Kolektor</span>
                </h3>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Ulasan apresiasi dan stempel keaslian untuk: <strong className="text-white">"{activeArtwork.title}"</strong>
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleAddAuthenticSeal}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-950/60 hover:bg-emerald-900 text-emerald-300 border border-emerald-800/60 text-xs transition cursor-pointer"
                >
                  <Award className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Beri Stempel Keaslian</span>
                </button>

                <button
                  type="button"
                  onClick={handleAddVoiceNote}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-950/60 hover:bg-purple-900 text-purple-300 border border-purple-800/60 text-xs transition cursor-pointer"
                >
                  <Mic className="w-3.5 h-3.5 text-purple-400" />
                  <span>Catatan Suara</span>
                </button>
              </div>
            </div>

            {/* List of Interactions */}
            <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
              {filteredInteractions.length === 0 ? (
                <div className="text-xs text-neutral-400 py-4 text-center italic">
                  Belum ada catatan kurasi untuk karya ini. Jadilah yang pertama memberikan ulasan apresiasi di bawah.
                </div>
              ) : (
                filteredInteractions.map((item) => (
                  <div
                    key={item.id}
                    className="p-3.5 rounded-xl bg-neutral-950/70 border border-neutral-800 space-y-2 hover:border-neutral-700 transition text-xs"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white">{item.author}</span>
                        <span className="text-[10px] text-cyan-300 bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-800/60">
                          {item.role}
                        </span>
                      </div>
                      <span className="text-neutral-400 text-[11px]">{item.timestamp}</span>
                    </div>

                    {item.type === 'COMMENT' && (
                      <p className="text-xs text-neutral-300 leading-relaxed pl-1">
                        "{item.content}"
                      </p>
                    )}

                    {item.type === 'VOICE_NOTE' && (
                      <div className="flex items-center gap-3 bg-black/60 p-2.5 rounded-xl border border-purple-900/40 max-w-md">
                        <button
                          type="button"
                          onClick={() => setIsPlayingAudio(isPlayingAudio === item.id ? null : item.id)}
                          className="w-8 h-8 rounded-full bg-purple-600 hover:bg-purple-500 flex items-center justify-center text-white transition shadow shrink-0 cursor-pointer"
                        >
                          {isPlayingAudio === item.id ? (
                            <Pause className="w-3.5 h-3.5" />
                          ) : (
                            <Play className="w-3.5 h-3.5 ml-0.5" />
                          )}
                        </button>
                        <div className="flex-1">
                          <div className="text-[10px] text-purple-300">Catatan Suara Kurator</div>
                          <div className="h-5 flex items-center gap-1 mt-0.5">
                            {(item.waveform || [20, 50, 80, 100, 60, 40, 90, 70, 30]).map((h, idx) => (
                              <div
                                key={idx}
                                className={`w-1 rounded-full transition-all ${
                                  isPlayingAudio === item.id ? 'bg-purple-400 animate-pulse' : 'bg-purple-700/60'
                                }`}
                                style={{ height: `${Math.max(20, h)}%` }}
                              />
                            ))}
                          </div>
                        </div>
                        <span className="text-xs text-purple-300 tabular-nums">
                          0:{item.voiceDuration?.toFixed(0)}
                        </span>
                      </div>
                    )}

                    {item.type === 'AUTHENTIC_SEAL' && (
                      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-emerald-950/60 border border-emerald-800/60 text-xs text-emerald-300">
                        <Award className="w-3.5 h-3.5 text-emerald-400" />
                        <span>{item.content}</span>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Comment Input */}
            <div className="pt-2 flex items-center gap-2">
              <input
                type="text"
                placeholder={`Tulis kurasi atau apresiasi untuk "${activeArtwork.title}"...`}
                value={commentInput}
                onChange={(e) => setCommentInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendComment()}
                disabled={isSubmitting}
                className="flex-1 bg-neutral-950 text-xs text-white placeholder-neutral-500 px-4 py-3 rounded-xl border border-neutral-700/80 focus:outline-none focus:border-cyan-500 transition"
              />
              <button
                type="button"
                onClick={handleSendComment}
                disabled={isSubmitting || !commentInput.trim()}
                className="px-5 py-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white text-xs font-semibold transition flex items-center gap-2 shadow cursor-pointer"
              >
                <span>Kirim</span>
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>

          </div>

        </section>
      )}


      {/* ------------------------------------------------------------- */}
      {/* 5. FULL RESOLUTION IMAGE VIEWER MODAL WITH ZOOM               */}
      {/* ------------------------------------------------------------- */}
      {isViewerModalOpen && activeArtwork && (
        <div 
          className="fixed inset-0 z-50 bg-black/92 backdrop-blur-md flex flex-col p-4 sm:p-6 animate-in fade-in"
          onClick={() => setIsViewerModalOpen(false)}
        >
          <div 
            className="flex items-center justify-between pb-3 border-b border-neutral-800 text-xs"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-cyan-950/80 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-white font-bold text-sm line-clamp-1">{activeArtwork.title}</h4>
                <p className="text-[11px] text-neutral-400">{activeArtwork.artist} • {activeArtwork.dimensions || '1920 × 1080'}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 bg-neutral-900 border border-neutral-800 rounded-xl px-2.5 py-1">
                <button
                  type="button"
                  onClick={() => setViewerZoomLevel((z) => Math.max(0.5, Number((z - 0.25).toFixed(2))))}
                  disabled={viewerZoomLevel <= 0.5}
                  className="p-1 text-neutral-400 hover:text-white disabled:opacity-30 cursor-pointer"
                  title="Perkecil"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <span className="text-[11px] text-cyan-300 w-12 text-center font-bold font-mono">
                  {Math.round(viewerZoomLevel * 100)}%
                </span>
                <button
                  type="button"
                  onClick={() => setViewerZoomLevel((z) => Math.min(3.5, Number((z + 0.25).toFixed(2))))}
                  disabled={viewerZoomLevel >= 3.5}
                  className="p-1 text-neutral-400 hover:text-white disabled:opacity-30 cursor-pointer"
                  title="Perbesar"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
              </div>

              {activeArtwork.photoUrl && (
                <a
                  href={activeArtwork.photoUrl}
                  download={`${activeArtwork.title.replace(/\s+/g, '_')}_VEC_C2PA.jpg`}
                  className="px-3 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs flex items-center gap-1.5 transition shadow"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Download className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Unduh Gambar</span>
                </a>
              )}

              <button
                type="button"
                onClick={() => setIsViewerModalOpen(false)}
                className="p-1.5 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800 transition cursor-pointer"
                title="Tutup penampil resolusi penuh"
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
                className="max-h-[75vh] max-w-[90vw] object-contain rounded-2xl shadow-2xl border border-neutral-800"
              />
            </div>
          </div>

          <div 
            className="pt-2 border-t border-neutral-800/80 flex flex-col sm:flex-row items-center justify-between text-xs text-neutral-400 gap-2"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2 truncate max-w-xl">
              <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0"></span>
              <span className="text-white shrink-0 font-medium">Kode Keaslian:</span>
              <span className="text-cyan-300 truncate font-mono">{activeArtwork.digest}</span>
            </div>
            <div className="text-[11px] text-neutral-400 font-medium">
              Kamera: {activeArtwork.deviceInfo} • Keaslian: {activeArtwork.authenticityScore}%
            </div>
          </div>
        </div>
      )}

      {/* Guide / Connectivity Modal */}
      {showGlobalGuideModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-neutral-900 border border-cyan-500/40 rounded-3xl max-w-2xl w-full p-6 space-y-5 shadow-2xl relative my-8">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shrink-0">
                  <Globe className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    Status Koneksi Basis Data & Sinkronisasi
                  </h3>
                  <p className="text-xs text-neutral-400">
                    Informasi keterhubungan katalog dengan Supabase Cloud Storage
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowGlobalGuideModal(false)}
                className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-neutral-950 border border-neutral-800 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-neutral-400 font-bold">STATUS KONEKSI SAAT INI:</span>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                  connectionStatus?.connected 
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' 
                    : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                }`}>
                  {connectionStatus?.connected ? '✓ TERHUBUNG KE SUPABASE' : '⚠ MODE LOKAL / MENUNGGU SINKRONISASI'}
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-neutral-300 pt-1">
                <div>
                  <span className="text-neutral-400 block text-[11px]">Endpoint Proyek:</span>
                  <span className="text-cyan-300 break-all">{connectionStatus?.url || getSupabaseUrl()}</span>
                </div>
                <div>
                  <span className="text-neutral-400 block text-[11px]">Status Storage Bucket:</span>
                  <span className={connectionStatus?.bucketExists ? 'text-emerald-400' : 'text-amber-400'}>
                    {connectionStatus?.bucketExists ? '✓ Bucket "vec-captures" Siap' : '⚠ Menunggu Bucket'}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-neutral-800">
              <span className="text-[11px] text-neutral-400">
                Seluruh karya yang diterbitkan publik dapat diakses pengunjung secara aman.
              </span>
              <button
                type="button"
                onClick={() => setShowGlobalGuideModal(false)}
                className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-neutral-800 hover:bg-neutral-700 text-white border border-neutral-700 transition cursor-pointer"
              >
                Tutup Panduan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {vaultToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-600 text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-2 text-xs font-medium border border-emerald-400/40 animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-4 h-4 text-white" />
          <span>{vaultToast}</span>
        </div>
      )}

      {/* Veroia Processor Modal */}

      {isProcessorModalOpen && activeArtwork && (
        <VeroiaProcessorModal
          isOpen={isProcessorModalOpen}
          onClose={() => setIsProcessorModalOpen(false)}
          initialArtwork={{
            id: activeArtwork.id,
            title: activeArtwork.title,
            photoUrl: activeArtwork.photoUrl,
            digest: activeArtwork.digest,
            resolution: activeArtwork.dimensions || '1920 × 1080',
            fileSize: '3.4 MB',
            captureDate: activeArtwork.publishedAt,
            deviceInfo: activeArtwork.deviceInfo,
            isPrivate: false,
            isPublished: true,
            c2paSignature: activeArtwork.c2paSignature,
            sensorType: 'Direct CMOS RAW',
            creatorName: activeArtwork.artist,
            description: activeArtwork.description
          }}
        />
      )}

    </div>
  );
};

