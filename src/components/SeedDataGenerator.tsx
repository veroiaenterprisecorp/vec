import React, { useState } from 'react';
import { Copy, Check, Play, Database, FileText } from 'lucide-react';
import { VEC_SAMPLE_SEED_SQL } from '../data/vecSqlSchema';

export const SeedDataGenerator: React.FC = () => {
  const [copied, setCopied] = useState(false);

  const handleCopySeed = () => {
    navigator.clipboard.writeText(VEC_SAMPLE_SEED_SQL);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6 min-w-0 w-full">
      {/* Overview Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono text-purple-400 font-bold uppercase tracking-wider">
              Data Uji Coba & Verifikasi
            </span>
            <span className="text-slate-500">•</span>
            <span className="text-xs text-slate-400 font-mono">100% Siap Supabase SQL Editor</span>
          </div>
          <h2 className="text-lg font-bold text-white">
            Data Simulasi Ekosistem Veroia Enterprise Corp (VEC)
          </h2>
          <p className="text-xs text-slate-400 max-w-3xl mt-1 leading-relaxed">
            Gunakan cuplikan data uji coba ini untuk menguji performa query spasial PostGIS (<code className="text-cyan-300 font-mono">ST_DWithin</code>), memastikan trigger auto-fuzzing berjalan, menguji silsilah fisik NFC NTAG424, serta melihat render visual gelombang audio voice note.
          </p>
        </div>

        <button
          onClick={handleCopySeed}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-mono font-bold transition border ${
            copied
              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/60'
              : 'bg-purple-600 hover:bg-purple-500 text-white border-purple-500 shadow-lg shadow-purple-900/30'
          }`}
        >
          {copied ? (
            <>
              <Check className="w-4 h-4 text-emerald-400" />
              <span>Tersalin ke Clipboard!</span>
            </>
          ) : (
            <>
              <Copy className="w-4 h-4 text-white" />
              <span>Salin Skrip Seed SQL</span>
            </>
          )}
        </button>
      </div>

      {/* Highlights of Included Data */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5">
          <div className="text-xs font-mono text-cyan-400 font-bold mb-1">1. Mock Users</div>
          <div className="text-xs text-slate-300 font-medium">Budi Hartono (99.20 Skor)</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Tier: HARDWARE_ATTESTED, KYC Active</div>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5">
          <div className="text-xs font-mono text-cyan-400 font-bold mb-1">2. Zero-Trust Post</div>
          <div className="text-xs text-slate-300 font-medium">Sony A7RV C2PA Firmware</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Monas Jakarta + Auto Fuzzed PostGIS</div>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5">
          <div className="text-xs font-mono text-cyan-400 font-bold mb-1">3. Art CoA & Proofs</div>
          <div className="text-xs text-slate-300 font-medium">Simfoni Jiwa Borneo No. 03</div>
          <div className="text-[11px] text-slate-500 mt-0.5">NTAG424 Chip Hash + 3 Tahap Proses</div>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5">
          <div className="text-xs font-mono text-cyan-400 font-bold mb-1">4. Interactions & Audio</div>
          <div className="text-xs text-slate-300 font-medium">Voice Note & Waveform JSONB</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Opus Audio 24.5s + Validasi Kurator</div>
        </div>
      </div>

      {/* SQL Code Block */}
      <div className="border border-slate-800 rounded-xl bg-slate-950 overflow-hidden shadow-2xl">
        <div className="bg-slate-900 px-4 py-2.5 border-b border-slate-800 flex items-center justify-between text-xs font-mono text-slate-400">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-purple-400" />
            <span className="text-slate-200 font-bold">vec_mock_seed_data.sql</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-emerald-400 flex items-center gap-1">
              <Play className="w-3.5 h-3.5" /> Siap Run di Supabase
            </span>
          </div>
        </div>

        <pre className="p-4 font-mono text-xs text-slate-300 overflow-x-auto leading-relaxed max-h-[500px]">
          {VEC_SAMPLE_SEED_SQL}
        </pre>
      </div>
    </div>
  );
};
