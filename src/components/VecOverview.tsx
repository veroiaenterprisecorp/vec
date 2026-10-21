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
  KeyRound
} from 'lucide-react';

interface VecOverviewProps {
  onNavigate: (tab: string) => void;
}

export const VecOverview: React.FC<VecOverviewProps> = ({ onNavigate }) => {
  return (
    <div className="space-y-20 py-4 font-sans text-neutral-100">
      
      {/* ------------------------------------------------------------- */}
      {/* HERO SECTION - LUXURY ENTERPRISE ATTESTATION                 */}
      {/* ------------------------------------------------------------- */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-neutral-900 via-[#030611] to-[#020409] border border-neutral-800/90 p-6 sm:p-10 lg:p-14 shadow-2xl">
        
        {/* Ambient Subtle Radial Glow */}
        <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-cyan-500/5 rounded-full blur-3xl pointer-events-none -z-0"></div>
        <div className="absolute bottom-0 left-10 w-[450px] h-[450px] bg-blue-600/5 rounded-full blur-3xl pointer-events-none -z-0"></div>

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
          
          {/* Left Column: Editorial Value Proposition */}
          <div className="lg:col-span-7 space-y-7">
            
            {/* Quiet Unboxed Metadata Lead-in */}
            <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-neutral-400">
              <span className="text-cyan-400 font-semibold uppercase tracking-wider">Veroia Zero-Trust</span>
              <span aria-hidden="true" className="text-neutral-600">·</span>
              <span>C2PA v2.1 Content Authenticity</span>
              <span aria-hidden="true" className="text-neutral-600">·</span>
              <span>Hardware TEE Enclave</span>
              <span aria-hidden="true" className="text-neutral-600">·</span>
              <span>NTAG424 DNA</span>
            </div>

            {/* Display Headline with Balancce */}
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight text-white leading-[1.12]" style={{ textWrap: 'balance' }}>
              Autentikasi Karya Seni & Jepretan Hardware Tanpa Kompromi
            </h1>

            {/* Prose */}
            <p className="text-sm sm:text-base text-neutral-300 leading-relaxed max-w-2xl font-normal">
              Platform pembuktian keaslian multi-lapis untuk Veroia Enterprise Corp yang menghubungkan tanda tangan kriptografis sensor CMOS kamera, segel fisik NFC NTAG424 DNA, dan proteksi geoprivasi PostGIS langsung ke cluster Supabase cloud berstandar institusional.
            </p>

            {/* High-Intent Primary CTAs */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                onClick={() => onNavigate('vault')}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl text-xs sm:text-sm font-semibold text-white bg-cyan-600 hover:bg-cyan-500 transition shadow-lg shadow-cyan-950/40 cursor-pointer"
              >
                <span>Jelajahi Katalog Karya</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => onNavigate('studio')}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl text-xs sm:text-sm font-semibold text-white bg-neutral-900 hover:bg-neutral-800 border border-neutral-700/80 hover:border-cyan-500/50 transition cursor-pointer"
              >
                <Camera className="w-4 h-4 text-cyan-400" />
                <span>Buka Studio Sensor C2PA</span>
              </button>

              <button
                onClick={() => onNavigate('private-vault')}
                className="inline-flex items-center gap-2 px-4 py-3 rounded-xl text-xs sm:text-sm font-semibold text-neutral-300 hover:text-white bg-neutral-950/60 hover:bg-neutral-900 border border-neutral-800 transition cursor-pointer"
              >
                <Lock className="w-3.5 h-3.5 text-emerald-400" />
                <span>Brankas Kolektor</span>
              </button>
            </div>

            {/* Trust Markers */}
            <div className="pt-4 border-t border-neutral-800/80 flex flex-wrap items-center gap-6 text-xs text-neutral-400">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Sony A7RV & Leica M11-P TEE Enclave</span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0" />
                <span>Immutable RAW SHA-256 Digest</span>
              </div>
            </div>

          </div>

          {/* Right Column: Hero Visual Attestation Showcase */}
          <div className="lg:col-span-5 relative">
            <div className="relative rounded-2xl overflow-hidden border border-neutral-700/80 bg-neutral-950 shadow-2xl group">
              <img
                src="/assets/images/vec_hero_camera_1792494926035.jpg"
                alt="VEC Hardware Camera Attestation"
                className="w-full h-84 sm:h-96 object-cover object-center group-hover:scale-102 transition duration-700"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  const el = e.currentTarget;
                  if (!el.src.includes('vec_vault_artwork')) {
                    el.src = '/assets/images/vec_vault_artwork_1792494925679.jpg';
                  }
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/35 to-transparent"></div>

              {/* Verified Enclave Overlay Badge */}
              <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
                <div className="bg-black/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-cyan-500/40 text-xs font-mono text-cyan-300 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Hardware TEE Attested</span>
                </div>
                <div className="bg-black/80 backdrop-blur-md px-2.5 py-1 rounded-lg border border-neutral-700 text-[11px] font-mono text-neutral-300">
                  C2PA RAW
                </div>
              </div>

              {/* Cryptographic Card at Bottom */}
              <div className="absolute bottom-4 left-4 right-4 bg-neutral-900/90 backdrop-blur-md p-3.5 rounded-xl border border-neutral-800 text-xs space-y-1.5">
                <div className="flex items-center justify-between font-mono">
                  <span className="text-neutral-400 text-[11px]">C2PA Cryptographic Signature:</span>
                  <span className="text-emerald-400 font-bold text-[11px]">VALID</span>
                </div>
                <div className="text-[11px] font-mono text-cyan-300 truncate">
                  SHA256: 9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822c...
                </div>
                <div className="flex items-center justify-between text-[11px] text-neutral-400 pt-1 border-t border-neutral-800">
                  <span>Integritas Sensor Fisik</span>
                  <span className="text-emerald-400">Terverifikasi 100%</span>
                </div>
              </div>

            </div>
          </div>

        </div>

        {/* 4-Column KPI Provenance Strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-10 pt-8 border-t border-neutral-800/80">
          <div className="p-4 rounded-xl bg-neutral-950/60 border border-neutral-800/80">
            <div className="text-2xl sm:text-3xl font-bold font-mono text-white tabular-nums">99.4%</div>
            <div className="text-xs text-neutral-400 mt-1">Keandalan Hardware Enclave</div>
          </div>
          <div className="p-4 rounded-xl bg-neutral-950/60 border border-neutral-800/80">
            <div className="text-2xl sm:text-3xl font-bold font-mono text-cyan-400 tabular-nums">C2PA v2.1</div>
            <div className="text-xs text-neutral-400 mt-1">Standar Manifes Internasional</div>
          </div>
          <div className="p-4 rounded-xl bg-neutral-950/60 border border-neutral-800/80">
            <div className="text-2xl sm:text-3xl font-bold font-mono text-amber-400 tabular-nums">NTAG424</div>
            <div className="text-xs text-neutral-400 mt-1">Chip Kriptografi Fisik Kanvas</div>
          </div>
          <div className="p-4 rounded-xl bg-neutral-950/60 border border-neutral-800/80">
            <div className="text-2xl sm:text-3xl font-bold font-mono text-emerald-400 tabular-nums">Supabase</div>
            <div className="text-xs text-neutral-400 mt-1">Row-Level Security PostgreSQL</div>
          </div>
        </div>

      </section>

      {/* ------------------------------------------------------------- */}
      {/* FOUR CORE PILLARS SECTION                                     */}
      {/* ------------------------------------------------------------- */}
      <section className="space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <div className="text-xs font-mono text-cyan-400 uppercase tracking-wider">Arsitektur Terpercaya</div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight mt-1">
              Empat Pilar Integritas Zero-Trust VEC
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-neutral-400 max-w-md">
            Dirancang dari lapisan silikon hardware kamera, chip NFC fisik, hingga enkripsi cloud database terdistribusi.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Card 1: Sensor Hardware Attestation */}
          <div 
            onClick={() => onNavigate('studio')}
            className="group cursor-pointer bg-neutral-900/60 hover:bg-neutral-900 border border-neutral-800 hover:border-cyan-500/50 rounded-2xl p-6 transition duration-300 flex flex-col justify-between space-y-5 shadow-lg"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                  <Camera className="w-5 h-5" />
                </div>
                <span className="text-xs font-medium text-cyan-400 group-hover:translate-x-1 transition-transform flex items-center gap-1">
                  Uji Studio <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
              <h3 className="text-lg font-bold text-white">
                01. Hardware Sensor Attestation
              </h3>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Setiap foto diambil langsung lewat antarmuka sensor CMOS hardware tanpa manipulasi eksternal. Checksum SHA-256 dihitung seketika di dalam Secure Enclave sehingga kebal terhadap rekonstruksi AI generatif.
              </p>
            </div>

            <div className="relative h-44 rounded-xl overflow-hidden border border-neutral-800">
              <img
                src="/assets/images/vec_chip_nfc_1792494926609.jpg"
                alt="Cryptographic Hardware Chip"
                className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-neutral-950/80 via-transparent to-transparent"></div>
              <div className="absolute bottom-2.5 left-3 text-[11px] font-mono text-cyan-300">
                Secure Enclave TEE & Silikon Kriptografi
              </div>
            </div>
          </div>

          {/* Card 2: Live Art Vault & Provenance */}
          <div 
            onClick={() => onNavigate('vault')}
            className="group cursor-pointer bg-neutral-900/60 hover:bg-neutral-900 border border-neutral-800 hover:border-emerald-500/50 rounded-2xl p-6 transition duration-300 flex flex-col justify-between space-y-5 shadow-lg"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <Award className="w-5 h-5" />
                </div>
                <span className="text-xs font-medium text-emerald-400 group-hover:translate-x-1 transition-transform flex items-center gap-1">
                  Buka Vault <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
              <h3 className="text-lg font-bold text-white">
                02. Pameran Masterwork & Silsilah Provenance
              </h3>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Karya seni fisik terhubung ke chip NTAG424 DNA yang tertanam pada karya fisik. Dilengkapi catatan suara kurator berbobot reputasi dengan pemutar audio visual dan riwayat kepemilikan terverifikasi.
              </p>
            </div>

            <div className="relative h-44 rounded-xl overflow-hidden border border-neutral-800">
              <img
                src="/assets/images/vec_vault_artwork_1792494925679.jpg"
                alt="Museum Vault Exhibition"
                className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-neutral-950/80 via-transparent to-transparent"></div>
              <div className="absolute bottom-2.5 left-3 text-[11px] font-mono text-emerald-300">
                Pameran Galeri & Catatan Silsilah Terverifikasi
              </div>
            </div>
          </div>

          {/* Card 3: Collector Enclave & Privacy */}
          <div 
            onClick={() => onNavigate('private-vault')}
            className="group cursor-pointer bg-neutral-900/60 hover:bg-neutral-900 border border-neutral-800 hover:border-amber-500/50 rounded-2xl p-6 transition duration-300 flex flex-col justify-between space-y-5 shadow-lg"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <MapPin className="w-5 h-5" />
                </div>
                <span className="text-xs font-medium text-amber-400 group-hover:translate-x-1 transition-transform flex items-center gap-1">
                  Brankas Kolektor <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
              <h3 className="text-lg font-bold text-white">
                03. Brankas Kolektor & Geoprivasi Diferensial
              </h3>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Koleksi pribadi Anda disimpan secara aman dengan enkripsi lokal IndexedDB dan opsi unggah ke Supabase Cloud. Koordinat studio seniman terlindungi oleh PostGIS Differential Geoprivacy.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800/80 font-mono text-xs space-y-2">
              <div className="flex justify-between text-neutral-400">
                <span>Enkripsi Penyimpanan:</span>
                <span className="text-emerald-400">Lokal IDB + Cloud Supabase</span>
              </div>
              <div className="flex justify-between text-neutral-400">
                <span>Proteksi Geospasial:</span>
                <span className="text-amber-300">PostGIS ST_Project Fuzzing</span>
              </div>
              <div className="flex justify-between text-neutral-400">
                <span>Kontrol Akses:</span>
                <span className="text-cyan-300">Row-Level Security (RLS)</span>
              </div>
            </div>
          </div>

          {/* Card 4: Global Enterprise & Edge Architecture */}
          <div 
            onClick={() => onNavigate('vault')}
            className="group cursor-pointer bg-neutral-900/60 hover:bg-neutral-900 border border-neutral-800 hover:border-purple-500/50 rounded-2xl p-6 transition duration-300 flex flex-col justify-between space-y-5 shadow-lg"
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
                04. Kepatuhan Galeri & Rumah Lelang
              </h3>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Memenuhi standar sertifikasi galeri internasional, rumah lelang, dan kurator seni rupa kontemporer untuk memastikan keaslian fisik karya tidak dapat dipalsukan sepanjang masa.
              </p>
            </div>

            <div className="relative h-44 rounded-xl overflow-hidden border border-neutral-800">
              <img
                src="/assets/images/vec_curator_portrait_1792494927295.jpg"
                alt="Master Curator Review"
                className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-neutral-950/80 via-transparent to-transparent"></div>
              <div className="absolute bottom-2.5 left-3 text-[11px] font-mono text-purple-300">
                Audit Kurator Institusional & Sertifikasi
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* CURATOR'S SELECTION / RECENT VERIFIED MASTERPIECES PREVIEW   */}
      {/* ------------------------------------------------------------- */}
      <section className="space-y-6 pt-4">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <div className="text-xs font-mono text-emerald-400 uppercase tracking-wider">Koleksi Terpilih</div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight mt-1">
              Karya Seni Terverifikasi Terbaru
            </h2>
          </div>
          <button
            onClick={() => onNavigate('vault')}
            className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer transition"
          >
            <span>Lihat Semua Koleksi di Vault</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          
          {/* Showcase Item 1 */}
          <div 
            onClick={() => onNavigate('vault')}
            className="group cursor-pointer rounded-2xl overflow-hidden border border-neutral-800 bg-neutral-900/40 hover:border-neutral-700 transition duration-300 flex flex-col"
          >
            <div className="relative h-48 overflow-hidden">
              <img
                src="/assets/images/vec_vault_artwork_1792494925679.jpg"
                alt="Gelap dan Cahaya"
                className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                referrerPolicy="no-referrer"
              />
              <div className="absolute top-3 left-3 bg-black/80 px-2.5 py-1 rounded text-[10px] font-mono text-emerald-300 border border-emerald-500/40">
                TEE ATT_OK
              </div>
            </div>
            <div className="p-4 space-y-2 flex-1 flex flex-col justify-between">
              <div>
                <h4 className="font-semibold text-white group-hover:text-cyan-300 transition text-sm">
                  Cahaya di Balik Obsidian
                </h4>
                <p className="text-xs text-neutral-400 mt-1 line-clamp-2">
                  Tangkapan sensor Leica M11-P dengan manifes C2PA v2.1 terenkripsi.
                </p>
              </div>
              <div className="pt-2 border-t border-neutral-800 flex items-center justify-between text-[11px] font-mono text-neutral-400">
                <span>Skor Keaslian:</span>
                <span className="text-emerald-400 font-bold">99.40%</span>
              </div>
            </div>
          </div>

          {/* Showcase Item 2 */}
          <div 
            onClick={() => onNavigate('vault')}
            className="group cursor-pointer rounded-2xl overflow-hidden border border-neutral-800 bg-neutral-900/40 hover:border-neutral-700 transition duration-300 flex flex-col"
          >
            <div className="relative h-48 overflow-hidden">
              <img
                src="/assets/images/vec_hero_camera_1792494926035.jpg"
                alt="Sensor Enclave Macro"
                className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                referrerPolicy="no-referrer"
              />
              <div className="absolute top-3 left-3 bg-black/80 px-2.5 py-1 rounded text-[10px] font-mono text-cyan-300 border border-cyan-500/40">
                SONY_A7RV
              </div>
            </div>
            <div className="p-4 space-y-2 flex-1 flex flex-col justify-between">
              <div>
                <h4 className="font-semibold text-white group-hover:text-cyan-300 transition text-sm">
                  Silikon Kriptografis M1
                </h4>
                <p className="text-xs text-neutral-400 mt-1 line-clamp-2">
                  Dokumentasi makro chip NTAG424 DNA pada permukaan kanvas linen murni.
                </p>
              </div>
              <div className="pt-2 border-t border-neutral-800 flex items-center justify-between text-[11px] font-mono text-neutral-400">
                <span>Skor Keaslian:</span>
                <span className="text-emerald-400 font-bold">99.80%</span>
              </div>
            </div>
          </div>

          {/* Showcase Item 3 */}
          <div 
            onClick={() => onNavigate('vault')}
            className="group cursor-pointer rounded-2xl overflow-hidden border border-neutral-800 bg-neutral-900/40 hover:border-neutral-700 transition duration-300 flex flex-col"
          >
            <div className="relative h-48 overflow-hidden">
              <img
                src="/assets/images/vec_curator_portrait_1792494927295.jpg"
                alt="Kurator Catatan Audio"
                className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                referrerPolicy="no-referrer"
              />
              <div className="absolute top-3 left-3 bg-black/80 px-2.5 py-1 rounded text-[10px] font-mono text-purple-300 border border-purple-500/40">
                VOICE_PROVENANCE
              </div>
            </div>
            <div className="p-4 space-y-2 flex-1 flex flex-col justify-between">
              <div>
                <h4 className="font-semibold text-white group-hover:text-cyan-300 transition text-sm">
                  Evaluasi Kurator Berbobot
                </h4>
                <p className="text-xs text-neutral-400 mt-1 line-clamp-2">
                  Catatan audio berbobot reputasi dengan waveform interaktif dari kurator master.
                </p>
              </div>
              <div className="pt-2 border-t border-neutral-800 flex items-center justify-between text-[11px] font-mono text-neutral-400">
                <span>Status Bukti:</span>
                <span className="text-purple-400 font-bold">TERSEGEL</span>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* ENTERPRISE ACTION BANNER                                       */}
      {/* ------------------------------------------------------------- */}
      <section className="bg-gradient-to-r from-neutral-900 via-neutral-950 to-neutral-900 border border-neutral-800 rounded-3xl p-8 sm:p-10 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
        <div className="space-y-2 text-center md:text-left">
          <div className="text-xs font-mono text-cyan-400 flex items-center justify-center md:justify-start gap-1.5">
            <Fingerprint className="w-4 h-4 text-cyan-400" />
            <span>STANDARISASI HARDWARE ZERO-TRUST</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Mulai Uji Coba Pengambilan Foto Terverifikasi Hardware
          </h3>
          <p className="text-xs sm:text-sm text-neutral-400 max-w-xl">
            Akses langsung kamera sensor C2PA kami untuk menghasilkan tangkapan gambar asli dengan hash SHA-256 dan stempel kriptografis instan ke Supabase.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3 shrink-0">
          <button
            onClick={() => onNavigate('studio')}
            className="px-6 py-3 rounded-xl text-xs sm:text-sm font-semibold text-white bg-cyan-600 hover:bg-cyan-500 transition shadow-lg shadow-cyan-950/50 cursor-pointer"
          >
            Buka Studio Sensor Kamera
          </button>
          
          <button
            onClick={() => onNavigate('vault')}
            className="px-5 py-3 rounded-xl text-xs sm:text-sm font-medium text-neutral-300 hover:text-white bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 transition cursor-pointer"
          >
            Buka Katalog Vault
          </button>
        </div>
      </section>

    </div>
  );
};
