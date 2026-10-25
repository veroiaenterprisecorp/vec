import React from 'react';
import { 
  ShieldCheck, 
  Camera, 
  MapPin, 
  Lock, 
  ArrowRight, 
  Award,
  CheckCircle2,
  Fingerprint,
  Layers,
  KeyRound,
  Mail
} from 'lucide-react';

interface VecOverviewProps {
  onNavigate: (tab: string) => void;
  onOpenRegisterModal?: () => void;
}

export const VecOverview: React.FC<VecOverviewProps> = ({ onNavigate, onOpenRegisterModal }) => {
  return (
    <div className="space-y-12 sm:space-y-16 lg:space-y-20 py-2 sm:py-4 font-sans text-neutral-100 min-w-0 w-full">
      
      {/* ------------------------------------------------------------- */}
      {/* HERO SECTION - ELEGANT ART ATTESTATION                        */}
      {/* ------------------------------------------------------------- */}
      <section className="vec-hero-section relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-b from-neutral-900 via-[#030611] to-[#020409] border border-neutral-800/90 p-4 sm:p-8 lg:p-14 shadow-2xl min-w-0 w-full">
        
        {/* Ambient Subtle Radial Glow */}
        <div className="vec-ambient-glow absolute top-0 right-1/4 w-[400px] sm:w-[500px] h-[400px] sm:h-[500px] bg-cyan-500/5 rounded-full blur-3xl pointer-events-none -z-0"></div>
        <div className="vec-ambient-glow absolute bottom-0 left-10 w-[350px] sm:w-[450px] h-[350px] sm:h-[450px] bg-blue-600/5 rounded-full blur-3xl pointer-events-none -z-0"></div>

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-center min-w-0">
          
          {/* Left Column: Editorial Value Proposition */}
          <div className="lg:col-span-7 space-y-5 sm:space-y-7 min-w-0">
            
            {/* Lead-in Badges */}
            <div className="vec-hero-breadcrumb flex flex-wrap items-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs text-neutral-400 font-medium">
              <span className="text-cyan-400 font-semibold uppercase tracking-wider">Keaslian Terjamin</span>
              <span aria-hidden="true" className="text-neutral-600">·</span>
              <span>Sertifikasi Standar Global</span>
              <span aria-hidden="true" className="text-neutral-600">·</span>
              <span>Kamera Terverifikasi Asli</span>
              <span aria-hidden="true" className="text-neutral-600">·</span>
              <span>Segel Fisik Anti-Pemalsuan</span>
            </div>

            {/* Display Headline */}
            <h1 className="vec-hero-title text-2xl sm:text-4xl lg:text-5xl font-semibold tracking-tight text-white leading-[1.15] break-words" style={{ textWrap: 'balance' }}>
              Autentikasi Karya Seni & Dokumentasi Asli Tanpa Kompromi
            </h1>

            {/* Prose */}
            <p className="vec-hero-prose text-xs sm:text-base text-neutral-300 leading-relaxed max-w-2xl font-normal break-words">
              Platform perlindungan keaslian karya seni untuk Veroia Enterprise Corp yang menghubungkan pengambilan foto asli langsung dari kamera, segel fisik anti-pemalsuan pada kanvas karya, dan perlindungan privasi ke sistem penyimpanan aman.
            </p>

            {/* Primary Action Buttons */}
            <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 pt-1 sm:pt-2">
              <button
                onClick={() => onNavigate('vault')}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 sm:px-5 py-2.5 sm:py-3 rounded-xl text-xs sm:text-sm font-semibold text-white bg-cyan-600 hover:bg-cyan-500 transition shadow-lg shadow-cyan-950/40 cursor-pointer"
              >
                <span>Jelajahi Katalog Karya</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => onNavigate('studio')}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 sm:px-5 py-2.5 sm:py-3 rounded-xl text-xs sm:text-sm font-semibold text-white bg-neutral-900 hover:bg-neutral-800 border border-neutral-700/80 hover:border-cyan-500/50 transition cursor-pointer"
              >
                <Camera className="w-4 h-4 text-cyan-400" />
                <span>Buka Studio Foto</span>
              </button>

              <button
                onClick={() => onNavigate('private-vault')}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 sm:py-3 rounded-xl text-xs sm:text-sm font-semibold text-neutral-300 hover:text-white bg-neutral-950/60 hover:bg-neutral-900 border border-neutral-800 transition cursor-pointer"
              >
                <Lock className="w-3.5 h-3.5 text-emerald-400" />
                <span>Brankas Koleksi Pribadi</span>
              </button>

              {onOpenRegisterModal && (
                <button
                  onClick={onOpenRegisterModal}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 sm:py-3 rounded-xl text-xs sm:text-sm font-semibold text-cyan-200 hover:text-white bg-cyan-950/70 hover:bg-cyan-900 border border-cyan-500/50 hover:border-cyan-400 transition cursor-pointer shadow-lg shadow-cyan-950/50"
                  title="Daftar akun dan terbitkan kunci brankas baru"
                >
                  <KeyRound className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Daftar Brankas Baru</span>
                </button>
              )}
            </div>

            {/* Trust Markers */}
            <div className="vec-hero-trust pt-3 sm:pt-4 border-t border-neutral-800/80 flex flex-wrap items-center gap-4 sm:gap-6 text-xs text-neutral-400">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Dukungan Kamera Profesional Terverifikasi</span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0" />
                <span>Jaminan Foto Asli Tanpa Rekayasa</span>
              </div>
            </div>

          </div>

          {/* Right Column: Hero Visual Showcase */}
          <div className="lg:col-span-5 relative w-full min-w-0">
            <div className="vec-hero-photo-wrap relative rounded-2xl overflow-hidden border border-neutral-700/80 bg-neutral-950 shadow-2xl group w-full">
              <img
                src="/assets/images/vec_hero_camera_1792494926035.jpg"
                alt="Verifikasi Kamera Veroia Enterprise"
                className="w-full h-72 sm:h-88 lg:h-96 object-cover object-center group-hover:scale-102 transition duration-700"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  e.currentTarget.style.opacity = '0.3';
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/35 to-transparent"></div>

              {/* Verified Overlay Badge - Fully Responsive with wrapping */}
              <div className="absolute top-3 sm:top-4 left-3 sm:left-4 right-3 sm:right-4 flex flex-wrap items-center justify-between gap-1.5 z-10">
                <div className="vec-hero-badge bg-black/85 backdrop-blur-md px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg border border-cyan-500/40 text-[11px] sm:text-xs font-medium text-cyan-300 flex items-center gap-1.5 max-w-[75%] truncate shadow">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span className="truncate">Terverifikasi Kamera Asli</span>
                </div>
                <div className="vec-hero-badge-sub bg-black/85 backdrop-blur-md px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-lg border border-neutral-700 text-[10px] sm:text-[11px] font-medium text-neutral-300 shrink-0 shadow">
                  Foto Asli
                </div>
              </div>

              {/* Certificate Card at Bottom */}
              <div className="vec-hero-cert-card absolute bottom-3 sm:bottom-4 left-3 sm:left-4 right-3 sm:right-4 bg-neutral-900/90 backdrop-blur-md p-3 sm:p-3.5 rounded-xl border border-neutral-800 text-xs space-y-1.5 shadow-lg">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-neutral-400 text-[11px] truncate">Tanda Keaslian Resmi:</span>
                  <span className="text-emerald-400 font-bold text-[11px] shrink-0">ASLI & SAH</span>
                </div>
                <div className="text-[11px] text-cyan-300 truncate font-medium font-mono">
                  ID Sertifikat: VEC-CERT-9F86D081
                </div>
                <div className="flex items-center justify-between gap-2 text-[11px] text-neutral-400 pt-1 border-t border-neutral-800">
                  <span className="truncate">Keaslian Karya & Foto</span>
                  <span className="text-emerald-400 font-semibold shrink-0">Terverifikasi 100%</span>
                </div>
              </div>

            </div>
          </div>

        </div>

        {/* 4-Column KPI Strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-4 mt-8 sm:mt-10 pt-6 sm:pt-8 border-t border-neutral-800/80">
          <div className="vec-kpi-card p-3 sm:p-4 rounded-xl bg-neutral-950/60 border border-neutral-800/80 min-w-0">
            <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-white tabular-nums truncate">99.4%</div>
            <div className="text-[11px] sm:text-xs text-neutral-400 mt-1 break-words">Akurasi Verifikasi Keaslian</div>
          </div>
          <div className="vec-kpi-card p-3 sm:p-4 rounded-xl bg-neutral-950/60 border border-neutral-800/80 min-w-0">
            <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-cyan-400 truncate">Resmi</div>
            <div className="text-[11px] sm:text-xs text-neutral-400 mt-1 break-words">Standar Verifikasi Global</div>
          </div>
          <div className="vec-kpi-card p-3 sm:p-4 rounded-xl bg-neutral-950/60 border border-neutral-800/80 min-w-0">
            <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-amber-400 truncate">Aman</div>
            <div className="text-[11px] sm:text-xs text-neutral-400 mt-1 break-words">Segel Pengaman Fisik</div>
          </div>
          <div className="vec-kpi-card p-3 sm:p-4 rounded-xl bg-neutral-950/60 border border-neutral-800/80 min-w-0">
            <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-emerald-400 truncate">Cloud</div>
            <div className="text-[11px] sm:text-xs text-neutral-400 mt-1 break-words">Penyimpanan Terproteksi</div>
          </div>
        </div>

      </section>


      {/* ------------------------------------------------------------- */}
      {/* REGISTRATION & VAULT IDENTITY CONNECTOR BANNER                */}
      {/* ------------------------------------------------------------- */}
      <section className="vec-registration-banner relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-r from-[#071326] via-[#040a14] to-[#02050b] border border-cyan-500/40 p-4 sm:p-8 lg:p-10 shadow-2xl min-w-0 w-full">
        <div className="vec-ambient-glow absolute top-0 right-0 w-72 sm:w-96 h-72 sm:h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 flex flex-col lg:flex-row items-center lg:items-start justify-between gap-6 sm:gap-8 min-w-0">
          <div className="space-y-3 text-center lg:text-left min-w-0 w-full">
            <div className="vec-banner-badge inline-flex max-w-full items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 text-xs font-semibold">
              <KeyRound className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <span className="truncate">Sistem Pendaftaran Brankas Terenkripsi Multi-Tenant</span>
            </div>
            <h2 className="vec-banner-title text-xl sm:text-2xl lg:text-3xl font-bold text-white tracking-tight break-words">
              Pendaftaran Mandiri: Terhubung Langsung ke Ruang Admin & Email
            </h2>
            <p className="vec-banner-desc text-xs sm:text-sm text-neutral-300 max-w-2xl leading-relaxed break-words">
              Daftarkan brankas karya pribadi Anda dalam satu langkah. Sistem langsung menerbitkan kunci akses kriptografis SHA-256 yang aman, otomatis tersinkronisasi ke <strong>Ruangan Kontrol Admin Vecmaster</strong>, dan mengirimkan salinan sertifikat resmi langsung ke <strong>email pendaftar</strong>.
            </p>
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2.5 sm:gap-4 pt-1 text-xs text-neutral-400 font-medium">
              <span className="vec-banner-feature flex items-center gap-1.5 text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> Terhubung Web Resmi VEC
              </span>
              <span className="vec-banner-feature flex items-center gap-1.5 text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> Tercatat di Kontrol Admin
              </span>
              <span className="vec-banner-feature flex items-center gap-1.5 text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> Konfirmasi ke Email Pendaftar
              </span>
            </div>
          </div>

          {onOpenRegisterModal && (
            <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0 w-full lg:w-auto">
              <button
                type="button"
                onClick={onOpenRegisterModal}
                className="w-full sm:w-auto justify-center inline-flex items-center gap-2 px-6 py-3.5 rounded-xl text-xs sm:text-sm font-bold text-white bg-gradient-to-r from-cyan-600 via-cyan-500 to-blue-600 hover:from-cyan-500 hover:to-blue-500 transition shadow-lg shadow-cyan-950/60 cursor-pointer"
              >
                <KeyRound className="w-4 h-4 shrink-0" />
                <span>Daftar Brankas Karya Baru</span>
                <ArrowRight className="w-4 h-4 shrink-0" />
              </button>
            </div>
          )}
        </div>
      </section>


      {/* ------------------------------------------------------------- */}
      {/* FOUR CORE PILLARS SECTION                                     */}
      {/* ------------------------------------------------------------- */}
      <section className="space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <div className="text-xs font-semibold text-cyan-400 uppercase tracking-wider">Sistem Perlindungan Terpadu</div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight mt-1">
              Empat Pilar Perlindungan Keaslian Veroia
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-neutral-400 max-w-md">
            Dirancang untuk memastikan karya seni fisik dan dokumentasi aslinya selalu terlindungi dan tidak dapat dipalsukan.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Card 1: Pengambilan Foto Langsung */}
          <div 
            onClick={() => onNavigate('studio')}
            className="vec-pillar-card group cursor-pointer bg-neutral-900/60 hover:bg-neutral-900 border border-neutral-800 hover:border-cyan-500/50 rounded-2xl p-6 transition duration-300 flex flex-col justify-between space-y-5 shadow-lg"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                  <Camera className="w-5 h-5" />
                </div>
                <span className="text-xs font-medium text-cyan-400 group-hover:translate-x-1 transition-transform flex items-center gap-1">
                  Coba Studio <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
              <h3 className="text-lg font-bold text-white">
                01. Pengambilan Foto Langsung & Asli
              </h3>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Setiap foto diambil langsung lewat lensa kamera tanpa modifikasi eksternal. Sistem memastikan foto terlindung dari manipulasi atau rekayasa kecerdasan buatan.
              </p>
            </div>

            <div className="relative h-44 rounded-xl overflow-hidden border border-neutral-800">
              <img
                src="/assets/images/vec_chip_nfc_1792494926609.jpg"
                alt="Segel Pengaman Lensa Kamera"
                className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-neutral-950/80 via-transparent to-transparent"></div>
              <div className="absolute bottom-2.5 left-3 text-[11px] font-medium text-cyan-300">
                Perlindungan Keaslian Lensa & Kamera
              </div>
            </div>
          </div>

          {/* Card 2: Pameran Karya Utama */}
          <div 
            onClick={() => onNavigate('vault')}
            className="vec-pillar-card group cursor-pointer bg-neutral-900/60 hover:bg-neutral-900 border border-neutral-800 hover:border-emerald-500/50 rounded-2xl p-6 transition duration-300 flex flex-col justify-between space-y-5 shadow-lg"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <Award className="w-5 h-5" />
                </div>
                <span className="text-xs font-medium text-emerald-400 group-hover:translate-x-1 transition-transform flex items-center gap-1">
                  Buka Katalog <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
              <h3 className="text-lg font-bold text-white">
                02. Pameran Karya Utama & Riwayat Kepemilikan
              </h3>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Karya seni fisik terhubung ke segel pintar pada kanvas. Dilengkapi ulasan kurator profesional dengan rekaman suara asli dan riwayat kepemilikan yang sah.
              </p>
            </div>

            <div className="relative h-44 rounded-xl overflow-hidden border border-neutral-800">
              <img
                src="/assets/images/vec_vault_artwork_1792494925679.jpg"
                alt="Pameran Galeri Karya Seni"
                className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-neutral-950/80 via-transparent to-transparent"></div>
              <div className="absolute bottom-2.5 left-3 text-[11px] font-medium text-emerald-300">
                Pameran Galeri & Riwayat Kepemilikan Sah
              </div>
            </div>
          </div>

          {/* Card 3: Brankas Koleksi Pribadi */}
          <div 
            onClick={() => onNavigate('private-vault')}
            className="vec-pillar-card group cursor-pointer bg-neutral-900/60 hover:bg-neutral-900 border border-neutral-800 hover:border-amber-500/50 rounded-2xl p-6 transition duration-300 flex flex-col justify-between space-y-5 shadow-lg"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <MapPin className="w-5 h-5" />
                </div>
                <span className="text-xs font-medium text-amber-400 group-hover:translate-x-1 transition-transform flex items-center gap-1">
                  Brankas Pribadi <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
              <h3 className="text-lg font-bold text-white">
                03. Brankas Pribadi & Perlindungan Lokasi
              </h3>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Koleksi pribadi Anda tersimpan secara aman di perangkat dengan opsi pencadangan cloud. Informasi lokasi studio seniman terlindungi sehingga privasi selalu terjaga.
              </p>
            </div>

            <div className="vec-pillar-inner-box p-4 rounded-xl bg-neutral-950 border border-neutral-800/80 text-xs space-y-2">
              <div className="flex justify-between text-neutral-400">
                <span>Penyimpanan Aman:</span>
                <span className="text-emerald-400 font-medium">Di Perangkat & Cloud Terproteksi</span>
              </div>
              <div className="flex justify-between text-neutral-400">
                <span>Privasi Lokasi:</span>
                <span className="text-amber-300 font-medium">Titik Koordinat Terlindungi</span>
              </div>
              <div className="flex justify-between text-neutral-400">
                <span>Hak Akses:</span>
                <span className="text-cyan-300 font-medium">Hanya Pemilik yang Berhak</span>
              </div>
            </div>
          </div>

          {/* Card 4: Standar Galeri & Lelang */}
          <div 
            onClick={() => onNavigate('vault')}
            className="vec-pillar-card group cursor-pointer bg-neutral-900/60 hover:bg-neutral-900 border border-neutral-800 hover:border-purple-500/50 rounded-2xl p-6 transition duration-300 flex flex-col justify-between space-y-5 shadow-lg"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
                  <Layers className="w-5 h-5" />
                </div>
                <span className="text-xs font-medium text-purple-400 group-hover:translate-x-1 transition-transform flex items-center gap-1">
                  Kurator & Lelang <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
              <h3 className="text-lg font-bold text-white">
                04. Standar Galeri & Rumah Lelang
              </h3>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Memenuhi standar sertifikasi galeri seni internasional, balai lelang, dan kurator seni rupa untuk memastikan keaslian fisik karya diakui secara global.
              </p>
            </div>

            <div className="relative h-44 rounded-xl overflow-hidden border border-neutral-800">
              <img
                src="/assets/images/vec_curator_portrait_1792494927295.jpg"
                alt="Kurator Profesional"
                className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-neutral-950/80 via-transparent to-transparent"></div>
              <div className="absolute bottom-2.5 left-3 text-[11px] font-medium text-purple-300">
                Sertifikasi Kurator & Standar Rumah Lelang
              </div>
            </div>
          </div>

        </div>

        {/* Card 5: Ruang Kontrol Admin & Pengawasan Sistem (Full Width Connector) */}
        <div 
          onClick={() => onNavigate('admin-portal')}
          className="vec-admin-banner group cursor-pointer bg-gradient-to-r from-emerald-950/30 via-slate-900/60 to-cyan-950/30 hover:bg-slate-900 border border-emerald-500/30 hover:border-emerald-500/60 rounded-2xl p-4 sm:p-6 transition duration-300 flex flex-col md:flex-row items-center md:items-center justify-between gap-4 sm:gap-6 shadow-xl min-w-0"
        >
          <div className="space-y-2 text-center md:text-left min-w-0 w-full">
            <div className="vec-admin-badge inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
              <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">KONSOL PENGELOLA UTAMA · VECMASTER PORTAL</span>
            </div>
            <h3 className="text-base sm:text-xl font-bold text-white break-words">
              Ruang Kontrol Admin: Pengawasan Sistem, Direktori Pengguna & Audit
            </h3>
            <p className="text-xs text-neutral-300 max-w-2xl leading-relaxed break-words">
              Pusat kendali terisolasi untuk mengaudit seluruh pendaftar, memvalidasi persetujuan kurasi galeri, memantau alokasi penyimpanan cloud Supabase, dan mencatat riwayat keamanan sistem secara real-time.
            </p>
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onNavigate('admin-portal');
            }}
            className="vec-admin-btn w-full md:w-auto justify-center inline-flex items-center gap-2 px-5 py-3 rounded-xl text-xs sm:text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-500 transition shadow-lg shadow-emerald-950/50 cursor-pointer shrink-0"
          >
            <ShieldCheck className="w-4 h-4 text-white shrink-0" />
            <span>Buka Ruang Kontrol Admin</span>
            <ArrowRight className="w-4 h-4 shrink-0" />
          </button>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* CURATOR'S SELECTION / RECENT VERIFIED MASTERPIECES PREVIEW   */}
      {/* ------------------------------------------------------------- */}
      <section className="space-y-6 pt-2 sm:pt-4 min-w-0 w-full">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 sm:gap-4">
          <div>
            <div className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">Koleksi Terpilih</div>
            <h2 className="text-xl sm:text-3xl font-bold text-white tracking-tight mt-1 break-words">
              Karya Seni Terverifikasi Terbaru
            </h2>
          </div>
          <button
            onClick={() => onNavigate('vault')}
            className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer transition shrink-0"
          >
            <span>Lihat Semua Koleksi di Katalog</span>
            <ArrowRight className="w-3.5 h-3.5 shrink-0" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          
          {/* Showcase Item 1 */}
          <div 
            onClick={() => onNavigate('vault')}
            className="vec-showcase-card group cursor-pointer rounded-2xl overflow-hidden border border-neutral-800 bg-neutral-900/40 hover:border-neutral-700 transition duration-300 flex flex-col min-w-0"
          >
            <div className="relative h-44 sm:h-48 overflow-hidden">
              <img
                src="/assets/images/vec_vault_artwork_1792494925679.jpg"
                alt="Gelap dan Cahaya"
                className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                referrerPolicy="no-referrer"
              />
              <div className="absolute top-3 left-3 bg-black/80 px-2.5 py-1 rounded text-[10px] font-medium text-emerald-300 border border-emerald-500/40">
                ASLI & RESMI
              </div>
            </div>
            <div className="vec-showcase-panel p-4 space-y-2 flex-1 flex flex-col justify-between">
              <div>
                <h4 className="font-semibold text-white group-hover:text-cyan-300 transition text-sm">
                  Cahaya di Balik Obsidian
                </h4>
                <p className="text-xs text-neutral-400 mt-1 line-clamp-2">
                  Dokumentasi resmi karya seni dengan bukti keaslian kamera yang terverifikasi.
                </p>
              </div>
              <div className="vec-showcase-meta pt-2 border-t border-neutral-800 flex items-center justify-between text-[11px] text-neutral-400">
                <span>Tingkat Keaslian:</span>
                <span className="text-emerald-400 font-bold">99.40%</span>
              </div>
            </div>
          </div>

          {/* Showcase Item 2 */}
          <div 
            onClick={() => onNavigate('vault')}
            className="vec-showcase-card group cursor-pointer rounded-2xl overflow-hidden border border-neutral-800 bg-neutral-900/40 hover:border-neutral-700 transition duration-300 flex flex-col min-w-0"
          >
            <div className="relative h-44 sm:h-48 overflow-hidden">
              <img
                src="/assets/images/vec_hero_camera_1792494926035.jpg"
                alt="Segel Pengaman Kanvas"
                className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                referrerPolicy="no-referrer"
              />
              <div className="absolute top-3 left-3 bg-black/80 px-2.5 py-1 rounded text-[10px] font-medium text-cyan-300 border border-cyan-500/40">
                KAMERA RESMI
              </div>
            </div>
            <div className="vec-showcase-panel p-4 space-y-2 flex-1 flex flex-col justify-between">
              <div>
                <h4 className="font-semibold text-white group-hover:text-cyan-300 transition text-sm">
                  Detail Segel Pengaman Kanvas
                </h4>
                <p className="text-xs text-neutral-400 mt-1 line-clamp-2">
                  Dokumentasi makro segel pengaman fisik yang tertanam pada permukaan kanvas linen murni.
                </p>
              </div>
              <div className="vec-showcase-meta pt-2 border-t border-neutral-800 flex items-center justify-between text-[11px] text-neutral-400">
                <span>Tingkat Keaslian:</span>
                <span className="text-emerald-400 font-bold">99.80%</span>
              </div>
            </div>
          </div>

          {/* Showcase Item 3 */}
          <div 
            onClick={() => onNavigate('vault')}
            className="vec-showcase-card group cursor-pointer rounded-2xl overflow-hidden border border-neutral-800 bg-neutral-900/40 hover:border-neutral-700 transition duration-300 flex flex-col min-w-0 sm:col-span-2 lg:col-span-1"
          >
            <div className="relative h-44 sm:h-48 overflow-hidden">
              <img
                src="/assets/images/vec_curator_portrait_1792494927295.jpg"
                alt="Ulasan Kurator Berpengalaman"
                className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                referrerPolicy="no-referrer"
              />
              <div className="absolute top-3 left-3 bg-black/80 px-2.5 py-1 rounded text-[10px] font-medium text-purple-300 border border-purple-500/40">
                REKAMAN SUARA
              </div>
            </div>
            <div className="vec-showcase-panel p-4 space-y-2 flex-1 flex flex-col justify-between">
              <div>
                <h4 className="font-semibold text-white group-hover:text-cyan-300 transition text-sm">
                  Ulasan Kurator Berpengalaman
                </h4>
                <p className="text-xs text-neutral-400 mt-1 line-clamp-2">
                  Ulasan audio resmi dari kurator master yang mengonfirmasi nilai dan keaslian karya.
                </p>
              </div>
              <div className="vec-showcase-meta pt-2 border-t border-neutral-800 flex items-center justify-between text-[11px] text-neutral-400">
                <span>Status Bukti:</span>
                <span className="text-purple-400 font-bold">TERVERIFIKASI</span>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* ACTION BANNER                                                 */}
      {/* ------------------------------------------------------------- */}
      <section className="vec-cta-banner bg-gradient-to-r from-neutral-900 via-neutral-950 to-neutral-900 border border-neutral-800 rounded-2xl sm:rounded-3xl p-5 sm:p-8 lg:p-10 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl min-w-0 w-full">
        <div className="space-y-2 text-center md:text-left min-w-0 w-full">
          <div className="vec-cta-badge text-xs font-semibold text-cyan-400 flex items-center justify-center md:justify-start gap-1.5">
            <Fingerprint className="w-4 h-4 text-cyan-400 shrink-0" />
            <span>STANDAR KEASLIAN RESMI VEROIA</span>
          </div>
          <h3 className="vec-cta-title text-lg sm:text-2xl font-bold text-white tracking-tight break-words">
            Mulai Ambil Foto Terverifikasi Asli
          </h3>
          <p className="vec-cta-desc text-xs sm:text-sm text-neutral-400 max-w-xl break-words">
            Gunakan kamera kami untuk mengambil foto asli dengan bukti keaslian digital dan sertifikat resmi yang langsung tersimpan aman.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center md:justify-end gap-2.5 sm:gap-3 shrink-0 w-full md:w-auto">
          {onOpenRegisterModal && (
            <button
              onClick={onOpenRegisterModal}
              className="w-full sm:w-auto justify-center px-4 sm:px-5 py-2.5 sm:py-3 rounded-xl text-xs sm:text-sm font-semibold text-cyan-200 hover:text-white bg-cyan-950/70 hover:bg-cyan-900 border border-cyan-500/50 hover:border-cyan-400 transition cursor-pointer shadow-lg shadow-cyan-950/50 flex items-center gap-2"
            >
              <KeyRound className="w-4 h-4 text-cyan-400 shrink-0" />
              <span>Daftar Brankas Baru</span>
            </button>
          )}

          <button
            onClick={() => onNavigate('studio')}
            className="w-full sm:w-auto justify-center px-5 sm:px-6 py-2.5 sm:py-3 rounded-xl text-xs sm:text-sm font-semibold text-white bg-cyan-600 hover:bg-cyan-500 transition shadow-lg shadow-cyan-950/50 cursor-pointer"
          >
            Buka Studio Foto
          </button>
          
          <button
            onClick={() => onNavigate('vault')}
            className="w-full sm:w-auto justify-center px-4 sm:px-5 py-2.5 sm:py-3 rounded-xl text-xs sm:text-sm font-medium text-neutral-300 hover:text-white bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 transition cursor-pointer"
          >
            Lihat Katalog Karya
          </button>

          <button
            onClick={() => onNavigate('admin-portal')}
            className="w-full sm:w-auto justify-center px-4 sm:px-5 py-2.5 sm:py-3 rounded-xl text-xs sm:text-sm font-semibold text-emerald-300 hover:text-white bg-emerald-950/60 hover:bg-emerald-900 border border-emerald-500/40 transition cursor-pointer flex items-center gap-1.5"
          >
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Ruang Kontrol Admin</span>
          </button>
        </div>
      </section>

    </div>
  );
};

