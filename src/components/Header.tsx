import React, { useState, useEffect } from 'react';
import { VecOfficialLogo } from './VecOfficialLogo';
import { Camera, Lock, Power, KeyRound } from 'lucide-react';
import { isVaultUnlocked } from '../lib/vaultKeyAuth';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenSyncHub?: () => void;
  onCopyAll?: () => void;
  copied?: boolean;
  onDownloadSql?: () => void;
  onVecout?: () => void;
  onOpenRegisterModal?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onVecout,
  onOpenRegisterModal
}) => {
  const [isUnlocked, setIsUnlocked] = useState<boolean>(() => isVaultUnlocked());

  useEffect(() => {
    const sync = () => setIsUnlocked(isVaultUnlocked());
    window.addEventListener('vec-vault-lock-state-changed', sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener('vec-vault-lock-state-changed', sync);
      window.removeEventListener('storage', sync);
    };
  }, []);
  return (
    <header className="border-b border-neutral-800/80 bg-[#020409]/95 backdrop-blur-xl sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between gap-8">
        
        {/* Zone 1: Brand Wordmark (Single Element Lockup) */}
        <button
          onClick={() => setActiveTab('overview')}
          className="flex items-center gap-3 text-left whitespace-nowrap shrink-0 group focus:outline-none cursor-pointer"
        >
          <div className="w-8 h-8 rounded-lg overflow-hidden border border-neutral-700/80 bg-neutral-950 p-0.5 flex items-center justify-center transition group-hover:border-cyan-400/80 shadow-sm">
            <VecOfficialLogo className="w-full h-full" />
          </div>
          <span className="text-sm font-semibold tracking-[0.20em] text-white font-sans group-hover:text-cyan-300 transition-colors uppercase">
            Veroia Enterprise
          </span>
        </button>

        {/* Zone 2: Navigation Links (Clean Single-Line Typography) */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-neutral-300">
          <button
            onClick={() => setActiveTab('overview')}
            className={`whitespace-nowrap shrink-0 transition-colors py-1 cursor-pointer ${
              activeTab === 'overview'
                ? 'text-white border-b-2 border-cyan-400 font-semibold'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            Ikhtisar
          </button>

          <button
            onClick={() => setActiveTab('vault')}
            className={`whitespace-nowrap shrink-0 transition-colors py-1 cursor-pointer ${
              activeTab === 'vault'
                ? 'text-white border-b-2 border-cyan-400 font-semibold'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            Katalog Karya
          </button>

          <button
            onClick={() => setActiveTab('private-vault')}
            className={`whitespace-nowrap shrink-0 transition-colors py-1 cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'private-vault'
                ? 'text-white border-b-2 border-emerald-400 font-semibold'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <span>Brankas Karya</span>
            {isUnlocked ? (
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" title="Brankas Terbuka"></span>
            ) : (
              <span title="Brankas Terkunci">
                <Lock className="w-3 h-3 text-neutral-500" />
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('studio')}
            className={`whitespace-nowrap shrink-0 transition-colors py-1 cursor-pointer ${
              activeTab === 'studio'
                ? 'text-white border-b-2 border-cyan-400 font-semibold'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            Studio Kamera
          </button>
        </nav>

        {/* Zone 3: Primary Action & Vecout */}
        <div className="flex items-center gap-3 shrink-0">
          {onOpenRegisterModal && (
            <button
              onClick={onOpenRegisterModal}
              className="hidden lg:inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-cyan-200 bg-cyan-950/40 hover:bg-cyan-900/60 border border-cyan-800/60 hover:border-cyan-500 rounded-lg shadow-sm transition-all duration-200 cursor-pointer"
              title="Pendaftaran Brankas & Kunci Baru"
            >
              <KeyRound className="w-3.5 h-3.5 text-cyan-400" />
              <span className="whitespace-nowrap">Daftar Brankas</span>
            </button>
          )}

          <button
            onClick={() => setActiveTab('studio')}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-neutral-900 hover:bg-neutral-800 border border-neutral-700/80 hover:border-cyan-500/50 rounded-lg shadow-sm transition-all duration-200 cursor-pointer"
          >
            <Camera className="w-3.5 h-3.5 text-cyan-400" />
            <span className="whitespace-nowrap">Buka Studio Foto</span>
          </button>

          <button
            onClick={onVecout}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-rose-300 bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/60 hover:border-rose-600 rounded-lg shadow-sm transition-all duration-200 cursor-pointer"
            title="Vecout ('): Kunci seluruh brankas dan keluar dari sesi aktif"
          >
            <Power className="w-3.5 h-3.5 text-rose-400" />
            <span className="whitespace-nowrap font-medium">Vecout (')</span>
          </button>
        </div>

      </div>

      {/* Mobile Responsive Navigation Strip */}
      <div className="md:hidden flex items-center justify-between gap-1 overflow-x-auto px-4 py-2 border-t border-neutral-900 bg-neutral-950 text-xs">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-3 py-1.5 rounded-md whitespace-nowrap transition-colors ${
            activeTab === 'overview' ? 'text-white font-semibold bg-neutral-800' : 'text-neutral-400'
          }`}
        >
          Ikhtisar
        </button>
        <button
          onClick={() => setActiveTab('vault')}
          className={`px-3 py-1.5 rounded-md whitespace-nowrap transition-colors ${
            activeTab === 'vault' ? 'text-white font-semibold bg-neutral-800' : 'text-neutral-400'
          }`}
        >
          Katalog
        </button>
        <button
          onClick={() => setActiveTab('private-vault')}
          className={`px-3 py-1.5 rounded-md whitespace-nowrap transition-colors ${
            activeTab === 'private-vault' ? 'text-white font-semibold bg-neutral-800' : 'text-neutral-400'
          }`}
        >
          Brankas
        </button>
        <button
          onClick={() => setActiveTab('studio')}
          className={`px-3 py-1.5 rounded-md whitespace-nowrap transition-colors ${
            activeTab === 'studio' ? 'text-white font-semibold bg-neutral-800' : 'text-neutral-400'
          }`}
        >
          Studio
        </button>
        {onOpenRegisterModal && (
          <button
            onClick={onOpenRegisterModal}
            className="px-2.5 py-1.5 rounded-md whitespace-nowrap text-xs text-cyan-300 bg-cyan-950/60 border border-cyan-800/60 flex items-center gap-1 cursor-pointer"
            title="Daftar Brankas"
          >
            <KeyRound className="w-3 h-3 text-cyan-400" />
            <span>Daftar</span>
          </button>
        )}
        <button
          onClick={onVecout}
          className="px-2.5 py-1.5 rounded-md whitespace-nowrap text-xs text-rose-300 bg-rose-950/50 hover:bg-rose-900/60 border border-rose-800/50 flex items-center gap-1 cursor-pointer"
          title="Vecout ('): Kunci Sesi"
        >
          <Power className="w-3 h-3 text-rose-400" />
          <span>Vecout (')</span>
        </button>
      </div>

    </header>
  );
};
