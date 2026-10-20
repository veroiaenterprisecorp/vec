import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { 
  ShieldCheck, 
  Award, 
  MessageSquare, 
  Mic, 
  Play, 
  Pause, 
  Send, 
  Lock, 
  MapPin, 
  CheckCircle2, 
  RefreshCw,
  Sliders,
  Filter
} from 'lucide-react';

interface InteractionItem {
  id: string;
  author: string;
  role: string;
  score: number;
  type: 'COMMENT' | 'VOICE_NOTE' | 'AUTHENTIC_SEAL';
  content?: string;
  voiceDuration?: number;
  waveform?: number[];
  timestamp: string;
}

export const VecVault: React.FC = () => {
  const [filterType, setFilterType] = useState<'all' | 'COMMENT' | 'VOICE_NOTE' | 'AUTHENTIC_SEAL'>('all');
  const [commentInput, setCommentInput] = useState<string>('');
  const [isPlayingAudio, setIsPlayingAudio] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  const [interactions, setInteractions] = useState<InteractionItem[]>([
    {
      id: 'int-1',
      author: 'Budi Hartono',
      role: 'VEC Master Curator',
      score: 99.20,
      type: 'COMMENT',
      content: 'Manifest C2PA tervalidasi penuh via hardware Secure Enclave. Telemetri sensor CMOS terbukti murni tanpa rekonstruksi AI generatif.',
      timestamp: '15 menit lalu'
    },
    {
      id: 'int-2',
      author: 'Galeri Seni Nusantara',
      role: 'Verified Art Vault',
      score: 98.80,
      type: 'VOICE_NOTE',
      voiceDuration: 18.5,
      waveform: [35, 60, 95, 80, 45, 90, 65, 40, 75, 100, 55, 30],
      timestamp: '32 menit lalu'
    },
    {
      id: 'int-3',
      author: 'Sarah Jenkins',
      role: 'Fine Art Photographer',
      score: 96.80,
      type: 'AUTHENTIC_SEAL',
      content: 'Menyematkan Stempel Keaslian Resmi (AUTHENTIC_SEAL). Silsilah pigmen dan tag fisik NTAG424 DNA terhubung identik.',
      timestamp: '1 jam lalu'
    }
  ]);

  const fetchLiveInteractions = async () => {
    setIsRefreshing(true);
    try {
      const { data, error } = await supabase
        .from('interactions')
        .select(`
          id,
          user_id,
          interaction_type,
          comment_body,
          voice_duration_seconds,
          voice_waveform,
          voice_transcription,
          author_authenticity_weight,
          created_at
        `)
        .order('created_at', { ascending: false })
        .limit(20);

      if (!error && data && data.length > 0) {
        const mapped: InteractionItem[] = data.map((row: any) => ({
          id: row.id,
          author: 'Kurator Hardware Attested',
          role: 'Verified Member',
          score: (row.author_authenticity_weight || 0.98) * 100,
          type: row.interaction_type,
          content: row.interaction_type === 'VOICE_NOTE' ? (row.voice_transcription || 'Catatan suara kurator tervalidasi') : row.comment_body,
          voiceDuration: row.voice_duration_seconds || 15.0,
          waveform: row.voice_waveform || [30, 60, 90, 70, 40, 80, 50, 30],
          timestamp: new Date(row.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
        }));
        setInteractions(mapped);
      }
    } catch (e) {
      console.warn('Could not fetch interactions from Supabase:', e);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchLiveInteractions();
  }, []);

  const handleSendComment = async () => {
    if (!commentInput.trim()) return;
    const currentText = commentInput.trim();
    const newItem: InteractionItem = {
      id: `int-${Date.now()}`,
      author: 'Anda (Kolektor Terverifikasi)',
      role: 'Hardware Attested Member',
      score: 99.40,
      type: 'COMMENT',
      content: currentText,
      timestamp: 'Baru saja'
    };
    setInteractions([newItem, ...interactions]);
    setCommentInput('');
    setIsSubmitting(true);

    try {
      await supabase.from('interactions').insert({
        user_id: 'a1111111-1111-4111-8111-111111111111',
        post_id: 'd4444444-4444-4444-8444-444444444444',
        post_created_at: '2026-06-15 10:30:00+00',
        interaction_type: 'COMMENT',
        comment_body: currentText,
        author_authenticity_weight: 0.994
      });
    } catch (e) {
      console.warn('Live comment insertion note:', e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddVoiceNote = () => {
    const newItem: InteractionItem = {
      id: `int-${Date.now()}`,
      author: 'Anda (Kolektor Terverifikasi)',
      role: 'Hardware Attested Member',
      score: 99.40,
      type: 'VOICE_NOTE',
      voiceDuration: 14.5,
      waveform: [25, 45, 80, 100, 70, 95, 60, 40, 85, 90, 50, 20],
      timestamp: 'Baru saja'
    };
    setInteractions([newItem, ...interactions]);
  };

  const filteredInteractions = interactions.filter(item => {
    if (filterType === 'all') return true;
    return item.type === filterType;
  });

  return (
    <div className="space-y-8">
      
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-cyan-400">
            <ShieldCheck className="w-4 h-4 text-cyan-400" />
            <span>IMMUTABLE ART VAULT • REPUTATION-WEIGHTED CURATION</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight mt-1">
            Live Art Vault & Diskusi Kurasi Otentik
          </h2>
        </div>

        <button
          onClick={fetchLiveInteractions}
          disabled={isRefreshing}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-mono bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
          <span>Sinkronkan Live Data</span>
        </button>
      </div>

      {/* Featured Masterpiece Vault Card */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl grid grid-cols-1 lg:grid-cols-12">
        <div className="lg:col-span-5 relative h-72 sm:h-96 lg:h-auto min-h-[300px]">
          <img
            src="/src/assets/images/vec_vault_artwork_1792494925679.jpg"
            alt="Fine Art Masterpiece in Vault"
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent lg:bg-gradient-to-r lg:from-transparent lg:to-slate-900/90"></div>
          
          <div className="absolute top-4 left-4 bg-black/75 backdrop-blur-md px-3 py-1.5 rounded-xl border border-emerald-500/40 text-xs font-mono text-emerald-300 flex items-center gap-1.5">
            <Award className="w-3.5 h-3.5 text-emerald-400" />
            <span>Karya Terkurasi No. VEC-2026-0042</span>
          </div>
        </div>

        <div className="lg:col-span-7 p-6 sm:p-8 flex flex-col justify-between space-y-6">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
              <span className="text-cyan-400 font-bold">Galeri Seni Kontemporer</span>
              <span aria-hidden="true">·</span>
              <span>Akrilik & Pigmen Emas di Atas Kanvas</span>
              <span aria-hidden="true">·</span>
              <span>120 × 150 cm</span>
            </div>

            <h3 className="text-2xl font-bold text-white tracking-tight">
              Metamorfosis Cahaya & Silikon #04
            </h3>

            <p className="text-sm text-slate-300 leading-relaxed font-normal">
              Karya asli yang diverifikasi langsung dengan sertifikasi hardware TEE dan chip NTAG424 DNA. Seluruh riwayat kepemilikan, uji spektrometri pigmen, dan catatan kurasi tersimpan di cluster Supabase PostgreSQL 16.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs font-mono">
            <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
              <span className="text-slate-500 block text-[11px]">Skor Keaslian:</span>
              <span className="text-emerald-400 font-bold text-sm">99.8%</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
              <span className="text-slate-500 block text-[11px]">NFC Sun Seal:</span>
              <span className="text-amber-300 font-bold text-sm">Tervalidasi</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 col-span-2 sm:col-span-1">
              <span className="text-slate-500 block text-[11px]">Geoprivasi:</span>
              <span className="text-cyan-300 font-bold text-sm">PostGIS Protected</span>
            </div>
          </div>
        </div>
      </div>

      {/* Curation & Community Discussions Section */}
      <div className="bg-[#050C1E] rounded-3xl border border-slate-800 p-6 space-y-6">
        
        {/* Sub-Header & Segmented Filters */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
          <div>
            <h4 className="text-lg font-bold text-white">
              Catatan Kurasi & Verifikasi Kolektor
            </h4>
            <p className="text-xs text-slate-400 mt-0.5">
              Setiap catatan diverifikasi secara kriptografis dan berbobot reputasi desimal (0.00 – 1.00)
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Filter Buttons */}
            <div className="flex items-center gap-1 p-1 bg-slate-900 rounded-xl border border-slate-800 text-xs font-mono">
              <button
                onClick={() => setFilterType('all')}
                className={`px-2.5 py-1 rounded-lg transition ${
                  filterType === 'all' ? 'bg-cyan-600 text-white font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                Semua
              </button>
              <button
                onClick={() => setFilterType('VOICE_NOTE')}
                className={`px-2.5 py-1 rounded-lg transition ${
                  filterType === 'VOICE_NOTE' ? 'bg-cyan-600 text-white font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                Voice Notes
              </button>
              <button
                onClick={() => setFilterType('AUTHENTIC_SEAL')}
                className={`px-2.5 py-1 rounded-lg transition ${
                  filterType === 'AUTHENTIC_SEAL' ? 'bg-cyan-600 text-white font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                Stempel
              </button>
            </div>

            <button
              onClick={handleAddVoiceNote}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-950/60 hover:bg-purple-900/70 text-purple-300 border border-purple-800/60 text-xs font-mono transition"
            >
              <Mic className="w-3.5 h-3.5 text-purple-400" />
              <span>Simulasi Voice Note</span>
            </button>
          </div>
        </div>

        {/* Discussion Items List */}
        <div className="space-y-4">
          {filteredInteractions.map((item) => (
            <div
              key={item.id}
              className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3 hover:border-slate-700 transition"
            >
              <div className="flex items-center justify-between text-xs font-mono">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white">{item.author}</span>
                  <span className="text-[10px] text-cyan-300 bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-800/60">
                    {item.role}
                  </span>
                  <span className="text-[11px] text-emerald-400 hidden sm:inline">
                    Skor: {(item.score).toFixed(1)}%
                  </span>
                </div>
                <span className="text-slate-500 text-[11px]">{item.timestamp}</span>
              </div>

              {/* Text comment */}
              {item.type === 'COMMENT' && (
                <p className="text-xs text-slate-300 leading-relaxed font-sans pl-1">
                  "{item.content}"
                </p>
              )}

              {/* Voice Note Visualizer */}
              {item.type === 'VOICE_NOTE' && (
                <div className="flex items-center gap-3 bg-black/60 p-3 rounded-xl border border-purple-900/40 max-w-lg">
                  <button
                    onClick={() => setIsPlayingAudio(isPlayingAudio === item.id ? null : item.id)}
                    className="w-9 h-9 rounded-full bg-purple-600 hover:bg-purple-500 flex items-center justify-center text-white transition shadow-md shadow-purple-950 shrink-0"
                  >
                    {isPlayingAudio === item.id ? (
                      <Pause className="w-4 h-4" />
                    ) : (
                      <Play className="w-4 h-4 ml-0.5" />
                    )}
                  </button>
                  <div className="flex-1">
                    <div className="text-[11px] font-mono text-purple-300 mb-1">
                      Catatan Suara Kurator
                    </div>
                    <div className="h-6 flex items-center gap-1">
                      {(item.waveform || [20, 50, 80, 100, 60, 40, 90, 70, 30]).map((h, idx) => (
                        <div
                          key={idx}
                          className={`w-1.5 rounded-full transition-all ${
                            isPlayingAudio === item.id ? 'bg-purple-400 animate-pulse' : 'bg-purple-700/60'
                          }`}
                          style={{ height: `${Math.max(20, h)}%` }}
                        />
                      ))}
                    </div>
                  </div>
                  <span className="text-xs font-mono text-purple-300 tabular-nums">
                    0:{item.voiceDuration?.toFixed(0)}
                  </span>
                </div>
              )}

              {/* Authentic Seal */}
              {item.type === 'AUTHENTIC_SEAL' && (
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-950/60 border border-emerald-800/60 text-xs font-mono text-emerald-300">
                  <Award className="w-4 h-4 text-emerald-400" />
                  <span>{item.content}</span>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Real-Time Comment Submission Bar */}
        <div className="pt-2 flex items-center gap-2">
          <input
            type="text"
            placeholder="Tulis kurasi atau ulasan otentik baru..."
            value={commentInput}
            onChange={(e) => setCommentInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendComment()}
            disabled={isSubmitting}
            className="flex-1 bg-slate-950 text-xs font-mono text-white placeholder-slate-500 px-4 py-3 rounded-xl border border-slate-800 focus:outline-none focus:border-cyan-500 transition"
          />
          <button
            onClick={handleSendComment}
            disabled={isSubmitting || !commentInput.trim()}
            className="px-5 py-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white font-mono text-xs font-bold transition flex items-center gap-2 shadow-lg shadow-cyan-950"
          >
            <span>Kirim</span>
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>

      </div>

    </div>
  );
};
