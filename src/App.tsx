import React, { useState, useEffect, lazy, Suspense } from 'react';
import { Header } from './components/Header';
import { VecOverview } from './components/VecOverview';
import { VecOfficialLogo } from './components/VecOfficialLogo';
import { Check, Loader2 } from 'lucide-react';
import { vecoutAll, isVaultUnlocked } from './lib/vaultKeyAuth';
import { checkAdminSession } from './lib/masterAdminStorage';
import type { AdminPortalTab } from './components/MasterAdminPortal';

// Code-split heavy tabs to reduce initial bundle and memory footprint
const VecVault = lazy(() => import('./components/VecVault').then((m) => ({ default: m.VecVault })));
const VecStudio = lazy(() => import('./components/VecStudio').then((m) => ({ default: m.VecStudio })));
const VecPrivateVault = lazy(() => import('./components/VecPrivateVault').then((m) => ({ default: m.VecPrivateVault })));
const MasterAdminPortal = lazy(() => import('./components/MasterAdminPortal').then((m) => ({ default: m.MasterAdminPortal })));

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
      if (hash.includes('monitoring')) return 'monitoring';
      if (hash.includes('gallery')) return 'gallery';
      if (hash.includes('security')) return 'security';
      if (hash.includes('spatial')) return 'spatial';
      if (hash.includes('architecture') || hash.includes('sql')) return 'architecture';
      if (hash.includes('sync')) return 'sync';
    }
    return 'monitoring';
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
      if (hash.includes('monitoring')) setAdminSubTab('monitoring');
      if (hash.includes('gallery')) setAdminSubTab('gallery');
      if (hash.includes('security')) setAdminSubTab('security');
      if (hash.includes('users')) setAdminSubTab('users');
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
    }, 3500);
  };

  // Inactivity Auto-Lock: Otomatis mengunci setelah 5 menit (300.000 ms) tanpa interaksi
  useEffect(() => {
    const INACTIVITY_TIMEOUT_MS = 5 * 60 * 1000;
    let timer: NodeJS.Timeout | null = null;

    const performAutoLock = () => {
      const isUnlockedNow = isVaultUnlocked();
      const isAdminActive = checkAdminSession();

      if (isUnlockedNow || isAdminActive) {
        vecoutAll();
        triggerToast('Sesi dan brankas dikunci otomatis karena tidak ada aktivitas selama 5 menit.');
      }
    };

    const resetTimer = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(performAutoLock, INACTIVITY_TIMEOUT_MS);
    };

    const events = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart', 'click'];
    events.forEach((evt) => window.addEventListener(evt, resetTimer, { passive: true }));

    resetTimer();

    return () => {
      if (timer) clearTimeout(timer);
      events.forEach((evt) => window.removeEventListener(evt, resetTimer));
    };
  }, []);

  const handleVecout = () => {
    vecoutAll();
    triggerToast("Vecout ('): Seluruh sesi aktif dan brankas telah dikunci rapat.");
  };

  const handleCopyAllSql = async () => {
    try {
      const { VEC_FULL_SQL_SCRIPT } = await import('./data/vecSqlSchema');
      await navigator.clipboard.writeText(VEC_FULL_SQL_SCRIPT);
      setCopied(true);
      triggerToast('Skrip SQL lengkap berhasil disalin!');
      setTimeout(() => setCopied(false), 2500);
    } catch {
      triggerToast('Gagal menyalin skrip SQL.');
    }
  };

  const handleDownloadSql = async () => {
    try {
      const { VEC_FULL_SQL_SCRIPT } = await import('./data/vecSqlSchema');
      const element = document.createElement('a');
      const file = new Blob([VEC_FULL_SQL_SCRIPT], { type: 'text/plain' });
      element.href = URL.createObjectURL(file);
      element.download = 'vec_schema_supabase.sql';
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
      triggerToast('File vec_schema_supabase.sql berhasil diunduh!');
    } catch {
      triggerToast('Gagal mengunduh skrip SQL.');
    }
  };

  const handleNavigate = (tab: string) => {
    if (
      tab === 'monitoring' ||
      tab === 'users' ||
      tab === 'gallery' ||
      tab === 'security' ||
      tab === 'spatial' ||
      tab === 'architecture' ||
      tab === 'sync'
    ) {
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
        onVecout={handleVecout}
      />

      {/* Main Content Container with Suspense Lazy Loading */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Suspense
          fallback={
            <div className="flex flex-col items-center justify-center min-h-[400px] gap-3 text-neutral-400">
              <Loader2 className="w-6 h-6 animate-spin text-cyan-400" />
              <span className="text-xs font-mono tracking-wider uppercase text-neutral-500">Memuat Modul VEC...</span>
            </div>
          }
        >
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
        </Suspense>
      </main>

      {/* Premium Institutional Footer */}
      <footer className="border-t border-neutral-900 bg-[#010206] py-10 text-xs font-sans text-neutral-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-neutral-900 border border-neutral-800 p-0.5 flex items-center justify-center">
              <VecOfficialLogo className="w-full h-full" />
            </div>
            <div>
              <span className="text-white font-semibold">Veroia Enterprise Corp</span>
              <span className="mx-2 text-neutral-600">·</span>
              <span className="text-neutral-400">Verifikasi & Sertifikasi Keaslian Karya Seni</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-5 text-neutral-400">
            <span>Brankas Aman</span>
            <span aria-hidden="true" className="text-neutral-700">·</span>
            <span>Standar Verifikasi Resmi</span>
            <span aria-hidden="true" className="text-neutral-700">·</span>
            <span>Penyimpanan Cloud Terproteksi</span>
            <span aria-hidden="true" className="text-neutral-700">·</span>
            <span>Perlindungan Privasi Lokasi</span>

            <span className="text-neutral-800 hidden sm:inline">|</span>

            <button
              onClick={() => {
                setAdminSubTab('monitoring');
                setActiveTab('admin-portal');
              }}
              className="text-[11px] text-neutral-600 hover:text-neutral-400 transition-colors cursor-pointer select-none"
              title="Konsol Vecmaster"
            >
              Vecmaster
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
