import React, { useState } from 'react';
import { VEC_TABLE_SCHEMAS, SchemaTableDef } from '../data/vecSqlSchema';
import { 
  Key, 
  Link as LinkIcon, 
  ShieldAlert, 
  Layers, 
  MapPin, 
  Cpu, 
  Mic, 
  Award, 
  UserCheck,
  CheckCircle2,
  Sparkles
} from 'lucide-react';

export const ErdVisualizer: React.FC = () => {
  const [selectedTable, setSelectedTable] = useState<SchemaTableDef>(VEC_TABLE_SCHEMAS[1]); // Default to 'posts'

  const getTableIcon = (name: string) => {
    switch (name) {
      case 'users':
        return <UserCheck className="w-4 h-4 text-emerald-400" />;
      case 'posts':
        return <MapPin className="w-4 h-4 text-cyan-400" />;
      case 'art_certificates':
        return <Award className="w-4 h-4 text-amber-400" />;
      case 'art_process_proofs':
        return <Cpu className="w-4 h-4 text-purple-400" />;
      case 'interactions':
        return <Mic className="w-4 h-4 text-pink-400" />;
      default:
        return <Layers className="w-4 h-4 text-slate-400" />;
    }
  };

  const getBadgeStyle = (badge?: string) => {
    switch (badge) {
      case 'ZERO_TRUST_PRIVATE':
        return 'bg-red-950/80 text-red-400 border-red-800/80 font-bold';
      case 'RESTRICTED_FUZZED':
        return 'bg-cyan-950/80 text-cyan-300 border-cyan-700/80 font-medium';
      case 'CRYPTOGRAPHIC':
        return 'bg-purple-950/80 text-purple-300 border-purple-700/80 font-medium';
      case 'PUBLIC':
      default:
        return 'bg-slate-800/80 text-slate-300 border-slate-700/80';
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Architecture Overview Card */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900/90 to-cyan-950/40 border border-slate-800 rounded-2xl p-5">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-mono text-cyan-400 font-bold uppercase tracking-wider">
                Model Hubungan Entitas (ERD)
              </span>
              <span className="text-slate-500">•</span>
              <span className="text-xs text-slate-400 font-mono">Normalisasi 3NF + Partisi Range + Spasial GiST</span>
            </div>
            <h2 className="text-lg font-bold text-white">
              Arsitektur Data Platform Veroia Enterprise Corp (VEC)
            </h2>
            <p className="text-xs text-slate-400 max-w-3xl mt-1 leading-relaxed">
              Skema 5 tabel inti berdaya tahan enterprise: memadukan identitas perangkat keras TEE kamera, partisi skala besar PostgreSQL, perlindungan privasi koordinat PostGIS, silsilah fisik NFC NTAG424, dan interaksi multimedia berbasis bobot reputasi manusia asli.
            </p>
          </div>

          <div className="flex items-center gap-2 bg-slate-950/60 p-2 rounded-xl border border-slate-800/80">
            <div className="text-center px-3 border-r border-slate-800">
              <div className="text-base font-bold font-mono text-cyan-400">5</div>
              <div className="text-[10px] font-mono text-slate-500">Tabel Inti</div>
            </div>
            <div className="text-center px-3 border-r border-slate-800">
              <div className="text-base font-bold font-mono text-emerald-400">4</div>
              <div className="text-[10px] font-mono text-slate-500">Partisi posts</div>
            </div>
            <div className="text-center px-3">
              <div className="text-base font-bold font-mono text-purple-400">PostGIS</div>
              <div className="text-[10px] font-mono text-slate-500">SRID 4326</div>
            </div>
          </div>
        </div>

        {/* Visual Entity Graph / Nav Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 mt-5">
          {VEC_TABLE_SCHEMAS.map((table) => {
            const isSelected = selectedTable.name === table.name;
            return (
              <button
                key={table.name}
                onClick={() => setSelectedTable(table)}
                className={`text-left p-3.5 rounded-xl border transition-all duration-200 relative overflow-hidden group ${
                  isSelected
                    ? 'bg-slate-900 border-cyan-500 shadow-lg shadow-cyan-950 ring-1 ring-cyan-500/50'
                    : 'bg-slate-950/60 border-slate-800/80 hover:bg-slate-900/60 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {getTableIcon(table.name)}
                    <span className="text-xs font-mono font-bold text-white group-hover:text-cyan-300">
                      {table.name}
                    </span>
                  </div>
                  {isSelected && (
                    <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>
                  )}
                </div>

                <div className="text-[11px] text-slate-400 line-clamp-2">
                  {table.tagline}
                </div>

                {table.partitionStrategy && (
                  <div className="mt-2.5 inline-block text-[9px] font-mono px-1.5 py-0.5 rounded bg-purple-950/70 border border-purple-800/60 text-purple-300">
                    ⚡ Partitioned
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Relational Flow Indicator */}
      <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 flex items-center justify-between text-xs font-mono text-slate-400 overflow-x-auto">
        <div className="flex items-center gap-2 whitespace-nowrap">
          <span className="text-emerald-400 font-semibold">auth.users</span>
          <span className="text-slate-600">──(1:1)──►</span>
          <span className="text-white font-semibold">users</span>
          <span className="text-slate-600">──(1:N)──►</span>
          <span className="text-cyan-400 font-semibold">posts [Partitioned]</span>
          <span className="text-slate-600">──(1:N composite)──►</span>
          <span className="text-pink-400 font-semibold">interactions</span>
        </div>
        <div className="hidden lg:flex items-center gap-2 whitespace-nowrap pl-4 border-l border-slate-800">
          <span className="text-white font-semibold">users</span>
          <span className="text-slate-600">──(creator/owner)──►</span>
          <span className="text-amber-400 font-semibold">art_certificates</span>
          <span className="text-slate-600">──(1:N chrono)──►</span>
          <span className="text-purple-400 font-semibold">art_process_proofs</span>
        </div>
      </div>

      {/* Active Table Deep Dive Details */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        {/* Table Title Bar */}
        <div className="bg-slate-950/80 px-5 py-4 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-slate-900 rounded-xl border border-slate-800">
              {getTableIcon(selectedTable.name)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold font-mono text-white">
                  public.{selectedTable.name}
                </h3>
                {selectedTable.partitionStrategy && (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-950 border border-purple-800 text-purple-300">
                    Range Partition
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {selectedTable.tagline}
              </p>
            </div>
          </div>

          {/* Partition Warning if applicable */}
          {selectedTable.partitionStrategy && (
            <div className="bg-purple-950/40 border border-purple-800/60 rounded-xl px-3 py-2 text-xs font-mono text-purple-300 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-400 shrink-0" />
              <span>
                Strategi: <strong className="text-white">{selectedTable.partitionStrategy}</strong>
              </span>
            </div>
          )}
        </div>

        {/* Columns Grid / Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-950/40 text-slate-400 border-b border-slate-800 text-[11px]">
              <tr>
                <th className="py-3 px-4">Nama Kolom</th>
                <th className="py-3 px-4">Tipe Data (PostgreSQL 16)</th>
                <th className="py-3 px-4">Kunci & Relasi</th>
                <th className="py-3 px-4">Keamanan & Klasifikasi Data</th>
                <th className="py-3 px-4">Deskripsi Fungsional</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {selectedTable.columns.map((col, idx) => (
                <tr key={idx} className="hover:bg-slate-800/40 transition">
                  <td className="py-3 px-4 font-bold text-slate-200">
                    <div className="flex items-center gap-1.5">
                      {col.isPk && (
                        <span title="Primary Key">
                          <Key className="w-3.5 h-3.5 text-amber-400" />
                        </span>
                      )}
                      {col.isFk && (
                        <span title="Foreign Key">
                          <LinkIcon className="w-3.5 h-3.5 text-cyan-400" />
                        </span>
                      )}
                      <span>{col.name}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-cyan-300 font-medium">
                    {col.type}
                  </td>
                  <td className="py-3 px-4 text-slate-300">
                    {col.isPk && (
                      <span className="inline-block px-1.5 py-0.5 bg-amber-950/70 text-amber-300 border border-amber-800/80 rounded text-[10px] mr-1">
                        PK
                      </span>
                    )}
                    {col.isFk && (
                      <span className="inline-block px-1.5 py-0.5 bg-cyan-950/70 text-cyan-300 border border-cyan-800/80 rounded text-[10px]">
                        FK → {col.fkTarget}
                      </span>
                    )}
                    {col.isUnique && (
                      <span className="inline-block px-1.5 py-0.5 bg-emerald-950/70 text-emerald-300 border border-emerald-800/80 rounded text-[10px] ml-1">
                        UNIQUE
                      </span>
                    )}
                    {!col.isPk && !col.isFk && !col.isUnique && (
                      <span className="text-slate-600">—</span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded border text-[10px] ${getBadgeStyle(col.securityBadge)}`}>
                      {col.securityBadge === 'ZERO_TRUST_PRIVATE' && <ShieldAlert className="w-3 h-3 text-red-400" />}
                      {col.securityBadge === 'RESTRICTED_FUZZED' && <MapPin className="w-3 h-3 text-cyan-400" />}
                      {col.securityBadge === 'CRYPTOGRAPHIC' && <CheckCircle2 className="w-3 h-3 text-purple-400" />}
                      {col.securityBadge || 'PUBLIC'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-400 font-sans text-xs">
                    {col.description}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer: Indexes & Key Features */}
        <div className="bg-slate-950/60 p-4 border-t border-slate-800 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
              Indeks Kinerja & Spasial
            </h4>
            <div className="space-y-1.5">
              {selectedTable.indexes.map((idx, i) => (
                <div key={i} className="text-[11px] font-mono text-slate-400 bg-slate-900 px-2.5 py-1 rounded border border-slate-800">
                  {idx}
                </div>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              Fitur Arsitektur Utama
            </h4>
            <ul className="space-y-1.5">
              {selectedTable.keyFeatures.map((feat, i) => (
                <li key={i} className="text-xs text-slate-300 flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                  <span>{feat}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
