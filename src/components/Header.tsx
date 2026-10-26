import React, { useState, useEffect } from 'react';
import { VecOfficialLogo } from './VecOfficialLogo';
import { Camera, Lock, Power, KeyRound, ShieldCheck, Menu, X, Sun, Moon, Search } from 'lucide-react';
import { isVaultUnlocked } from '../lib/vaultKeyAuth';
import { ThemeMode, getInitialTheme, toggleTheme } from '../lib/theme';

interface HeaderProps {
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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState<boolean>(false);
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
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener('vec-vault-lock-state-changed', sync);
      window.removeEventListener('storage', sync);
    };
  }, []);

  const handleTabClick = (tab: string) => {
    setActiveTab(tab);
    setIsMobileMenuOpen(false);
    setIsMobileSearchOpen(false);
  };

  const handleSearchSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const query = localSearchText.trim();
    if (onSearch) {
      onSearch(query);
    } else {
      setActiveTab('vault');
    }
    setIsMobileSearchOpen(false);
    setIsMobileMenuOpen(false);
  };

  return (
    <header className="border-b border-neutral-800/80 bg-[#020409]/95 backdrop-blur-xl sticky top-0 z-50 w-full max-w-full">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-5 xl:px-8 h-16 sm:h-18 flex items-center justify-between gap-1.5 sm:gap-2.5 lg:gap-3 xl:gap-4 min-w-0 w-full">
        
        {/* Zone 1: Brand Wordmark */}
        <button
          onClick={() => handleTabClick('overview')}
          className="flex items-center gap-1.5 sm:gap-2.5 text-left shrink-0 group focus:outline-none cursor-pointer min-w-0"
        >
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg overflow-hidden border border-neutral-700/80 bg-neutral-950 p-0.5 flex items-center justify-center transition group-hover:border-cyan-400/80 shadow-sm shrink-0">
            <VecOfficialLogo className="w-full h-full" />
          </div>
          <span className="text-xs sm:text-sm font-semibold tracking-[0.12em] sm:tracking-[0.18em] text-white font-sans group-hover:text-cyan-300 transition-colors uppercase truncate">
            Veroia<span className="hidden sm:inline"> Enterprise</span>
          </span>
        </button>

        {/* Zone 2: Desktop Navigation Links */}
        <nav className="hidden lg:flex items-center gap-1 lg:gap-1.5 xl:gap-3 2xl:gap-4 text-xs xl:text-sm font-medium text-neutral-300 shrink-0 min-w-0">
          <button
            onClick={() => handleTabClick('overview')}
            className={`whitespace-nowrap transition-colors py-1 px-1.5 xl:px-2 rounded cursor-pointer ${
              activeTab === 'overview'
                ? 'text-white border-b-2 border-cyan-400 font-semibold'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            Ikhtisar
          </button>

          <button
            onClick={() => handleTabClick('vault')}
            className={`whitespace-nowrap transition-colors py-1 px-1.5 xl:px-2 rounded cursor-pointer ${
              activeTab === 'vault'
                ? 'text-white border-b-2 border-cyan-400 font-semibold'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <span>Katalog<span className="hidden xl:inline"> Karya</span></span>
          </button>

          <button
            onClick={() => handleTabClick('private-vault')}
            className={`whitespace-nowrap transition-colors py-1 px-1.5 xl:px-2 rounded cursor-pointer flex items-center gap-1 ${
              activeTab === 'private-vault'
                ? 'text-white border-b-2 border-emerald-400 font-semibold'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <span>Brankas<span className="hidden xl:inline"> Karya</span></span>
            {isUnlocked ? (
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" title="Brankas Terbuka"></span>
            ) : (
              <span title="Brankas Terkunci">
                <Lock className="w-3 h-3 text-neutral-500" />
              </span>
            )}
          </button>

          <button
            onClick={() => handleTabClick('studio')}
            className={`whitespace-nowrap transition-colors py-1 px-1.5 xl:px-2 rounded cursor-pointer ${
              activeTab === 'studio'
                ? 'text-white border-b-2 border-cyan-400 font-semibold'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <span>Studio<span className="hidden xl:inline"> Kamera</span></span>
          </button>

          <button
            onClick={() => handleTabClick('admin-portal')}
            className={`whitespace-nowrap transition-colors py-1 px-1.5 xl:px-2 rounded cursor-pointer flex items-center gap-1 ${
              activeTab === 'admin-portal'
                ? 'text-white border-b-2 border-emerald-400 font-semibold'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span><span className="hidden xl:inline">Kontrol </span>Admin</span>
          </button>
        </nav>

        {/* Zone 2.5: Compact Persistent Navbar Search Input (Desktop) */}
        <form
          onSubmit={handleSearchSubmit}
          role="search"
          className="hidden md:flex items-center relative flex-1 min-w-[110px] sm:min-w-[130px] lg:min-w-[140px] max-w-[170px] lg:max-w-[210px] xl:max-w-[260px] min-w-0 mx-0.5 lg:mx-1 xl:mx-2"
        >
          <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-neutral-400">
            <Search className="w-3.5 h-3.5 shrink-0" />
          </div>
          <input
            type="text"
            aria-label="Cari Karya Atau Nama Seniman"
            placeholder="Cari Karya Atau Nama Seniman..."
            value={localSearchText}
            onChange={(e) => setLocalSearchText(e.target.value)}
            className="w-full min-w-0 bg-neutral-900/90 hover:bg-neutral-900 text-white placeholder-neutral-500 text-xs pl-8 pr-7 py-1.5 rounded-lg border border-neutral-700/80 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/40 transition font-sans"
          />
          {localSearchText && (
            <button
              type="button"
              onClick={() => {
                setLocalSearchText('');
                if (onSearch) onSearch('');
              }}
              className="absolute inset-y-0 right-0 pr-2 flex items-center text-neutral-400 hover:text-white transition cursor-pointer"
              title="Hapus pencarian"
              aria-label="Hapus kata kunci"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </form>

        {/* Zone 3: Primary Action & Vecout */}
        <div className="flex items-center gap-1 sm:gap-1.5 lg:gap-2 shrink-0 min-w-0">
          
          {/* Mobile Search Toggle Icon (Shown on screens < md) */}
          <button
            type="button"
            onClick={() => setIsMobileSearchOpen(!isMobileSearchOpen)}
            className={`md:hidden p-1.5 sm:p-2 rounded-lg text-neutral-300 hover:text-white border transition cursor-pointer flex items-center justify-center ${
              isMobileSearchOpen 
                ? 'bg-cyan-950/80 text-cyan-300 border-cyan-500/50' 
                : 'bg-neutral-900 border-neutral-800 hover:bg-neutral-800'
            }`}
            aria-label={isMobileSearchOpen ? 'Tutup pencarian' : 'Buka pencarian karya atau kreator'}
            title="Cari karya atau kreator"
          >
            <Search className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-cyan-400" />
          </button>

          {onOpenRegisterModal && (
            <button
              onClick={onOpenRegisterModal}
              className="hidden sm:inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 xl:px-3 py-1.5 sm:py-2 text-xs font-semibold text-cyan-200 bg-cyan-950/60 hover:bg-cyan-900 border border-cyan-500/50 hover:border-cyan-400 rounded-lg shadow-sm transition-all duration-200 cursor-pointer"
              title="Pendaftaran Brankas & Kunci Baru"
            >
              <KeyRound className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <span className="whitespace-nowrap"><span className="hidden lg:inline xl:hidden">Daftar</span><span className="hidden xl:inline">Daftar Brankas</span><span className="lg:hidden">Daftar Brankas</span></span>
            </button>
          )}

          <button
            onClick={() => handleTabClick('studio')}
            className="hidden 2xl:inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-white bg-neutral-900 hover:bg-neutral-800 border border-neutral-700/80 hover:border-cyan-500/50 rounded-lg shadow-sm transition-all duration-200 cursor-pointer"
            title="Buka Studio Kamera"
          >
            <Camera className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <span className="whitespace-nowrap">Studio Foto</span>
          </button>

          {/* Theme Toggle Button */}
          <button
            type="button"
            onClick={handleToggleTheme}
            className="p-1.5 sm:p-2 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white border border-neutral-800 hover:border-neutral-700 transition cursor-pointer flex items-center justify-center shrink-0"
            title={currentTheme === 'light' ? 'Beralih ke Dark Mode (Default)' : 'Beralih ke Light Mode'}
            aria-label={currentTheme === 'light' ? 'Beralih ke Dark Mode' : 'Beralih ke Light Mode'}
          >
            {currentTheme === 'light' ? (
              <Sun className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-500" />
            ) : (
              <Moon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-cyan-400" />
            )}
          </button>

          {/* Vecout Button: Always prominently visible on mobile and desktop */}
          <button
            onClick={onVecout}
            className="inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 xl:px-3 py-1.5 sm:py-2 text-xs font-semibold text-rose-300 bg-rose-950/50 hover:bg-rose-900/70 border border-rose-800/70 hover:border-rose-600 rounded-lg shadow-sm transition-all duration-200 cursor-pointer shrink-0"
            title="Vecout: Kunci seluruh brankas dan keluar dari sesi aktif"
          >
            <Power className="w-3.5 h-3.5 text-rose-400 shrink-0" />
            <span className="whitespace-nowrap font-medium">Vecout</span>
          </button>

          {/* Mobile Menu Toggle Button */}
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden p-2 rounded-lg bg-neutral-900 text-neutral-300 hover:text-white border border-neutral-800 focus:outline-none transition cursor-pointer"
            aria-label={isMobileMenuOpen ? 'Tutup menu' : 'Buka menu'}
          >
            {isMobileMenuOpen ? (
              <X className="w-4 h-4 text-cyan-400" />
            ) : (
              <Menu className="w-4 h-4" />
            )}
          </button>
        </div>

      </div>

      {/* Mobile / Tablet Expandable Search Row (< md) */}
      {isMobileSearchOpen && (
        <div className="md:hidden border-t border-neutral-800/80 bg-neutral-950/98 px-3 sm:px-4 py-2 flex items-center gap-2 animate-in fade-in slide-in-from-top-1">
          <form onSubmit={handleSearchSubmit} className="relative flex-1" role="search">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-400">
              <Search className="w-3.5 h-3.5" />
            </div>
            <input
              type="text"
              autoFocus
              aria-label="Cari Karya Atau Nama Seniman"
              placeholder="Cari Karya Atau Nama Seniman..."
              value={localSearchText}
              onChange={(e) => setLocalSearchText(e.target.value)}
              className="w-full bg-neutral-900 text-white placeholder-neutral-500 text-xs pl-8 pr-8 py-2 rounded-lg border border-neutral-700/80 focus:outline-none focus:border-cyan-500 font-sans"
            />
            {localSearchText && (
              <button
                type="button"
                onClick={() => {
                  setLocalSearchText('');
                  if (onSearch) onSearch('');
                }}
                className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-neutral-400 hover:text-white cursor-pointer"
                aria-label="Hapus kata kunci"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </form>
          <button
            type="button"
            onClick={() => handleSearchSubmit()}
            className="px-3 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shrink-0 transition cursor-pointer"
          >
            Cari
          </button>
          <button
            type="button"
            onClick={() => setIsMobileSearchOpen(false)}
            className="p-1.5 text-neutral-400 hover:text-white shrink-0 cursor-pointer"
            aria-label="Tutup bar pencarian"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Expandable Mobile Navigation Menu */}
      {isMobileMenuOpen && (
        <div className="lg:hidden border-t border-neutral-850 bg-[#030612]/98 backdrop-blur-2xl px-4 py-4 space-y-3 shadow-2xl animate-in fade-in duration-150">
          
          {/* Mobile Menu Search Bar */}
          <form onSubmit={handleSearchSubmit} className="relative w-full mb-1" role="search">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-400">
              <Search className="w-3.5 h-3.5" />
            </div>
            <input
              type="text"
              aria-label="Cari Karya Atau Nama Seniman"
              placeholder="Cari Karya Atau Nama Seniman..."
              value={localSearchText}
              onChange={(e) => setLocalSearchText(e.target.value)}
              className="w-full bg-neutral-900 text-white placeholder-neutral-500 text-xs pl-8 pr-8 py-2.5 rounded-xl border border-neutral-700/80 focus:outline-none focus:border-cyan-500 font-sans"
            />
            {localSearchText && (
              <button
                type="button"
                onClick={() => {
                  setLocalSearchText('');
                  if (onSearch) onSearch('');
                }}
                className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-neutral-400 hover:text-white cursor-pointer"
                aria-label="Hapus kata kunci"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </form>

          <div className="grid grid-cols-1 gap-1 text-sm font-medium">
            <button
              onClick={() => handleTabClick('overview')}
              className={`flex items-center justify-between px-3 py-2.5 rounded-xl transition-colors text-left ${
                activeTab === 'overview'
                  ? 'bg-cyan-500/15 text-cyan-300 font-semibold border border-cyan-500/30'
                  : 'text-neutral-300 hover:bg-neutral-900'
              }`}
            >
              <span>Ikhtisar</span>
              {activeTab === 'overview' && <span className="w-2 h-2 rounded-full bg-cyan-400"></span>}
            </button>

            <button
              onClick={() => handleTabClick('vault')}
              className={`flex items-center justify-between px-3 py-2.5 rounded-xl transition-colors text-left ${
                activeTab === 'vault'
                  ? 'bg-cyan-500/15 text-cyan-300 font-semibold border border-cyan-500/30'
                  : 'text-neutral-300 hover:bg-neutral-900'
              }`}
            >
              <span>Katalog Karya</span>
              {activeTab === 'vault' && <span className="w-2 h-2 rounded-full bg-cyan-400"></span>}
            </button>

            <button
              onClick={() => handleTabClick('private-vault')}
              className={`flex items-center justify-between px-3 py-2.5 rounded-xl transition-colors text-left ${
                activeTab === 'private-vault'
                  ? 'bg-emerald-500/15 text-emerald-300 font-semibold border border-emerald-500/30'
                  : 'text-neutral-300 hover:bg-neutral-900'
              }`}
            >
              <div className="flex items-center gap-2">
                <span>Brankas Karya</span>
                {isUnlocked ? (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">Terbuka</span>
                ) : (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-400">Terkunci</span>
                )}
              </div>
              <Lock className={`w-4 h-4 ${isUnlocked ? 'text-emerald-400' : 'text-neutral-500'}`} />
            </button>

            <button
              onClick={() => handleTabClick('studio')}
              className={`flex items-center justify-between px-3 py-2.5 rounded-xl transition-colors text-left ${
                activeTab === 'studio'
                  ? 'bg-cyan-500/15 text-cyan-300 font-semibold border border-cyan-500/30'
                  : 'text-neutral-300 hover:bg-neutral-900'
              }`}
            >
              <div className="flex items-center gap-2">
                <Camera className="w-4 h-4 text-cyan-400" />
                <span>Studio Kamera</span>
              </div>
              {activeTab === 'studio' && <span className="w-2 h-2 rounded-full bg-cyan-400"></span>}
            </button>

            <button
              onClick={() => handleTabClick('admin-portal')}
              className={`flex items-center justify-between px-3 py-2.5 rounded-xl transition-colors text-left ${
                activeTab === 'admin-portal'
                  ? 'bg-emerald-500/15 text-emerald-300 font-semibold border border-emerald-500/30'
                  : 'text-neutral-300 hover:bg-neutral-900'
              }`}
            >
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Kontrol Admin</span>
              </div>
              {activeTab === 'admin-portal' && <span className="w-2 h-2 rounded-full bg-emerald-400"></span>}
            </button>
          </div>

          {/* Quick Actions in Mobile Menu */}
          <div className="pt-2 border-t border-neutral-800/80 flex flex-col gap-2">
            {onOpenRegisterModal && (
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  onOpenRegisterModal();
                }}
                className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold text-cyan-200 bg-cyan-950/70 border border-cyan-500/40 hover:bg-cyan-900 transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <KeyRound className="w-3.5 h-3.5 text-cyan-400" />
                <span>Daftar Akun & Brankas Baru</span>
              </button>
            )}

            <button
              onClick={() => handleTabClick('studio')}
              className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold text-white bg-neutral-900 hover:bg-neutral-850 border border-neutral-700 transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <Camera className="w-3.5 h-3.5 text-cyan-400" />
              <span>Buka Studio Foto Kamera</span>
            </button>

            <button
              onClick={handleToggleTheme}
              className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold text-neutral-300 bg-neutral-900 hover:bg-neutral-850 border border-neutral-700 transition flex items-center justify-between cursor-pointer"
            >
              <div className="flex items-center gap-2">
                {currentTheme === 'light' ? (
                  <Sun className="w-3.5 h-3.5 text-amber-500" />
                ) : (
                  <Moon className="w-3.5 h-3.5 text-cyan-400" />
                )}
                <span>Tema Tampilan</span>
              </div>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-neutral-800 text-neutral-300">
                {currentTheme === 'light' ? 'Light Mode' : 'Dark Mode (Default)'}
              </span>
            </button>
          </div>
        </div>
      )}

      {/* Mobile Responsive Navigation Strip (Quick Horizontal Tap Bar) */}
      <div className="header-mobile-strip lg:hidden w-full overflow-x-auto scrollbar-none px-2.5 sm:px-4 py-1.5 border-t border-neutral-900/90 bg-neutral-950/90 flex items-center gap-1.5 text-xs">
        <button
          onClick={() => handleTabClick('overview')}
          className={`px-3 py-1.5 rounded-lg whitespace-nowrap shrink-0 transition-colors ${
            activeTab === 'overview' ? 'text-white font-semibold bg-neutral-800 shadow-xs' : 'text-neutral-400 hover:text-white'
          }`}
        >
          Ikhtisar
        </button>
        <button
          onClick={() => handleTabClick('vault')}
          className={`px-3 py-1.5 rounded-lg whitespace-nowrap shrink-0 transition-colors ${
            activeTab === 'vault' ? 'text-white font-semibold bg-neutral-800 shadow-xs' : 'text-neutral-400 hover:text-white'
          }`}
        >
          Katalog
        </button>
        <button
          onClick={() => handleTabClick('private-vault')}
          className={`px-3 py-1.5 rounded-lg whitespace-nowrap shrink-0 transition-colors flex items-center gap-1.5 ${
            activeTab === 'private-vault' ? 'text-white font-semibold bg-neutral-800 shadow-xs' : 'text-neutral-400 hover:text-white'
          }`}
        >
          <span>Brankas</span>
          {isUnlocked ? (
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" title="Terbuka"></span>
          ) : (
            <Lock className="w-2.5 h-2.5 text-neutral-500" />
          )}
        </button>
        <button
          onClick={() => handleTabClick('studio')}
          className={`px-3 py-1.5 rounded-lg whitespace-nowrap shrink-0 transition-colors ${
            activeTab === 'studio' ? 'text-white font-semibold bg-neutral-800 shadow-xs' : 'text-neutral-400 hover:text-white'
          }`}
        >
          Studio
        </button>
        <button
          onClick={() => handleTabClick('admin-portal')}
          className={`px-3 py-1.5 rounded-lg whitespace-nowrap shrink-0 transition-colors flex items-center gap-1 ${
            activeTab === 'admin-portal' ? 'text-emerald-300 font-semibold bg-emerald-950/60 border border-emerald-500/40 shadow-xs' : 'text-neutral-400 hover:text-white'
          }`}
        >
          <ShieldCheck className="w-3 h-3 text-emerald-400" />
          <span>Admin</span>
        </button>
      </div>

    </header>
  );
};
