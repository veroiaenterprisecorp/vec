import React, { useState, useEffect } from 'react';
import { VecOfficialLogo } from './VecOfficialLogo';
import { 
  Camera, 
  Lock, 
  Unlock,
  Power, 
  KeyRound, 
  ShieldCheck, 
  Sun, 
  Moon, 
  Search, 
  X,
  Compass,
  Layers
} from 'lucide-react';
import { isVaultUnlocked } from '../lib/vaultKeyAuth';
import { ThemeMode, getInitialTheme, toggleTheme } from '../lib/theme';

export interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  searchQuery?: string;
  onSearch?: (query: string) => void;
  onOpenSyncHub?: () => void;
  onCopyAll?: () => void;
  copied?: boolean;
  onDownloadSql?: () => void;
  onVecout?: () => void;
  onOpenRegisterModal?: () => void;
  theme?: ThemeMode;
  onToggleTheme?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  searchQuery = '',
  onSearch,
  onVecout,
  onOpenRegisterModal,
  theme,
  onToggleTheme
}) => {
  const [isUnlocked, setIsUnlocked] = useState<boolean>(() => isVaultUnlocked());
  const [currentTheme, setCurrentTheme] = useState<ThemeMode>(() => theme || getInitialTheme());
  const [localSearchText, setLocalSearchText] = useState<string>(() => searchQuery);

  useEffect(() => {
    if (theme) {
      setCurrentTheme(theme);
    }
  }, [theme]);

  // Keep local search input synchronized if searchQuery prop changes from external component
  useEffect(() => {
    setLocalSearchText(searchQuery);
  }, [searchQuery]);

  useEffect(() => {
    const handleThemeChange = (e: any) => {
      if (e.detail?.theme) {
        setCurrentTheme(e.detail.theme);
      }
    };
    window.addEventListener('vec-theme-changed', handleThemeChange);
    return () => window.removeEventListener('vec-theme-changed', handleThemeChange);
  }, []);

  const handleToggleTheme = () => {
    if (onToggleTheme) {
      onToggleTheme();
    } else {
      const next = toggleTheme(currentTheme);
      setCurrentTheme(next);
    }
  };

  useEffect(() => {
    const sync = () => setIsUnlocked(isVaultUnlocked());
    window.addEventListener('vec-vault-lock-state-changed', sync);
    window.addEventListener('vec-lock-state-changed', sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener('vec-vault-lock-state-changed', sync);
      window.removeEventListener('vec-lock-state-changed', sync);
      window.removeEventListener('storage', sync);
    };
  }, []);

  const handleTabClick = (tab: string) => {
    setActiveTab(tab);
  };

  const handleSearchSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const query = localSearchText.trim();
    if (onSearch) {
      onSearch(query);
    } else {
      setActiveTab('vault');
    }
  };

  const handleClearSearch = () => {
    setLocalSearchText('');
    if (onSearch) {
      onSearch('');
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full max-w-full shadow-lg">
      
      {/* ========================================================================= */}
      {/* LAPISAN 1: HEADER ATAS (Top Bar)                                         */}
      {/* Menampilkan: Logo & Nama, Search Bar, Theme Toggle, Tombol Vecout         */}
      {/* ========================================================================= */}
      <div className="vec-header-top border-b border-neutral-800/80 bg-[#020409]/95 backdrop-blur-xl w-full">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-15 sm:h-16 flex items-center justify-between gap-2 sm:gap-4 md:gap-6 min-w-0 w-full">
          
          {/* 1. Logo & Nama Veroia Enterprise */}
          <button
            type="button"
            onClick={() => handleTabClick('overview')}
            className="flex items-center gap-2 sm:gap-2.5 text-left shrink-0 group focus:outline-none cursor-pointer"
            title="Kembali ke Ikhtisar Veroia Enterprise"
          >
            <div className="w-8 h-8 rounded-xl overflow-hidden border border-neutral-700/80 bg-neutral-950 p-1 flex items-center justify-center transition group-hover:border-cyan-400/80 shadow-xs shrink-0">
              <VecOfficialLogo className="w-full h-full" />
            </div>
            <div className="flex flex-col">
              <span className="text-xs sm:text-sm font-bold tracking-[0.14em] sm:tracking-[0.18em] text-white font-sans group-hover:text-cyan-300 transition-colors uppercase whitespace-nowrap">
                Veroia<span className="hidden sm:inline"> Enterprise</span>
              </span>
              <span className="text-[10px] text-neutral-400 tracking-wider hidden md:inline font-sans -mt-0.5">
                Zero-Trust Provenance
              </span>
            </div>
          </button>

          {/* 2. Search Bar Karya & Seniman (Proporsional & Nyaman) */}
          <form
            onSubmit={handleSearchSubmit}
            role="search"
            className="flex-1 max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg min-w-0 mx-1 sm:mx-2"
          >
            <div className="relative w-full flex items-center">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-400">
                <Search className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
              </div>
              <input
                type="text"
                aria-label="Cari Karya atau Nama Seniman"
                placeholder="Cari karya atau nama seniman..."
                value={localSearchText}
                onChange={(e) => setLocalSearchText(e.target.value)}
                className="vec-search-input w-full min-w-0 bg-neutral-900/90 hover:bg-neutral-900 text-white placeholder-neutral-500 text-xs sm:text-sm pl-8 sm:pl-9 pr-7 sm:pr-8 py-2 rounded-xl border border-neutral-700/80 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/40 transition font-sans"
              />
              {localSearchText && (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-neutral-400 hover:text-white transition cursor-pointer"
                  title="Hapus kata kunci pencarian"
                  aria-label="Hapus pencarian"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </form>

          {/* 3 & 4. Toggle Mode & Tombol Vecout */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            
            {/* Toggle Dark/Light Mode */}
            <button
              type="button"
              onClick={handleToggleTheme}
              className="vec-theme-toggle p-2 rounded-xl bg-neutral-900 hover:bg-neutral-850 text-neutral-300 hover:text-white border border-neutral-800 hover:border-neutral-700 transition cursor-pointer flex items-center justify-center shrink-0 shadow-xs"
              title={currentTheme === 'light' ? 'Beralih ke Dark Mode (Default)' : 'Beralih ke Light Mode'}
              aria-label={currentTheme === 'light' ? 'Beralih ke Dark Mode' : 'Beralih ke Light Mode'}
            >
              {currentTheme === 'light' ? (
                <Sun className="w-4 h-4 text-amber-500" />
              ) : (
                <Moon className="w-4 h-4 text-cyan-400" />
              )}
            </button>

            {/* Tombol Vecout (Logout & Lock All) */}
            <button
              type="button"
              onClick={onVecout}
              className="vec-vecout-btn inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-2 rounded-xl text-xs font-semibold text-rose-300 bg-rose-950/60 hover:bg-rose-900/80 border border-rose-800/70 hover:border-rose-600 transition shadow-sm cursor-pointer shrink-0"
              title="Vecout: Kunci seluruh brankas dan keluar dari sesi aktif"
              aria-label="Vecout: Kunci seluruh brankas dan keluar dari sesi aktif"
            >
              <Power className="w-3.5 h-3.5 text-rose-400 shrink-0" />
              <span className="whitespace-nowrap font-medium">Vecout</span>
            </button>

          </div>

        </div>
      </div>

      {/* ========================================================================= */}
      {/* LAPISAN 2: PANEL NAVIGASI UTAMA DI BAWAH HEADER (Dedicated Nav Panel)    */}
      {/* Menampilkan 6 item tepat:                                                 */}
      {/* 1. Ikhtisar                                                               */}
      {/* 2. Katalog Karya                                                          */}
      {/* 3. Brankas Karya (dengan indikator status terbuka/terkunci)               */}
      {/* 4. Studio Kamera                                                          */}
      {/* 5. Kontrol Admin (mengikuti aturan otorisasi master key)                  */}
      {/* 6. Daftar Brankas (membuka modal pendaftaran brankas)                    */}
      {/* ========================================================================= */}
      <nav 
        aria-label="Navigasi Utama Veroia"
        className="vec-nav-panel border-b border-neutral-800/80 bg-[#040714]/95 backdrop-blur-xl w-full"
      >
        <div className="max-w-7xl mx-auto px-2.5 sm:px-6 lg:px-8 py-1.5 sm:py-2">
          
          {/* Responsive Layout: Single horizontal row on desktop/tablet (md+), 2-row grid on mobile (< md) */}
          <div className="grid grid-cols-3 md:flex md:flex-wrap md:items-center md:justify-center gap-1.5 sm:gap-2 lg:gap-3">
            
            {/* 1. Ikhtisar */}
            <button
              type="button"
              onClick={() => handleTabClick('overview')}
              className={`vec-nav-btn flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-1.5 px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl text-[11px] sm:text-xs md:text-sm font-medium transition cursor-pointer min-h-[38px] sm:min-h-[40px] whitespace-nowrap ${
                activeTab === 'overview'
                  ? 'vec-nav-btn-active bg-cyan-950/50 text-cyan-300 font-semibold border border-cyan-500/40 shadow-xs'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-900/60 border border-transparent'
              }`}
            >
              <Compass className={`w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 ${activeTab === 'overview' ? 'text-cyan-400' : 'text-neutral-400'}`} />
              <span>Ikhtisar</span>
            </button>

            {/* 2. Katalog Karya */}
            <button
              type="button"
              onClick={() => handleTabClick('vault')}
              className={`vec-nav-btn flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-1.5 px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl text-[11px] sm:text-xs md:text-sm font-medium transition cursor-pointer min-h-[38px] sm:min-h-[40px] whitespace-nowrap ${
                activeTab === 'vault'
                  ? 'vec-nav-btn-active bg-cyan-950/50 text-cyan-300 font-semibold border border-cyan-500/40 shadow-xs'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-900/60 border border-transparent'
              }`}
            >
              <Layers className={`w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 ${activeTab === 'vault' ? 'text-cyan-400' : 'text-neutral-400'}`} />
              <span>Katalog Karya</span>
            </button>

            {/* 3. Brankas Karya */}
            <button
              type="button"
              onClick={() => handleTabClick('private-vault')}
              className={`vec-nav-btn flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-1.5 px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl text-[11px] sm:text-xs md:text-sm font-medium transition cursor-pointer min-h-[38px] sm:min-h-[40px] whitespace-nowrap relative ${
                activeTab === 'private-vault'
                  ? 'vec-nav-btn-active-emerald bg-emerald-950/50 text-emerald-300 font-semibold border border-emerald-500/40 shadow-xs'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-900/60 border border-transparent'
              }`}
              title={isUnlocked ? 'Brankas Pribadi: Terbuka' : 'Brankas Pribadi: Terkunci rapat'}
            >
              {isUnlocked ? (
                <Unlock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400 shrink-0" />
              ) : (
                <Lock className={`w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 ${activeTab === 'private-vault' ? 'text-emerald-400' : 'text-neutral-400'}`} />
              )}
              <span className="flex items-center gap-1">
                <span>Brankas Karya</span>
                {isUnlocked && (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" title="Brankas Terbuka"></span>
                )}
              </span>
            </button>

            {/* 4. Studio Kamera */}
            <button
              type="button"
              onClick={() => handleTabClick('studio')}
              className={`vec-nav-btn flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-1.5 px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl text-[11px] sm:text-xs md:text-sm font-medium transition cursor-pointer min-h-[38px] sm:min-h-[40px] whitespace-nowrap ${
                activeTab === 'studio'
                  ? 'vec-nav-btn-active bg-cyan-950/50 text-cyan-300 font-semibold border border-cyan-500/40 shadow-xs'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-900/60 border border-transparent'
              }`}
            >
              <Camera className={`w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 ${activeTab === 'studio' ? 'text-cyan-400' : 'text-neutral-400'}`} />
              <span>Studio Kamera</span>
            </button>

            {/* 5. Kontrol Admin */}
            <button
              type="button"
              onClick={() => handleTabClick('admin-portal')}
              className={`vec-nav-btn flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-1.5 px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl text-[11px] sm:text-xs md:text-sm font-medium transition cursor-pointer min-h-[38px] sm:min-h-[40px] whitespace-nowrap ${
                activeTab === 'admin-portal'
                  ? 'vec-nav-btn-active-emerald bg-emerald-950/50 text-emerald-300 font-semibold border border-emerald-500/40 shadow-xs'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-900/60 border border-transparent'
              }`}
              title="Portal Kontrol Admin & Keamanan"
            >
              <ShieldCheck className={`w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 ${activeTab === 'admin-portal' ? 'text-emerald-400' : 'text-neutral-400'}`} />
              <span>Kontrol Admin</span>
            </button>

            {/* 6. Daftar Brankas */}
            <button
              type="button"
              onClick={() => {
                if (onOpenRegisterModal) {
                  onOpenRegisterModal();
                }
              }}
              className="vec-nav-btn flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-1.5 px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl text-[11px] sm:text-xs md:text-sm font-medium text-cyan-300 hover:text-white bg-cyan-950/40 hover:bg-cyan-900/60 border border-cyan-500/30 hover:border-cyan-400/60 transition cursor-pointer min-h-[38px] sm:min-h-[40px] whitespace-nowrap shadow-xs"
              title="Pendaftaran Akun & Brankas Kreator Baru"
            >
              <KeyRound className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-cyan-400 shrink-0" />
              <span>Daftar Brankas</span>
            </button>

          </div>

        </div>
      </nav>

    </header>
  );
};

