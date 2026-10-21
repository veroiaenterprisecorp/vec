import React from 'react';
import { VecOfficialLogo } from './VecOfficialLogo';
import { ShieldCheck, Camera, LockKeyhole } from 'lucide-react';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenSyncHub: () => void;
  onCopyAll?: () => void;
  copied?: boolean;
  onDownloadSql?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onOpenSyncHub
}) => {
  return (
    <header className="border-b border-slate-800/80 bg-[#030712]/95 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
        <button
          onClick={() => setActiveTab('overview')}
          className="flex items-center gap-3 text-left whitespace-nowrap shrink-0 group focus:outline-none"
        >
          <div className="w-9 h-9 rounded-xl overflow-hidden shadow-md shadow-cyan-500/20 border border-cyan-500/30 bg-[#02040A] p-0.5 flex items-center justify-center transition group-hover:border-cyan-400/60">
            <VecOfficialLogo className="w-full h-full" />
          </div>
          <span className="text-base font-bold tracking-tight text-white font-sans group-hover:text-cyan-300 transition-colors">
            VEROIA <span className="font-light text-slate-400">ENTERPRISE</span>
          </span>
        </button>

        <nav className="hidden xl:flex items-center gap-6 text-sm font-medium text-slate-300">
          <button
            onClick={() => setActiveTab('overview')}
            className={`whitespace-nowrap shrink-0 transition-colors py-1 ${
              activeTab === 'overview'
                ? 'text-cyan-400 border-b-2 border-cyan-400 font-semibold'
                : 'hover:text-white'
            }`}
          >
            Ikhtisar Platform
          </button>

          <button
            onClick={() => setActiveTab('private-vault')}
            className={`whitespace-nowrap shrink-0 transition-colors py-1 flex items-center gap-1.5 ${
              activeTab === 'private-vault'
                ? 'text-emerald-400 border-b-2 border-emerald-400 font-semibold'
                : 'hover:text-white'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Brankas Pribadi</span>
          </button>

          <button
            onClick={() => setActiveTab('vault')}
            className={`whitespace-nowrap shrink-0 transition-colors py-1 ${
              activeTab === 'vault'
                ? 'text-cyan-400 border-b-2 border-cyan-400 font-semibold'
                : 'hover:text-white'
            }`}
          >
            Live Vault
          </button>

          <button
            onClick={() => setActiveTab('studio')}
            className={`whitespace-nowrap shrink-0 transition-colors py-1 ${
              activeTab === 'studio'
                ? 'text-cyan-400 border-b-2 border-cyan-400 font-semibold'
                : 'hover:text-white'
            }`}
          >
            Studio Sensor C2PA
          </button>
        </nav>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => setActiveTab('admin-portal')}
            className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium text-slate-400 hover:text-emerald-300 bg-slate-900/80 hover:bg-slate-800 border border-slate-800 transition-colors"
            title="Akses portal admin tersembunyi"
          >
            <LockKeyhole className="w-3.5 h-3.5" />
            <span>Root Gate</span>
          </button>

          <button
            onClick={() => setActiveTab('studio')}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 rounded-lg shadow-lg shadow-cyan-950/40 transition-colors"
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Uji Sensor C2PA</span>
          </button>
        </div>
      </div>

      <div className="xl:hidden flex items-center gap-2 overflow-x-auto px-4 py-2 border-t border-slate-900 bg-slate-950 text-xs">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-2.5 py-1 rounded-md whitespace-nowrap ${
            activeTab === 'overview' ? 'bg-cyan-500/20 text-cyan-300 font-bold' : 'text-slate-400'
          }`}
        >
          Ikhtisar
        </button>
        <button
          onClick={() => setActiveTab('private-vault')}
          className={`px-2.5 py-1 rounded-md whitespace-nowrap flex items-center gap-1 ${
            activeTab === 'private-vault' ? 'bg-emerald-500/20 text-emerald-300 font-bold' : 'text-slate-400'
          }`}
        >
          <span>🔒 Brankas</span>
        </button>
        <button
          onClick={() => setActiveTab('vault')}
          className={`px-2.5 py-1 rounded-md whitespace-nowrap ${
            activeTab === 'vault' ? 'bg-cyan-500/20 text-cyan-300 font-bold' : 'text-slate-400'
          }`}
        >
          Live Vault
        </button>
        <button
          onClick={() => setActiveTab('studio')}
          className={`px-2.5 py-1 rounded-md whitespace-nowrap ${
            activeTab === 'studio' ? 'bg-cyan-500/20 text-cyan-300 font-bold' : 'text-slate-400'
          }`}
        >
          Sensor C2PA
        </button>
        <button
          onClick={() => setActiveTab('admin-portal')}
          className={`px-2.5 py-1 rounded-md whitespace-nowrap ${
            activeTab === 'admin-portal' ? 'bg-emerald-500/20 text-emerald-300 font-bold' : 'text-slate-400'
          }`}
        >
          Root Gate
        </button>
      </div>
    </header>
  );
};
