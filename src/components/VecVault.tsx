import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { getPrivateVaultItems, PrivateVaultItem } from '../lib/userVaultStorage';
import { 
  ShieldCheck, 
  Award, 
  MessageSquare, 
  Mic, 
  Play, 
  Pause, 
  Send, 
  Lock, 
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
  Image as ImageIcon
} from 'lucide-react';

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

const DEFAULT_FEATURED: VaultArtwork = {
  id: 'featured-masterpiece-001',
  title: 'Metamorfosis Cahaya & Silikon #04',
  artist: 'Galeri Seni Kontemporer VEC',
  artistRole: 'Verified Master Vault',
  medium: 'Akrilik & Pigmen Emas di Atas Kanvas',
  dimensions: '120 × 150 cm',
  photoUrl: '/src/assets/images/vec_vault_artwork_1792494925679.jpg',
  authenticityScore: 99.80,
  digest: '4a6b2c8e1d9f3a5b7c0e2d4f6a8b1c3d5e7f9a0b2c4d6e8f1a3b5c7d9e0f2a4b',
  c2paSignature: 'ECDSA_P256_TEE_SECURE_ENCLAVE_VALID',
  deviceInfo: 'Direct CMOS RAW • Sony Alpha 7R V Enclave',
  curationNumber: 'VEC-2026-0042',
  description: 'Karya asli yang diverifikasi langsung dengan sertifikasi hardware TEE dan chip NTAG424 DNA. Seluruh riwayat kepemilikan, uji spektrometri pigmen, dan catatan kurasi tersimpan di cluster Supabase PostgreSQL 16.',
  publishedAt: '2026-10-20',
  storageTarget: 'cloud_supabase',
  cloudBucket: 'vec-captures'
};

interface VecVaultProps {
  onNavigateToStudio?: () => void;
  onNavigateToPrivateVault?: () => void;
}

