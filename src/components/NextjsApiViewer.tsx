import React, { useState } from 'react';
import { 
  PRISMA_SCHEMA_CODE, 
  API_POSTS_ROUTE_CODE, 
  API_INTERACTIONS_ROUTE_CODE, 
  LIB_C2PA_CODE, 
  LIB_GEOSPATIAL_CODE,
  LIB_PRISMA_CODE 
} from '../data/nextjsApiCode';
import { 
  Copy, 
  Check, 
  FileCode, 
  Send, 
  ShieldCheck, 
  Mic, 
  MapPin, 
  Play, 
  Volume2, 
  Sparkles, 
  Layers, 
  Cpu, 
  Download,
  AlertCircle
} from 'lucide-react';

type FileKey = 'prisma' | 'posts_api' | 'interactions_api' | 'c2pa_lib' | 'geo_lib' | 'prisma_lib';

interface ApiPreset {
  id: string;
  name: string;
  camera: string;
  make: string;
  manifestHash: string;
  teeSig: string;
  lat: number;
  lng: number;
  fuzzRadius: number;
  isSynthetic: boolean;
}

const POST_PRESETS: ApiPreset[] = [
  {
    id: 'sony-a7rv',
    name: 'Sony Alpha 7R V (C2PA Hardware TEE)',
    camera: 'Alpha 7R V C2PA',
    make: 'Sony',
    manifestHash: '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08',
    teeSig: 'MEQCIC7m2m6h+K4eQ3p0K7vA992...HardwareSecureEnclaveSignature...',
    lat: -6.175392,
    lng: 106.827153,
    fuzzRadius: 750,
    isSynthetic: false,
  },
  {
    id: 'leica-m11p',
    name: 'Leica M11-P (Content Authenticity Seal)',
    camera: 'M11-P',
    make: 'Leica',
    manifestHash: 'a8b9c0d1e2f30415263748596a7b8c9d0e1f2a3b4c5d6e7f8091a2b3c4d5e6f7',
    teeSig: 'LEICA_TEE_CHIP_SEAL_998129...HardwareSignature...',
    lat: -6.902484,
    lng: 107.618691,
    fuzzRadius: 500,
    isSynthetic: false,
  },
  {
    id: 'synthetic-attack',
    name: 'Simulated AI Synthetic Attack (Invalid Signature)',
    camera: 'Synthetic GenAI Midjourney v6',
    make: 'Unknown Synthetic Model',
    manifestHash: 'invalid_non_sha256_hash_spoofed',
    teeSig: 'corrupt_short_sig',
    lat: -8.506854,
    lng: 115.262482,
    fuzzRadius: 500,
    isSynthetic: true,
  }
];

