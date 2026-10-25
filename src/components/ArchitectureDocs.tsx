import React from 'react';
import { 
  ShieldCheck, 
  Layers, 
  MapPin, 
  FileCheck, 
  CheckCircle2, 
  AlertTriangle,
  Terminal,
  Cpu
} from 'lucide-react';

export const ArchitectureDocs: React.FC = () => {
  return (
    <div className="space-y-6 max-w-5xl mx-auto min-w-0 w-full">
      {/* Hero Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs font-mono text-cyan-400 font-bold uppercase tracking-wider bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800">
            Whitepaper Arsitektur Database
          </span>
          <span className="text-slate-500">•</span>
          <span className="text-xs font-mono text-slate-400">VEC Enterprise Standard 2026</span>
        </div>
        <h2 className="text-xl font-bold text-white">
          Rasional Desain Database Veroia Enterprise Corp (VEC)
        </h2>
        <p className="text-xs text-slate-400 mt-1 leading-relaxed">
          Dokumentasi teknis untuk Arsitek Database, Lead DevOps, dan Tim Security mengenai keputusan arsitektur PostgreSQL 16 + PostGIS pada platform otentikasi kamera zero-trust dan sertifikasi fisik-digital karya seni.
        </p>
      </div>

      {/* Grid of Key Pillars */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Pillar 1: Partitioning Requirement */}
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 space-y-3">
          <div className="flex items-center gap-2 text-cyan-400 font-mono text-sm font-bold">
            <Layers className="w-4 h-4 text-cyan-400" />
            <span>1. Partisi posts & Composite Primary Key</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            Pada PostgreSQL 16 declarative range partitioning, aturan mutlak database mensyaratkan kolom partisi (<code className="text-cyan-300 font-mono">created_at</code>) harus disertakan ke dalam Primary Key:
          </p>
          <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800 font-mono text-[11px] text-slate-300">
            CONSTRAINT pk_posts PRIMARY KEY (id, created_at)
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Manfaat: <strong>Partition Pruning</strong>. Saat query mencari jepretan kamera pada tahun 2026, PostgreSQL langsung membuang partisi tahun 2025 dan 2027 tanpa perlu scanning indeks, menghasilkan performa I/O secepat kilat bahkan dengan miliaran baris foto.
          </p>
        </div>

        {/* Pillar 2: PostGIS Privacy & Fuzzing */}
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 space-y-3">
          <div className="flex items-center gap-2 text-amber-400 font-mono text-sm font-bold">
            <MapPin className="w-4 h-4 text-amber-400" />
            <span>2. Dual-Layer PostGIS & Anti-Doxxing</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            Kamera bersertifikasi C2PA merekam koordinat sensor presisi. Mempublikasikan koordinat ini ke publik berisiko tinggi membocorkan lokasi privat fotografer/kolektor (doxxing).
          </p>
          <ul className="text-xs text-slate-400 space-y-1.5 list-disc pl-4">
            <li><strong className="text-slate-200">exact_location</strong>: Disimpan sebagai GEOMETRY(Point, 4326) terlindungi RLS untuk verifikasi keaslian.</li>
            <li><strong className="text-slate-200">public_location</strong>: Dihitung secara otomatis via trigger <code className="text-cyan-300 font-mono">ST_Project()</code> dengan seed deterministik berbasis MD5(id) agar titik fuzzed tidak berubah-ubah saat record di-update.</li>
          </ul>
        </div>

        {/* Pillar 3: NFC NTAG424 & RAW Checksum */}
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 space-y-3">
          <div className="flex items-center gap-2 text-purple-400 font-mono text-sm font-bold">
            <Cpu className="w-4 h-4 text-purple-400" />
            <span>3. Dual-Anchoring Fisik & Digital Karya Seni</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            Tabel <code className="text-cyan-300 font-mono">art_certificates</code> menjamin karya seni tidak dapat digandakan maupun dipalsukan melalui kombinasi:
          </p>
          <ul className="text-xs text-slate-400 space-y-1.5 list-disc pl-4">
            <li><strong className="text-slate-200">nfc_chip_uid_hash</strong>: Enkripsi hardware NXP NTAG424 DNA yang menghasilkan Secure Unique NFC (SUN) cryptographic code dinamis pada setiap pemindaian fisik.</li>
            <li><strong className="text-slate-200">raw_file_checksum_sha256</strong>: Checksum cryptographic file master kamera asli (Sony .ARW, Leica .DNG, Canon .CR3) sebelum masuk proses kompresi atau web rendering.</li>
          </ul>
        </div>

        {/* Pillar 4: Composite FK in Interactions */}
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 space-y-3">
          <div className="flex items-center gap-2 text-emerald-400 font-mono text-sm font-bold">
            <FileCheck className="w-4 h-4 text-emerald-400" />
            <span>4. Foreign Key Komposit pada interactions</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            Karena tabel <code className="text-cyan-300 font-mono">posts</code> memiliki komposit primary key <code className="text-slate-200 font-mono">(id, created_at)</code>, maka tabel <code className="text-cyan-300 font-mono">interactions</code> wajib memiliki dua kolom pendamping:
          </p>
          <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800 font-mono text-[11px] text-slate-300">
            FOREIGN KEY (post_id, post_created_at)<br />
            REFERENCES public.posts(id, created_at) ON DELETE CASCADE
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Hal ini memastikan integritas relasional PostgreSQL tidak rusak saat query interaksi (komentar, voice note) join langsung ke partisi waktu yang relevan.
          </p>
        </div>
      </div>

      {/* Supabase Deployment Guide */}
      <div className="bg-slate-900 border border-cyan-800/60 rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-3">
          <Terminal className="w-5 h-5 text-cyan-400" />
          <h3 className="text-base font-bold text-white font-mono">
            Panduan Menjalankan di Supabase SQL Editor
          </h3>
        </div>

        <ol className="space-y-3 text-xs text-slate-300 list-decimal pl-5">
          <li>
            <strong className="text-white">Buka Dashboard Supabase:</strong> Masuk ke project Supabase Anda, lalu pilih menu <span className="text-cyan-300 font-mono bg-slate-950 px-2 py-0.5 rounded border border-slate-800">SQL Editor</span> di bilah navigasi kiri.
          </li>
          <li>
            <strong className="text-white">Buat Query Baru (New Query):</strong> Klik tombol hijau <span className="text-emerald-400 font-mono">+ New Query</span>.
          </li>
          <li>
            <strong className="text-white">Tempelkan Skrip:</strong> Salin skrip lengkap dari tab <span className="text-cyan-300 font-mono">Skrip SQL Supabase</span> di studio ini, lalu tempelkan (Paste) ke editor Supabase.
          </li>
          <li>
            <strong className="text-white">Jalankan (RUN):</strong> Tekan tombol <span className="text-cyan-300 font-mono">RUN</span> (atau pintasan keyboard Ctrl + Enter / Cmd + Enter).
          </li>
          <li>
            <strong className="text-white">Verifikasi Hasil:</strong> Buka menu <span className="text-cyan-300 font-mono">Table Editor</span> di Supabase. Anda akan melihat 5 tabel inti (<code className="text-cyan-300">users</code>, <code className="text-cyan-300">posts</code>, <code className="text-cyan-300">art_certificates</code>, <code className="text-cyan-300">art_process_proofs</code>, <code className="text-cyan-300">interactions</code>) beserta partisi dan trigger PostGIS aktif.
          </li>
        </ol>

        <div className="mt-4 p-3 rounded-xl bg-cyan-950/40 border border-cyan-800/80 flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
          <div className="text-xs text-cyan-200">
            <strong>Kompatibilitas Penuh:</strong> Skrip ini telah menyertakan <code className="font-mono">CREATE EXTENSION IF NOT EXISTS &quot;postgis&quot;;</code> yang secara default didukung secara native oleh infrastruktur Supabase PostgreSQL.
          </div>
        </div>
      </div>
    </div>
  );
};
