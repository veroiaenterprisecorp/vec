'use client';

import React, { useState } from 'react';
import { VecOfficialLogo } from './VecOfficialLogo';
import { 
  ShieldCheck, 
  Camera, 
  MapPin, 
  Award, 
  MessageSquare, 
  Mic, 
  Play, 
  Pause, 
  Volume2, 
  Send, 
  Lock, 
  Sparkles, 
  Radio, 
  ExternalLink,
  ChevronRight,
  Share2,
  CheckCircle2,
  Copy,
  Check
} from 'lucide-react';

type NavMenu = 'beranda' | 'kamera' | 'vault' | 'diskusi';

interface InteractionItem {
  id: string;
  author: string;
  role: string;
  score: number;
  type: 'COMMENT' | 'VOICE_NOTE' | 'AUTHENTIC_SEAL';
  content?: string;
  voiceDuration?: number;
  waveform?: number[];
  timestamp: string;
}

export default function VecNextPage() {
  const [activeMenu, setActiveMenu] = useState<NavMenu>('beranda');

  // Camera State
  const [isCapturing, setIsCapturing] = useState<boolean>(false);
  const [capturedDigest, setCapturedDigest] = useState<string>(
    '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08'
  );
  const [capturedTime, setCapturedTime] = useState<string>('2026-10-19 17:30 UTC');
  const [isMockGpsDetected, setIsMockGpsDetected] = useState<boolean>(false);
  const [fuzzRadius, setFuzzRadius] = useState<number>(500);

  // Interaction State
  const [commentInput, setCommentInput] = useState<string>('');
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);
  const [copiedRawHash, setCopiedRawHash] = useState<boolean>(false);

  const [interactions, setInteractions] = useState<InteractionItem[]>([
    {
      id: 'int-1',
      author: 'Budi Hartono',
      role: 'VEC Master Curator',
      score: 99.20,
      type: 'COMMENT',
      content: 'Manifest C2PA tervalidasi penuh via hardware Secure Enclave. Telemetri sensor CMOS terbukti murni tanpa rekonstruksi AI generatif.',
      timestamp: '15 menit lalu'
    },
    {
      id: 'int-2',
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
      author: 'Sarah Jenkins',
      role: 'Fine Art Photographer',
      score: 96.80,
      type: 'AUTHENTIC_SEAL',
      content: 'Menyematkan Stempel Keaslian Resmi (AUTHENTIC_SEAL). Silsilah pigmen dan tag fisik NTAG424 DNA terhubung identik.',
      timestamp: '1 jam lalu'
    }
  ]);

  const handleCapture = () => {
    setIsCapturing(true);
    setTimeout(() => {
      setIsCapturing(false);
      const newHash = Array.from({ length: 64 }, () =>
        Math.floor(Math.random() * 16).toString(16)
      ).join('');
      setCapturedDigest(newHash);
      setCapturedTime(new Date().toUTCString().replace('GMT', 'UTC'));
    }, 600);
  };

  const handleSendComment = () => {
    if (!commentInput.trim()) return;
    const newItem: InteractionItem = {
      id: `int-${Date.now()}`,
      author: 'Anda (Kolektor Terverifikasi)',
      role: 'Hardware Attested Member',
      score: 99.40,
      type: 'COMMENT',
      content: commentInput,
      timestamp: 'Baru saja'
    };
    setInteractions([newItem, ...interactions]);
    setCommentInput('');
  };

  const handleAddVoiceNote = () => {
    const newItem: InteractionItem = {
      id: `int-${Date.now()}`,
      author: 'Anda (Kolektor Terverifikasi)',
      role: 'Hardware Attested Member',
      score: 99.40,
      type: 'VOICE_NOTE',
      voiceDuration: 12.0,
      waveform: [25, 45, 80, 100, 70, 95, 60, 40, 85, 90, 50, 20],
      timestamp: 'Baru saja'
    };
    setInteractions([newItem, ...interactions]);
  };

  return (
    <div className="min-h-screen bg-[#030712] text-slate-100 flex flex-col font-sans selection:bg-cyan-500/25 selection:text-cyan-200">
      
      {/* --------------------------------------------------------------- */}
      {/* 1. TOP LUXE NAVIGATION BAR WITH OFFICIAL 3D VEC LOGO            */}
      {/* --------------------------------------------------------------- */}
      <header className="border-b border-slate-800/70 bg-[#050C1E]/90 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          
          {/* Logo Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl overflow-hidden shadow-lg shadow-cyan-500/15 border border-cyan-500/30 flex items-center justify-center bg-[#02040A]">
              <VecOfficialLogo className="w-full h-full" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold tracking-tight text-white font-mono">
                  VEROIA
                </span>
                <span className="text-[10px] font-mono uppercase tracking-wider text-cyan-400 bg-cyan-950/80 border border-cyan-800/60 px-1.5 py-0.2 rounded">
                  Core
                </span>
              </div>
              <div className="text-[11px] text-slate-400 font-mono tracking-tight -mt-0.5">
                Zero-Trust Provenance Platform
              </div>
            </div>
          </div>

          {/* 2. Compact Minimalist Navigation Tabs */}
          <nav className="flex items-center gap-1 bg-slate-900/60 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setActiveMenu('beranda')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                activeMenu === 'beranda'
                  ? 'bg-cyan-500/20 text-cyan-300 font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Beranda
            </button>
            <button
              onClick={() => setActiveMenu('kamera')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                activeMenu === 'kamera'
                  ? 'bg-cyan-500/20 text-cyan-300 font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Kamera Sensor
            </button>
            <button
              onClick={() => setActiveMenu('vault')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                activeMenu === 'vault'
                  ? 'bg-cyan-500/20 text-cyan-300 font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Galeri Vault
            </button>
            <button
              onClick={() => setActiveMenu('diskusi')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                activeMenu === 'diskusi'
                  ? 'bg-cyan-500/20 text-cyan-300 font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Diskusi
            </button>
          </nav>

          {/* Right Status Pill */}
          <div className="hidden sm:flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-950/60 border border-emerald-800/60 text-emerald-300 text-xs font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>Skor Keaslian: <strong>99.40</strong></span>
            </div>
          </div>
        </div>
      </header>

      {/* --------------------------------------------------------------- */}
      {/* MAIN CONTAINER (DARK LUXE GALLERY)                              */}
      {/* --------------------------------------------------------------- */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8 space-y-8">
        
        {/* Hero Tagline minimal */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-2 border-b border-slate-800/60">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 mb-1">
              <ShieldCheck className="w-4 h-4 text-cyan-400" />
              <span>C2PA HARDWARE ATTESTATION • POSTGIS GEOPRIVACY</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-light tracking-tight text-white">
              Autentikasi Karya Seni & Jepretan Sensor Asli
            </h1>
          </div>
          <div className="text-xs font-mono text-slate-400 flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-cyan-400"></span>
            <span>TEE Firmware: Sony A7RV / Leica M11-P Validated</span>
          </div>
        </div>

        {/* --------------------------------------------------------------- */}
        {/* 3. MODUL LIVE CAMERA CAPTURE (C2PA CHECKSUM & POSTGIS)          */}
        {/* --------------------------------------------------------------- */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left: Viewfinder Minimalist Frame */}
          <div className="lg:col-span-7 bg-[#050C1E] rounded-3xl border border-slate-800 p-5 relative overflow-hidden flex flex-col justify-between min-h-[420px] shadow-2xl">
            {/* Background Texture / Live Preview */}
            <div className="absolute inset-0 z-0">
              <img
                src="https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=80"
                alt="Sensor Viewfinder Stream"
                className="w-full h-full object-cover opacity-65 scale-105 transition-all duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#050C1E] via-transparent to-[#050C1E]/80"></div>
            </div>

            {/* Top HUD Badges */}
            <div className="relative z-10 flex items-center justify-between">
              <div className="flex items-center gap-2 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-cyan-500/30 text-xs font-mono text-cyan-300">
                <Camera className="w-3.5 h-3.5 text-cyan-400" />
                <span>Sensor CMOS Aktif (RAW DNG)</span>
              </div>

              <div className="bg-red-950/80 backdrop-blur-md px-2.5 py-1 rounded-full border border-red-800/80 text-[11px] font-mono text-red-300 flex items-center gap-1">
                <Lock className="w-3 h-3 text-red-400" />
                <span>Gallery Import Blocked</span>
              </div>
            </div>

            {/* Shutter Flash Animation */}
            {isCapturing && (
              <div className="absolute inset-0 bg-cyan-400/30 backdrop-blur-sm z-20 animate-pulse"></div>
            )}

            {/* Bottom HUD: Coordinates & Trigger Action */}
            <div className="relative z-10 space-y-3">
              <div className="bg-black/75 backdrop-blur-md rounded-2xl p-3 border border-slate-800 text-xs font-mono space-y-1.5">
                <div className="flex items-center justify-between text-slate-300">
                  <span className="flex items-center gap-1 text-cyan-400">
                    <MapPin className="w-3.5 h-3.5" /> PostGIS Coordinates:
                  </span>
                  <span className="text-emerald-400 text-[11px]">GNSS Satelit Asli (Non-Mock)</span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span>Exact (Privat/Terkunci RLS):</span>
                  <span className="text-white">-6.175392, 106.827153</span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span>Public Fuzzed (PostGIS ST_Project):</span>
                  <span className="text-cyan-300">-6.178890, 106.831350 (~{fuzzRadius}m fuzzed)</span>
                </div>
              </div>

              <button
                onClick={handleCapture}
                disabled={isCapturing}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-medium text-xs font-mono tracking-wider uppercase transition shadow-lg shadow-cyan-950 flex items-center justify-center gap-2"
              >
                {isCapturing ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Mengunci Checksum RAW Sensor...</span>
                  </>
                ) : (
                  <>
                    <Camera className="w-4 h-4" />
                    <span>Jepret Sensor Hardware (Ambil Foto)</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Right: C2PA & NFC Provenance Card */}
          <div className="lg:col-span-5 bg-[#050C1E] rounded-3xl border border-slate-800 p-6 flex flex-col justify-between space-y-5">
            <div>
              <div className="flex items-center gap-2 mb-2 text-xs font-mono text-emerald-400">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>SERTIFIKASI SILSILAH KRIPTOGRAFIS</span>
              </div>
              <h2 className="text-lg font-normal text-white">
                Status Keaslian Hardware C2PA
              </h2>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Tiap tangkapan langsung diverifikasi tanda tangan TEE-nya, dicocokkan dengan checksum RAW dan chip NFC fisik NTAG424.
              </p>

              {/* Data Properties */}
              <div className="mt-5 space-y-3 font-mono text-xs">
                <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
                  <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                    <span>SHA-256 RAW Sensor Checksum:</span>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(capturedDigest);
                        setCopiedRawHash(true);
                        setTimeout(() => setCopiedRawHash(false), 2000);
                      }}
                      className="text-cyan-400 hover:text-cyan-300"
                    >
                      {copiedRawHash ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  <div className="text-cyan-300 text-[11px] break-all">
                    {capturedDigest}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
                    <span className="text-slate-500 block">Kamera Make:</span>
                    <span className="text-white font-medium">Sony Alpha 7R V</span>
                  </div>
                  <div className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
                    <span className="text-slate-500 block">Chip TEE:</span>
                    <span className="text-emerald-400 font-medium">Secure Enclave Valid</span>
                  </div>
                </div>

                <div className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-800 text-[11px] flex items-center justify-between">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <Radio className="w-3.5 h-3.5 text-amber-400" /> Chip Fisik NFC:
                  </span>
                  <span className="text-amber-300 font-mono">NTAG424 DNA Sun Seal</span>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs font-mono text-slate-500">
              <span>Timestamp: {capturedTime}</span>
              <span className="text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> 100% Asli
              </span>
            </div>
          </div>
        </div>

        {/* --------------------------------------------------------------- */}
        {/* 4. KOLOM INTERAKSI & RUANG DISKUSI MINIMALIS                    */}
        {/* --------------------------------------------------------------- */}
        <div className="bg-[#050C1E] rounded-3xl border border-slate-800 p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800/70">
            <div>
              <div className="flex items-center gap-2 text-xs font-mono text-cyan-400">
                <MessageSquare className="w-4 h-4 text-cyan-400" />
                <span>RUANG DISKUSI & KURASI OTENTIK</span>
              </div>
              <h2 className="text-lg font-light text-white mt-0.5">
                Interaksi Kolektor Berbobot Reputasi
              </h2>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleAddVoiceNote}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 text-xs font-mono transition"
              >
                <Mic className="w-3.5 h-3.5 text-pink-400" />
                <span>Kirim Voice Note</span>
              </button>
            </div>
          </div>

          {/* Interactions List */}
          <div className="space-y-4">
            {interactions.map((item) => (
              <div
                key={item.id}
                className="p-4 rounded-2xl bg-slate-900/40 border border-slate-800/70 space-y-2 hover:border-slate-700/80 transition"
              >
                <div className="flex items-center justify-between text-xs font-mono">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-white">{item.author}</span>
                    <span className="text-[10px] text-cyan-400 bg-cyan-950/70 px-2 py-0.5 rounded border border-cyan-800/60">
                      {item.role}
                    </span>
                    <span className="text-[10px] text-slate-500 hidden sm:inline">
                      Bobot: {(item.score / 100).toFixed(2)}
                    </span>
                  </div>
                  <span className="text-slate-500 text-[11px]">{item.timestamp}</span>
                </div>

                {/* Content: Text Comment */}
                {item.type === 'COMMENT' && (
                  <p className="text-xs text-slate-300 leading-relaxed font-sans pl-1">
                    {item.content}
                  </p>
                )}

                {/* Content: Voice Note */}
                {item.type === 'VOICE_NOTE' && (
                  <div className="flex items-center gap-3 bg-black/40 p-2.5 rounded-xl border border-slate-800 max-w-md">
                    <button
                      onClick={() => setIsPlayingAudio(!isPlayingAudio)}
                      className="w-8 h-8 rounded-full bg-pink-500/20 border border-pink-500/50 flex items-center justify-center text-pink-300 hover:bg-pink-500/30 transition shrink-0"
                    >
                      {isPlayingAudio ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 ml-0.5" />}
                    </button>
                    <div className="flex-1">
                      <div className="h-6 flex items-center gap-1">
                        {item.waveform?.map((height, idx) => (
                          <div
                            key={idx}
                            className="w-1 bg-pink-400/80 rounded-full transition-all"
                            style={{ height: `${height}%` }}
                          ></div>
                        ))}
                      </div>
                    </div>
                    <span className="text-[11px] font-mono text-slate-400">
                      0:{item.voiceDuration?.toFixed(0)}
                    </span>
                  </div>
                )}

                {/* Content: Authentic Seal Reaction */}
                {item.type === 'AUTHENTIC_SEAL' && (
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-950/40 border border-emerald-800/50 text-[11px] font-mono text-emerald-300">
                    <Award className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{item.content}</span>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Minimalist Input Bar */}
          <div className="flex items-center gap-2 pt-2">
            <input
              type="text"
              placeholder="Tulis ulasan kurasi atau verifikasi..."
              value={commentInput}
              onChange={(e) => setCommentInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendComment()}
              className="flex-1 bg-slate-900/90 text-xs font-mono text-slate-200 placeholder-slate-500 px-4 py-3 rounded-2xl border border-slate-800 focus:outline-none focus:border-cyan-500 transition"
            />
            <button
              onClick={handleSendComment}
              className="px-4 py-3 bg-cyan-600 hover:bg-cyan-500 text-white rounded-2xl text-xs font-mono font-medium flex items-center gap-1.5 transition shadow"
            >
              <span>Kirim</span>
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </main>

      {/* --------------------------------------------------------------- */}
      {/* FOOTER LUXE                                                     */}
      {/* --------------------------------------------------------------- */}
      <footer className="border-t border-slate-900 bg-[#02040A] py-6 text-xs font-mono text-slate-500">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-slate-400">
            <VecOfficialLogo className="w-4 h-4" />
            <span>Veroia Enterprise Corp • Zero-Trust Hardware Provenance</span>
          </div>
          <div>PostgreSQL 16 + PostGIS • C2PA Standards • Next.js 14 App Router</div>
        </div>
      </footer>
    </div>
  );
}
