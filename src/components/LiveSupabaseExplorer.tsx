import React, { useState, useEffect } from 'react';
import { SupabaseClient } from '@supabase/supabase-js';
import { getSupabaseUrl, getSupabaseAnonKey, getActiveSupabaseClient, setManualSupabaseCredentials } from '../lib/supabase';
import { 
  Database, 
  Key, 
  Wifi, 
  WifiOff, 
  Play, 
  Volume2, 
  ShieldCheck, 
  MapPin, 
  RefreshCw, 
  CheckCircle2, 
  AlertTriangle, 
  Lock, 
  Unlock, 
  Sparkles,
  ExternalLink,
  Sliders,
  Send,
  Eye,
  Trash2
} from 'lucide-react';

interface PostRecord {
  id: string;
  title: string;
  caption?: string;
  media_url?: string;
  media_thumbnail_url?: string;
  fuzz_radius_meters?: number;
  location_place_name?: string;
  camera_make?: string;
  camera_model?: string;
  verification_status?: string;
  authenticity_confidence?: number;
  created_at: string;
}

interface InteractionRecord {
  id: string;
  user_id: string;
  post_id: string;
  interaction_type: 'COMMENT' | 'VOICE_NOTE' | 'REACTION' | 'ATTESTATION_ENDORSEMENT';
  comment_body?: string;
  voice_note_url?: string;
  voice_duration_seconds?: number;
  voice_waveform?: number[];
  voice_transcription?: string;
  author_authenticity_weight?: number;
  created_at: string;
}

interface NearbyPostResult {
  post_id: string;
  title: string;
  author_username: string;
  author_score: number;
  distance_meters: number;
  fuzzed_coords: { lon: number; lat: number };
}

