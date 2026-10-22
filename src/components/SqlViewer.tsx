import React, { useState, useMemo } from 'react';
import { Copy, Check, Search, Filter, Shield, Code, Sparkles, AlertCircle } from 'lucide-react';
import { VEC_FULL_SQL_SCRIPT, VEC_ALIGNMENT_MIGRATION_SQL } from '../data/vecSqlSchema';

interface SqlViewerProps {
  onCopyAll: () => void;
  copied: boolean;
}

type SectionKey = 'all' | 'alignment' | 'users' | 'posts' | 'certificates' | 'proofs' | 'interactions' | 'triggers' | 'rls';

export const SqlViewer: React.FC<SqlViewerProps> = ({ onCopyAll, copied }) => {
  const [selectedSection, setSelectedSection] = useState<SectionKey>('alignment');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedSection, setCopiedSection] = useState(false);

  // Filter content by section if selected
  const activeSqlContent = useMemo(() => {
    if (selectedSection === 'alignment') return VEC_ALIGNMENT_MIGRATION_SQL;
    if (selectedSection === 'all') return VEC_FULL_SQL_SCRIPT;

    const sections: Record<Exclude<SectionKey, 'alignment'>, { start: string; end?: string }> = {
      all: { start: '' },
      users: { 
        start: '-- 2. TABLE: users', 
        end: '-- 3. TABLE: posts' 
      },
      posts: { 
        start: '-- 3. TABLE: posts', 
        end: '-- 4. FUNCTION & TRIGGER: OTOMATISASI FUZZED GPS' 
      },
      triggers: { 
        start: '-- 4. FUNCTION & TRIGGER: OTOMATISASI FUZZED GPS', 
        end: '-- 5. TABLE: art_certificates' 
      },
      certificates: { 
        start: '-- 5. TABLE: art_certificates', 
        end: '-- 6. TABLE: art_process_proofs' 
      },
      proofs: { 
        start: '-- 6. TABLE: art_process_proofs', 
        end: '-- 7. TABLE: interactions' 
      },
      interactions: { 
        start: '-- 7. TABLE: interactions', 
        end: '-- 8. VIEW AMAN PUBLIK' 
      },
      rls: { 
        start: '-- 10. ROW LEVEL SECURITY', 
        end: '-- =====================================================================\n-- SELESAI' 
      }
    };

    const target = sections[selectedSection as Exclude<SectionKey, 'alignment'>];
    if (!target) return VEC_FULL_SQL_SCRIPT;
    const startIndex = VEC_FULL_SQL_SCRIPT.indexOf(target.start);
    if (startIndex === -1) return VEC_FULL_SQL_SCRIPT;

    if (target.end) {
      const endIndex = VEC_FULL_SQL_SCRIPT.indexOf(target.end, startIndex);
      if (endIndex !== -1) {
        return VEC_FULL_SQL_SCRIPT.slice(startIndex, endIndex).trim();
      }
    }
    return VEC_FULL_SQL_SCRIPT.slice(startIndex).trim();
  }, [selectedSection]);

  // Highlight search matches or lines
  const lines = useMemo(() => {
    return activeSqlContent.split('\n');
  }, [activeSqlContent]);

  const handleCopyCurrent = () => {
    navigator.clipboard.writeText(activeSqlContent);
    setCopiedSection(true);
    setTimeout(() => setCopiedSection(false), 2000);
  };

  return (
    <div className="space-y-4">
      {/* Top Banner / Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5 flex items-start gap-3">
          <div className="p-2 bg-cyan-500/10 text-cyan-400 rounded-lg border border-cyan-500/20">
            <Code className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-mono text-slate-400">Total Baris DDL</div>
            <div className="text-xl font-bold font-mono text-white">{lines.length} Baris</div>
            <div className="text-xs text-slate-500">PostgreSQL 16 Native</div>
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5 flex items-start gap-3">
          <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg border border-emerald-500/20">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-mono text-slate-400">Arsitektur Keamanan</div>
            <div className="text-xl font-bold font-mono text-white">5 RLS Policies</div>
            <div className="text-xs text-emerald-400/90 font-mono">Zero-Trust C2PA + NFC</div>
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5 flex items-start gap-3">
          <div className="p-2 bg-blue-500/10 text-blue-400 rounded-lg border border-blue-500/20">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-mono text-slate-400">Spasial PostGIS</div>
            <div className="text-xl font-bold font-mono text-white">GiST + ST_Project</div>
            <div className="text-xs text-blue-400/90 font-mono">Fuzzed GPS Trigger</div>
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5 flex items-start gap-3">
          <div className="p-2 bg-purple-500/10 text-purple-400 rounded-lg border border-purple-500/20">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-mono text-slate-400">Partisi posts</div>
            <div className="text-xl font-bold font-mono text-white">RANGE (created_at)</div>
            <div className="text-xs text-purple-400/90 font-mono">4 Sub-Partisi Aktif</div>
          </div>
        </div>
      </div>

      {/* Control Toolbar */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Section Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto text-xs font-mono">
          <span className="text-slate-400 flex items-center gap-1 mr-1">
            <Filter className="w-3.5 h-3.5" /> Filter:
          </span>
          {[
            { id: 'alignment', label: '⚡ Perbaikan Supabase (Migration)' },
            { id: 'all', label: 'Lengkap (Semua)' },
            { id: 'users', label: '1. users' },
            { id: 'posts', label: '2. posts (Partisi)' },
            { id: 'triggers', label: 'Trigger GPS' },
            { id: 'certificates', label: '3. art_certificates' },
            { id: 'proofs', label: '4. process_proofs' },
            { id: 'interactions', label: '5. interactions' },
            { id: 'rls', label: 'RLS Supabase' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedSection(tab.id as SectionKey)}
              className={`px-2.5 py-1 rounded transition whitespace-nowrap ${
                selectedSection === tab.id
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search & Copy */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-500" />
            <input
              type="text"
              placeholder="Cari sintaks SQL..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-slate-950 text-slate-200 text-xs font-mono pl-8 pr-3 py-1.5 rounded-lg border border-slate-800 focus:outline-none focus:border-cyan-500 w-44 sm:w-56"
            />
          </div>

          <button
            onClick={handleCopyCurrent}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono bg-cyan-600 hover:bg-cyan-500 text-white font-medium shadow transition"
            title="Salin bagian SQL yang sedang aktif"
          >
            {copiedSection ? (
              <>
                <Check className="w-3.5 h-3.5 text-white" />
                <span>Tersalin</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-white" />
                <span>Salin Bagian Ini</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Migration Notice Banner if alignment tab is active */}
      {selectedSection === 'alignment' && (
        <div className="bg-gradient-to-r from-cyan-950/40 via-blue-950/30 to-purple-950/20 border border-cyan-500/30 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs font-mono">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-cyan-300 font-semibold text-sm">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span>Skrip Migrasi Perbaikan Supabase (20261022010000_vec_supabase_full_alignment.sql)</span>
            </div>
            <p className="text-slate-300 text-[11px] leading-relaxed max-w-2xl">
              Salin dan jalankan di <strong>Supabase Dashboard &gt; SQL Editor</strong> untuk mengatasi masalah: 
              menambahkan izin RLS <code className="text-amber-300 bg-amber-950/50 px-1 rounded">DELETE</code> pada tabel <code className="text-white">posts</code> dan storage <code className="text-white">vec-captures</code>, menyinkronkan kolom penghapusan karya (<code className="text-white">is_destroyed</code>), serta menuntaskan seluruh peringatan Supabase Linter (search_path &amp; anon security definer).
            </p>
          </div>
          <button
            onClick={handleCopyCurrent}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold transition shadow-lg shrink-0 self-start md:self-auto cursor-pointer"
          >
            {copiedSection ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            <span>Salin Skrip Migrasi</span>
          </button>
        </div>
      )}

      {/* SQL Code Block Display */}
      <div className="border border-slate-800 rounded-xl bg-slate-950 overflow-hidden shadow-2xl relative">
        {/* Editor Top Bar */}
        <div className="bg-slate-900/90 border-b border-slate-800/80 px-4 py-2.5 flex items-center justify-between text-xs font-mono text-slate-400">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-red-500/80 inline-block"></span>
            <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block"></span>
            <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block"></span>
            <span className="text-slate-300 font-semibold ml-2">
              {selectedSection === 'alignment' ? '20261022010000_vec_supabase_full_alignment.sql' : 'supabase_vec_schema.sql'}
            </span>
            <span className="text-[11px] text-cyan-400 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800/50">
              PostgreSQL 16 + PostGIS 3.4
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span>Encoding: UTF-8</span>
            <span>•</span>
            <button
              onClick={onCopyAll}
              className="text-cyan-400 hover:text-cyan-300 underline font-medium"
            >
              Salin Semua (Full Script)
            </button>
          </div>
        </div>

        {/* Code Content */}
        <div className="max-h-[600px] overflow-auto p-4 font-mono text-xs leading-relaxed selection:bg-cyan-500/30 selection:text-white">
          <table className="w-full border-collapse">
            <tbody>
              {lines.map((line, index) => {
                const lineNum = index + 1;
                const isComment = line.trim().startsWith('--');
                const isHighlight =
                  searchQuery.trim().length > 1 &&
                  line.toLowerCase().includes(searchQuery.toLowerCase());

                return (
                  <tr
                    key={index}
                    className={`hover:bg-slate-900/50 ${
                      isHighlight ? 'bg-amber-500/20' : ''
                    }`}
                  >
                    <td className="w-12 select-none pr-4 text-right text-slate-600 font-mono text-[11px] align-top">
                      {lineNum}
                    </td>
                    <td className="whitespace-pre font-mono text-slate-200">
                      {isComment ? (
                        <span className="text-slate-500 italic">{line}</span>
                      ) : (
                        formatSqlLine(line)
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// Syntax high-level highlighter for SQL tokens
function formatSqlLine(line: string) {
  // Keywords
  const keywords = [
    'CREATE', 'TABLE', 'EXTENSION', 'IF', 'NOT', 'EXISTS', 'PRIMARY', 'KEY', 'REFERENCES',
    'ON', 'DELETE', 'CASCADE', 'RESTRICT', 'CHECK', 'DEFAULT', 'UNIQUE', 'PARTITION', 'BY',
    'RANGE', 'PARTITION OF', 'FOR', 'VALUES', 'FROM', 'TO', 'INDEX', 'USING', 'GIST',
    'FUNCTION', 'RETURNS', 'TRIGGER', 'AS', 'DECLARE', 'BEGIN', 'END', 'RETURN', 'NEW',
    'SECURITY', 'DEFINER', 'ALTER', 'ENABLE', 'ROW', 'LEVEL', 'POLICY', 'SELECT', 'INSERT',
    'UPDATE', 'WHERE', 'AND', 'OR', 'ORDER', 'LIMIT', 'JOIN', 'VIEW'
  ];

  // Types
  const types = [
    'UUID', 'VARCHAR', 'TEXT', 'NUMERIC', 'INTEGER', 'BIGINT', 'BOOLEAN', 'TIMESTAMPTZ',
    'JSONB', 'GEOMETRY', 'GEOGRAPHY', 'Point', 'FLOAT8', 'FLOAT'
  ];

  // Simple token rendering
  const parts = line.split(/(\s+|,|\(|\)|;)/);

  return (
    <>
      {parts.map((part, i) => {
        const upper = part.toUpperCase();
        if (keywords.includes(upper)) {
          return <span key={i} className="text-indigo-400 font-semibold">{part}</span>;
        }
        if (types.includes(upper) || part.startsWith('GEOMETRY(') || part.startsWith('user_trust_tier') || part.startsWith('verification_status') || part.startsWith('custody_status') || part.startsWith('interaction_type') || part.startsWith('reaction_type')) {
          return <span key={i} className="text-cyan-300 font-medium">{part}</span>;
        }
        if (part.startsWith('ST_') || part === 'gen_random_uuid()' || part === 'NOW()' || part === 'TIMEZONE') {
          return <span key={i} className="text-amber-300">{part}</span>;
        }
        if (part.startsWith("'") && part.endsWith("'")) {
          return <span key={i} className="text-emerald-300">{part}</span>;
        }
        return <span key={i}>{part}</span>;
      })}
    </>
  );
}