export const NextjsApiViewer: React.FC = () => {
  const [activeFile, setActiveFile] = useState<FileKey>('posts_api');
  const [copiedFile, setCopiedFile] = useState<boolean>(false);
  
  // Interactive API Sandbox State
  const [activeSandboxTab, setActiveSandboxTab] = useState<'posts' | 'interactions'>('posts');
  const [selectedPreset, setSelectedPreset] = useState<ApiPreset>(POST_PRESETS[0]);
  const [isLoadingApi, setIsLoadingApi] = useState<boolean>(false);
  const [apiResponse, setApiResponse] = useState<any | null>(null);

  // Interactions Sandbox State
  const [interactionType, setInteractionType] = useState<'VOICE_NOTE' | 'COMMENT' | 'REACTION'>('VOICE_NOTE');
  const [commentText, setCommentText] = useState<string>('Tangkapan kamera tervalidasi 100% C2PA hardware seal.');
  const [voiceDuration, setVoiceDuration] = useState<number>(18.5);

  const fileMap: Record<FileKey, { label: string; path: string; code: string; desc: string }> = {
    prisma: {
      label: 'schema.prisma',
      path: 'prisma/schema.prisma',
      code: PRISMA_SCHEMA_CODE,
      desc: 'Skema Prisma ORM dengan dukungan ekstensi PostGIS (Unsupported("geometry(Point, 4326)")) & 5 model relasional.'
    },
    posts_api: {
      label: 'posts/route.ts',
      path: 'app/api/posts/route.ts',
      code: API_POSTS_ROUTE_CODE,
      desc: 'Next.js 14 App Router: Penerimaan tangkapan kamera, verifikasi manifest C2PA & PostGIS exact vs fuzzed GPS.'
    },
    interactions_api: {
      label: 'interactions/route.ts',
      path: 'app/api/interactions/route.ts',
      code: API_INTERACTIONS_ROUTE_CODE,
      desc: 'Next.js 14 App Router: Pengelolaan komentar teks, stempel reaksi, dan voice note audio berwaveform.'
    },
    c2pa_lib: {
      label: 'c2pa.ts',
      path: 'lib/c2pa.ts',
      code: LIB_C2PA_CODE,
      desc: 'Modul utilitas verifikasi kriptografis manifest SHA-256 dan tanda tangan Secure Enclave hardware kamera.'
    },
    geo_lib: {
      label: 'geospatial.ts',
      path: 'lib/geospatial.ts',
      code: LIB_GEOSPATIAL_CODE,
      desc: 'Fungsi proyeksi geospasial ST_Project & seed deterministik untuk pengacakan GPS anti-doxxing.'
    },
    prisma_lib: {
      label: 'prisma.ts',
      path: 'lib/prisma.ts',
      code: LIB_PRISMA_CODE,
      desc: 'Singleton instance PrismaClient untuk Next.js 14 (mencegah koneksi berlebih pada Fast Refresh).'
    }
  };

  const currentFile = fileMap[activeFile];

  const handleCopy = () => {
    navigator.clipboard.writeText(currentFile.code);
    setCopiedFile(true);
    setTimeout(() => setCopiedFile(false), 2000);
  };

  const handleDownloadActiveFile = () => {
    const filename = currentFile.path.split('/').pop() || 'file.ts';
    const blob = new Blob([currentFile.code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Simulate execution of POST /api/posts
  const handleExecutePostsApi = () => {
    setIsLoadingApi(true);
    setApiResponse(null);

    setTimeout(() => {
      setIsLoadingApi(false);
      if (selectedPreset.isSynthetic || !selectedPreset.manifestHash.startsWith('9') && !selectedPreset.manifestHash.startsWith('a')) {
        setApiResponse({
          status: 422,
          success: false,
          error: 'Verifikasi Keaslian Hardware Gagal',
          reason: 'Format C2PA manifest hash tidak valid (Bukan SHA-256 resmi) atau Hardware TEE signature rusak.',
          verificationStatus: 'MANIPULATION_DETECTED',
          confidenceScore: 0.0,
        });
      } else {
        // Calculate deterministic fuzzed location
        const displacement = Math.round(selectedPreset.fuzzRadius * 0.72);
        const fuzzedLat = selectedPreset.lat + 0.0035;
        const fuzzedLng = selectedPreset.lng + 0.0042;

        setApiResponse({
          status: 201,
          success: true,
          message: 'Tangkapan kamera Zero-Trust berhasil diverifikasi dan disimpan ke tabel terpartisi posts.',
          data: {
            id: 'd9b0421e-128a-493e-8f92-56e29a99b821',
            createdAt: new Date().toISOString(),
            title: `Capture ${selectedPreset.name}`,
            cameraMake: selectedPreset.make,
            cameraModel: selectedPreset.camera,
            verification: {
              status: 'VERIFIED_HARDWARE_TEE',
              confidenceScore: 99.80,
              c2paManifestHash: selectedPreset.manifestHash,
            },
            privacyGeo: {
              publicLocation: {
                latitude: Number(fuzzedLat.toFixed(6)),
                longitude: Number(fuzzedLng.toFixed(6)),
              },
              fuzzRadiusMeters: selectedPreset.fuzzRadius,
              offsetAppliedMeters: displacement,
              exactLocationProtection: 'RESTRICTED_BY_RLS_VIEW (Protected from public payload)',
            },
          },
        });
      }
    }, 700);
  };

  // Simulate execution of POST /api/interactions
  const handleExecuteInteractionsApi = () => {
    setIsLoadingApi(true);
    setApiResponse(null);

    setTimeout(() => {
      setIsLoadingApi(false);
      const mockId = crypto.randomUUID();
      const mockCreatedAt = new Date().toISOString();

      if (interactionType === 'VOICE_NOTE') {
        setApiResponse({
          status: 201,
          success: true,
          message: 'Interaksi VOICE_NOTE berhasil dikirim.',
          data: {
            id: mockId,
            interactionType: 'VOICE_NOTE',
            postId: 'd4444444-4444-4444-8444-444444444444',
            postCreatedAt: '2026-06-15T10:30:00.000Z',
            voiceNoteUrl: 'https://storage.vec.network/voice/audit_vn_9941.opus',
            voiceDurationSeconds: voiceDuration,
            voiceWaveform: [0.12, 0.45, 0.89, 0.72, 0.35, 0.91, 0.65, 0.42, 0.78, 0.95, 0.52, 0.19],
            voiceTranscription: 'Inspeksi fisik NFC dan frame master RAW tervalidasi 100%.',
            authorAuthenticityWeight: 0.99,
            isVerifiedHuman: true,
            createdAt: mockCreatedAt,
            user: {
              username: 'budi_hartono_vec',
              fullName: 'Budi Hartono (VEC Master Curator)',
              authenticityScore: 99.20,
              trustTier: 'HARDWARE_ATTESTED',
            },
          },
        });
      } else {
        setApiResponse({
          status: 201,
          success: true,
          message: `Interaksi ${interactionType} berhasil dikirim.`,
          data: {
            id: mockId,
            interactionType,
            postId: 'd4444444-4444-4444-8444-444444444444',
            commentBody: interactionType === 'COMMENT' ? commentText : undefined,
            reactionType: interactionType === 'REACTION' ? 'AUTHENTIC_SEAL' : undefined,
            authorAuthenticityWeight: 0.99,
            isVerifiedHuman: true,
            createdAt: mockCreatedAt,
            user: {
              username: 'budi_hartono_vec',
              fullName: 'Budi Hartono (VEC Master Curator)',
              authenticityScore: 99.20,
              trustTier: 'HARDWARE_ATTESTED',
            },
          },
        });
      }
    }, 600);
  };

  return (
    <div className="space-y-6 min-w-0 w-full">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-mono text-cyan-400 font-bold uppercase tracking-wider bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800">
                Next.js 14 App Router + Prisma ORM
              </span>
              <span className="text-slate-500">•</span>
              <span className="text-xs text-slate-400 font-mono">Backend API Arsitektur VEC</span>
            </div>
            <h2 className="text-lg font-bold text-white">
              Struktur Backend Produksi & Pengujian API Route
            </h2>
            <p className="text-xs text-slate-400 max-w-3xl mt-1 leading-relaxed">
              Arsitektur backend minimalis dan rapi yang menghubungkan Prisma ORM ke PostgreSQL 16 PostGIS, menangani verifikasi manifest C2PA kamera hardware, algoritma geospatial fuzzing, serta endpoint komentar dan rekaman suara (voice notes).
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-medium border transition ${
                copiedFile
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/60'
                  : 'bg-cyan-600 hover:bg-cyan-500 text-white border-cyan-500 shadow'
              }`}
            >
              {copiedFile ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Tersalin!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Salin File Ini</span>
                </>
              )}
            </button>

            <button
              onClick={handleDownloadActiveFile}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
              title="Unduh file saat ini"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Unduh</span>
            </button>
          </div>
        </div>

        {/* File Tabs */}
        <div className="flex items-center gap-1.5 mt-4 overflow-x-auto scrollbar-none max-w-full text-xs font-mono border-t border-slate-800/80 pt-3">
          {(Object.keys(fileMap) as FileKey[]).map((key) => {
            const item = fileMap[key];
            const isActive = activeFile === key;
            return (
              <button
                key={key}
                onClick={() => setActiveFile(key)}
                className={`px-3 py-1.5 rounded-lg border transition whitespace-nowrap flex items-center gap-1.5 shrink-0 cursor-pointer ${
                  isActive
                    ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50 font-bold shadow-sm'
                    : 'bg-slate-950/60 text-slate-400 border-slate-800 hover:bg-slate-900 hover:text-slate-200'
                }`}
              >
                <FileCode className="w-3.5 h-3.5 text-cyan-400" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Grid: Code Inspector (Left) & Live API Sandbox (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-w-0 w-full">
        {/* Left: Code Viewer */}
        <div className="lg:col-span-7 space-y-2 min-w-0">
          <div className="flex items-center justify-between text-xs font-mono text-slate-400 bg-slate-900 px-3.5 py-2 rounded-t-xl border border-b-0 border-slate-800 min-w-0">
            <span className="font-bold text-slate-200 flex items-center gap-1.5 truncate">
              <FileCode className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <span className="truncate">{currentFile.path}</span>
            </span>
            <span className="text-[11px] text-slate-500 shrink-0">TypeScript / Prisma</span>
          </div>

          <div className="border border-slate-800 rounded-b-xl bg-slate-950 overflow-hidden shadow-2xl relative min-w-0">
            <div className="p-3 bg-slate-900/60 border-b border-slate-800 text-xs text-slate-400 flex items-start gap-2">
              <Sparkles className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
              <span>{currentFile.desc}</span>
            </div>
            <pre className="p-4 font-mono text-xs text-slate-300 overflow-x-auto max-w-full leading-relaxed max-h-[560px]">
              {currentFile.code}
            </pre>
          </div>
        </div>

        {/* Right: Interactive API Tester & Sandbox */}
        <div className="lg:col-span-5 space-y-4 min-w-0">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Send className="w-4 h-4 text-cyan-400" />
                <h3 className="text-sm font-bold font-mono text-white">
                  Live API Route Tester & Sandbox
                </h3>
              </div>
              <div className="flex rounded-lg bg-slate-950 p-0.5 border border-slate-800 text-[11px] font-mono">
                <button
                  onClick={() => {
                    setActiveSandboxTab('posts');
                    setApiResponse(null);
                  }}
                  className={`px-2.5 py-1 rounded transition ${
                    activeSandboxTab === 'posts'
                      ? 'bg-cyan-500/20 text-cyan-300 font-bold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  /api/posts
                </button>
                <button
                  onClick={() => {
                    setActiveSandboxTab('interactions');
                    setApiResponse(null);
                  }}
                  className={`px-2.5 py-1 rounded transition ${
                    activeSandboxTab === 'interactions'
                      ? 'bg-cyan-500/20 text-cyan-300 font-bold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  /api/interactions
                </button>
              </div>
            </div>

            {/* Posts Route Tester */}
            {activeSandboxTab === 'posts' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-400">Metode & Endpoint:</span>
                  <span className="bg-emerald-950 text-emerald-300 border border-emerald-800 px-2 py-0.5 rounded font-bold">
                    POST /api/posts
                  </span>
                </div>

                <div>
                  <label className="text-[11px] font-mono text-slate-400 block mb-1">
                    Pilih Payload Kamera Sensor:
                  </label>
                  <select
                    value={selectedPreset.id}
                    onChange={(e) => {
                      const found = POST_PRESETS.find((p) => p.id === e.target.value);
                      if (found) setSelectedPreset(found);
                    }}
                    className="w-full bg-slate-950 text-slate-200 text-xs font-mono p-2 rounded-lg border border-slate-800 focus:outline-none focus:border-cyan-500"
                  >
                    {POST_PRESETS.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80 space-y-1.5 text-[11px] font-mono text-slate-300">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Camera:</span>
                    <span className="text-white font-semibold">{selectedPreset.camera}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Exact GPS:</span>
                    <span className="text-amber-400">{selectedPreset.lat}, {selectedPreset.lng}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Fuzz Radius:</span>
                    <span className="text-cyan-400">{selectedPreset.fuzzRadius} meter</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">C2PA Manifest:</span>
                    <span className="text-purple-300 truncate max-w-[180px]">{selectedPreset.manifestHash}</span>
                  </div>
                </div>

                <button
                  onClick={handleExecutePostsApi}
                  disabled={isLoadingApi}
                  className="w-full py-2.5 rounded-xl text-xs font-mono font-bold bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white flex items-center justify-center gap-2 shadow-lg shadow-cyan-950 transition"
                >
                  {isLoadingApi ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Memverifikasi Kriptografi C2PA...</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5" />
                      <span>Kirim Test Request (Execute)</span>
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Interactions Route Tester */}
            {activeSandboxTab === 'interactions' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-400">Metode & Endpoint:</span>
                  <span className="bg-emerald-950 text-emerald-300 border border-emerald-800 px-2 py-0.5 rounded font-bold">
                    POST /api/interactions
                  </span>
                </div>

                <div>
                  <label className="text-[11px] font-mono text-slate-400 block mb-1">
                    Tipe Interaksi:
                  </label>
                  <div className="grid grid-cols-3 gap-1.5 text-xs font-mono">
                    {(['VOICE_NOTE', 'COMMENT', 'REACTION'] as const).map((type) => (
                      <button
                        key={type}
                        onClick={() => setInteractionType(type)}
                        className={`py-1.5 rounded-lg border text-center transition ${
                          interactionType === type
                            ? 'bg-pink-950/80 text-pink-300 border-pink-700 font-bold'
                            : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                        }`}
                      >
                        {type === 'VOICE_NOTE' && '🎤 Voice Note'}
                        {type === 'COMMENT' && '💬 Komentar'}
                        {type === 'REACTION' && '🎖️ Stempel'}
                      </button>
                    ))}
                  </div>
                </div>

                {interactionType === 'VOICE_NOTE' && (
                  <div className="space-y-2.5 bg-slate-950 p-3 rounded-xl border border-slate-800">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="text-slate-400 flex items-center gap-1">
                        <Volume2 className="w-3.5 h-3.5 text-pink-400" /> Durasi Audio:
                      </span>
                      <span className="text-pink-300 font-bold">{voiceDuration} detik</span>
                    </div>
                    <input
                      type="range"
                      min="5"
                      max="120"
                      value={voiceDuration}
                      onChange={(e) => setVoiceDuration(Number(e.target.value))}
                      className="w-full accent-pink-500"
                    />

                    {/* Waveform Visualizer Preview */}
                    <div className="pt-1">
                      <div className="text-[10px] font-mono text-slate-500 mb-1">
                        Normalisasi Waveform JSONB (12 Bar Amplitudo):
                      </div>
                      <div className="h-8 bg-slate-900 rounded-lg flex items-center justify-around px-2 border border-slate-800">
                        {[40, 75, 100, 85, 50, 95, 70, 45, 80, 100, 60, 30].map((h, i) => (
                          <div
                            key={i}
                            className="w-1 bg-pink-400 rounded-full transition-all duration-300"
                            style={{ height: `${h}%` }}
                          ></div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {interactionType === 'COMMENT' && (
                  <div>
                    <label className="text-[11px] font-mono text-slate-400 block mb-1">
                      Isi Komentar Teks:
                    </label>
                    <textarea
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      rows={3}
                      className="w-full bg-slate-950 text-slate-200 text-xs font-mono p-2 rounded-lg border border-slate-800 focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                )}

                {interactionType === 'REACTION' && (
                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs font-mono text-slate-300">
                    Stempel: <strong className="text-cyan-400">AUTHENTIC_SEAL</strong> (Memberikan validasi verifikasi pada bukti sensor kamera).
                  </div>
                )}

                <button
                  onClick={handleExecuteInteractionsApi}
                  disabled={isLoadingApi}
                  className="w-full py-2.5 rounded-xl text-xs font-mono font-bold bg-pink-600 hover:bg-pink-500 disabled:opacity-50 text-white flex items-center justify-center gap-2 shadow-lg shadow-pink-950 transition"
                >
                  {isLoadingApi ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Menyimpan Interaksi...</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5" />
                      <span>Kirim Interaksi (Execute)</span>
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Live API Response Display */}
            {apiResponse && (
              <div className="space-y-2 pt-2 border-t border-slate-800">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-400 font-bold">HTTP Response Output:</span>
                  <span
                    className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                      apiResponse.status >= 200 && apiResponse.status < 300
                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                        : 'bg-red-950 text-red-300 border border-red-800'
                    }`}
                  >
                    Status: {apiResponse.status}
                  </span>
                </div>

                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 font-mono text-[11px] max-h-64 overflow-auto leading-relaxed">
                  <pre className="text-slate-200">
                    {JSON.stringify(apiResponse, null, 2)}
                  </pre>
                </div>
              </div>
            )}
          </div>

          {/* Quick Integration Checklist */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 text-xs font-mono space-y-2">
            <div className="font-bold text-slate-200 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Prisma PostGIS Best Practices</span>
            </div>
            <ul className="text-slate-400 space-y-1.5 text-[11px]">
              <li>• Kolom geospasial dipetakan via <code className="text-cyan-300">Unsupported(&quot;geometry(Point, 4326)&quot;)</code>.</li>
              <li>• Penulisan titik PostGIS memakai <code className="text-cyan-300">ST_SetSRID(ST_MakePoint(lng, lat), 4326)</code> di Prisma <code className="text-slate-200">$executeRaw</code>.</li>
              <li>• Kueri pembacaan feed publik diarahkan ke view aman <code className="text-cyan-300">v_posts_feed</code>.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
