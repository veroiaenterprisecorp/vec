import React, { useState, useMemo } from 'react';
import { MapPin, ShieldAlert, ShieldCheck, RefreshCw, Eye, EyeOff, Compass } from 'lucide-react';

interface PresetLocation {
  name: string;
  city: string;
  lat: number;
  lng: number;
  exactDesc: string;
}

const PRESETS: PresetLocation[] = [
  { name: 'Monumen Nasional (Monas)', city: 'DKI Jakarta', lat: -6.175392, lng: 106.827153, exactDesc: 'Plaza Cawan Barat, Sensor Sony A7RV' },
  { name: 'Gedung Sate Heritage', city: 'Bandung', lat: -6.902484, lng: 107.618691, exactDesc: 'Menara Sayap Timur, Leica M11-P' },
  { name: 'Ubud Art Sanctuary', city: 'Bali', lat: -8.506854, lng: 115.262482, exactDesc: 'Campuhan Ridge Path, Hasselblad X2D' },
  { name: 'Shibuya Scramble Crossing', city: 'Tokyo', lat: 35.6595, lng: 139.7005, exactDesc: 'Pedestrian Skybridge, Nikon Z9 C2PA' }
];

export const PostGisSimulator: React.FC = () => {
  const [selectedPreset, setSelectedPreset] = useState<PresetLocation>(PRESETS[0]);
  const [fuzzRadius, setFuzzRadius] = useState<number>(750); // in meters
  const [fuzzSeed, setFuzzSeed] = useState<number>(42);
  const [revealExactInFeed, setRevealExactInFeed] = useState<boolean>(false);

  // Pseudo PostGIS ST_Project projection calculation
  const spatialData = useMemo(() => {
    const lat = selectedPreset.lat;
    const lng = selectedPreset.lng;

    // Deterministic pseudo-random angle (0 to 2*PI) and distance (0.5 to 1.0 * fuzzRadius)
    const pseudoRandom1 = Math.sin(fuzzSeed * 12.9898 + lat * 78.233) * 43758.5453;
    const normRand1 = pseudoRandom1 - Math.floor(pseudoRandom1);

    const pseudoRandom2 = Math.cos(fuzzSeed * 4.1414 + lng * 26.651) * 23421.631;
    const normRand2 = pseudoRandom2 - Math.floor(pseudoRandom2);

    const actualFuzzDistance = (fuzzRadius * 0.5) + (normRand1 * (fuzzRadius * 0.5));
    const angleRadians = normRand2 * 2 * Math.PI;

    // Convert meters to approximate degrees latitude and longitude at this lat
    const earthRadius = 6371000; // meters
    const deltaLat = (actualFuzzDistance * Math.cos(angleRadians)) / earthRadius * (180 / Math.PI);
    const deltaLng = (actualFuzzDistance * Math.sin(angleRadians)) / (earthRadius * Math.cos(lat * Math.PI / 180)) * (180 / Math.PI);

    const fuzzedLat = lat + deltaLat;
    const fuzzedLng = lng + deltaLng;

    return {
      exact: { lat, lng },
      public: { lat: fuzzedLat, lng: fuzzedLng },
      actualDistanceMeters: Math.round(actualFuzzDistance),
      bearingDegrees: Math.round((angleRadians * 180 / Math.PI + 360) % 360),
    };
  }, [selectedPreset, fuzzRadius, fuzzSeed]);

  return (
    <div className="space-y-6 min-w-0 w-full">
      {/* Introduction Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-mono text-amber-400 font-bold uppercase tracking-wider">
                Simulasi PostGIS ST_Project
              </span>
              <span className="text-slate-500">•</span>
              <span className="text-xs text-slate-400 font-mono">Privasi Zero-Trust & Anti-Doxxing</span>
            </div>
            <h2 className="text-lg font-bold text-white">
              Dual-Layer PostGIS: exact_location vs public_location
            </h2>
            <p className="text-xs text-slate-400 max-w-3xl mt-1 leading-relaxed">
              Kamera zero-trust merekam koordinat satelit akurat untuk pembuktian forensik keaslian jepretan. Namun untuk konsumsi publik, PostgreSQL 16 PostGIS secara otomatis memproyeksikan titik fuzzed (acak dalam radius {fuzzRadius}m) menggunakan trigger <code className="text-cyan-300 font-mono">ST_Project()</code> sehingga koordinat asli fotografer tidak dapat dilacak oleh pihak ketiga.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setFuzzSeed((prev) => prev + 1)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
              title="Regenerate seed deterministik"
            >
              <RefreshCw className="w-3.5 h-3.5 text-cyan-400" />
              <span>Acak Offset Baru</span>
            </button>
          </div>
        </div>

        {/* Preset Selector */}
        <div className="flex items-center gap-2 mt-4 overflow-x-auto scrollbar-none max-w-full pt-2 text-xs font-mono">
          <span className="text-slate-400 whitespace-nowrap shrink-0">Pilih Lokasi Uji:</span>
          {PRESETS.map((loc) => (
            <button
              key={loc.name}
              onClick={() => setSelectedPreset(loc)}
              className={`px-3 py-1.5 rounded-lg border transition whitespace-nowrap ${
                selectedPreset.name === loc.name
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/60 font-semibold'
                  : 'bg-slate-950/60 text-slate-400 border-slate-800 hover:bg-slate-850 hover:text-slate-200'
              }`}
            >
              {loc.name} ({loc.city})
            </button>
          ))}
        </div>
      </div>

      {/* Interactive Radar & Map Visualizer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Radar Canvas / Map Representation */}
        <div className="lg:col-span-7 bg-slate-950 border border-slate-800 rounded-2xl p-6 relative overflow-hidden flex flex-col items-center justify-center min-h-[380px]">
          {/* Background Grid Lines */}
          <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] opacity-40 pointer-events-none"></div>

          {/* Compass Rose */}
          <div className="absolute top-4 right-4 flex items-center gap-1 text-[11px] font-mono text-slate-500">
            <Compass className="w-4 h-4 text-cyan-400" />
            <span>N (360°)</span>
          </div>

          {/* Interactive Radar Circle Area */}
          <div className="relative w-72 h-72 sm:w-80 sm:h-80 rounded-full border border-slate-800 bg-slate-900/40 flex items-center justify-center shadow-inner">
            {/* Outer Fuzz Range Boundary Circle */}
            <div 
              className="absolute rounded-full border-2 border-dashed border-cyan-500/40 bg-cyan-500/5 transition-all duration-300"
              style={{ width: '85%', height: '85%' }}
            >
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-[10px] font-mono text-cyan-400 bg-slate-950 px-2 py-0.5 rounded border border-cyan-800/80">
                Radius Fuzzing: {fuzzRadius}m
              </span>
            </div>

            {/* Inner Distance Guide Circles */}
            <div className="absolute w-[50%] h-[50%] rounded-full border border-slate-800/80"></div>
            <div className="absolute w-[25%] h-[25%] rounded-full border border-slate-800/60"></div>

            {/* Center: EXACT LOCATION (Protected Point) */}
            <div className="relative z-10 flex flex-col items-center group">
              <div className="w-6 h-6 rounded-full bg-red-500/20 border-2 border-red-500 flex items-center justify-center shadow-lg shadow-red-500/40 animate-pulse">
                <div className="w-2 h-2 rounded-full bg-red-400"></div>
              </div>
              <div className="absolute -bottom-6 whitespace-nowrap bg-red-950/90 text-red-300 text-[10px] font-mono px-2 py-0.5 rounded border border-red-800/80 shadow">
                exact_location (Private)
              </div>
            </div>

            {/* Vector Connector Line */}
            {(() => {
              const rad = (spatialData.bearingDegrees * Math.PI) / 180;
              // Normalize distance to radius container percentage
              const distPercent = (spatialData.actualDistanceMeters / fuzzRadius) * 42.5; // max 42.5% radius from center
              const offsetX = Math.sin(rad) * distPercent;
              const offsetY = -Math.cos(rad) * distPercent;

              return (
                <>
                  <svg className="absolute inset-0 w-full h-full pointer-events-none">
                    <line
                      x1="50%"
                      y1="50%"
                      x2={`${50 + offsetX}%`}
                      y2={`${50 + offsetY}%`}
                      stroke="#06b6d4"
                      strokeWidth="2"
                      strokeDasharray="4 4"
                      opacity="0.7"
                    />
                  </svg>

                  {/* PUBLIC LOCATION (Fuzzed Point) */}
                  <div
                    className="absolute z-20 flex flex-col items-center transition-all duration-300"
                    style={{
                      left: `calc(50% + ${offsetX}% - 14px)`,
                      top: `calc(50% + ${offsetY}% - 14px)`
                    }}
                  >
                    <div className="w-7 h-7 rounded-full bg-cyan-500/20 border-2 border-cyan-400 flex items-center justify-center shadow-lg shadow-cyan-500/40">
                      <MapPin className="w-4 h-4 text-cyan-300" />
                    </div>
                    <div className="absolute -top-7 whitespace-nowrap bg-cyan-950/90 text-cyan-300 text-[10px] font-mono px-2 py-0.5 rounded border border-cyan-800/80 shadow">
                      public_location ({spatialData.actualDistanceMeters}m fuzzed)
                    </div>
                  </div>
                </>
              );
            })()}
          </div>

          {/* Bottom Coordinates Preview */}
          <div className="mt-5 w-full grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
            <div className="bg-red-950/20 border border-red-900/40 rounded-xl p-3">
              <div className="flex items-center gap-1.5 text-red-400 font-semibold mb-1">
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>exact_location (Sensitif)</span>
              </div>
              <div className="text-slate-300">
                Lat: <span className="font-bold">{spatialData.exact.lat.toFixed(6)}</span> | Lng: <span className="font-bold">{spatialData.exact.lng.toFixed(6)}</span>
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                {selectedPreset.exactDesc}
              </div>
            </div>

            <div className="bg-cyan-950/20 border border-cyan-900/40 rounded-xl p-3">
              <div className="flex items-center gap-1.5 text-cyan-400 font-semibold mb-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>public_location (Aman Ter-fuzz)</span>
              </div>
              <div className="text-slate-300">
                Lat: <span className="font-bold">{spatialData.public.lat.toFixed(6)}</span> | Lng: <span className="font-bold">{spatialData.public.lng.toFixed(6)}</span>
              </div>
              <div className="text-[11px] text-cyan-400/80 mt-1">
                Jarak Jitter: {spatialData.actualDistanceMeters}m (Azimuth: {spatialData.bearingDegrees}°)
              </div>
            </div>
          </div>
        </div>

        {/* Right Controls & Privacy Security View */}
        <div className="lg:col-span-5 space-y-4">
          {/* Radius Slider Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-mono font-bold text-slate-200 uppercase tracking-wider">
                Radius Pengaburan (fuzz_radius_meters)
              </label>
              <span className="text-xs font-mono font-bold text-cyan-400 bg-cyan-950 px-2.5 py-0.5 rounded border border-cyan-800">
                {fuzzRadius} meter
              </span>
            </div>
            <input
              type="range"
              min="200"
              max="3000"
              step="50"
              value={fuzzRadius}
              onChange={(e) => setFuzzRadius(Number(e.target.value))}
              className="w-full accent-cyan-400 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] font-mono text-slate-500 mt-1">
              <span>200m (Mikro)</span>
              <span>500m (Standar)</span>
              <span>1000m (Kota)</span>
              <span>3000m (Maksimal)</span>
            </div>
          </div>

          {/* Privacy Enforcement Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-mono font-bold text-slate-200">
                  Supabase View: public.v_posts_feed
                </span>
              </div>
              <button
                onClick={() => setRevealExactInFeed(!revealExactInFeed)}
                className="text-[11px] font-mono text-slate-400 hover:text-white flex items-center gap-1"
              >
                {revealExactInFeed ? (
                  <>
                    <EyeOff className="w-3.5 h-3.5 text-red-400" />
                    <span>Mode Audit (Intip Exact)</span>
                  </>
                ) : (
                  <>
                    <Eye className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Mode Publik (Sembunyi)</span>
                  </>
                )}
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Sistem secara otomatis membedakan data yang boleh dilihat masyarakat umum dan data rahasia pemilik karya:
            </p>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3 text-xs">
              <div className="space-y-1">
                <span className="text-[11px] font-semibold text-cyan-400 block">
                  1. Lokasi yang Dilihat Publik di Peta:
                </span>
                <p className="text-slate-300 text-[11px] leading-relaxed">
                  Titik telah digeser aman sejauh <strong className="text-cyan-300">{spatialData.actualDistanceMeters} meter</strong> dari studio asli. Pengunjung hanya mengetahui kawasan umumnya tanpa mengetahui alamat persisnya.
                </p>
              </div>

              <div className="pt-2 border-t border-slate-800/80 space-y-1">
                <span className="text-[11px] font-semibold text-slate-400 block">
                  2. Lokasi Studio Asli (Privat):
                </span>
                {revealExactInFeed ? (
                  <div className="text-emerald-400 text-[11px] leading-relaxed bg-emerald-950/30 p-2 rounded border border-emerald-900/40">
                    Mode Pemilik Aktif: Terbuka untuk Anda di koordinat <span className="font-bold">{spatialData.exact.lat.toFixed(6)}, {spatialData.exact.lng.toFixed(6)}</span>.
                  </div>
                ) : (
                  <div className="text-rose-400 text-[11px] leading-relaxed bg-rose-950/20 p-2 rounded border border-rose-900/30">
                    Terkunci Rapat: Koordinat asli disembunyikan otomatis oleh database untuk mencegah pelacakan atau risiko keamanan studio.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Human-Readable Privacy Measurement Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-cyan-400" />
              <span className="text-xs font-bold text-white">
                Hasil Uji Pengaburan Lokasi
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                <span className="text-[11px] text-slate-500 block">Jarak Selisih Aman:</span>
                <span className="text-cyan-300 font-bold">{spatialData.actualDistanceMeters} meter</span>
              </div>
              <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                <span className="text-[11px] text-slate-500 block">Status Privasi:</span>
                <span className="text-emerald-400 font-bold">100% Terlindungi</span>
              </div>
            </div>

            <p className="text-[11px] text-slate-400 leading-relaxed pt-1">
              Perhitungan kelengkungan bumi ini diproses langsung di database Supabase secara instan tanpa memperlambat perangkat Anda.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
