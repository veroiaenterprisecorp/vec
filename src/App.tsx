import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { VecOverview } from './components/VecOverview';
import { VecVault } from './components/VecVault';
import { VecStudio } from './components/VecStudio';
import { VecPrivateVault } from './components/VecPrivateVault';
import { PostGisSimulator } from './components/PostGisSimulator';
import { GitHubSupabaseSyncHub } from './components/GitHubSupabaseSyncHub';
import { VecArchitectureConsole } from './components/VecArchitectureConsole';
import { MasterAdminPortal } from './components/MasterAdminPortal';
import { VEC_FULL_SQL_SCRIPT } from './data/vecSqlSchema';
import { VecOfficialLogo } from './components/VecOfficialLogo';
import { 
  Check, 
  ShieldCheck, 
  GitBranch, 
  Database,
  ExternalLink,
  Lock
} from 'lucide-react';

export type AppTab = 'overview' | 'private-vault' | 'vault' | 'studio' | 'spatial' | 'architecture' | 'admin-portal' | 'sync';

export default function App() {
  const [activeTab, setActiveTab] = useState<AppTab>(() => {
    if (typeof window !== 'undefined') {
      const search = window.location.search.toLowerCase();
      const hash = window.location.hash.toLowerCase();
      if (search.includes('portal=') || search.includes('admin') || hash.includes('admin') || hash.includes('portal')) {
        return 'admin-portal';
      }
    }
    return 'overview';
  });
  const [copied, setCopied] = useState<boolean>(false);
  const [showToast, setShowToast] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string>('');

  // Listen to URL changes (e.g. query param ?portal=master-admin or hash #master-admin)
  useEffect(() => {
    const handleUrlCheck = () => {
      const search = window.location.search.toLowerCase();
      const hash = window.location.hash.toLowerCase();
      if (search.includes('portal=') || search.includes('admin') || hash.includes('admin') || hash.includes('portal')) {
        setActiveTab('admin-portal');
      }
    };

    window.addEventListener('popstate', handleUrlCheck);
    window.addEventListener('hashchange', handleUrlCheck);

    // Stealth keyboard shortcut for master owner: Ctrl + Shift + A (or Cmd + Shift + A)
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'A' || e.key === 'a')) {
        e.preventDefault();
        setActiveTab((prev) => (prev === 'admin-portal' ? 'overview' : 'admin-portal'));
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('popstate', handleUrlCheck);
      window.removeEventListener('hashchange', handleUrlCheck);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setShowToast(true);
    setTimeout(() => {
      setShowToast(false);
    }, 3200);
  };

  const handleCopyAllSql = () => {
    navigator.clipboard.writeText(VEC_FULL_SQL_SCRIPT);
    setCopied(true);
    triggerToast('Skrip SQL Supabase lengkap berhasil disalin!');
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
    <div className="min-h-screen bg-[#030712] text-slate-100 flex flex-col font-sans selection:bg-cyan-500/25 selection:text-cyan-200">
      
      {/* Executive Top Navigation Bar */}
      <Header
        activeTab={activeTab}
        setActiveTab={(tab: string) => setActiveTab(tab as any)}
        onOpenSyncHub={() => setActiveTab('sync')}
        onCopyAll={handleCopyAllSql}
        copied={copied}
        onDownloadSql={handleDownloadSql}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {/* VIEW 1: FLAGSHIP PLATFORM OVERVIEW */}
        {activeTab === 'overview' && (
          <VecOverview onNavigate={(tab) => setActiveTab(tab)} />
        )}

        {/* VIEW 2: BRANKAS PRIBADI SAYA (PERSONAL PRIVATE STORAGE) */}
        {activeTab === 'private-vault' && (
          <VecPrivateVault 
            onNavigateToStudio={() => setActiveTab('studio')}
            onNavigateToPublicVault={() => setActiveTab('vault')}
          />
        )}

        {/* VIEW 3: LIVE ART VAULT & CURATOR DISCUSSIONS (PUBLIC EXHIBITION) */}
        {activeTab === 'vault' && (
          <VecVault />
        )}

        {/* VIEW 4: HARDWARE SENSOR STUDIO & C2PA VERIFICATION */}
        {activeTab === 'studio' && (
          <VecStudio 
            onNavigateToPrivateVault={() => setActiveTab('private-vault')}
          />
        )}

        {/* VIEW 4: POSTGIS DIFFERENTIAL GEOPRIVACY RADAR */}
        {activeTab === 'spatial' && (
          <PostGisSimulator />
        )}

        {/* VIEW 5: GITHUB & SUPABASE SYNC CONTROL CENTER (LEGACY/FALLBACK) */}
        {activeTab === 'sync' && (
          <GitHubSupabaseSyncHub
            onCopyAllSql={handleCopyAllSql}
            copiedSql={copied}
          />
        )}

        {/* VIEW 6: ENTERPRISE ARCHITECTURE & SPECIFICATIONS */}
        {activeTab === 'architecture' && (
          <VecArchitectureConsole
            onCopyAllSql={handleCopyAllSql}
            copiedSql={copied}
            onDownloadSql={handleDownloadSql}
          />
        )}

        {/* VIEW 7: MASTER ADMIN FORTRESS PORTAL (SECRET ISOLATED ACCESS) */}
        {activeTab === 'admin-portal' && (
          <MasterAdminPortal
            onBackToPublicSite={() => {
              if (typeof window !== 'undefined' && window.history.pushState) {
                const cleanUrl = window.location.protocol + "//" + window.location.host + window.location.pathname;
                window.history.pushState({ path: cleanUrl }, '', cleanUrl);
              }
              setActiveTab('overview');
            }}
            onCopyAllSql={handleCopyAllSql}
            copiedSql={copied}
            onDownloadSql={handleDownloadSql}
          />
        )}

      </main>

      {/* Modern Executive Footer */}
      <footer className="border-t border-slate-900 bg-[#02040A] py-8 text-xs font-mono text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 rounded-lg bg-slate-900 border border-slate-800 p-0.5 flex items-center justify-center">
              <VecOfficialLogo className="w-full h-full" />
            </div>
            <div className="text-slate-400">
              <span className="text-white font-bold font-sans">Veroia Enterprise Corp (VEC)</span>
              <span className="mx-2">·</span>
              <span>Zero-Trust Cryptographic Hardware Provenance</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-slate-400">
            <a
              href="https://github.com/veroiaenterprisecorp/vec"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 hover:text-white transition"
            >
              <GitBranch className="w-3.5 h-3.5 text-slate-400" />
              <span>veroiaenterprisecorp/vec</span>
              <ExternalLink className="w-3 h-3 text-slate-600" />
            </a>

            <span className="text-slate-700">|</span>

            <span className="flex items-center gap-1 text-emerald-400">
              <Database className="w-3.5 h-3.5" />
              <span>Supabase PostgreSQL 16 & PostGIS 3.4</span>
            </span>

            <span className="text-slate-700">|</span>

            <span>C2PA v2.1 • NTAG424 DNA NFC</span>

            <span className="text-slate-800">|</span>

            {/* Discreet Stealth Access for Owner (Not in primary nav) */}
            <button
              onClick={() => setActiveTab('admin-portal')}
              className="flex items-center gap-1 text-slate-600 hover:text-emerald-400 transition cursor-pointer text-[11px] font-mono group"
              title="Akses Konsol Master Rahasia (?portal=master-admin | Ctrl+Shift+A)"
            >
              <Lock className="w-3 h-3 text-slate-600 group-hover:text-emerald-400 transition" />
              <span className="opacity-60 group-hover:opacity-100">Root Gate</span>
            </button>
          </div>

        </div>
      </footer>

      {/* Floating Toast Notification */}
      {showToast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl bg-slate-900 border border-cyan-500/60 shadow-2xl shadow-cyan-950 text-white text-xs font-mono">
          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

    </div>
  );
}
