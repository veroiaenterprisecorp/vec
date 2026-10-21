import React from 'react';
import { VecOfficialLogo } from './VecOfficialLogo';
import { ShieldCheck, Camera, LockKeyhole, ArrowRight } from 'lucide-react';

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
  onOpenSyncHub,
}) => {
  const publicNav = [
    { key: 'overview', label: 'Home' },
    { key: 'vault', label: 'Vault' },
    { key: 'studio', label: 'Studio' },
    { key: 'architecture', label: 'Architecture' },
  ] as const;

  return (
    <header className="sticky top-0 z-50 border-b border-slate-800/80 bg-slate-950/85 backdrop-blur-xl">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between gap-6 px-4 sm:px-6 lg:px-8">
        <button
          onClick={() => setActiveTab('overview')}
          className="group flex shrink-0 items-center gap-3 text-left focus:outline-none"
          aria-label="Go to overview"
        >
          <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl border border-cyan-500/30 bg-slate-950 p-1 shadow-lg shadow-cyan-950/30 transition group-hover:border-cyan-400/60">
            <VecOfficialLogo className="h-full w-full" />
          </div>
          <div className="leading-none">
            <div className="text-[11px] font-medium uppercase tracking-[0.28em] text-slate-400">
              Veroia
            </div>
            <div className="mt-1 text-sm font-semibold tracking-[0.18em] text-white">
              ENTERPRISE
            </div>
          </div>
        </button>

        <nav className="hidden items-center gap-2 xl:flex">
          {publicNav.map((item) => {
            const isActive = activeTab === item.key;

            return (
              <button
                key={item.key}
                onClick={() => setActiveTab(item.key)}
                className={[
                  'rounded-full border px-3.5 py-2 text-sm font-medium transition-all duration-200',
                  isActive
                    ? 'border-cyan-500/40 bg-cyan-500/10 text-cyan-300 shadow-lg shadow-cyan-950/20'
                    : 'border-transparent text-slate-300 hover:border-slate-700 hover:bg-slate-900/80 hover:text-white',
                ].join(' ')}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="flex items-center gap-3">
          <button
            onClick={onOpenSyncHub}
            className="hidden items-center gap-2 rounded-full border border-slate-700 bg-slate-900/80 px-3 py-2 text-[11px] font-medium text-slate-300 transition hover:border-slate-600 hover:text-white md:inline-flex"
            title="Open sync hub"
          >
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
            <span>Sync</span>
          </button>

          <button
            onClick={() => setActiveTab('admin-portal')}
            className="hidden items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-[11px] font-medium text-emerald-300 transition hover:border-emerald-400 hover:bg-emerald-500/15 sm:inline-flex"
            title="Akses portal admin tersembunyi"
          >
            <LockKeyhole className="h-3.5 w-3.5" />
            <span>Root Gate</span>
          </button>

          <button
            onClick={() => setActiveTab('studio')}
            className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 px-4 py-2.5 text-xs font-semibold text-white shadow-lg shadow-cyan-950/40 transition hover:from-cyan-400 hover:to-blue-500"
          >
            <Camera className="h-3.5 w-3.5" />
            <span>Test Sensor</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <div className="border-t border-slate-900 bg-slate-950/90 px-4 py-2 xl:hidden">
        <div className="flex gap-2 overflow-x-auto pb-1">
          {publicNav.map((item) => {
            const isActive = activeTab === item.key;

            return (
              <button
                key={item.key}
                onClick={() => setActiveTab(item.key)}
                className={[
                  'whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium transition',
                  isActive
                    ? 'bg-cyan-500/15 text-cyan-300 ring-1 ring-cyan-500/30'
                    : 'bg-slate-900 text-slate-400',
                ].join(' ')}
              >
                {item.label}
              </button>
            );
          })}

          <button
            onClick={() => setActiveTab('admin-portal')}
            className="whitespace-nowrap rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-300"
          >
            Root Gate
          </button>
        </div>
      </div>
    </header>
  );
};