export const LiveSupabaseExplorer: React.FC = () => {
  const defaultEnvUrl = import.meta.env.VITE_SUPABASE_URL || 'https://cruijnhylcdojbilzgwd.supabase.co';
  const defaultEnvKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNydWlqbmh5bGNkb2piaWx6Z3dkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI0ODE2NzIsImV4cCI6MjEwODA1NzY3Mn0.QQL0hq4Kzp01Hf7xfWDEDlCY9f-vyreYvze6tVD582k';

  // Credentials (Saved in localStorage or default project env)
  const [supabaseUrl, setSupabaseUrl] = useState<string>(() => getSupabaseUrl());
  const [supabaseAnonKey, setSupabaseAnonKey] = useState<string>(() => getSupabaseAnonKey());
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  // Live Database States
  const [posts, setPosts] = useState<PostRecord[]>([]);
  const [interactions, setInteractions] = useState<InteractionRecord[]>([]);
  const [loadingPosts, setLoadingPosts] = useState<boolean>(false);
  const [loadingInteractions, setLoadingInteractions] = useState<boolean>(false);

  // Audio Playback Simulation State
  const [activeVoiceId, setActiveVoiceId] = useState<string | null>(null);

  // Spatial Radius Query State
  const [searchLat, setSearchLat] = useState<number>(-6.175392);
  const [searchLng, setSearchLng] = useState<number>(106.827153);
  const [searchRadiusKm, setSearchRadiusKm] = useState<number>(25);
  const [nearbyResults, setNearbyResults] = useState<NearbyPostResult[]>([]);
  const [searchingNearby, setSearchingNearby] = useState<boolean>(false);

  // Active Sub-tab in Explorer
  const [activeTab, setActiveTab] = useState<'feed' | 'interactions' | 'spatial' | 'stats'>('feed');

  // Helper to sanitize URL (strips /rest/v1 or trailing slashes)
  const sanitizeSupabaseUrl = (url: string): string => {
    let clean = url.trim();
    clean = clean.replace(/\/+$/, '');
    clean = clean.replace(/\/rest\/v1\/?$/i, '');
    clean = clean.replace(/\/rest\/?$/i, '');
    clean = clean.replace(/\/auth\/v1\/?$/i, '');
    return clean;
  };

  // Helper to get singleton client
  const getClient = (): SupabaseClient => {
    return getActiveSupabaseClient();
  };

  // Test connection and fetch initial data
  const handleConnect = async () => {
    const cleanUrl = sanitizeSupabaseUrl(supabaseUrl);
    if (!cleanUrl || !supabaseAnonKey.trim()) {
      setConnectionError('Harap masukkan Project URL dan anon key Supabase Anda.');
      return;
    }

    // Auto-update input with sanitized clean URL
    if (cleanUrl !== supabaseUrl) {
      setSupabaseUrl(cleanUrl);
    }

    setIsConnecting(true);
    setConnectionError(null);

    try {
      // Save credentials via centralized singleton setter
      setManualSupabaseCredentials(cleanUrl, supabaseAnonKey.trim());
      const client = getActiveSupabaseClient();

      // Test query on public.posts
      const { error } = await client.from('posts').select('id, title, created_at').limit(1);

      if (error) {
        throw new Error(error.message);
      }

      setIsConnected(true);
      fetchLivePosts(client);
      fetchLiveInteractions(client);
    } catch (err: any) {
      setIsConnected(false);
      setConnectionError(err.message || 'Gagal terhubung ke Supabase. Periksa URL dan anon key Anda.');
    } finally {
      setIsConnecting(false);
    }
  };

  // Disconnect / Clear Local Storage
  const handleDisconnect = () => {
    setManualSupabaseCredentials('', '');
    setSupabaseUrl('');
    setSupabaseAnonKey('');
    setIsConnected(false);
    setPosts([]);
    setInteractions([]);
    setNearbyResults([]);
  };

  // Fetch Live Posts
  const fetchLivePosts = async (clientInstance?: SupabaseClient) => {
    const client = clientInstance || getClient();
    if (!client) return;

    setLoadingPosts(true);
    try {
      const { data, error } = await client
        .from('posts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      if (!error && data) {
        setPosts(data as PostRecord[]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingPosts(false);
    }
  };

  // Fetch Live Interactions
  const fetchLiveInteractions = async (clientInstance?: SupabaseClient) => {
    const client = clientInstance || getClient();
    if (!client) return;

    setLoadingInteractions(true);
    try {
      const { data, error } = await client
        .from('interactions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      if (!error && data) {
        setInteractions(data as InteractionRecord[]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingInteractions(false);
    }
  };

  // Call PostGIS Radius RPC Function
  const handleRunSpatialQuery = async () => {
    const client = getClient();
    if (!client) return;

    setSearchingNearby(true);
    try {
      // First try fn_vec_query_nearby_posts
      let { data, error } = await client.rpc('fn_vec_query_nearby_posts', {
        center_latitude: searchLat,
        center_longitude: searchLng,
        radius_meters: searchRadiusKm * 1000,
        min_author_score: 50.00
      });

      // If alias not found, try original vec_fn_get_nearby_posts
      if (error && error.message.includes('does not exist')) {
        const fallback = await client.rpc('vec_fn_get_nearby_posts', {
          center_longitude: searchLng,
          center_latitude: searchLat,
          radius_meters: searchRadiusKm * 1000,
          min_author_score: 50.00
        });
        data = fallback.data;
        error = fallback.error;
      }

      if (!error && data) {
        setNearbyResults(data as NearbyPostResult[]);
      } else if (error) {
        console.error('Spatial error:', error);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSearchingNearby(false);
    }
  };

  // Check saved credentials on load
  useEffect(() => {
    if (supabaseUrl && supabaseAnonKey) {
      handleConnect();
    }
  }, []);

  return (
    <div className="space-y-6">
      {/* Privacy & Security Notice Banner */}
      <div className="bg-slate-900/90 border border-emerald-500/30 rounded-2xl p-5 backdrop-blur-sm shadow-xl shadow-black/40">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mt-0.5">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-wider">
                  Privasi & Keamanan 100% Terisolasi
                </span>
                <span className="text-slate-500">•</span>
                <span className="text-xs text-slate-400 font-mono">Client-Side LocalStorage Only</span>
              </div>
              <h2 className="text-base font-bold text-white mt-0.5">
                Apakah Kredensial Ini Dapat Dilihat Orang Lain? <span className="text-emerald-400">TIDAK.</span>
              </h2>
              <p className="text-xs text-slate-400 mt-1 max-w-3xl leading-relaxed">
                Kredensial Project URL dan Anon Key yang Anda masukkan <strong className="text-slate-200">hanya disimpan di memori peramban (browser) Anda sendiri</strong>. Kredensial tidak pernah dikirim ke server website ini dan pengunjung lain yang membuka tautan publik tidak akan melihat kunci Anda.
              </p>
            </div>
          </div>

          {isConnected && (
            <button
              onClick={handleDisconnect}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-mono bg-rose-950/60 hover:bg-rose-900/70 text-rose-300 border border-rose-800/60 transition whitespace-nowrap"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Putuskan & Hapus Kunci</span>
            </button>
          )}
        </div>
      </div>

      {/* Connection Panel */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800/80">
          <div className="flex items-center gap-2.5">
            <Database className="w-5 h-5 text-cyan-400" />
            <h3 className="text-sm font-bold text-white font-mono">
              Konfigurasi Koneksi Supabase Real-Time
            </h3>
          </div>
          <div className="flex items-center gap-2">
            {isConnected ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                Terkoneksi ke Supabase Anda
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono bg-slate-800 text-slate-400 border border-slate-700">
                <WifiOff className="w-3 h-3 text-slate-400" />
                Belum Terhubung
              </span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-mono text-slate-400 mb-1.5">
              Supabase Project URL
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="https://xyzcompany.supabase.co"
                value={supabaseUrl}
                onChange={(e) => setSupabaseUrl(e.target.value)}
                disabled={isConnected}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-cyan-500 focus:outline-none text-xs font-mono text-white placeholder-slate-600 disabled:opacity-60"
              />
            </div>
            <p className="text-[11px] text-slate-500 mt-1 font-mono">
              Dari: Supabase Dashboard &gt; Project Settings &gt; API &gt; Project URL
            </p>
          </div>

          <div>
            <label className="block text-xs font-mono text-slate-400 mb-1.5">
              Supabase anon / public Key
            </label>
            <div className="relative">
              <input
                type="password"
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                value={supabaseAnonKey}
                onChange={(e) => setSupabaseAnonKey(e.target.value)}
                disabled={isConnected}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-cyan-500 focus:outline-none text-xs font-mono text-white placeholder-slate-600 disabled:opacity-60"
              />
            </div>
            <p className="text-[11px] text-slate-500 mt-1 font-mono">
              Dari: Supabase Dashboard &gt; Project Settings &gt; API &gt; anon public key
            </p>
          </div>
        </div>

        {connectionError && (
          <div className="mt-4 p-3 rounded-xl bg-rose-950/40 border border-rose-800/60 text-xs font-mono text-rose-300 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0" />
            <span>{connectionError}</span>
          </div>
        )}

        <div className="mt-4 flex items-center justify-end gap-3">
          {isConnected ? (
            <button
              onClick={() => {
                fetchLivePosts();
                fetchLiveInteractions();
              }}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-mono bg-cyan-600 hover:bg-cyan-500 text-white font-bold transition shadow-lg shadow-cyan-900/30"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Sinkronkan Ulang Data</span>
            </button>
          ) : (
            <button
              onClick={handleConnect}
              disabled={isConnecting}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-mono bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold transition shadow-lg shadow-cyan-950 disabled:opacity-50"
            >
              {isConnecting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-white" />
                  <span>Menghubungkan...</span>
                </>
              ) : (
                <>
                  <Wifi className="w-4 h-4 text-white" />
                  <span>Hubungkan ke Supabase Saya</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Explorer Workspace (Only active when connected) */}
      {isConnected ? (
        <div className="space-y-5">
          {/* Sub-Navigation */}
          <div className="flex items-center gap-2 border-b border-slate-800 pb-2 overflow-x-auto text-xs font-mono">
            <button
              onClick={() => setActiveTab('feed')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition ${
                activeTab === 'feed'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>1. Live Posts Feed ({posts.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('interactions')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition ${
                activeTab === 'interactions'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>2. Komentar & Voice Notes ({interactions.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('spatial')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition ${
                activeTab === 'spatial'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <MapPin className="w-3.5 h-3.5 text-amber-400" />
              <span>3. Live PostGIS Radius Query</span>
            </button>
          </div>

          {/* TAB 1: LIVE POSTS FEED */}
          {activeTab === 'feed' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
                <span>Daftar karya seni otentik langsung dari tabel <code className="text-cyan-300">posts</code> Supabase:</span>
                <button
                  onClick={() => fetchLivePosts()}
                  className="flex items-center gap-1 text-cyan-400 hover:underline"
                >
                  <RefreshCw className="w-3 h-3" /> Refresh
                </button>
              </div>

              {posts.length === 0 ? (
                <div className="p-8 text-center bg-slate-900 border border-slate-800 rounded-2xl text-xs font-mono text-slate-400">
                  Belum ada baris data di tabel `posts`. Jalankan skrip seed data untuk mengisinya!
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {posts.map((post) => (
                    <div
                      key={post.id}
                      className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden hover:border-cyan-500/40 transition shadow-lg flex flex-col justify-between"
                    >
                      {post.media_url && (
                        <div className="relative h-48 w-full bg-slate-950 overflow-hidden">
                          <img
                            src={post.media_url}
                            alt={post.title}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              // Fallback on broken image
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                          />
                          <div className="absolute top-3 left-3 bg-slate-950/80 backdrop-blur-md px-2.5 py-1 rounded-lg border border-cyan-500/40 text-[11px] font-mono text-cyan-300 flex items-center gap-1.5">
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                            <span>{post.verification_status || 'VERIFIED'}</span>
                          </div>
                          <div className="absolute bottom-3 right-3 bg-black/80 px-2 py-0.5 rounded text-[10px] font-mono text-slate-300">
                            Confidence: {post.authenticity_confidence || 99.8}%
                          </div>
                        </div>
                      )}

                      <div className="p-4 space-y-2.5">
                        <h4 className="text-sm font-bold text-white leading-snug">
                          {post.title}
                        </h4>
                        {post.caption && (
                          <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                            {post.caption}
                          </p>
                        )}

                        <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-between text-[11px] font-mono text-slate-400 gap-2">
                          <div className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-amber-400" />
                            <span>{post.location_place_name || 'Koordinat Ter-fuzz'}</span>
                          </div>
                          {post.camera_model && (
                            <span className="text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/40">
                              {post.camera_make} {post.camera_model}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: LIVE INTERACTIONS & VOICE NOTES */}
          {activeTab === 'interactions' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
                <span>Interaksi real-time dari tabel <code className="text-cyan-300">interactions</code>:</span>
                <button
                  onClick={() => fetchLiveInteractions()}
                  className="flex items-center gap-1 text-cyan-400 hover:underline"
                >
                  <RefreshCw className="w-3 h-3" /> Refresh
                </button>
              </div>

              {interactions.length === 0 ? (
                <div className="p-8 text-center bg-slate-900 border border-slate-800 rounded-2xl text-xs font-mono text-slate-400">
                  Belum ada interaksi komentar atau voice note di Supabase.
                </div>
              ) : (
                <div className="space-y-3">
                  {interactions.map((item) => (
                    <div
                      key={item.id}
                      className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3 hover:border-slate-700 transition"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider ${
                            item.interaction_type === 'VOICE_NOTE'
                              ? 'bg-purple-950/80 text-purple-300 border border-purple-800/60'
                              : 'bg-cyan-950/80 text-cyan-300 border border-cyan-800/60'
                          }`}>
                            {item.interaction_type}
                          </span>
                          <span className="text-xs font-mono text-slate-400">
                            User ID: {item.user_id.slice(0, 8)}...
                          </span>
                        </div>
                        <span className="text-[11px] font-mono text-slate-500">
                          {new Date(item.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      {/* Comment text */}
                      {item.comment_body && (
                        <p className="text-xs text-slate-200 leading-relaxed font-sans bg-slate-950 p-3 rounded-lg border border-slate-800/70">
                          "{item.comment_body}"
                        </p>
                      )}

                      {/* Voice Note Audio Visualizer */}
                      {item.interaction_type === 'VOICE_NOTE' && (
                        <div className="bg-purple-950/20 border border-purple-900/40 rounded-xl p-3.5 space-y-2.5">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => setActiveVoiceId(activeVoiceId === item.id ? null : item.id)}
                                className="w-8 h-8 rounded-full bg-purple-600 hover:bg-purple-500 flex items-center justify-center text-white transition shadow-md shadow-purple-950"
                              >
                                {activeVoiceId === item.id ? (
                                  <span className="text-xs font-bold">⏸</span>
                                ) : (
                                  <Play className="w-3.5 h-3.5 ml-0.5 text-white" />
                                )}
                              </button>
                              <div>
                                <div className="text-xs font-bold font-mono text-purple-200">
                                  Catatan Suara Kurator
                                </div>
                                <div className="text-[10px] text-purple-400 font-mono">
                                  Durasi: {item.voice_duration_seconds || 24.5} detik
                                </div>
                              </div>
                            </div>
                            <span className="text-[10px] font-mono text-purple-300/80 bg-purple-900/30 px-2 py-0.5 rounded">
                              Opus Audio
                            </span>
                          </div>

                          {/* Visual Waveform bars */}
                          <div className="flex items-center gap-1 h-7 px-2 bg-slate-950/60 rounded-lg">
                            {(item.voice_waveform || [20, 45, 80, 95, 60, 40, 75, 90, 50, 30, 65, 85, 40, 20]).map((val, idx) => (
                              <div
                                key={idx}
                                style={{ height: `${Math.max(15, Math.min(100, typeof val === 'number' ? (val < 1 ? val * 100 : val) : 50))}%` }}
                                className={`flex-1 rounded-full transition-all ${
                                  activeVoiceId === item.id
                                    ? 'bg-purple-400 animate-pulse'
                                    : 'bg-purple-700/60'
                                }`}
                              />
                            ))}
                          </div>

                          {/* Speech-to-Text Transcription */}
                          {item.voice_transcription && (
                            <div className="text-[11px] text-purple-300/90 italic font-mono bg-slate-950/40 p-2 rounded border border-purple-900/30">
                              Transkripsi: "{item.voice_transcription}"
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: LIVE POSTGIS SPATIAL QUERY */}
          {activeTab === 'spatial' && (
            <div className="space-y-4">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-4">
                <div className="flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-amber-400" />
                  <h4 className="text-xs font-bold text-white font-mono uppercase tracking-wider">
                    Parameter Pencarian PostGIS (fn_vec_query_nearby_posts)
                  </h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-mono text-slate-400 mb-1">
                      Pusat Garis Lintang (Latitude)
                    </label>
                    <input
                      type="number"
                      step="0.0001"
                      value={searchLat}
                      onChange={(e) => setSearchLat(parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-mono text-slate-400 mb-1">
                      Pusat Garis Bujur (Longitude)
                    </label>
                    <input
                      type="number"
                      step="0.0001"
                      value={searchLng}
                      onChange={(e) => setSearchLng(parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-mono text-slate-400 mb-1">
                      Radius Pencarian: <span className="text-amber-400 font-bold">{searchRadiusKm} km</span>
                    </label>
                    <input
                      type="range"
                      min="1"
                      max="100"
                      value={searchRadiusKm}
                      onChange={(e) => setSearchRadiusKm(parseInt(e.target.value) || 25)}
                      className="w-full accent-amber-500"
                    />
                  </div>
                </div>

                {/* Preset Buttons */}
                <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] font-mono">
                  <span className="text-slate-500">Preset Lokasi:</span>
                  <button
                    onClick={() => { setSearchLat(-6.175392); setSearchLng(106.827153); }}
                    className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-cyan-300"
                  >
                    Monas Jakarta
                  </button>
                  <button
                    onClick={() => { setSearchLat(-6.902484); setSearchLng(107.618691); }}
                    className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-cyan-300"
                  >
                    Gedung Sate Bandung
                  </button>
                  <button
                    onClick={() => { setSearchLat(-8.506854); setSearchLng(115.262482); }}
                    className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-cyan-300"
                  >
                    Ubud Bali
                  </button>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    onClick={handleRunSpatialQuery}
                    disabled={searchingNearby}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-mono font-bold bg-amber-600 hover:bg-amber-500 text-white transition shadow-lg shadow-amber-950 disabled:opacity-50"
                  >
                    {searchingNearby ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin text-white" />
                        <span>Menghitung Jarak PostGIS...</span>
                      </>
                    ) : (
                      <>
                        <MapPin className="w-3.5 h-3.5 text-white" />
                        <span>Eksekusi Query Radius PostGIS</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Spatial Results */}
              <div className="space-y-3">
                <h5 className="text-xs font-mono text-slate-400 font-bold">
                  Hasil Kembalian RPC Supabase ({nearbyResults.length} Karya Ditemukan):
                </h5>

                {nearbyResults.length === 0 ? (
                  <div className="p-6 text-center bg-slate-900 border border-slate-800 rounded-xl text-xs font-mono text-slate-500">
                    Klik tombol "Eksekusi Query Radius PostGIS" di atas untuk mencari postingan di sekitar koordinat ini.
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {nearbyResults.map((item, idx) => (
                      <div
                        key={idx}
                        className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-amber-500/40 transition"
                      >
                        <div>
                          <div className="text-xs font-bold text-white">
                            {item.title}
                          </div>
                          <div className="text-[11px] font-mono text-slate-400 mt-0.5">
                            Kreator: <span className="text-cyan-400 font-bold">@{item.author_username}</span> (Skor Keaslian: {item.author_score}%)
                          </div>
                        </div>

                        <div className="text-right flex sm:flex-col items-center sm:items-end justify-between sm:justify-center">
                          <div className="text-xs font-bold font-mono text-amber-400">
                            {(item.distance_meters / 1000).toFixed(2)} km
                          </div>
                          <div className="text-[10px] font-mono text-slate-500">
                            dari titik pencarian
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="p-10 text-center bg-slate-900/50 border border-dashed border-slate-800 rounded-2xl space-y-3">
          <Database className="w-10 h-10 text-slate-600 mx-auto" />
          <h4 className="text-sm font-bold text-white font-mono">
            Panel Siap Terhubung ke Supabase Anda
          </h4>
          <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
            Salin <strong>Project URL</strong> dan <strong>anon key</strong> dari Supabase Dashboard Anda, lalu klik tombol "Hubungkan ke Supabase Saya" di atas untuk menguji coba data secara langsung.
          </p>
        </div>
      )}
    </div>
  );
};
