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
import { Check, Lock } from 'lucide-react';

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
    triggerToast('Skrip SQL lengkap berhasil disalin!');
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
      <Header
        activeTab={activeTab}
        setActiveTab={(tab: string) => setActiveTab(tab as any)}
        onOpenSyncHub={() => setActiveTab('sync')}
        onCopyAll={handleCopyAllSql}
        copied={copied}
        onDownloadSql={handleDownloadSql}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'overview' && (
          <VecOverview onNavigate={(tab) => setActiveTab(tab)} />
        )}

        {activeTab === 'private-vault' && (
          <VecPrivateVault 
            onNavigateToStudio={() => setActiveTab('studio')}
            onNavigateToPublicVault={() => setActiveTab('vault')}
          />
        )}

        {activeTab === 'vault' && (
          <VecVault 
            onNavigateToStudio={() => setActiveTab('studio')}
            onNavigateToPrivateVault={() => setActiveTab('private-vault')}
          />
        )}

        {activeTab === 'studio' && (
          <VecStudio 
            onNavigateToPrivateVault={() => setActiveTab('private-vault')}
            onNavigateToPublicVault={() => setActiveTab('vault')}
          />
        )}

        {activeTab === 'spatial' && (
          <PostGisSimulator />
        )}

        {activeTab === 'sync' && (
          <GitHubSupabaseSyncHub
            onCopyAllSql={handleCopyAllSql}
            copiedSql={copied}
          />
        )}

        {activeTab === 'architecture' && (
          <VecArchitectureConsole
            onCopyAllSql={handleCopyAllSql}
            copiedSql={copied}
            onDownloadSql={handleDownloadSql}
          />
        )}

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
            <span className="text-slate-300">Private vault • C2PA verification • PostGIS geoprivacy</span>

            <span className="text-slate-700">|</span>

            <button
              onClick={() => setActiveTab('admin-portal')}
              className="flex items-center gap-1 text-slate-600 hover:text-emerald-400 transition cursor-pointer text-[11px] font-mono group"
              title="Akses Konsol Master Rahasia"
            >
              <Lock className="w-3 h-3 text-slate-600 group-hover:text-emerald-400 transition" />
              <span className="opacity-60 group-hover:opacity-100">Root Gate</span>
            </button>
          </div>
        </div>
      </footer>

      {showToast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl bg-slate-900 border border-cyan-500/60 shadow-2xl shadow-cyan-950 text-white text-xs font-mono">
          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
