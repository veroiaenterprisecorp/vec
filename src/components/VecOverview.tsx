import React from 'react';
import { 
  ShieldCheck, 
  Camera, 
  MapPin, 
  Lock, 
  Radio, 
  GitBranch, 
  Database, 
  ArrowRight, 
  Cpu, 
  Award,
  CheckCircle2,
  Workflow
} from 'lucide-react';

interface VecOverviewProps {
  onNavigate: (tab: 'overview' | 'private-vault' | 'vault' | 'studio' | 'spatial' | 'sync' | 'architecture') => void;
}

export const VecOverview: React.FC<VecOverviewProps> = ({ onNavigate }) => {
  return (
    <div className="space-y-16 py-4">
      
      {/* ------------------------------------------------------------- */}
      {/* HERO SECTION                                                  */}
      {/* ------------------------------------------------------------- */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-slate-900 via-[#050C1E] to-[#030712] border border-slate-800/80 p-6 sm:p-10 lg:p-12 shadow-2xl">
        {/* Ambient Glow */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none -z-0"></div>
        <div className="absolute bottom-0 left-10 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl pointer-events-none -z-0"></div>

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          
          {/* Left Column: Value Proposition & Prose */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Unboxed Metadata Header */}
            <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-slate-400">
              <span className="text-cyan-400 font-semibold uppercase tracking-wider">VEC Zero-Trust Architecture</span>
              <span aria-hidden="true" className="text-slate-600">·</span>
              <span>C2PA v2.1 Manifest</span>
              <span aria-hidden="true" className="text-slate-600">·</span>
              <span>PostgreSQL 16 & PostGIS 3.4</span>
              <span aria-hidden="true" className="text-slate-600">·</span>
              <span>NTAG424 DNA NFC</span>
            </div>

            {/* Balanced Display Headline */}
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white leading-[1.15]" style={{ textWrap: 'balance' }}>
              Autentikasi Karya Seni & Jepretan Hardware Tanpa Kompromi
            </h1>

            {/* Clear, Professional Description */}
            <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-2xl font-normal">
              Platform pembuktian keaslian multi-lapis untuk Veroia Enterprise Corp yang menghubungkan tanda tangan kriptografis CMOS sensor, chip fisik NFC NTAG424 DNA, dan proteksi geoprivasi PostGIS secara otomatis ke cluster Supabase Anda.
            </p>

            {/* High-Intent CTAs */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                onClick={() => onNavigate('private-vault')}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl text-xs sm:text-sm font-semibold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 transition shadow-lg shadow-emerald-950/40 cursor-pointer"
              >
                <Lock className="w-4 h-4" />
                <span>Brankas Pribadi Saya</span>
              </button>

              <button
                onClick={() => onNavigate('vault')}
                className="inline-flex items-center gap-2 px-4 py-3 rounded-xl text-xs sm:text-sm font-semibold text-white bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 transition shadow-lg shadow-cyan-950/40 cursor-pointer"
              >
                <span>Jelajahi Live Vault</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => onNavigate('studio')}
                className="inline-flex items-center gap-2 px-4 py-3 rounded-xl text-xs sm:text-sm font-semibold text-slate-200 bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 transition cursor-pointer"
              >
                <Camera className="w-4 h-4 text-cyan-400" />
                <span>Uji Sensor Hardware</span>
              </button>

              <button
                onClick={() => onNavigate('sync')}
                className="inline-flex items-center gap-2 px-4 py-3 rounded-xl text-xs sm:text-sm font-semibold text-emerald-300 bg-emerald-950/40 hover:bg-emerald-900/50 border border-emerald-800/60 transition cursor-pointer"
              >
                <Workflow className="w-4 h-4 text-emerald-400" />
                <span>Pusat Sinkronisasi GitHub & Supabase</span>
              </button>
            </div>

            {/* Trust Markers */}
            <div className="pt-4 border-t border-slate-800/80 flex flex-wrap items-center gap-6 text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Sony A7RV & Leica M11-P TEE Enclave</span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0" />
                <span>Immutable SHA-256 RAW Checksum</span>
              </div>
            </div>

          </div>

          {/* Right Column: Hero Visual Showcase */}
          <div className="lg:col-span-5 relative">
            <div className="relative rounded-2xl overflow-hidden border border-slate-700/80 bg-slate-950 shadow-2xl group">
              <img
                src="/src/assets/images/vec_hero_camera_1792494926035.jpg"
                alt="VEC Hardware Camera Attestation"
                className="w-full h-80 sm:h-96 object-cover object-center group-hover:scale-102 transition duration-700"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent"></div>

              {/* Live HUD Badges on Hero Image */}
              <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
                <div className="bg-black/75 backdrop-blur-md px-3 py-1.5 rounded-xl border border-cyan-500/40 text-xs font-mono text-cyan-300 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Hardware TEE Attested</span>
                </div>
                <div className="bg-black/75 backdrop-blur-md px-2.5 py-1 rounded-xl border border-slate-700 text-[11px] font-mono text-slate-300">
                  RAW DNG
                </div>
              </div>

              <div className="absolute bottom-4 left-4 right-4 bg-slate-900/90 backdrop-blur-md p-3.5 rounded-xl border border-slate-800/90 text-xs space-y-1.5">
                <div className="flex items-center justify-between font-mono">
                  <span className="text-slate-400 text-[11px]">C2PA Cryptographic Signature:</span>
                  <span className="text-emerald-400 font-bold text-[11px]">VALID</span>
                </div>
                <div className="text-[11px] font-mono text-cyan-300 truncate">
                  SHA256: 9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822c...
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-800">
                  <span>Lokasi Pengambilan</span>
                  <span className="text-emerald-400">Proteksi Geoprivasi Aktif</span>
                </div>
              </div>

            </div>
          </div>

        </div>

        {/* 4-Column KPI Trust Strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 pt-8 border-t border-slate-800/80">
          <div className="p-4 rounded-xl bg-slate-950/50 border border-slate-800/60">
            <div className="text-2xl sm:text-3xl font-bold font-mono text-white tabular-nums">99.4%</div>
            <div className="text-xs text-slate-400 mt-1">Keandalan Bukti Hardware</div>
          </div>
          <div className="p-4 rounded-xl bg-slate-950/50 border border-slate-800/60">
            <div className="text-2xl sm:text-3xl font-bold font-mono text-cyan-400 tabular-nums">500m</div>
            <div className="text-xs text-slate-400 mt-1">Fuzzing Dinamis PostGIS</div>
          </div>
          <div className="p-4 rounded-xl bg-slate-950/50 border border-slate-800/60">
            <div className="text-2xl sm:text-3xl font-bold font-mono text-amber-400 tabular-nums">AES-256</div>
            <div className="text-xs text-slate-400 mt-1">Enkripsi NFC NTAG424 DNA</div>
          </div>
          <div className="p-4 rounded-xl bg-slate-950/50 border border-slate-800/60">
            <div className="text-2xl sm:text-3xl font-bold font-mono text-emerald-400 tabular-nums">100%</div>
            <div className="text-xs text-slate-400 mt-1">Privasi Klien & Local RLS</div>
          </div>
        </div>

      </section>

      {/* ------------------------------------------------------------- */}
      {/* FOUR CORE PILLARS BENTO SECTION                               */}
      {/* ------------------------------------------------------------- */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <div className="text-xs font-mono text-cyan-400 uppercase tracking-wider">Arsitektur Modular</div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight mt-1">
              Empat Pilar Integritas Zero-Trust VEC
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 max-w-md">
            Dirancang dari level silikon hardware, lapisan database relasional spasial, hingga sinkronisasi otomatis ke GitHub dan Supabase.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Bento Card 1: Sensor Hardware Attestation */}
          <div 
            onClick={() => onNavigate('studio')}
            className="group cursor-pointer bg-slate-900/80 hover:bg-slate-900 border border-slate-800 hover:border-cyan-500/50 rounded-2xl p-6 transition duration-300 flex flex-col justify-between space-y-5 shadow-lg"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                  <Camera className="w-5 h-5" />
                </div>
                <span className="text-xs font-mono text-cyan-400 group-hover:translate-x-1 transition-transform flex items-center gap-1">
                  Uji Studio <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
              <h3 className="text-lg font-bold text-white">
                1. Hardware Sensor Attestation
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Setiap foto diambil langsung lewat antarmuka sensor CMOS hardware (bukan import galeri). Checksum SHA-256 dihasilkan instan di dalam Secure Enclave sehingga kebal manipulasi AI generatif.
              </p>
            </div>

            <div className="relative h-44 rounded-xl overflow-hidden border border-slate-800">
              <img
                src="/src/assets/images/vec_chip_nfc_1792494926609.jpg"
                alt="Cryptographic Hardware Chip"
                className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent"></div>
              <div className="absolute bottom-2.5 left-3 text-[11px] font-mono text-cyan-300">
                Secure Enclave TEE & NXP Silicon
              </div>
            </div>
          </div>

          {/* Bento Card 2: Live Art Vault & Provenance */}
          <div 
            onClick={() => onNavigate('vault')}
            className="group cursor-pointer bg-slate-900/80 hover:bg-slate-900 border border-slate-800 hover:border-emerald-500/50 rounded-2xl p-6 transition duration-300 flex flex-col justify-between space-y-5 shadow-lg"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <Award className="w-5 h-5" />
                </div>
                <span className="text-xs font-mono text-emerald-400 group-hover:translate-x-1 transition-transform flex items-center gap-1">
                  Buka Vault <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
              <h3 className="text-lg font-bold text-white">
                2. Live Vault & Silsilah Provenance
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Catatan karya seni fisik terhubung ke chip NTAG424 DNA yang ditempel pada kanvas atau patung. Dilengkapi catatan suara kurator berbobot reputasi dengan pemutar audio visual.
              </p>
            </div>

            <div className="relative h-44 rounded-xl overflow-hidden border border-slate-800">
              <img
                src="/src/assets/images/vec_vault_artwork_1792494925679.jpg"
                alt="Museum Vault Exhibition"
                className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent"></div>
              <div className="absolute bottom-2.5 left-3 text-[11px] font-mono text-emerald-300">
                Pameran Galeri & Catatan Silsilah Terverifikasi
              </div>
            </div>
          </div>

          {/* Bento Card 3: PostGIS Geoprivacy */}
          <div 
            onClick={() => onNavigate('spatial')}
            className="group cursor-pointer bg-slate-900/80 hover:bg-slate-900 border border-slate-800 hover:border-amber-500/50 rounded-2xl p-6 transition duration-300 flex flex-col justify-between space-y-5 shadow-lg"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <MapPin className="w-5 h-5" />
                </div>
                <span className="text-xs font-mono text-amber-400 group-hover:translate-x-1 transition-transform flex items-center gap-1">
                  Radar Geospasial <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
              <h3 className="text-lg font-bold text-white">
                3. PostGIS Differential Geoprivacy
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Koordinat asli studio seniman dikunci dengan Row-Level Security (RLS). Publik hanya melihat koordinat acak terproyeksi menggunakan fungsi PostGIS <code className="text-amber-300">ST_Project</code> dalam radius aman.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 font-mono text-xs space-y-2">
              <div className="flex justify-between text-slate-400">
                <span>Exact Location:</span>
                <span className="text-rose-400">Terkunci RLS (Privat)</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Public Feed Point:</span>
                <span className="text-amber-300">ST_Project(~500m)</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Spatial Index:</span>
                <span className="text-emerald-400">GIST(fuzzed_geography)</span>
              </div>
            </div>
          </div>

          {/* Bento Card 4: GitHub & Supabase Sync */}
          <div 
            onClick={() => onNavigate('sync')}
            className="group cursor-pointer bg-slate-900/80 hover:bg-slate-900 border border-slate-800 hover:border-purple-500/50 rounded-2xl p-6 transition duration-300 flex flex-col justify-between space-y-5 shadow-lg"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
                  <GitBranch className="w-5 h-5" />
                </div>
                <span className="text-xs font-mono text-purple-400 group-hover:translate-x-1 transition-transform flex items-center gap-1">
                  Kontrol Sync <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
              <h3 className="text-lg font-bold text-white">
                4. Sinkronisasi GitHub ⟷ Supabase
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Repositori <code className="text-purple-300 font-mono">veroiaenterprisecorp/vec</code> dilengkapi pipeline otomatisasi GitHub Actions dan skrip migrasi CLI untuk menyelaraskan perubahan skema ke cluster database secara instan.
              </p>
            </div>

            <div className="relative h-44 rounded-xl overflow-hidden border border-slate-800">
              <img
                src="/src/assets/images/vec_curator_portrait_1792494927295.jpg"
                alt="Master Curator Review"
                className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent"></div>
              <div className="absolute bottom-2.5 left-3 text-[11px] font-mono text-purple-300">
                Automated CI/CD Migration & Governance
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* CALLOUT BANNER: GITHUB SYNCHRONIZATION READY                  */}
      {/* ------------------------------------------------------------- */}
      <section className="bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-1.5 text-center md:text-left">
          <div className="text-xs font-mono text-cyan-400 flex items-center justify-center md:justify-start gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>SIAP DISINKRONISASIKAN KE GITHUB</span>
          </div>
          <h3 className="text-xl font-bold text-white">
            Repositori GitHub & Database Supabase Siap Terkoneksi
          </h3>
          <p className="text-xs sm:text-sm text-slate-300 max-w-xl">
            Semua file migrasi (<code className="text-cyan-300 font-mono">supabase/migrations</code>) dan workflow CI/CD (<code className="text-cyan-300 font-mono">.github/workflows</code>) telah terpasang.
          </p>
        </div>

        <button
          onClick={() => onNavigate('sync')}
          className="px-6 py-3 rounded-xl text-xs sm:text-sm font-semibold text-white bg-cyan-600 hover:bg-cyan-500 transition shadow-lg shadow-cyan-950 shrink-0"
        >
          Buka Pusat Kontrol Sinkronisasi
        </button>
      </section>

    </div>
  );
};
