import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { VecOverview } from './components/VecOverview';
import { VecVault } from './components/VecVault';
import { VecStudio } from './components/VecStudio';
import { VecPrivateVault } from './components/VecPrivateVault';
import { MasterAdminPortal, AdminPortalTab } from './components/MasterAdminPortal';
import { VEC_FULL_SQL_SCRIPT } from './data/vecSqlSchema';
import { VecOfficialLogo } from './components/VecOfficialLogo';
import { Check, Lock } from 'lucide-react';

export type AppTab = 'overview' | 'private-vault' | 'vault' | 'studio' | 'admin-portal';

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

  const [adminSubTab, setAdminSubTab] = useState<AdminPortalTab>(() => {
    if (typeof window !== 'undefined') {
      const hash = window.location.hash.toLowerCase();
      if (hash.includes('spatial')) return 'spatial';
      if (hash.includes('architecture') || hash.includes('sql')) return 'architecture';
      if (hash.includes('sync')) return 'sync';
    }
    return 'users';
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
      if (hash.includes('spatial')) setAdminSubTab('spatial');
      if (hash.includes('architecture') || hash.includes('sql')) setAdminSubTab('architecture');
      if (hash.includes('sync')) setAdminSubTab('sync');
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

  const handleNavigate = (tab: string) => {
    if (tab === 'spatial' || tab === 'architecture' || tab === 'sync') {
      setAdminSubTab(tab as AdminPortalTab);
      setActiveTab('admin-portal');
    } else {
      setActiveTab(tab as AppTab);
    }
  };

  return (
    <div className="min-h-screen bg-[#020409] text-neutral-100 flex flex-col font-sans selection:bg-cyan-500/25 selection:text-cyan-200">
      
      {/* Premium Luxury Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={handleNavigate}
        onOpenSyncHub={() => {
          setAdminSubTab('sync');
          setActiveTab('admin-portal');
        }}
        onCopyAll={handleCopyAllSql}
        copied={copied}
        onDownloadSql={handleDownloadSql}
      />

      {/* Main Luxury Content Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'overview' && (
          <VecOverview onNavigate={handleNavigate} />
        )}

        {activeTab === 'vault' && (
          <VecVault 
            onNavigateToStudio={() => setActiveTab('studio')}
            onNavigateToPrivateVault={() => setActiveTab('private-vault')}
          />
        )}

        {activeTab === 'private-vault' && (
          <VecPrivateVault 
            onNavigateToStudio={() => setActiveTab('studio')}
            onNavigateToPublicVault={() => setActiveTab('vault')}
          />
        )}

        {activeTab === 'studio' && (
          <VecStudio 
            onNavigateToPrivateVault={() => setActiveTab('private-vault')}
            onNavigateToPublicVault={() => setActiveTab('vault')}
          />
        )}

        {activeTab === 'admin-portal' && (
          <MasterAdminPortal
            initialAdminTab={adminSubTab}
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

      {/* Premium Institutional Footer */}
      <footer className="border-t border-neutral-900 bg-[#010206] py-10 text-xs font-sans text-neutral-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-neutral-900 border border-neutral-800 p-0.5 flex items-center justify-center">
              <VecOfficialLogo className="w-full h-full" />
            </div>
            <div>
              <span className="text-white font-semibold">Veroia Enterprise Corp (VEC)</span>
              <span className="mx-2 text-neutral-600">·</span>
              <span className="text-neutral-400">Zero-Trust Cryptographic Hardware Provenance</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-5 text-neutral-400">
            <span>Brankas Terenkripsi</span>
            <span aria-hidden="true" className="text-neutral-700">·</span>
            <span>C2PA v2.1 Verification</span>
            <span aria-hidden="true" className="text-neutral-700">·</span>
            <span>Supabase Cloud Integration</span>
            <span aria-hidden="true" className="text-neutral-700">·</span>
            <span>PostGIS Differential Geoprivacy</span>

            <span className="text-neutral-800 hidden sm:inline">|</span>

            <button
              onClick={() => {
                setAdminSubTab('users');
                setActiveTab('admin-portal');
              }}
              className="flex items-center gap-1.5 text-neutral-500 hover:text-emerald-400 transition cursor-pointer text-xs font-mono group"
              title="Akses Konsol Master Root Gate (Admin/Owner)"
            >
              <Lock className="w-3.5 h-3.5 text-neutral-500 group-hover:text-emerald-400 transition" />
              <span className="opacity-70 group-hover:opacity-100">Root Gate</span>
            </button>
          </div>
        </div>
      </footer>

      {/* Toast Notification */}
      {showToast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl bg-neutral-900 border border-cyan-500/60 shadow-2xl text-white text-xs font-mono">
          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

    </div>
  );
}
