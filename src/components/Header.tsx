import React from 'react';
import { Database, ShieldCheck, MapPin, Cpu, Copy, Check, Download, ExternalLink, Terminal, Smartphone, LayoutDashboard } from 'lucide-react';
import { VecOfficialLogo } from './VecOfficialLogo';

interface HeaderProps {
  onCopyAll: () => void;
  copied: boolean;
  onDownloadSql: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  onCopyAll,
  copied,
  onDownloadSql,
  activeTab,
  setActiveTab
}) => {
  return (
    <header className="border-b border-slate-800/80 bg-[#050C1E]/95 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          
          {/* Logo & Identity with Official 3D VEC Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl overflow-hidden shadow-lg shadow-cyan-500/20 border border-cyan-500/30 bg-[#02040A] p-0.5 flex items-center justify-center">
              <VecOfficialLogo className="w-full h-full" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold tracking-wider text-cyan-400 uppercase bg-cyan-950/80 border border-cyan-800/60 px-2 py-0.5 rounded">
                  VEC Core
                </span>
                <span className="text-xs font-mono text-slate-400 flex items-center gap-1">
                  <Database className="w-3.5 h-3.5 text-emerald-400" /> PostgreSQL 16 + PostGIS
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800/50 px-2 py-0.5 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  Dark Luxe Ready
                </span>
              </div>
              <h1 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
                Veroia Enterprise Corp (VEC)
                <span className="text-xs font-normal text-slate-400 hidden sm:inline">| Zero-Trust Provenance Architecture</span>
              </h1>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center flex-wrap gap-2.5">
            <button
              onClick={onCopyAll}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold font-mono transition-all duration-200 border ${
                copied
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/60'
                  : 'bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border-cyan-500/40 hover:border-cyan-400 shadow-sm shadow-cyan-950'
              }`}
              title="Salin seluruh skrip SQL untuk Supabase SQL Editor"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>Tersalin ke Clipboard!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-cyan-400" />
                  <span>Salin Skrip SQL</span>
                </>
              )}
            </button>

            <button
              onClick={onDownloadSql}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold font-mono bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 hover:border-slate-600 transition"
              title="Unduh file .sql untuk Supabase"
            >
              <Download className="w-4 h-4 text-slate-300" />
              <span>Unduh .sql</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 mt-3 overflow-x-auto border-t border-slate-800/80 pt-2.5 text-xs font-mono">
          <button
            onClick={() => setActiveTab('luxe')}
            className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 transition ${
              activeTab === 'luxe'
                ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-300 border border-cyan-500/60 font-bold shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <LayoutDashboard className="w-3.5 h-3.5 text-cyan-400" />
            <span>Next.js app/page.tsx (Dark Luxe)</span>
          </button>

          <button
            onClick={() => setActiveTab('sql')}
            className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 transition ${
              activeTab === 'sql'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 font-medium'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>Skrip SQL Supabase</span>
          </button>

          <button
            onClick={() => setActiveTab('flutter')}
            className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 transition ${
              activeTab === 'flutter'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 font-medium'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5 text-pink-400" />
            <span>Flutter Mobile Client</span>
          </button>

          <button
            onClick={() => setActiveTab('api')}
            className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 transition ${
              activeTab === 'api'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 font-medium'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Cpu className="w-3.5 h-3.5 text-cyan-400" />
            <span>Next.js 14 API & Prisma</span>
          </button>

          <button
            onClick={() => setActiveTab('erd')}
            className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 transition ${
              activeTab === 'erd'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 font-medium'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>Visual ERD & Skema</span>
          </button>

          <button
            onClick={() => setActiveTab('postgis')}
            className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 transition ${
              activeTab === 'postgis'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 font-medium'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <MapPin className="w-3.5 h-3.5 text-amber-400" />
            <span>PostGIS GPS Fuzzing Simulator</span>
          </button>

          <button
            onClick={() => setActiveTab('seed')}
            className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 transition ${
              activeTab === 'seed'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 font-medium'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Cpu className="w-3.5 h-3.5 text-purple-400" />
            <span>Data Simulasi (Seed)</span>
          </button>

          <button
            onClick={() => setActiveTab('docs')}
            className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 transition ${
              activeTab === 'docs'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 font-medium'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <ExternalLink className="w-3.5 h-3.5 text-sky-400" />
            <span>Panduan & Arsitektur</span>
          </button>
        </div>
      </div>
    </header>
  );
};
