import React, { useState, useEffect } from 'react';
import { 
  Camera, 
  ArrowRight, 
  ShieldCheck, 
  CheckCircle2, 
  Lock, 
  KeyRound, 
  Award, 
  Globe, 
  Layers, 
  Eye, 
  Info,
  ChevronDown,
  ChevronUp,
  FileCheck,
  Compass,
  Sparkles
} from 'lucide-react';
import { 
  getPublicVaultItems, 
  INITIAL_CURATED_ARTWORKS, 
  PrivateVaultItem,
  isDestroyedArtworkCandidate 
} from '../lib/userVaultStorage';
import { supabase } from '../lib/supabase';

interface VecOverviewProps {
  onNavigate: (tab: string) => void;
  onOpenRegisterModal?: () => void;
}

export const VecOverview: React.FC<VecOverviewProps> = ({ onNavigate, onOpenRegisterModal }) => {
  const [featuredArtworks, setFeaturedArtworks] = useState<PrivateVaultItem[]>(() => {
    const publicItems = getPublicVaultItems();
    if (publicItems && publicItems.length > 0) {
      return publicItems.slice(0, 3);
    }
    return INITIAL_CURATED_ARTWORKS.filter(
      (a) => (a.isPublished || !a.isPrivate) && !isDestroyedArtworkCandidate(a)
    ).slice(0, 3);
  });

  const [showTechnicalDetails, setShowTechnicalDetails] = useState<boolean>(false);

  // Sync real artworks from local vault storage and Supabase if available
  useEffect(() => {
    let isMounted = true;

    const loadArtworks = async () => {
      try {
        const localItems = getPublicVaultItems();
        let combined: PrivateVaultItem[] = [...localItems];

        // Also check Supabase for any published items
        try {
          const { data: posts, error } = await supabase
            .from('posts')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(10);

          if (!error && posts && posts.length > 0) {
            const remoteItems: PrivateVaultItem[] = posts
              .filter((p: any) => {
                if (p.is_destroyed === true || p.destroyed_at) return false;
                const telemetry = p.sensor_telemetry || {};
                const isExplicitPrivate = telemetry.is_private === true;
                const isExplicitPublished = p.is_published === true || telemetry.is_published === true;
                if (isExplicitPrivate || !isExplicitPublished) return false;
                return !isDestroyedArtworkCandidate({
                  id: p.id,
                  digest: p.c2pa_manifest_hash || p.raw_capture_digest,
                  title: p.title,
                  photoUrl: p.media_url
                });
              })
              .map((p: any) => ({
                id: p.id,
                title: p.title || 'Karya Terverifikasi',
                photoUrl: (p.media_url || '').replace('/src/assets/', '/assets/'),
                digest: p.c2pa_manifest_hash || p.raw_capture_digest || 'hash',
                resolution: p.sensor_telemetry?.resolution || '1920 × 1080',
                fileSize: '3.5 MB',
                captureDate: new Date(p.created_at).toLocaleDateString('id-ID', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric'
                }),
                deviceInfo: `${p.camera_make || 'Sony'} ${p.camera_model || 'Alpha C2PA'}`,
                isPrivate: false,
                isPublished: true,
                vaultName: p.sensor_telemetry?.vault_name || 'Brankas Mahakarya',
                creatorName: p.sensor_telemetry?.creator_name || p.author_name || 'Kreator Terverifikasi',
                c2paSignature: p.hardware_tee_signature || 'ECDSA_P256_TEE_VALID',
                sensorType: 'Direct CMOS RAW',
                description: p.caption || 'Karya seni terverifikasi dari dunia nyata.'
              }));

            const seen = new Set(combined.map((c) => c.id));
            remoteItems.forEach((ri) => {
              if (!seen.has(ri.id)) {
                combined.push(ri);
                seen.add(ri.id);
              }
            });
          }
        } catch (supabaseErr) {
          // Silent fallback to local items
        }

        if (combined.length === 0) {
          combined = INITIAL_CURATED_ARTWORKS.filter(
            (a) => (a.isPublished || !a.isPrivate) && !isDestroyedArtworkCandidate(a)
          );
        }

        if (isMounted) {
          setFeaturedArtworks(combined.slice(0, 3));
        }
      } catch (e) {
        console.warn('Overview artworks load note:', e);
      }
    };

    loadArtworks();

    const handleUpdate = () => loadArtworks();
    window.addEventListener('vec-vault-updated', handleUpdate);
    window.addEventListener('vec-artwork-destroyed', handleUpdate);
    window.addEventListener('storage', handleUpdate);

    return () => {
      isMounted = false;
      window.removeEventListener('vec-vault-updated', handleUpdate);
      window.removeEventListener('vec-artwork-destroyed', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  return (
    <div className="space-y-12 sm:space-y-16 lg:space-y-20 py-2 sm:py-4 font-sans text-neutral-100 min-w-0 w-full">
      
      {/* ------------------------------------------------------------- */}
      {/* 1. HERO SECTION: KARYA OTENTIK DI ERA SINTETIS                */}
      {/* ------------------------------------------------------------- */}
      <section className="vec-hero-section relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-b from-neutral-900 via-[#030611] to-[#020409] border border-neutral-800/90 p-5 sm:p-8 lg:p-14 shadow-2xl min-w-0 w-full">
        
        {/* Subtle Ambient Radial Glow */}
        <div className="vec-ambient-glow absolute top-0 right-1/4 w-[400px] sm:w-[500px] h-[400px] sm:h-[500px] bg-cyan-500/5 rounded-full blur-3xl pointer-events-none -z-0"></div>
        <div className="vec-ambient-glow absolute bottom-0 left-10 w-[350px] sm:w-[450px] h-[350px] sm:h-[450px] bg-blue-600/5 rounded-full blur-3xl pointer-events-none -z-0"></div>

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-center min-w-0">
          
          {/* Left Column: Mission & Core Value Proposition */}
          <div className="lg:col-span-7 space-y-5 sm:space-y-7 min-w-0">
            
            {/* Friendly Badge */}
            <div className="vec-hero-breadcrumb flex flex-wrap items-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs text-neutral-400 font-medium">
              <span className="text-cyan-400 font-semibold uppercase tracking-wider">Ruang Seni & Fotografi</span>
              <span aria-hidden="true" className="text-neutral-600">·</span>
              <span>Dokumentasi Dunia Nyata</span>
              <span aria-hidden="true" className="text-neutral-600">·</span>
              <span>Terverifikasi Asli</span>
            </div>

            {/* Primary Direction Headline */}
            <h1 className="vec-hero-title text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight text-white leading-[1.18] break-words" style={{ textWrap: 'balance' }}>
              Karya Otentik Di Era Sintetis.
            </h1>

            {/* Supporting Text */}
            <p className="vec-hero-prose text-sm sm:text-base text-neutral-300 leading-relaxed max-w-2xl font-normal break-words">
              Ruang apresiasi untuk karya seni dan fotografi yang lahir murni dari rasa, jemari, dan keaslian manusia. Setiap foto dan karya di Veroia diambil langsung dari dunia nyata — terverifikasi aman, asli, dan bebas dari rekayasa kecerdasan buatan.
            </p>

            {/* Clear Primary Actions */}
            <div className="flex flex-wrap items-center gap-3 pt-1 sm:pt-2">
              <button
                type="button"
                onClick={() => onNavigate('studio')}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl text-xs sm:text-sm font-semibold text-white bg-cyan-600 hover:bg-cyan-500 transition shadow-lg shadow-cyan-950/40 cursor-pointer"
              >
                <Camera className="w-4 h-4 text-cyan-200 shrink-0" />
                <span>Ambil Foto Asli</span>
              </button>

              <button
                type="button"
                onClick={() => onNavigate('vault')}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl text-xs sm:text-sm font-semibold text-neutral-200 hover:text-white bg-neutral-900 hover:bg-neutral-800 border border-neutral-700/80 hover:border-cyan-500/50 transition cursor-pointer"
              >
                <span>Lihat Katalog</span>
                <ArrowRight className="w-4 h-4 text-cyan-400 shrink-0" />
              </button>

              <button
                type="button"
                onClick={() => onNavigate('private-vault')}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-xs sm:text-sm font-medium text-neutral-400 hover:text-neutral-200 bg-neutral-950/60 hover:bg-neutral-900 border border-neutral-800/80 transition cursor-pointer"
                title="Buka brankas karya pribadi"
              >
                <Lock className="w-3.5 h-3.5 text-emerald-400/80 shrink-0" />
                <span>Brankas Pribadi</span>
              </button>
            </div>

            {/* Plain-Language Trust Markers */}
            <div className="vec-hero-trust pt-3 sm:pt-4 border-t border-neutral-800/80 flex flex-wrap items-center gap-4 sm:gap-6 text-xs text-neutral-400">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Dokumentasi langsung dari lensa kamera</span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0" />
                <span>Catatan asal-usul & riwayat karya tersimpan aman</span>
              </div>
            </div>

          </div>

          {/* Right Column: Hero Visual Showcase Artwork */}
          <div className="lg:col-span-5 relative w-full min-w-0">
            <div 
              onClick={() => onNavigate('vault')}
              className="vec-hero-photo-wrap relative rounded-2xl overflow-hidden border border-neutral-700/80 bg-neutral-950 shadow-2xl group w-full cursor-pointer"
              title="Klik untuk membuka karya ini di katalog"
            >
              <img
                src="/assets/images/vec_vault_artwork_1792494925679.jpg"
                alt="Simfoni Cahaya & Bayang Senja - Karya Otentik Veroia"
                className="w-full h-72 sm:h-88 lg:h-96 object-cover object-center group-hover:scale-103 transition duration-700"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  e.currentTarget.style.opacity = '0.5';
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent"></div>

              {/* Status Badges */}
              <div className="absolute top-3 sm:top-4 left-3 sm:left-4 right-3 sm:right-4 flex flex-wrap items-center justify-between gap-1.5 z-10">
                <div className="vec-hero-badge bg-black/85 backdrop-blur-md px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg border border-cyan-500/40 text-[11px] sm:text-xs font-medium text-cyan-300 flex items-center gap-1.5 max-w-[75%] truncate shadow">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span className="truncate">Karya Terverifikasi Asli</span>
                </div>
                <div className="vec-hero-badge-sub bg-black/85 backdrop-blur-md px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-lg border border-neutral-700 text-[10px] sm:text-[11px] font-medium text-neutral-300 shrink-0 shadow">
                  Dunia Nyata
                </div>
              </div>

              {/* Clean Artwork Provenance Summary Card at Bottom */}
              <div className="vec-hero-cert-card absolute bottom-3 sm:bottom-4 left-3 sm:left-4 right-3 sm:right-4 bg-neutral-900/90 backdrop-blur-md p-3 sm:p-3.5 rounded-xl border border-neutral-800 text-xs space-y-1.5 shadow-lg">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-white font-semibold text-xs sm:text-sm truncate">
                    Simfoni Cahaya & Bayang Senja #01
                  </span>
                  <span className="text-emerald-400 font-bold text-[11px] shrink-0">TERCATAT</span>
                </div>
                <p className="text-[11px] text-neutral-300 truncate font-sans">
                  Arifullah B.K. • Brankas Mahakarya Veroia
                </p>
                <div className="flex items-center justify-between gap-2 text-[11px] text-neutral-400 pt-1.5 border-t border-neutral-800/80">
                  <span className="truncate">Dokumentasi Lensa Kamera Langsung</span>
                  <span className="text-cyan-400 font-medium group-hover:text-cyan-300 flex items-center gap-1 shrink-0">
                    Buka di Katalog <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </div>

            </div>
          </div>

        </div>

        {/* 4-Value Human Highlights Strip */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mt-8 sm:mt-10 pt-6 sm:pt-8 border-t border-neutral-800/80">
          <div className="vec-kpi-card p-3.5 sm:p-4 rounded-xl bg-neutral-950/60 border border-neutral-800/80 min-w-0">
            <div className="text-base sm:text-lg font-bold text-white flex items-center gap-1.5 truncate">
              <Camera className="w-4 h-4 text-cyan-400 shrink-0" />
              <span>Dunia Nyata</span>
            </div>
            <div className="text-[11px] sm:text-xs text-neutral-400 mt-1 break-words">
              Foto diambil langsung dari lensa tanpa generator kecerdasan buatan.
            </div>
          </div>

          <div className="vec-kpi-card p-3.5 sm:p-4 rounded-xl bg-neutral-950/60 border border-neutral-800/80 min-w-0">
            <div className="text-base sm:text-lg font-bold text-cyan-400 flex items-center gap-1.5 truncate">
              <Compass className="w-4 h-4 text-cyan-400 shrink-0" />
              <span>Asal-Usul Jelas</span>
            </div>
            <div className="text-[11px] sm:text-xs text-neutral-400 mt-1 break-words">
              Informasi perangkat, waktu, dan riwayat rekaman tercatat utuh.
            </div>
          </div>

          <div className="vec-kpi-card p-3.5 sm:p-4 rounded-xl bg-neutral-950/60 border border-neutral-800/80 min-w-0">
            <div className="text-base sm:text-lg font-bold text-amber-400 flex items-center gap-1.5 truncate">
              <Lock className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Privasi Aman</span>
            </div>
            <div className="text-[11px] sm:text-xs text-neutral-400 mt-1 break-words">
              Lokasi studio dan koleksi pribadi terlindungi secara aman.
            </div>
          </div>

          <div className="vec-kpi-card p-3.5 sm:p-4 rounded-xl bg-neutral-950/60 border border-neutral-800/80 min-w-0">
            <div className="text-base sm:text-lg font-bold text-emerald-400 flex items-center gap-1.5 truncate">
              <Award className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Koleksi Terkurasi</span>
            </div>
            <div className="text-[11px] sm:text-xs text-neutral-400 mt-1 break-words">
              Mendukung kurasi profesional dan apresiasi nilai otentik karya.
            </div>
          </div>
        </div>

      </section>


      {/* ------------------------------------------------------------- */}
      {/* 2. FEATURED ARTWORKS & COLLECTIONS                            */}
      {/* ------------------------------------------------------------- */}
      <section className="space-y-6 pt-1 sm:pt-2 min-w-0 w-full">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 sm:gap-4">
          <div>
            <div className="text-xs font-semibold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>Koleksi Terpilih</span>
            </div>
            <h2 className="text-xl sm:text-3xl font-bold text-white tracking-tight mt-1 break-words">
              Menjelajahi Keindahan yang Nyata
            </h2>
            <p className="text-xs sm:text-sm text-neutral-400 mt-1 max-w-xl">
              Karya seni dan fotografi otentik yang telah diverifikasi dan dipublikasikan ke katalog umum.
            </p>
          </div>
          
          <button
            type="button"
            onClick={() => onNavigate('vault')}
            className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-1.5 cursor-pointer transition shrink-0 group py-1"
          >
            <span>Lihat Semua di Katalog</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        {/* Real Artwork Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
          {featuredArtworks.map((item) => (
            <div 
              key={item.id}
              onClick={() => onNavigate('vault')}
              className="vec-showcase-card group cursor-pointer rounded-2xl overflow-hidden border border-neutral-800 bg-neutral-900/50 hover:border-cyan-500/50 transition duration-300 flex flex-col min-w-0 shadow-lg"
            >
              {/* Artwork Media Frame */}
              <div className="relative h-48 sm:h-52 overflow-hidden bg-neutral-950">
                <img
                  src={item.photoUrl}
                  alt={item.title}
                  className="w-full h-full object-cover object-center group-hover:scale-104 transition duration-500"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    e.currentTarget.src = '/assets/images/vec_vault_artwork_1792494925679.jpg';
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-neutral-950/80 via-transparent to-transparent"></div>

                <div className="absolute top-3 left-3 bg-black/80 backdrop-blur-sm px-2.5 py-1 rounded-lg text-[10px] font-medium text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                  <span>Foto Terverifikasi</span>
                </div>

                <div className="absolute bottom-2.5 right-3 text-[10px] text-neutral-300 bg-black/70 backdrop-blur-sm px-2 py-0.5 rounded">
                  {item.resolution || '1920 × 1080'}
                </div>
              </div>

              {/* Artwork Content Panel */}
              <div className="vec-showcase-panel p-4 sm:p-5 space-y-3 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="font-bold text-white group-hover:text-cyan-300 transition text-sm sm:text-base line-clamp-1">
                    {item.title}
                  </h3>
                  <div className="text-xs text-neutral-400 mt-1 flex items-center justify-between">
                    <span className="truncate">{item.creatorName || 'Kreator Veroia'}</span>
                    <span className="text-[11px] text-neutral-400 shrink-0">{item.captureDate || 'Tercatat'}</span>
                  </div>
                  <p className="text-xs text-neutral-400 mt-2 line-clamp-2 leading-relaxed">
                    {item.description || 'Karya otentik dengan bukti catatan keaslian terverifikasi.'}
                  </p>
                </div>

                <div className="vec-showcase-meta pt-3 border-t border-neutral-800/80 flex items-center justify-between text-xs text-neutral-400">
                  <span className="text-neutral-400 text-[11px]">Asal: {item.vaultName || 'Brankas Karya'}</span>
                  <span className="text-cyan-400 font-medium group-hover:text-cyan-300 flex items-center gap-1 text-[11px]">
                    Lihat Karya <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>


      {/* ------------------------------------------------------------- */}
      {/* 3. "CARA KERJANYA" (HOW IT WORKS - 3 CONCISE STEPS)           */}
      {/* ------------------------------------------------------------- */}
      <section className="space-y-6 pt-2 min-w-0 w-full">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <div className="text-xs font-semibold text-cyan-400 uppercase tracking-wider">
            Alur Sederhana
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Bagaimana Veroia Bekerja
          </h2>
          <p className="text-xs sm:text-sm text-neutral-400 leading-relaxed">
            Menghubungkan proses berkarya di dunia nyata dengan pencatatan digital yang aman, transparan, dan mudah dipahami.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6 pt-2">
          
          {/* Step 1 */}
          <div 
            onClick={() => onNavigate('studio')}
            className="vec-step-card group cursor-pointer p-6 rounded-2xl bg-neutral-900/50 hover:bg-neutral-900 border border-neutral-800 hover:border-cyan-500/50 transition duration-300 flex flex-col justify-between space-y-4 shadow-lg"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                  <Camera className="w-6 h-6" />
                </div>
                <span className="text-2xl font-black text-neutral-700 group-hover:text-cyan-500/40 transition">
                  01
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-bold text-white">
                1. Ambil Foto atau Kirimkan Karya
              </h3>
              <p className="text-xs sm:text-sm text-neutral-400 leading-relaxed">
                Ambil foto langsung melalui studio kamera Veroia atau kirimkan dokumentasi karya Anda melalui alur yang tersedia di platform.
              </p>
            </div>
            <div className="pt-2 text-xs font-semibold text-cyan-400 group-hover:text-cyan-300 flex items-center gap-1">
              <span>Buka Studio Foto</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Step 2 */}
          <div 
            onClick={() => onNavigate('vault')}
            className="vec-step-card group cursor-pointer p-6 rounded-2xl bg-neutral-900/50 hover:bg-neutral-900 border border-neutral-800 hover:border-emerald-500/50 transition duration-300 flex flex-col justify-between space-y-4 shadow-lg"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <span className="text-2xl font-black text-neutral-700 group-hover:text-emerald-500/40 transition">
                  02
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-bold text-white">
                2. Pemeriksaan Bukti & Integritas
              </h3>
              <p className="text-xs sm:text-sm text-neutral-400 leading-relaxed">
                Sistem memeriksa informasi dan bukti yang didukung oleh proses verifikasi, memastikan karya terlindung dari manipulasi tanpa izin.
              </p>
            </div>
            <div className="pt-2 text-xs font-semibold text-emerald-400 group-hover:text-emerald-300 flex items-center gap-1">
              <span>Pelajari Verifikasi</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Step 3 */}
          <div 
            onClick={() => onNavigate('vault')}
            className="vec-step-card group cursor-pointer p-6 rounded-2xl bg-neutral-900/50 hover:bg-neutral-900 border border-neutral-800 hover:border-purple-500/50 transition duration-300 flex flex-col justify-between space-y-4 shadow-lg"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
                  <Globe className="w-6 h-6" />
                </div>
                <span className="text-2xl font-black text-neutral-700 group-hover:text-purple-500/40 transition">
                  03
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-bold text-white">
                3. Jelajahi, Simpan, atau Bagikan
              </h3>
              <p className="text-xs sm:text-sm text-neutral-400 leading-relaxed">
                Jelajahi karya di katalog publik, simpan dengan aman di brankas pribadi Anda, atau bagikan sesuai fitur dan izin yang tersedia.
              </p>
            </div>
            <div className="pt-2 text-xs font-semibold text-purple-400 group-hover:text-purple-300 flex items-center gap-1">
              <span>Jelajahi Katalog</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

        </div>
      </section>


      {/* ------------------------------------------------------------- */}
      {/* 4. PROVENANCE, INTEGRITY & VERIFICATION (PLAIN LANGUAGE)      */}
      {/* ------------------------------------------------------------- */}
      <section className="space-y-6 pt-2 min-w-0 w-full">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <div className="text-xs font-semibold text-cyan-400 uppercase tracking-wider">
              Transparansi & Catatan Keaslian
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight mt-1">
              Memahami Asal-Usul Setiap Karya
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-neutral-400 max-w-md">
            Kami membedakan catatan integritas teknis dengan nilai seni manusia secara jujur, akurat, dan transparan.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6">
          
          {/* Card 1: Asal-Usul Karya */}
          <div className="vec-provenance-card p-5 sm:p-6 rounded-2xl bg-neutral-900/60 border border-neutral-800 space-y-3 shadow-md">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Compass className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">
              Asal-Usul Karya (Origin)
            </h3>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Informasi jelas tentang dari mana karya berasal, perangkat kamera yang digunakan, dan momen dokumentasi saat karya terekam di dunia nyata.
            </p>
          </div>

          {/* Card 2: Catatan Keaslian */}
          <div className="vec-provenance-card p-5 sm:p-6 rounded-2xl bg-neutral-900/60 border border-neutral-800 space-y-3 shadow-md">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <FileCheck className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">
              Catatan Keaslian (Provenance)
            </h3>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Jejak rekaman dan bukti identitas digital yang memastikan file foto tidak dimodifikasi atau ditukar secara diam-diam setelah didokumentasikan.
            </p>
          </div>

          {/* Card 3: Status Verifikasi */}
          <div className="vec-provenance-card p-5 sm:p-6 rounded-2xl bg-neutral-900/60 border border-neutral-800 space-y-3 shadow-md">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">
              Status Verifikasi Terbuka
            </h3>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Menunjukkan secara jujur apa yang telah diperiksa sistem (seperti integritas sensor dan hash data) dan apa yang merupakan karya cipta manusia.
            </p>
          </div>

        </div>

        {/* Secondary Visual Hierarchy: Collapsible Technical Specifications for Auditors & Enthusiasts */}
        <div className="rounded-2xl border border-neutral-800/80 bg-neutral-950/70 overflow-hidden transition-all duration-300">
          <button
            type="button"
            onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
            className="w-full px-5 py-4 flex items-center justify-between text-left text-xs sm:text-sm font-medium text-neutral-400 hover:text-white transition cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 text-cyan-400 shrink-0" />
              <span>Detail Teknis, Kriptografi & Spesifikasi Keamanan</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-cyan-400">
              <span>{showTechnicalDetails ? 'Tutup Detail' : 'Tampilkan Detail'}</span>
              {showTechnicalDetails ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </div>
          </button>

          {showTechnicalDetails && (
            <div className="px-5 pb-6 pt-2 border-t border-neutral-800/80 space-y-4 text-xs text-neutral-400 leading-relaxed animate-in fade-in duration-200">
              <p>
                Platform Veroia mengimplementasikan standar provenance berbasis spesifikasi <strong>C2PA (Coalition for Content Provenance and Authenticity)</strong>, enkripsi ringkasan <strong>SHA-256</strong>, tanda tangan perangkat keras (Hardware Attestation), dan pengaburan koordinat lokasi berbasis <strong>PostGIS</strong> untuk melindungi privasi lokasi studio seniman.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-1">
                <div className="p-3 rounded-lg bg-neutral-900 border border-neutral-800">
                  <div className="text-[11px] font-mono text-cyan-300 font-semibold">C2PA Standard</div>
                  <div className="text-[10px] text-neutral-400 mt-0.5">Manifest digital tertanam langsung saat pengambilan gambar.</div>
                </div>
                <div className="p-3 rounded-lg bg-neutral-900 border border-neutral-800">
                  <div className="text-[11px] font-mono text-emerald-300 font-semibold">SHA-256 Checksum</div>
                  <div className="text-[10px] text-neutral-400 mt-0.5">Integritas piksel terkunci terhadap modifikasi piksel eksternal.</div>
                </div>
                <div className="p-3 rounded-lg bg-neutral-900 border border-neutral-800">
                  <div className="text-[11px] font-mono text-amber-300 font-semibold">PostGIS Privacy</div>
                  <div className="text-[10px] text-neutral-400 mt-0.5">Koordinat fuzzed untuk menjaga kerahasiaan lokasi seniman.</div>
                </div>
                <div className="p-3 rounded-lg bg-neutral-900 border border-neutral-800">
                  <div className="text-[11px] font-mono text-purple-300 font-semibold">Multi-Tenant Vault</div>
                  <div className="text-[10px] text-neutral-400 mt-0.5">Pemisahan data brankas per kreator dengan kunci privat.</div>
                </div>
              </div>
              <p className="text-[11px] text-neutral-400 italic">
                Catatan: Bukti teknis di atas mencatat keaslian rekaman sensor kamera dan integritas file, sebagai pelengkap ulasan nilai estetika oleh kurator manusia.
              </p>
            </div>
          )}
        </div>
      </section>


      {/* ------------------------------------------------------------- */}
      {/* 5. ARTIST & COLLECTOR VAULT ONBOARDING SECTION                */}
      {/* ------------------------------------------------------------- */}
      <section className="vec-registration-banner relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-r from-[#071326] via-[#040a14] to-[#02050b] border border-cyan-500/40 p-5 sm:p-8 lg:p-10 shadow-2xl min-w-0 w-full">
        <div className="vec-ambient-glow absolute top-0 right-0 w-72 sm:w-96 h-72 sm:h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>
        
        <div className="relative z-10 flex flex-col lg:flex-row items-center lg:items-start justify-between gap-6 sm:gap-8 min-w-0">
          <div className="space-y-3 text-center lg:text-left min-w-0 w-full">
            <div className="vec-banner-badge inline-flex max-w-full items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 text-xs font-semibold">
              <KeyRound className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <span>Ruang Kreator & Kolektor</span>
            </div>
            
            <h2 className="vec-banner-title text-xl sm:text-2xl lg:text-3xl font-bold text-white tracking-tight break-words">
              Miliki Brankas Karya Anda Sendiri
            </h2>
            
            <p className="vec-banner-desc text-xs sm:text-sm text-neutral-300 max-w-2xl leading-relaxed break-words">
              Daftarkan brankas pribadi untuk mendokumentasikan karya seni Anda, menerbitkan kunci akses mandiri, dan memilih karya yang ingin ditampilkan di katalog publik atau disimpan rapat untuk arsip pribadi Anda.
            </p>
            
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3 sm:gap-5 pt-1 text-xs text-neutral-400 font-medium">
              <span className="vec-banner-feature flex items-center gap-1.5 text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> Kunci Akses Mandiri
              </span>
              <span className="vec-banner-feature flex items-center gap-1.5 text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> Penyimpanan Aman Terproteksi
              </span>
              <span className="vec-banner-feature flex items-center gap-1.5 text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> Kontrol Privasi Penuh
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0 w-full lg:w-auto">
            {onOpenRegisterModal && (
              <button
                type="button"
                onClick={onOpenRegisterModal}
                className="w-full sm:w-auto justify-center inline-flex items-center gap-2 px-6 py-3.5 rounded-xl text-xs sm:text-sm font-bold text-white bg-gradient-to-r from-cyan-600 via-cyan-500 to-blue-600 hover:from-cyan-500 hover:to-blue-500 transition shadow-lg shadow-cyan-950/60 cursor-pointer"
              >
                <KeyRound className="w-4 h-4 shrink-0" />
                <span>Daftar Brankas Baru</span>
                <ArrowRight className="w-4 h-4 shrink-0" />
              </button>
            )}

            <button
              type="button"
              onClick={() => onNavigate('private-vault')}
              className="w-full sm:w-auto justify-center inline-flex items-center gap-2 px-5 py-3.5 rounded-xl text-xs sm:text-sm font-semibold text-neutral-300 hover:text-white bg-neutral-900/80 hover:bg-neutral-800 border border-neutral-700 transition cursor-pointer"
            >
              <Lock className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Buka Brankas</span>
            </button>
          </div>
        </div>
      </section>


      {/* ------------------------------------------------------------- */}
      {/* 6. INVITING CALL-TO-ACTION (BOTTOM GALLERY INVITATION)        */}
      {/* ------------------------------------------------------------- */}
      <section className="vec-cta-banner bg-gradient-to-r from-neutral-900 via-neutral-950 to-neutral-900 border border-neutral-800 rounded-2xl sm:rounded-3xl p-6 sm:p-8 lg:p-10 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl min-w-0 w-full">
        <div className="space-y-2 text-center md:text-left min-w-0 w-full">
          <div className="vec-cta-badge text-xs font-semibold text-cyan-400 flex items-center justify-center md:justify-start gap-1.5">
            <Sparkles className="w-4 h-4 text-cyan-400 shrink-0" />
            <span>RUANG APRESIASI OTENTIK</span>
          </div>
          <h3 className="vec-cta-title text-xl sm:text-2xl font-bold text-white tracking-tight break-words">
            Mulai Apresiasi Karya Asli Manusia Bersama Veroia
          </h3>
          <p className="vec-cta-desc text-xs sm:text-sm text-neutral-400 max-w-xl break-words">
            Jelajahi karya dunia nyata di katalog publik atau ambil dokumentasi karya pertama Anda dengan jaminan integritas terpercaya.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center md:justify-end gap-3 shrink-0 w-full md:w-auto">
          <button
            type="button"
            onClick={() => onNavigate('studio')}
            className="w-full sm:w-auto justify-center inline-flex items-center gap-2 px-6 py-3.5 rounded-xl text-xs sm:text-sm font-semibold text-white bg-cyan-600 hover:bg-cyan-500 transition shadow-lg shadow-cyan-950/50 cursor-pointer"
          >
            <Camera className="w-4 h-4 text-cyan-200 shrink-0" />
            <span>Ambil Foto Asli</span>
          </button>
          
          <button
            type="button"
            onClick={() => onNavigate('vault')}
            className="w-full sm:w-auto justify-center inline-flex items-center gap-2 px-5 py-3.5 rounded-xl text-xs sm:text-sm font-medium text-neutral-300 hover:text-white bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 transition cursor-pointer"
          >
            <span>Lihat Katalog</span>
            <ArrowRight className="w-4 h-4 text-cyan-400 shrink-0" />
          </button>
        </div>
      </section>

    </div>
  );
};