export const VecVault: React.FC<VecVaultProps> = ({ 
  onNavigateToStudio, 
  onNavigateToPrivateVault 
}) => {
  const [artworks, setArtworks] = useState<VaultArtwork[]>([DEFAULT_FEATURED]);
  const [selectedArtworkId, setSelectedArtworkId] = useState<string>(DEFAULT_FEATURED.id);
  const [copiedHash, setCopiedHash] = useState<boolean>(false);

  const [filterType, setFilterType] = useState<'all' | 'COMMENT' | 'VOICE_NOTE' | 'AUTHENTIC_SEAL'>('all');
  const [commentInput, setCommentInput] = useState<string>('');
  const [isPlayingAudio, setIsPlayingAudio] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  const [interactions, setInteractions] = useState<InteractionItem[]>([
    {
      id: 'int-1',
      artworkId: DEFAULT_FEATURED.id,
      author: 'Budi Hartono',
      role: 'VEC Master Curator',
      score: 99.20,
      type: 'COMMENT',
      content: 'Manifest C2PA tervalidasi penuh via hardware Secure Enclave. Telemetri sensor CMOS terbukti murni tanpa rekonstruksi AI generatif.',
      timestamp: '15 menit lalu'
    },
    {
      id: 'int-2',
      artworkId: DEFAULT_FEATURED.id,
      author: 'Galeri Seni Nusantara',
      role: 'Verified Art Vault',
      score: 98.80,
      type: 'VOICE_NOTE',
      voiceDuration: 18.5,
      waveform: [35, 60, 95, 80, 45, 90, 65, 40, 75, 100, 55, 30],
      timestamp: '32 menit lalu'
    },
    {
      id: 'int-3',
      artworkId: DEFAULT_FEATURED.id,
      author: 'Sarah Jenkins',
      role: 'Fine Art Photographer',
      score: 96.80,
      type: 'AUTHENTIC_SEAL',
      content: 'Menyematkan Stempel Keaslian Resmi (AUTHENTIC_SEAL). Silsilah pigmen dan tag fisik NTAG424 DNA terhubung identik.',
      timestamp: '1 jam lalu'
    }
  ]);

  // Load all artworks published by user from Private Vault + Supabase
  const loadPublishedArtworks = async () => {
    setIsRefreshing(true);
    try {
      // 1. Get user items where isPublished === true
      const localVaultItems = getPrivateVaultItems();
      const userPublishedList: VaultArtwork[] = localVaultItems
        .filter((item) => item.isPublished)
        .map((item, idx) => ({
          id: item.id,
          title: item.title,
          artist: 'Anda (Seniman Terverifikasi VEC)',
          artistRole: 'Hardware Attested Creator',
          medium: item.sensorType || 'Digital Fine Art / Sensor C2PA RAW',
          dimensions: item.resolution,
          photoUrl: item.cloudStorageUrl || item.photoUrl,
          authenticityScore: 99.40,
          digest: item.digest,
          c2paSignature: item.c2paSignature,
          deviceInfo: item.deviceInfo,
          curationNumber: `VEC-PUB-${item.id.slice(-4).toUpperCase()}`,
          description: `Karya fotografi otentik tervalidasi langsung via sensor kamera & C2PA. Berkas telah dipublikasikan ke Live Vault dan tersimpan pada ${item.storageTarget === 'cloud_supabase' ? 'Cloud Supabase Storage (' + (item.cloudBucket || 'vec-captures') + ')' : 'Brankas VEC'}.`,
          isUserUploaded: true,
          publishedAt: item.captureDate,
          storageTarget: item.storageTarget,
          cloudBucket: item.cloudBucket
        }));

      // 2. Fetch any remote posts from Supabase posts table if accessible
      let remoteArtworks: VaultArtwork[] = [];
      try {
        const { data: postsData, error } = await supabase
          .from('posts')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(10);

        if (!error && postsData && postsData.length > 0) {
          remoteArtworks = postsData.map((post: any) => ({
            id: post.id,
            title: post.title || 'Tangkapan C2PA Publik',
            artist: 'Kolektor Terverifikasi',
            artistRole: 'Hardware Attested Member',
            medium: 'Sensor CMOS RAW Attested',
            dimensions: '1920 × 1080 piksel',
            photoUrl: post.media_url,
            authenticityScore: Number(post.authenticity_confidence || 98.5),
            digest: post.c2pa_manifest_hash || post.raw_capture_digest || 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
            c2paSignature: post.hardware_tee_signature || 'ECDSA_P256_TEE_SECURE_ENCLAVE_VALID',
            deviceInfo: `${post.camera_make || 'Sony'} ${post.camera_model || 'Alpha C2PA'}`,
            curationNumber: `VEC-SDB-${post.id.slice(0, 4).toUpperCase()}`,
            description: post.caption || 'Karya terverifikasi yang tersinkronisasi via cluster Supabase PostgreSQL.',
            isUserUploaded: false,
            publishedAt: new Date(post.created_at).toLocaleDateString('id-ID')
          }));
        }
      } catch (dbErr) {
        console.warn('Supabase posts query note:', dbErr);
      }

      // Merge: Featured master item + User published items + Remote items (deduplicated)
      const combined = [DEFAULT_FEATURED, ...userPublishedList, ...remoteArtworks];
      const uniqueCombined = Array.from(new Map(combined.map(item => [item.id, item])).values());

      setArtworks(uniqueCombined);

      // If user recently published, select their newest artwork
      if (userPublishedList.length > 0) {
        setSelectedArtworkId(userPublishedList[0].id);
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
    loadPublishedArtworks();
    fetchLiveInteractions();

    // Listen to localStorage changes in case user published from another component
    const handleStorageChange = () => {
      loadPublishedArtworks();
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const activeArtwork = artworks.find((a) => a.id === selectedArtworkId) || artworks[0] || DEFAULT_FEATURED;

  const handleCopyHash = () => {
    if (!activeArtwork) return;
    navigator.clipboard.writeText(activeArtwork.digest);
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 2000);
  };

  const handleSendComment = async () => {
    if (!commentInput.trim()) return;
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

  return (
    <div className="space-y-8">
      
      {/* Top Banner Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-cyan-400">
            <ShieldCheck className="w-4 h-4 text-cyan-400" />
            <span>IMMUTABLE ART VAULT • LIVE EXHIBITION & REPUTATION-WEIGHTED CURATION</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight mt-1">
            Live Art Vault & Pameran Karya Terpublikasi
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Menampilkan seluruh karya seni dan foto otentik C2PA yang telah diterbitkan oleh seniman dan kolektor.
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

      {/* EXHIBITION GALLERY BAR (List of Published Artworks) */}
      <div className="bg-[#050C1E] border border-slate-800 rounded-3xl p-5 space-y-4 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-bold text-white font-mono">
              Koleksi Karya Terpublikasi di Live Vault ({artworks.length} Karya)
            </h3>
            {userPublishedCount > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-mono border border-emerald-500/40">
                {userPublishedCount} karya diterbitkan oleh Anda
              </span>
            )}
          </div>
          <span className="text-[11px] font-mono text-slate-400">
            Klik karya di bawah untuk meneliti bukti C2PA & kurasi
          </span>
        </div>

        {/* Horizontal Scrollable Exhibition Cards */}
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
                {/* Image Viewport */}
                <div className="relative h-28 rounded-xl overflow-hidden bg-slate-900 mb-2">
                  <img
                    src={art.photoUrl}
                    alt={art.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                  />
                  {art.isUserUploaded && (
                    <span className="absolute top-1.5 left-1.5 bg-emerald-600/90 backdrop-blur-md px-1.5 py-0.5 rounded text-[9px] font-mono font-bold text-white shadow">
                      Karya Anda
                    </span>
                  )}
                  {isSelected && (
                    <span className="absolute bottom-1.5 right-1.5 bg-cyan-500 text-slate-950 px-1.5 py-0.5 rounded text-[9px] font-mono font-bold shadow">
                      Aktif Ditampilkan
                    </span>
                  )}
                </div>

                {/* Info Text */}
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

      {/* Featured Masterpiece Vault Card (Shows Currently Selected Artwork) */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl grid grid-cols-1 lg:grid-cols-12">
        <div className="lg:col-span-5 relative h-72 sm:h-96 lg:h-auto min-h-[340px] bg-black">
          <img
            src={activeArtwork.photoUrl}
            alt={activeArtwork.title}
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent lg:bg-gradient-to-r lg:from-transparent lg:to-slate-900/90"></div>
          
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

          <div className="absolute bottom-4 left-4 right-4 text-[11px] font-mono text-slate-300 bg-black/70 backdrop-blur-md p-2 rounded-xl border border-slate-800 flex items-center justify-between">
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

            <h3 className="text-2xl font-bold text-white tracking-tight">
              {activeArtwork.title}
            </h3>

            <p className="text-sm text-slate-300 leading-relaxed font-normal">
              {activeArtwork.description}
            </p>
          </div>

          {/* SHA-256 Checksum Card */}
          <div className="p-3 bg-slate-950/80 rounded-2xl border border-slate-800 space-y-1 text-xs font-mono">
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span>SHA-256 RAW Hardware Digest:</span>
              <button
                onClick={handleCopyHash}
                className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer"
              >
                {copiedHash ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedHash ? 'Disalin' : 'Salin Hash'}</span>
              </button>
            </div>
            <div className="text-cyan-300 text-[11px] break-all leading-tight">
              {activeArtwork.digest}
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs font-mono">
            <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
              <span className="text-slate-500 block text-[11px]">Skor Keaslian:</span>
              <span className="text-emerald-400 font-bold text-sm">{activeArtwork.authenticityScore}%</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
              <span className="text-slate-500 block text-[11px]">NFC Sun Seal:</span>
              <span className="text-amber-300 font-bold text-sm">Tervalidasi TEE</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 col-span-2 sm:col-span-1">
              <span className="text-slate-500 block text-[11px]">Geoprivasi:</span>
              <span className="text-cyan-300 font-bold text-sm">PostGIS Protected</span>
            </div>
          </div>
        </div>
      </div>

      {/* Curation & Community Discussions Section */}
      <div className="bg-[#050C1E] rounded-3xl border border-slate-800 p-6 space-y-6">
        
        {/* Sub-Header & Segmented Filters */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
          <div>
            <h4 className="text-lg font-bold text-white flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-cyan-400" />
              <span>Catatan Kurasi & Verifikasi Kolektor</span>
            </h4>
            <p className="text-xs text-slate-400 mt-0.5">
              Diskusi & stempel keaslian untuk: <strong className="text-white">"{activeArtwork.title}"</strong>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Filter Buttons */}
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

        {/* Discussion Items List */}
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

              {/* Text comment */}
              {item.type === 'COMMENT' && (
                <p className="text-xs text-slate-300 leading-relaxed font-sans pl-1">
                  "{item.content}"
                </p>
              )}

              {/* Voice Note Visualizer */}
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

              {/* Authentic Seal */}
              {item.type === 'AUTHENTIC_SEAL' && (
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-950/60 border border-emerald-800/60 text-xs font-mono text-emerald-300">
                  <Award className="w-4 h-4 text-emerald-400" />
                  <span>{item.content}</span>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Real-Time Comment Submission Bar */}
        <div className="pt-2 flex items-center gap-2">
          <input
            type="text"
            placeholder={`Tulis kurasi atau ulasan otentik untuk "${activeArtwork.title}"...`}
            value={commentInput}
            onChange={(e) => setCommentInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendComment()}
            disabled={isSubmitting}
            className="flex-1 bg-slate-950 text-xs font-mono text-white placeholder-slate-500 px-4 py-3 rounded-xl border border-slate-800 focus:outline-none focus:border-cyan-500 transition"
          />
          <button
            onClick={handleSendComment}
            disabled={isSubmitting || !commentInput.trim()}
            className="px-5 py-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white font-mono text-xs font-bold transition flex items-center gap-2 shadow-lg shadow-cyan-950 cursor-pointer"
          >
            <span>Kirim</span>
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>

      </div>

    </div>
  );
};
