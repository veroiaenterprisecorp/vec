import React, { useState } from 'react';
import { Header } from './components/Header';
import VecDarkLuxePage from './components/VecDarkLuxePage';
import { SqlViewer } from './components/SqlViewer';
import { NextjsApiViewer } from './components/NextjsApiViewer';
import { FlutterAppViewer } from './components/FlutterAppViewer';
import { ErdVisualizer } from './components/ErdVisualizer';
import { PostGisSimulator } from './components/PostGisSimulator';
import { SeedDataGenerator } from './components/SeedDataGenerator';
import { ArchitectureDocs } from './components/ArchitectureDocs';
import { LiveSupabaseExplorer } from './components/LiveSupabaseExplorer';
import { VEC_FULL_SQL_SCRIPT } from './data/vecSqlSchema';
import { 
  Check, 
  Terminal, 
  Database, 
  MapPin, 
  Cpu, 
  FileText,
  ShieldCheck,
  ChevronRight,
  Smartphone,
  LayoutDashboard
} from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'luxe' | 'explorer' | 'flutter' | 'api' | 'sql' | 'erd' | 'postgis' | 'seed' | 'docs'>('luxe');
  const [copied, setCopied] = useState<boolean>(false);
  const [showToast, setShowToast] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string>('');

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setShowToast(true);
    setTimeout(() => {
      setShowToast(false);
    }, 3000);
  };

  const handleCopyAll = () => {
    navigator.clipboard.writeText(VEC_FULL_SQL_SCRIPT);
    setCopied(true);
    triggerToast('Skrip SQL lengkap berhasil disalin ke clipboard!');
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownloadSql = () => {
    const element = document.createElement('a');
    const file = new Blob([VEC_FULL_SQL_SCRIPT], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = 'vec_schema_supabase.sql';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    triggerToast('File vec_schema_supabase.sql berhasil diunduh!');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500/30 selection:text-white">
      {/* Top Header */}
      <Header
        onCopyAll={handleCopyAll}
        copied={copied}
        onDownloadSql={handleDownloadSql}
        activeTab={activeTab}
        setActiveTab={(tab: string) => setActiveTab(tab as any)}
      />

      {/* Main Workspace Body */}
      {activeTab === 'luxe' ? (
        <VecDarkLuxePage />
      ) : (
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Breadcrumb Bar */}
          <div className="flex items-center gap-2 text-xs font-mono text-slate-500 mb-5">
            <span>Veroia Enterprise Corp</span>
            <ChevronRight className="w-3 h-3 text-slate-700" />
            <span>Architecture Hub</span>
            <ChevronRight className="w-3 h-3 text-slate-700" />
            <span className="text-cyan-400 capitalize">
              {activeTab === 'explorer' && 'Live Supabase Explorer (Real-Time Database Inspector)'}
              {activeTab === 'flutter' && 'Flutter Mobile Client (Hardware-Bypass & NFC)'}
              {activeTab === 'api' && 'Next.js 14 App Router + Prisma ORM Backend'}
              {activeTab === 'sql' && 'Skrip SQL Supabase Ready'}
              {activeTab === 'erd' && 'Visual ERD & Skema 5 Tabel'}
              {activeTab === 'postgis' && 'Simulator PostGIS Fuzzing GPS'}
              {activeTab === 'seed' && 'Data Simulasi (Seed Mock Data)'}
              {activeTab === 'docs' && 'Whitepaper Arsitektur Teknis'}
            </span>
          </div>

          {/* Tab Views */}
          {activeTab === 'explorer' && (
            <LiveSupabaseExplorer />
          )}

          {activeTab === 'flutter' && (
            <FlutterAppViewer />
          )}

          {activeTab === 'api' && (
            <NextjsApiViewer />
          )}

          {activeTab === 'sql' && (
            <SqlViewer onCopyAll={handleCopyAll} copied={copied} />
          )}

        {activeTab === 'erd' && (
          <ErdVisualizer />
        )}

        {activeTab === 'postgis' && (
          <PostGisSimulator />
        )}

        {activeTab === 'seed' && (
          <SeedDataGenerator />
        )}

        {activeTab === 'docs' && (
          <ArchitectureDocs />
        )}
      </main>
    )}

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-5 text-center text-xs font-mono text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-cyan-400" />
            <span>VEC Zero-Trust Hardware Attestation Platform</span>
          </div>
          <div>
            PostgreSQL 16.3 • PostGIS 3.4 • C2PA Manifest • NTAG424 DNA NFC
          </div>
        </div>
      </footer>

      {/* Floating Toast Notification */}
      {showToast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-slate-900 border border-cyan-500/60 shadow-2xl shadow-cyan-950 text-white text-xs font-mono animate-bounce">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
