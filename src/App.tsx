import React, { useState, useEffect, lazy, Suspense } from 'react';
import { Header } from './components/Header';
import { VEC_FULL_SQL_SCRIPT } from './data/vecSqlSchema';
import { VecOfficialLogo } from './components/VecOfficialLogo';
import { VaultRegistrationModal } from './components/VaultRegistrationModal';
import type { AdminPortalTab } from './components/MasterAdminPortal';

const VecOverview = lazy(() =>
  import('./components/VecOverview').then((module) => ({ default: module.VecOverview }))
);
const VecVault = lazy(() =>
  import('./components/VecVault').then((module) => ({ default: module.VecVault }))
);
const VecStudio = lazy(() =>
  import('./components/VecStudio').then((module) => ({ default: module.VecStudio }))
);
const VecPrivateVault = lazy(() =>
  import('./components/VecPrivateVault').then((module) => ({ default: module.VecPrivateVault }))
);
const MasterAdminPortal = lazy(() =>
  import('./components/MasterAdminPortal').then((module) => ({ default: module.MasterAdminPortal }))
);
import { Check } from 'lucide-react';
import { vecoutAll, isVaultUnlocked } from './lib/vaultKeyAuth';
import { checkAdminSession } from './lib/masterAdminStorage';
import { ThemeMode, getInitialTheme, applyTheme, toggleTheme } from './lib/theme';

export type AppTab = 'overview' | 'private-vault' | 'vault' | 'studio' | 'admin-portal';

export default function App() {
  const [catalogSearchQuery, setCatalogSearchQuery] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const q = new URLSearchParams(window.location.search).get('q');
      if (q) return q;
    }
    return '';
  });

  const [activeTab, setActiveTab] = useState<AppTab>(() => {
    if (typeof window !== 'undefined') {
      const search = window.location.search.toLowerCase();
      const hash = window.location.hash.toLowerCase();
      if (search.includes('portal=') || search.includes('admin') || hash.includes('admin') || hash.includes('portal')) {
        return 'admin-portal';
      }
      const q = new URLSearchParams(window.location.search).get('q');
      if (q && q.trim()) {
        return 'vault';
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
  const [showRegisterModal, setShowRegisterModal] = useState<boolean>(false);
  const [theme, setTheme] = useState<ThemeMode>(() => getInitialTheme());

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  useEffect(() => {
    const handleThemeEvent = (e: any) => {
      if (e.detail?.theme) {
        setTheme(e.detail.theme);
      }
    };
    window.addEventListener('vec-theme-changed', handleThemeEvent);
    return () => window.removeEventListener('vec-theme-changed', handleThemeEvent);
  }, []);

  useEffect(() => {
    const handleUrlCheck = () => {
      const search = window.location.search.toLowerCase();
      const hash = window.location.hash.toLowerCase();
      if (search.includes('portal=') || search.includes('admin') || hash.includes('admin') || hash.includes('portal')) {
        setActiveTab('admin-portal');
      }
      const q = new URLSearchParams(window.location.search).get('q');
      if (q !== null) {
        setCatalogSearchQuery(q);
        if (q.trim()) {
          setActiveTab('vault');
        }
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
    triggerToast("Vecout: Seluruh sesi aktif dan brankas telah dikunci rapat.");
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

  const handleHeaderSearch = (query: string) => {
    const clean = query.trim();
    setCatalogSearchQuery(clean);
    setActiveTab('vault');
    if (typeof window !== 'undefined' && window.history.pushState) {
      const url = new URL(window.location.href);
      if (clean) {
        url.searchParams.set('q', clean);
      } else {
        url.searchParams.delete('q');
      }
      window.history.pushState({}, '', url.toString());
    }
  };

  return (
    <div className="app-shell min-h-screen bg-[#020409] text-neutral-100 flex flex-col font-sans selection:bg-cyan-500/25 selection:text-cyan-200">
      
      {/* Premium Luxury Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={handleNavigate}
        searchQuery={catalogSearchQuery}
        onSearch={handleHeaderSearch}
        onOpenSyncHub={() => {
          setAdminSubTab('sync');
          setActiveTab('admin-portal');
        }}
        onCopyAll={handleCopyAllSql}
        copied={copied}
        onDownloadSql={handleDownloadSql}
        onVecout={handleVecout}
        onOpenRegisterModal={() => setShowRegisterModal(true)}
        theme={theme}
        onToggleTheme={() => {
          const next = toggleTheme(theme);
          setTheme(next);
        }}
      />

      {/* Main Luxury Content Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-5 sm:py-8 min-w-0">
        <Suspense
          fallback={
            <div className="flex min-h-[420px] items-center justify-center rounded-2xl border border-neutral-800 bg-neutral-950/70 text-sm text-neutral-400">
              Memuat panel Veroia…
            </div>
          }
        >
          {activeTab === 'overview' && (
            <VecOverview 
              onNavigate={handleNavigate} 
              onOpenRegisterModal={() => setShowRegisterModal(true)}
            />
          )}

          {activeTab === 'vault' && (
            <VecVault 
              onNavigateToStudio={() => setActiveTab('studio')}
              onNavigateToPrivateVault={() => setActiveTab('private-vault')}
              searchQuery={catalogSearchQuery}
              onSearchQueryChange={(newQuery) => {
                setCatalogSearchQuery(newQuery);
                if (typeof window !== 'undefined' && window.history.replaceState) {
                  const url = new URL(window.location.href);
                  if (newQuery.trim()) {
                    url.searchParams.set('q', newQuery.trim());
                  } else {
                    url.searchParams.delete('q');
                  }
                  window.history.replaceState({}, '', url.toString());
                }
              }}
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
      <footer className="border-t border-neutral-900 bg-[#010206] py-8 sm:py-10 text-xs font-sans text-neutral-400 w-full">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6 min-w-0">
          <div className="flex flex-col sm:flex-row items-center gap-3 text-center sm:text-left min-w-0">
            <div className="w-7 h-7 rounded-lg bg-neutral-900 border border-neutral-800 p-0.5 flex items-center justify-center shrink-0">
              <VecOfficialLogo className="w-full h-full" />
            </div>
            <div className="min-w-0">
              <span className="text-white font-semibold">Veroia Enterprise Corp</span>
              <span className="mx-2 text-neutral-600 hidden sm:inline">·</span>
              <span className="text-neutral-400 block sm:inline mt-0.5 sm:mt-0">Verifikasi & Sertifikasi Keaslian Karya Seni</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center md:justify-end gap-2.5 sm:gap-5 text-neutral-400 text-center">
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


      {/* Global Vault Registration Modal */}
      <VaultRegistrationModal
        isOpen={showRegisterModal}
        onClose={() => setShowRegisterModal(false)}
        onRegisteredSuccess={(vault) => {
          setActiveTab('private-vault');
          triggerToast(`Brankas "${vault.vault_name}" berhasil didaftarkan dan kunci aktif!`);
        }}
      />

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
