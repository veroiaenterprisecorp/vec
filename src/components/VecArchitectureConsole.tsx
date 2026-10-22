import React, { useState } from 'react';
import { ErdVisualizer } from './ErdVisualizer';
import { SqlViewer } from './SqlViewer';
import { NextjsApiViewer } from './NextjsApiViewer';
import { FlutterAppViewer } from './FlutterAppViewer';
import { SeedDataGenerator } from './SeedDataGenerator';
import { ArchitectureDocs } from './ArchitectureDocs';
import { 
  Database, 
  Terminal, 
  Cpu, 
  Smartphone, 
  Layers, 
  FileText,
  Download,
  Copy,
  Check
} from 'lucide-react';

interface VecArchitectureConsoleProps {
  onCopyAllSql: () => void;
  copiedSql: boolean;
  onDownloadSql: () => void;
}

export const VecArchitectureConsole: React.FC<VecArchitectureConsoleProps> = ({
  onCopyAllSql,
  copiedSql,
  onDownloadSql
}) => {
  const [subTab, setSubTab] = useState<'erd' | 'sql' | 'api' | 'flutter' | 'seed' | 'docs'>('erd');

  return (
    <div className="space-y-6">
      
      {/* Top Console Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-cyan-400">
            <Cpu className="w-4 h-4 text-cyan-400" />
            <span>ENTERPRISE SPECIFICATIONS & MULTI-TIER REPOSITORY</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight mt-1">
            Konsol Spesifikasi Teknis & Skema VEC
          </h2>
        </div>

        {/* Quick SQL actions */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={onCopyAllSql}
            className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-mono font-semibold transition border ${
              copiedSql 
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/60'
                : 'bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
            }`}
          >
            {copiedSql ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-cyan-400" />}
            <span>{copiedSql ? 'SQL Tersalin' : 'Salin SQL Skema'}</span>
          </button>

          <button
            onClick={onDownloadSql}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-mono bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Unduh .sql</span>
          </button>
        </div>
      </div>

      {/* Segmented Controls for Sub-views */}
      <div className="flex items-center gap-1.5 p-1 bg-slate-900/90 rounded-2xl border border-slate-800 overflow-x-auto text-xs font-mono">
        <button
          onClick={() => setSubTab('erd')}
          className={`px-3.5 py-2 rounded-xl flex items-center gap-2 whitespace-nowrap transition ${
            subTab === 'erd'
              ? 'bg-cyan-600 text-white font-bold shadow-md shadow-cyan-950'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Database className="w-3.5 h-3.5" />
          <span>Visual ERD 5 Tabel</span>
        </button>

        <button
          onClick={() => setSubTab('sql')}
          className={`px-3.5 py-2 rounded-xl flex items-center gap-2 whitespace-nowrap transition ${
            subTab === 'sql'
              ? 'bg-cyan-600 text-white font-bold shadow-md shadow-cyan-950'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Terminal className="w-3.5 h-3.5" />
          <span>Skrip SQL Supabase</span>
        </button>

        <button
          onClick={() => setSubTab('api')}
          className={`px-3.5 py-2 rounded-xl flex items-center gap-2 whitespace-nowrap transition ${
            subTab === 'api'
              ? 'bg-cyan-600 text-white font-bold shadow-md shadow-cyan-950'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Cpu className="w-3.5 h-3.5" />
          <span>Next.js 14 API & Prisma</span>
        </button>

        <button
          onClick={() => setSubTab('flutter')}
          className={`px-3.5 py-2 rounded-xl flex items-center gap-2 whitespace-nowrap transition ${
            subTab === 'flutter'
              ? 'bg-cyan-600 text-white font-bold shadow-md shadow-cyan-950'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Smartphone className="w-3.5 h-3.5" />
          <span>Flutter Mobile Client</span>
        </button>

        <button
          onClick={() => setSubTab('seed')}
          className={`px-3.5 py-2 rounded-xl flex items-center gap-2 whitespace-nowrap transition ${
            subTab === 'seed'
              ? 'bg-cyan-600 text-white font-bold shadow-md shadow-cyan-950'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Generator Data Mock</span>
        </button>

        <button
          onClick={() => setSubTab('docs')}
          className={`px-3.5 py-2 rounded-xl flex items-center gap-2 whitespace-nowrap transition ${
            subTab === 'docs'
              ? 'bg-cyan-600 text-white font-bold shadow-md shadow-cyan-950'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Whitepaper Arsitektur</span>
        </button>
      </div>

      {/* Sub-view Viewport */}
      <div className="pt-2">
        {subTab === 'erd' && <ErdVisualizer />}
        {subTab === 'sql' && <SqlViewer onCopyAll={onCopyAllSql} copied={copiedSql} />}
        {subTab === 'api' && <NextjsApiViewer />}
        {subTab === 'flutter' && <FlutterAppViewer />}
        {subTab === 'seed' && <SeedDataGenerator />}
        {subTab === 'docs' && <ArchitectureDocs />}
      </div>

    </div>
  );
};
