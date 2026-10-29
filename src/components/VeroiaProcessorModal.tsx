import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Cpu, 
  Fingerprint, 
  FileCheck, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  HelpCircle, 
  Copy, 
  Check, 
  X, 
  Upload, 
  RefreshCw, 
  Layers, 
  ArrowRight, 
  ExternalLink, 
  Lock, 
  UserCheck, 
  Plus, 
  Trash2, 
  AlertCircle,
  Sparkles,
  Link2
} from 'lucide-react';
import { PrivateVaultItem, getAllRegisteredArtworks } from '../lib/userVaultStorage';
import { 
  VGuardInspectionRecord, 
  VGuardInspectionStatus, 
  GenevoraFingerprintRecord, 
  GenevoraVerificationStatus,
  VeroiaProcessorPipelineState,
  calculateBlobSha256,
  fetchMediaAndCalculateSha256,
  saveVGuardInspection,
  getVGuardInspection,
  saveGenevoraFingerprint,
  getGenevoraFingerprint,
  reverifyGenevoraHash,
  handoffToHumanGuard,
  getArtworkProcessorState,
  getCurrentInspectorIdentity
} from '../lib/veroiaProcessor';

interface VeroiaProcessorModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialArtwork?: PrivateVaultItem | null;
  onArtworkUpdated?: () => void;
}

type ProcessorTab = 'overview' | 'vguard' | 'humanguard' | 'genevora' | 'happy' | 'beauty';

export const VeroiaProcessorModal: React.FC<VeroiaProcessorModalProps> = ({
  isOpen,
  onClose,
  initialArtwork,
  onArtworkUpdated
}) => {
  // All registered artworks for selection
  const [allArtworks, setAllArtworks] = useState<PrivateVaultItem[]>(() => getAllRegisteredArtworks());
  const [selectedArtworkId, setSelectedArtworkId] = useState<string>(() => initialArtwork?.id || '');
  const [activeTab, setActiveTab] = useState<ProcessorTab>('overview');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Sync initial artwork when modal opens
  useEffect(() => {
    if (initialArtwork?.id) {
      setSelectedArtworkId(initialArtwork.id);
    } else if (allArtworks.length > 0 && !selectedArtworkId) {
      setSelectedArtworkId(allArtworks[0].id);
    }
  }, [initialArtwork, allArtworks]);

  useEffect(() => {
    if (isOpen) {
      setAllArtworks(getAllRegisteredArtworks());
    }
  }, [isOpen]);

  const currentArtwork = allArtworks.find((a) => a.id === selectedArtworkId) || allArtworks[0] || null;

  // Pipeline State
  const [pipelineState, setPipelineState] = useState<VeroiaProcessorPipelineState | null>(null);

  const refreshState = () => {
    if (currentArtwork) {
      setPipelineState(getArtworkProcessorState(currentArtwork));
    }
  };

  useEffect(() => {
    refreshState();
  }, [currentArtwork]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // -------------------------------------------------------------------------
  // VGUARD STATE
  // -------------------------------------------------------------------------
  const [vguardStatus, setVguardStatus] = useState<VGuardInspectionStatus>('BELUM DIPERIKSA');
  const [similarUrls, setSimilarUrls] = useState<string[]>([]);
  const [newUrlInput, setNewUrlInput] = useState<string>('');
  const [evidenceSources, setEvidenceSources] = useState<string>('');
  const [inspectorNotes, setInspectorNotes] = useState<string>('');
  const [hasAiIndicator, setHasAiIndicator] = useState<boolean>(false);
  const [aiEvidenceNotes, setAiEvidenceNotes] = useState<string>('');
  const [inspectorName, setInspectorName] = useState<string>(() => getCurrentInspectorIdentity().name);
  const [isSavingVGuard, setIsSavingVGuard] = useState<boolean>(false);

  // Load existing VGuard record when artwork changes
  useEffect(() => {
    if (currentArtwork) {
      const existing = getVGuardInspection(currentArtwork.id);
      if (existing) {
        setVguardStatus(existing.status);
        setSimilarUrls(existing.similarWorkUrls || []);
        setEvidenceSources(existing.evidenceSources || '');
        setInspectorNotes(existing.inspectorNotes || '');
        setHasAiIndicator(existing.aiUsageIndicators?.hasIndicator || false);
        setAiEvidenceNotes(existing.aiUsageIndicators?.evidenceNotes || '');
        setInspectorName(existing.inspectorName || getCurrentInspectorIdentity().name);
      } else {
        setVguardStatus('BELUM DIPERIKSA');
        setSimilarUrls([]);
        setEvidenceSources('');
        setInspectorNotes('');
        setHasAiIndicator(false);
        setAiEvidenceNotes('');
        setInspectorName(getCurrentInspectorIdentity().name);
      }
    }
  }, [currentArtwork]);

  const handleAddUrl = () => {
    const trimmed = newUrlInput.trim();
    if (!trimmed) return;
    if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
      showToast('URL referensi harus diawali dengan http:// atau https://');
      return;
    }
    if (similarUrls.includes(trimmed)) {
      showToast('URL ini sudah ada di daftar referensi.');
      return;
    }
    setSimilarUrls([...similarUrls, trimmed]);
    setNewUrlInput('');
  };

  const handleRemoveUrl = (index: number) => {
    setSimilarUrls(similarUrls.filter((_, i) => i !== index));
  };

  const handleSaveVGuard = async () => {
    if (!currentArtwork) return;
    setIsSavingVGuard(true);

    const record: VGuardInspectionRecord = {
      id: `vguard-${currentArtwork.id}-${Date.now()}`,
      artworkId: currentArtwork.id,
      artworkTitle: currentArtwork.title,
      inspectorName: inspectorName.trim() || 'Pemeriksa Terdaftar Veroia',
      inspectedAt: new Date().toISOString(),
      status: vguardStatus,
      similarWorkUrls: similarUrls,
      evidenceSources: evidenceSources.trim(),
      inspectorNotes: inspectorNotes.trim(),
      aiUsageIndicators: {
        hasIndicator: hasAiIndicator,
        evidenceNotes: hasAiIndicator ? aiEvidenceNotes.trim() : undefined
      }
    };

    const res = await saveVGuardInspection(record);
    setIsSavingVGuard(false);
    refreshState();
    showToast(res.message);
    if (onArtworkUpdated) onArtworkUpdated();
  };

  const handleEscalateToHumanGuard = async () => {
    if (!currentArtwork) return;
    const res = await handoffToHumanGuard(
      currentArtwork.id, 
      inspectorNotes || 'Diteruskan dari pemeriksaan VGUARD awal karena ada indikasi yang memerlukan tinjauan kurator.'
    );
    refreshState();
    showToast(res.message);
    setActiveTab('humanguard');
    if (onArtworkUpdated) onArtworkUpdated();
  };

  // -------------------------------------------------------------------------
  // GENEVORA STATE
  // -------------------------------------------------------------------------
  const [calculatedSha256, setCalculatedSha256] = useState<string>('');
  const [computedFileMeta, setComputedFileMeta] = useState<{
    fileName?: string;
    fileFormat?: string;
    sizeBytes?: number;
    sizeFormatted?: string;
  } | null>(null);
  const [isHashingFile, setIsHashingFile] = useState<boolean>(false);
  const [hashingError, setHashingError] = useState<string | null>(null);
  const [copiedSha, setCopiedSha] = useState<boolean>(false);

  // Re-verification state
  const [recheckFile, setRecheckFile] = useState<File | null>(null);
  const [recheckStatus, setRecheckStatus] = useState<GenevoraVerificationStatus | null>(null);
  const [isReverifying, setIsReverifying] = useState<boolean>(false);
  const [recheckError, setRecheckError] = useState<string | null>(null);

  const existingGenevora = currentArtwork ? getGenevoraFingerprint(currentArtwork.id) : null;

  const handleCalculateFromFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setHashingError(null);
    setIsHashingFile(true);
    try {
      const { sha256, sizeBytes, sizeFormatted } = await calculateBlobSha256(file);
      setCalculatedSha256(sha256);
      setComputedFileMeta({
        fileName: file.name,
        fileFormat: file.type || file.name.split('.').pop()?.toUpperCase() || 'RAW/JPEG',
        sizeBytes,
        sizeFormatted
      });
      showToast(`SHA-256 berhasil dihitung dari ${sizeFormatted} byte berkas asli.`);
    } catch (err: any) {
      setHashingError(err.message || 'Gagal membaca berkas untuk hashing SHA-256.');
      setCalculatedSha256('');
    } finally {
      setIsHashingFile(false);
    }
  };

  const handleCalculateFromMediaUrl = async () => {
    if (!currentArtwork?.photoUrl) {
      setHashingError('URL berkas karya tidak tersedia.');
      return;
    }

    setHashingError(null);
    setIsHashingFile(true);
    try {
      const { sha256, sizeBytes, sizeFormatted, mimeType } = await fetchMediaAndCalculateSha256(currentArtwork.photoUrl);
      setCalculatedSha256(sha256);
      setComputedFileMeta({
        fileName: `${currentArtwork.title.replace(/\s+/g, '_')}_master`,
        fileFormat: mimeType.split('/')[1]?.toUpperCase() || 'JPEG',
        sizeBytes,
        sizeFormatted
      });
      showToast(`SHA-256 berhasil dihitung dari unduhan byte media (${sizeFormatted}).`);
    } catch (err: any) {
      setHashingError(err.message || 'Gagal membaca berkas dari URL media karya.');
      setCalculatedSha256('');
    } finally {
      setIsHashingFile(false);
    }
  };

  const handleSaveGenevoraFingerprint = async () => {
    if (!currentArtwork || !calculatedSha256) return;

    const record: GenevoraFingerprintRecord = {
      artworkId: currentArtwork.id,
      artworkTitle: currentArtwork.title,
      sha256: calculatedSha256,
      fileName: computedFileMeta?.fileName || 'master_artwork_file',
      fileFormat: computedFileMeta?.fileFormat || 'JPEG',
      fileSizeBytes: computedFileMeta?.sizeBytes,
      fileSizeFormatted: computedFileMeta?.sizeFormatted || currentArtwork.fileSize,
      createdAt: new Date().toISOString(),
      methodVersion: 'SHA-256-v1',
      creatorName: getCurrentInspectorIdentity().name,
      sourceType: computedFileMeta?.fileName ? 'uploaded_file' : 'remote_media_fetch'
    };

    const res = await saveGenevoraFingerprint(record);
    refreshState();
    showToast(res.message);
    if (onArtworkUpdated) onArtworkUpdated();
  };

  const handleReverifyUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentArtwork) return;

    setRecheckFile(file);
    setRecheckError(null);
    setIsReverifying(true);
    try {
      const { sha256 } = await calculateBlobSha256(file);
      const identity = getCurrentInspectorIdentity();
      const result = await reverifyGenevoraHash(currentArtwork.id, sha256, identity.name, `Uji Berkas: ${file.name}`);
      setRecheckStatus(result.status);
      refreshState();
    } catch (err: any) {
      setRecheckError(err.message || 'Pemeriksaan ulang gagal.');
      setRecheckStatus(null);
    } finally {
      setIsReverifying(false);
    }
  };

  const handleReverifyCurrentMedia = async () => {
    if (!currentArtwork?.photoUrl) return;

    setRecheckError(null);
    setIsReverifying(true);
    try {
      const { sha256 } = await fetchMediaAndCalculateSha256(currentArtwork.photoUrl);
      const identity = getCurrentInspectorIdentity();
      const result = await reverifyGenevoraHash(
        currentArtwork.id, 
        sha256, 
        identity.name, 
        'Uji Otentikasi Byte Media Server'
      );
      setRecheckStatus(result.status);
      refreshState();
    } catch (err: any) {
      setRecheckError(err.message || 'Pemeriksaan ulang media server gagal.');
      setRecheckStatus(null);
    } finally {
      setIsReverifying(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="processor-modal-title"
    >
      <div className="relative w-full max-w-5xl bg-neutral-900 border border-neutral-700/80 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden my-auto flex flex-col max-h-[92vh]">
        
        {/* =================================================================== */}
        {/* HEADER MODAL DENGAN BRANDING RESMI VEROIA PROCESSOR                 */}
        {/* =================================================================== */}
        <div className="px-4 sm:px-6 py-4 bg-neutral-950 border-b border-neutral-800 flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-cyan-950/70 border border-cyan-500/40 p-2 flex items-center justify-center text-cyan-400 shrink-0">
              <Cpu className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 id="processor-modal-title" className="text-base sm:text-lg font-bold text-white truncate">
                  Veroia Processor
                </h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-950 text-cyan-300 border border-cyan-700/60 uppercase">
                  VGUARD & GENEVORA
                </span>
              </div>
              <p className="text-xs text-neutral-400 truncate">
                Pipeline Integritas & Verifikasi Karya: TWIN → VGUARD → HUMANGUARD → GENEVORA → HAPPY → BEAUTY
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-neutral-400 hover:text-white bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 transition cursor-pointer"
            aria-label="Tutup Panel"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* =================================================================== */}
        {/* PEMILIH KARYA & BANNER INFORMASI KARYA TERPILIH                     */}
        {/* =================================================================== */}
        <div className="px-4 sm:px-6 py-3 bg-neutral-950/60 border-b border-neutral-800 flex flex-col md:flex-row md:items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            {currentArtwork?.photoUrl ? (
              <img 
                src={currentArtwork.photoUrl} 
                alt={currentArtwork.title}
                className="w-12 h-12 rounded-xl object-cover border border-neutral-700 shrink-0 bg-black"
                onError={(e) => { e.currentTarget.style.opacity = '0.3'; }}
              />
            ) : (
              <div className="w-12 h-12 rounded-xl bg-neutral-800 border border-neutral-700 flex items-center justify-center text-neutral-500 shrink-0">
                <FileCheck className="w-6 h-6" />
              </div>
            )}
            <div className="min-w-0">
              <div className="text-xs text-neutral-400 flex items-center gap-1.5">
                <span>Karya Terpilih:</span>
                <span className="font-mono text-cyan-400 truncate max-w-[200px]">ID: {currentArtwork?.id || '—'}</span>
              </div>
              <h3 className="text-sm font-bold text-white truncate max-w-sm sm:max-w-md">
                {currentArtwork?.title || 'Pilih Karya...'}
              </h3>
              <div className="text-[11px] text-neutral-400 truncate">
                {currentArtwork?.creatorName || 'VEC Master Curator'} • {currentArtwork?.deviceInfo || 'VEC Sensor Enclave'}
              </div>
            </div>
          </div>

          {/* Dropdown Pemilih Karya yang Terdaftar di Sistem */}
          <div className="flex items-center gap-2 shrink-0">
            <label htmlFor="select-artwork" className="text-xs text-neutral-400 whitespace-nowrap">
              Ganti Karya:
            </label>
            <select
              id="select-artwork"
              value={selectedArtworkId}
              onChange={(e) => setSelectedArtworkId(e.target.value)}
              className="bg-neutral-900 border border-neutral-700 text-xs text-white rounded-xl px-3 py-1.5 focus:outline-none focus:border-cyan-500 max-w-[240px] truncate"
            >
              {allArtworks.map((art) => (
                <option key={art.id} value={art.id}>
                  {art.title} ({art.id.slice(0, 8)}...)
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* =================================================================== */}
        {/* PIPELINE PROGRESS BAR (TWIN → VGUARD → HUMANGUARD → GENEVORA...)     */}
        {/* =================================================================== */}
        <div className="px-4 sm:px-6 py-2.5 bg-neutral-950/40 border-b border-neutral-800/80 overflow-x-auto shrink-0">
          <div className="flex items-center justify-between min-w-[620px] gap-1 text-[11px]">
            
            {/* 1. TWIN */}
            <div className="flex items-center gap-1 text-emerald-400 font-semibold px-2 py-1 rounded-lg bg-emerald-950/40 border border-emerald-800/50">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              <span>1. TWIN</span>
            </div>

            <ArrowRight className="w-3 h-3 text-neutral-600 shrink-0" />

            {/* 2. VGUARD */}
            <button
              type="button"
              onClick={() => setActiveTab('vguard')}
              className={`flex items-center gap-1 px-2 py-1 rounded-lg border transition cursor-pointer ${
                activeTab === 'vguard'
                  ? 'bg-cyan-950 text-cyan-300 border-cyan-500 font-bold'
                  : vguardStatus === 'BELUM DIPERIKSA'
                  ? 'bg-neutral-900 text-neutral-400 border-neutral-800 hover:text-white'
                  : 'bg-neutral-900 text-cyan-400 border-cyan-800/60'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
              <span>2. VGUARD</span>
              <span className="text-[9px] px-1 py-0.2 rounded bg-black/60 font-mono">
                {vguardStatus === 'BELUM DIPERIKSA' ? 'Draft' : 'Aktif'}
              </span>
            </button>

            <ArrowRight className="w-3 h-3 text-neutral-600 shrink-0" />

            {/* 3. HUMANGUARD */}
            <button
              type="button"
              onClick={() => setActiveTab('humanguard')}
              className={`flex items-center gap-1 px-2 py-1 rounded-lg border transition cursor-pointer ${
                activeTab === 'humanguard'
                  ? 'bg-purple-950 text-purple-300 border-purple-500 font-bold'
                  : pipelineState?.humanguard.isReady
                  ? 'bg-amber-950/50 text-amber-300 border-amber-700/60'
                  : 'bg-neutral-900 text-neutral-400 border-neutral-800 hover:text-white'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5 shrink-0" />
              <span>3. HUMANGUARD</span>
              {pipelineState?.humanguard.isReady && (
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
              )}
            </button>

            <ArrowRight className="w-3 h-3 text-neutral-600 shrink-0" />

            {/* 4. GENEVORA */}
            <button
              type="button"
              onClick={() => setActiveTab('genevora')}
              className={`flex items-center gap-1 px-2 py-1 rounded-lg border transition cursor-pointer ${
                activeTab === 'genevora'
                  ? 'bg-cyan-950 text-cyan-300 border-cyan-500 font-bold'
                  : existingGenevora
                  ? 'bg-emerald-950/40 text-emerald-300 border-emerald-800/50'
                  : 'bg-neutral-900 text-neutral-400 border-neutral-800 hover:text-white'
              }`}
            >
              <Fingerprint className="w-3.5 h-3.5 shrink-0" />
              <span>4. GENEVORA</span>
              <span className="text-[9px] px-1 py-0.2 rounded bg-black/60 font-mono">
                {existingGenevora ? 'SHA-256' : 'Perlu Hash'}
              </span>
            </button>

            <ArrowRight className="w-3 h-3 text-neutral-600 shrink-0" />

            {/* 5. HAPPY */}
            <button
              type="button"
              onClick={() => setActiveTab('happy')}
              className={`flex items-center gap-1 px-2 py-1 rounded-lg border transition cursor-pointer ${
                activeTab === 'happy'
                  ? 'bg-neutral-800 text-white border-neutral-600 font-bold'
                  : 'bg-neutral-950 text-neutral-500 border-neutral-850 hover:text-neutral-300'
              }`}
            >
              <Lock className="w-3 h-3 text-neutral-500 shrink-0" />
              <span>5. HAPPY</span>
            </button>

            <ArrowRight className="w-3 h-3 text-neutral-600 shrink-0" />

            {/* 6. BEAUTY */}
            <button
              type="button"
              onClick={() => setActiveTab('beauty')}
              className={`flex items-center gap-1 px-2 py-1 rounded-lg border transition cursor-pointer ${
                activeTab === 'beauty'
                  ? 'bg-neutral-800 text-white border-neutral-600 font-bold'
                  : 'bg-neutral-950 text-neutral-500 border-neutral-850 hover:text-neutral-300'
              }`}
            >
              <Lock className="w-3 h-3 text-neutral-500 shrink-0" />
              <span>6. BEAUTY</span>
            </button>

          </div>
        </div>

        {/* =================================================================== */}
        {/* TAB NAVIGATION BUTTONS                                              */}
        {/* =================================================================== */}
        <div className="flex border-b border-neutral-800 bg-neutral-950/40 px-4 sm:px-6 gap-2 pt-2 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            className={`px-3 py-2 text-xs font-medium rounded-t-xl transition cursor-pointer border-t border-x ${
              activeTab === 'overview'
                ? 'bg-neutral-900 text-cyan-300 border-neutral-700 border-b-neutral-900 -mb-px font-semibold'
                : 'text-neutral-400 hover:text-white border-transparent'
            }`}
          >
            Ikhtisar Pipeline
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('vguard')}
            className={`px-3 py-2 text-xs font-medium rounded-t-xl transition cursor-pointer border-t border-x flex items-center gap-1.5 ${
              activeTab === 'vguard'
                ? 'bg-neutral-900 text-cyan-300 border-neutral-700 border-b-neutral-900 -mb-px font-semibold'
                : 'text-neutral-400 hover:text-white border-transparent'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
            <span>Modul VGUARD</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('genevora')}
            className={`px-3 py-2 text-xs font-medium rounded-t-xl transition cursor-pointer border-t border-x flex items-center gap-1.5 ${
              activeTab === 'genevora'
                ? 'bg-neutral-900 text-cyan-300 border-neutral-700 border-b-neutral-900 -mb-px font-semibold'
                : 'text-neutral-400 hover:text-white border-transparent'
            }`}
          >
            <Fingerprint className="w-3.5 h-3.5 text-cyan-400" />
            <span>Modul GENEVORA</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('humanguard')}
            className={`px-3 py-2 text-xs font-medium rounded-t-xl transition cursor-pointer border-t border-x flex items-center gap-1.5 ${
              activeTab === 'humanguard'
                ? 'bg-neutral-900 text-purple-300 border-neutral-700 border-b-neutral-900 -mb-px font-semibold'
                : 'text-neutral-400 hover:text-white border-transparent'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5 text-purple-400" />
            <span>HUMANGUARD</span>
          </button>
        </div>

        {/* =================================================================== */}
        {/* MODAL BODY (CONTENT BY TAB)                                         */}
        {/* =================================================================== */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">

          {/* --------------------------------------------------------------- */}
          {/* TAB 1: IKHTISAR PIPELINE VEROIA PROCESSOR                       */}
          {/* --------------------------------------------------------------- */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-neutral-950 via-neutral-900 to-cyan-950/40 border border-neutral-800 space-y-2">
                <div className="flex items-center gap-2 text-cyan-400 text-xs font-mono font-bold uppercase tracking-wider">
                  <Cpu className="w-4 h-4" />
                  <span>Arsitektur Veroia Processor</span>
                </div>
                <h4 className="text-base sm:text-lg font-bold text-white">
                  6-Tahap Integritas & Keaslian Karya Seni
                </h4>
                <p className="text-xs text-neutral-400 leading-relaxed max-w-3xl">
                  Veroia Processor menjalankan rantai pemeriksaan bertahap tanpa spekulasi otomatis. 
                  Fokus implementasi saat ini adalah penyempurnaan <strong>VGUARD</strong> (pengumpulan bukti kesamaan & indikasi AI) 
                  dan <strong>GENEVORA</strong> (fingerprint SHA-256 berbasis byte konten berkas riil).
                </p>
              </div>

              {/* Status 6 Tahap Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                
                {/* 1. TWIN */}
                <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">1. TWIN</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-950 text-emerald-300 border border-emerald-800/60">
                      Terdaftar TEE
                    </span>
                  </div>
                  <p className="text-[11px] text-neutral-400">
                    Otentikasi kamera hardware TEE & segel C2PA dari sensor langsung.
                  </p>
                  <div className="text-[10px] font-mono text-neutral-500 truncate">
                    Sig: {currentArtwork?.c2paSignature || 'TEE_HARDWARE_ATTESTED'}
                  </div>
                </div>

                {/* 2. VGUARD */}
                <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-cyan-300">2. VGUARD</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono border ${
                      vguardStatus === 'BELUM DIPERIKSA'
                        ? 'bg-neutral-900 text-neutral-400 border-neutral-700'
                        : vguardStatus === 'TIDAK ADA INDIKASI YANG DITEMUKAN'
                        ? 'bg-emerald-950 text-emerald-300 border-emerald-800/60'
                        : vguardStatus === 'ADA INDIKASI YANG PERLU DITINJAU'
                        ? 'bg-rose-950 text-rose-300 border-rose-800/60'
                        : 'bg-amber-950 text-amber-300 border-amber-800/60'
                    }`}>
                      {vguardStatus}
                    </span>
                  </div>
                  <p className="text-[11px] text-neutral-400">
                    Pemeriksaan bukti kesamaan manual & indikasi AI berdasarkan fakta tersedia.
                  </p>
                  <button
                    type="button"
                    onClick={() => setActiveTab('vguard')}
                    className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-medium cursor-pointer"
                  >
                    Buka Formulir VGUARD →
                  </button>
                </div>

                {/* 3. HUMANGUARD */}
                <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-purple-300">3. HUMANGUARD</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-purple-950/60 text-purple-300 border border-purple-800/60">
                      {pipelineState?.humanguard.isReady ? 'Siap Tinjauan' : 'Titik Integrasi'}
                    </span>
                  </div>
                  <p className="text-[11px] text-neutral-400">
                    Eskalasi ke dewan kurator manusia jika VGUARD menemukan indikasi yang perlu dikaji.
                  </p>
                  <button
                    type="button"
                    onClick={() => setActiveTab('humanguard')}
                    className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1 font-medium cursor-pointer"
                  >
                    Detail Integrasi HUMANGUARD →
                  </button>
                </div>

                {/* 4. GENEVORA */}
                <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-cyan-300">4. GENEVORA</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono border ${
                      existingGenevora 
                        ? 'bg-emerald-950 text-emerald-300 border-emerald-800/60' 
                        : 'bg-amber-950 text-amber-300 border-amber-800/60'
                    }`}>
                      {existingGenevora ? 'SHA-256 Aktif' : 'Belum Ada Fingerprint'}
                    </span>
                  </div>
                  <p className="text-[11px] text-neutral-400">
                    Fingerprint kriptografis SHA-256-v1 dihitung dari byte berkas aktual.
                  </p>
                  <button
                    type="button"
                    onClick={() => setActiveTab('genevora')}
                    className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-medium cursor-pointer"
                  >
                    Buka Modul GENEVORA →
                  </button>
                </div>

                {/* 5. HAPPY */}
                <div className="p-4 rounded-xl bg-neutral-950/60 border border-neutral-850 space-y-2 opacity-80">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-neutral-300">5. HAPPY</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-neutral-900 text-neutral-400 border border-neutral-800">
                      Terkunci
                    </span>
                  </div>
                  <p className="text-[11px] text-neutral-500">
                    Parameter kuratorial dipertahankan apa adanya sesuai standar sistem.
                  </p>
                </div>

                {/* 6. BEAUTY */}
                <div className="p-4 rounded-xl bg-neutral-950/60 border border-neutral-850 space-y-2 opacity-80">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-neutral-300">6. BEAUTY</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-neutral-900 text-neutral-400 border border-neutral-800">
                      Terkunci
                    </span>
                  </div>
                  <p className="text-[11px] text-neutral-500">
                    Parameter estetika spektral dipertahankan tanpa perubahan rumus.
                  </p>
                </div>

              </div>
            </div>
          )}

          {/* --------------------------------------------------------------- */}
          {/* TAB 2: MODUL VGUARD (FORM & PENCATATAN BUKTI PEMERIKSAAN)        */}
          {/* --------------------------------------------------------------- */}
          {activeTab === 'vguard' && (
            <div className="space-y-6">
              
              {/* VGUARD Banner & Purpose */}
              <div className="p-4 sm:p-5 rounded-2xl bg-neutral-950 border border-neutral-800 space-y-2">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-cyan-400" />
                    <h4 className="text-base font-bold text-white">
                      Modul VGUARD — Pemeriksaan Bukti & Indikasi Karya
                    </h4>
                  </div>
                  <div className={`px-2.5 py-1 rounded-xl text-xs font-mono font-bold border ${
                    vguardStatus === 'BELUM DIPERIKSA'
                      ? 'bg-neutral-900 text-neutral-300 border-neutral-700'
                      : vguardStatus === 'TIDAK ADA INDIKASI YANG DITEMUKAN'
                      ? 'bg-emerald-950 text-emerald-300 border-emerald-800/60'
                      : vguardStatus === 'ADA INDIKASI YANG PERLU DITINJAU'
                      ? 'bg-rose-950 text-rose-300 border-rose-800/60'
                      : 'bg-amber-950 text-amber-300 border-amber-800/60'
                  }`}>
                    STATUS: {vguardStatus}
                  </div>
                </div>
                <p className="text-xs text-neutral-400 leading-relaxed">
                  VGUARD membantu pemeriksa mengumpulkan bukti dan mencatat indikasi kesamaan karya, 
                  kemungkinan karya pernah dipublikasikan/diunduh, serta indikasi penggunaan AI berdasarkan bukti konkret.
                </p>
                
                {/* Batasan VGUARD Disclaimer Wajib */}
                <div className="p-3 rounded-xl bg-amber-950/25 border border-amber-800/40 text-amber-200 text-xs flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div className="leading-relaxed text-[11px]">
                    <strong>Batasan Resmi VGUARD Versi Pertama:</strong>
                    <ul className="list-disc pl-4 mt-1 space-y-0.5 text-amber-300/90">
                      <li>Status hanya menggambarkan hasil pemeriksaan awal, bukan vonis plagiarisme mutlak.</li>
                      <li>Tidak melakukan pencarian internet otomatis atau mengarang probabilitas AI.</li>
                      <li>Metadata yang hilang tidak dianggap sebagai bukti penggunaan AI.</li>
                      <li>Jika bukti belum cukup, status harus tetap menyatakan belum dapat disimpulkan.</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Form Pemeriksaan VGUARD */}
              <div className="p-4 sm:p-6 rounded-2xl bg-neutral-950/70 border border-neutral-800 space-y-5">
                
                {/* 1. Status Pemeriksaan Selector */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-white flex items-center gap-1.5">
                    <span>Status Hasil Pemeriksaan VGUARD:</span>
                    <span className="text-rose-400">*</span>
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    {(
                      [
                        'BELUM DIPERIKSA',
                        'MENUNGGU TINJAUAN MANUSIA',
                        'TIDAK ADA INDIKASI YANG DITEMUKAN',
                        'ADA INDIKASI YANG PERLU DITINJAU'
                      ] as VGuardInspectionStatus[]
                    ).map((st) => (
                      <label
                        key={st}
                        className={`p-3 rounded-xl border flex items-center gap-2.5 cursor-pointer transition ${
                          vguardStatus === st
                            ? 'bg-cyan-950/60 border-cyan-500 text-white font-semibold'
                            : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-neutral-200'
                        }`}
                      >
                        <input
                          type="radio"
                          name="vguard-status"
                          value={st}
                          checked={vguardStatus === st}
                          onChange={() => setVguardStatus(st)}
                          className="accent-cyan-500"
                        />
                        <span className="text-xs">{st}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* 2. URL Referensi Karya Serupa yang Ditemukan Manual */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-white flex items-center justify-between">
                    <span>URL Referensi Karya Serupa (Temuan Manual):</span>
                    <span className="text-[11px] text-neutral-500 font-normal">
                      {similarUrls.length} tautan tersimpan
                    </span>
                  </label>
                  
                  <div className="flex gap-2">
                    <input
                      type="url"
                      placeholder="https://contoh-sumber.com/karya-serupa"
                      value={newUrlInput}
                      onChange={(e) => setNewUrlInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddUrl();
                        }
                      }}
                      className="flex-1 bg-neutral-900 border border-neutral-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-cyan-500"
                    />
                    <button
                      type="button"
                      onClick={handleAddUrl}
                      className="px-3 py-2 rounded-xl bg-cyan-950 hover:bg-cyan-900 text-cyan-300 border border-cyan-800/70 text-xs font-medium flex items-center gap-1.5 transition cursor-pointer shrink-0"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Tambah URL</span>
                    </button>
                  </div>

                  {similarUrls.length > 0 && (
                    <div className="space-y-1.5 pt-1">
                      {similarUrls.map((url, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-xs text-cyan-300"
                        >
                          <div className="flex items-center gap-2 truncate min-w-0">
                            <Link2 className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
                            <a 
                              href={url} 
                              target="_blank" 
                              rel="noreferrer" 
                              className="truncate underline hover:text-cyan-200"
                            >
                              {url}
                            </a>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveUrl(idx)}
                            className="p-1 rounded text-neutral-500 hover:text-rose-400 transition cursor-pointer shrink-0"
                            title="Hapus URL ini"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 3. Sumber Bukti & Catatan Pemeriksa */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-white">
                      Sumber Bukti Pemeriksaan:
                    </label>
                    <textarea
                      rows={3}
                      placeholder="Contoh: Hasil pemindaian katalog fisik pameran, arsip repositori seni digital, atau pengamatan visual kurator."
                      value={evidenceSources}
                      onChange={(e) => setEvidenceSources(e.target.value)}
                      className="w-full bg-neutral-900 border border-neutral-700 rounded-xl p-3 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-cyan-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-white">
                      Catatan Rinci Pemeriksa:
                    </label>
                    <textarea
                      rows={3}
                      placeholder="Tuliskan analisis perbandingan elemen komposisi, goresan kuas, layer warna, atau rincian observasi."
                      value={inspectorNotes}
                      onChange={(e) => setInspectorNotes(e.target.value)}
                      className="w-full bg-neutral-900 border border-neutral-700 rounded-xl p-3 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>

                {/* 4. Bagian Indikasi Penggunaan AI Berdasarkan Bukti Nyata */}
                <div className="p-4 rounded-xl bg-neutral-900/90 border border-neutral-800 space-y-3">
                  <label className="flex items-start gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={hasAiIndicator}
                      onChange={(e) => setHasAiIndicator(e.target.checked)}
                      className="w-4 h-4 mt-0.5 accent-cyan-500 rounded"
                    />
                    <div>
                      <span className="text-xs font-bold text-white block">
                        Terdapat Indikasi Konkret Penggunaan AI
                      </span>
                      <span className="text-[11px] text-neutral-400 block mt-0.5">
                        Centang hanya jika terdapat bukti nyata (misalnya artefak difusi, distorsi anatomi generator, atau konfirmasi berkas).
                      </span>
                    </div>
                  </label>

                  {hasAiIndicator && (
                    <div className="pl-6 pt-1 space-y-1.5">
                      <label className="text-[11px] font-semibold text-amber-300">
                        Rincian Bukti Nyata Indikasi AI:
                      </label>
                      <textarea
                        rows={2}
                        placeholder="Uraikan bukti nyata (misal: artefak pencahayaan sintetis, repetisi pola fraktal latent noise, dll.)"
                        value={aiEvidenceNotes}
                        onChange={(e) => setAiEvidenceNotes(e.target.value)}
                        className="w-full bg-neutral-950 border border-amber-800/60 rounded-xl p-2.5 text-xs text-amber-100 placeholder-neutral-500 focus:outline-none focus:border-amber-500"
                      />
                    </div>
                  )}
                </div>

                {/* 5. Identitas Pemeriksa & Tombol Simpan */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-neutral-800">
                  <div className="flex items-center gap-2 text-xs text-neutral-400">
                    <span>Pemeriksa:</span>
                    <input
                      type="text"
                      value={inspectorName}
                      onChange={(e) => setInspectorName(e.target.value)}
                      className="bg-neutral-900 border border-neutral-700 rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:border-cyan-500"
                    />
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    {(vguardStatus === 'ADA INDIKASI YANG PERLU DITINJAU' || vguardStatus === 'MENUNGGU TINJAUAN MANUSIA') && (
                      <button
                        type="button"
                        onClick={handleEscalateToHumanGuard}
                        className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-purple-950 hover:bg-purple-900 text-purple-300 border border-purple-800/80 text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer"
                        title="Teruskan bukti ke tahap HUMANGUARD"
                      >
                        <UserCheck className="w-4 h-4 text-purple-400" />
                        <span>Kirim ke HUMANGUARD</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={handleSaveVGuard}
                      disabled={isSavingVGuard}
                      className="flex-1 sm:flex-none px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer shadow-md"
                    >
                      {isSavingVGuard ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <Check className="w-4 h-4" />
                      )}
                      <span>Simpan Pemeriksaan VGUARD</span>
                    </button>
                  </div>
                </div>

              </div>

            </div>
          )}

          {/* --------------------------------------------------------------- */}
          {/* TAB 3: MODUL GENEVORA (FINGERPRINT SHA-256 & RE-VERIFICATION)    */}
          {/* --------------------------------------------------------------- */}
          {activeTab === 'genevora' && (
            <div className="space-y-6">
              
              {/* GENEVORA Banner */}
              <div className="p-4 sm:p-5 rounded-2xl bg-neutral-950 border border-neutral-800 space-y-2">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <Fingerprint className="w-5 h-5 text-cyan-400" />
                    <h4 className="text-base font-bold text-white">
                      Modul GENEVORA — Fingerprint Kriptografis Berkas
                    </h4>
                  </div>
                  <span className="px-2.5 py-1 rounded-xl text-xs font-mono font-bold bg-neutral-900 text-cyan-300 border border-cyan-800/60">
                    METODE: SHA-256-v1
                  </span>
                </div>
                <p className="text-xs text-neutral-400 leading-relaxed">
                  GENEVORA membentuk identitas digital atau fingerprint untuk suatu karya dengan menghitung 
                  hash SHA-256 dari byte konten file yang sebenarnya.
                </p>

                {/* Disclaimer Wajib GENEVORA */}
                <div className="p-3 rounded-xl bg-cyan-950/30 border border-cyan-800/40 text-cyan-200 text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                  <div className="leading-relaxed text-[11px]">
                    <strong>Prinsip Kriptografi GENEVORA:</strong> Hash SHA-256 membuktikan integritas biner file pada saat pembacaan. 
                    Hash yang berbeda dapat terjadi karena kompresi ulang atau modifikasi teknis, dan tidak secara otomatis menyimpulkan 
                    bahwa karya berbeda. Hash tidak membuktikan hak cipta, kepemilikan, atau tanggal pembuatan karya.
                  </div>
                </div>
              </div>

              {/* Status Fingerprint Tersimpan Saat Ini */}
              <div className="p-4 sm:p-5 rounded-2xl bg-neutral-950/70 border border-neutral-800 space-y-3">
                <h5 className="text-xs font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
                  <FileCheck className="w-4 h-4 text-emerald-400" />
                  <span>Fingerprint Tersimpan di Sistem:</span>
                </h5>

                {existingGenevora ? (
                  <div className="space-y-3">
                    <div className="p-3.5 rounded-xl bg-black/70 border border-emerald-900/50 space-y-1.5">
                      <div className="flex items-center justify-between text-xs text-neutral-400">
                        <span>SHA-256 (64 Karakter Hex Konsisten):</span>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(existingGenevora.sha256);
                            setCopiedSha(true);
                            setTimeout(() => setCopiedSha(false), 2000);
                          }}
                          className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer font-medium"
                        >
                          {copiedSha ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>{copiedSha ? 'Disalin' : 'Salin Hash'}</span>
                        </button>
                      </div>
                      <div className="font-mono text-emerald-300 text-xs sm:text-sm break-all font-semibold">
                        {existingGenevora.sha256}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                      <div className="p-2.5 rounded-xl bg-neutral-900 border border-neutral-800">
                        <span className="text-neutral-500 block text-[10px]">Ukuran Berkas:</span>
                        <span className="text-white font-medium">{existingGenevora.fileSizeFormatted || '—'}</span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-neutral-900 border border-neutral-800">
                        <span className="text-neutral-500 block text-[10px]">Format:</span>
                        <span className="text-white font-medium">{existingGenevora.fileFormat || 'JPEG/RAW'}</span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-neutral-900 border border-neutral-800">
                        <span className="text-neutral-500 block text-[10px]">Versi Metode:</span>
                        <span className="text-cyan-400 font-mono font-medium">{existingGenevora.methodVersion}</span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-neutral-900 border border-neutral-800">
                        <span className="text-neutral-500 block text-[10px]">Waktu Dibuat:</span>
                        <span className="text-white text-[11px] truncate block">
                          {new Date(existingGenevora.createdAt).toLocaleString('id-ID')}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 rounded-xl bg-neutral-900 border border-dashed border-neutral-700 text-center space-y-1">
                    <p className="text-xs text-neutral-300 font-medium">
                      Belum ada fingerprint GENEVORA tersimpan untuk karya ini.
                    </p>
                    <p className="text-[11px] text-neutral-500">
                      Gunakan salah satu tombol di bawah untuk membentuk fingerprint SHA-256 langsung dari konten byte berkas.
                    </p>
                  </div>
                )}
              </div>

              {/* Form Pembuatan / Pembaruan Fingerprint */}
              <div className="p-4 sm:p-5 rounded-2xl bg-neutral-950/70 border border-neutral-800 space-y-4">
                <h5 className="text-xs font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
                  <Fingerprint className="w-4 h-4 text-cyan-400" />
                  <span>Hitung Fingerprint SHA-256 Baru:</span>
                </h5>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  
                  {/* Opsi 1: Hitung dari Berkas Asli Perangkat */}
                  <label className="p-4 rounded-xl bg-neutral-900 hover:bg-neutral-850 border border-neutral-700/80 hover:border-cyan-500/60 transition cursor-pointer flex flex-col justify-between space-y-2">
                    <div className="flex items-center gap-2 text-cyan-400 font-semibold text-xs">
                      <Upload className="w-4 h-4" />
                      <span>Unggah & Baca Berkas Asli Lokal</span>
                    </div>
                    <p className="text-[11px] text-neutral-400">
                      Membaca seluruh byte berkas dari drive komputer Anda untuk menghitung SHA-256 murni.
                    </p>
                    <span className="text-[10px] text-cyan-400 font-medium pt-1">
                      Klik untuk memilih berkas (.jpg, .png, .raw, .dng)...
                    </span>
                    <input
                      type="file"
                      accept="image/*,.dng,.raw,.arw,.cr3"
                      onChange={handleCalculateFromFile}
                      className="hidden"
                    />
                  </label>

                  {/* Opsi 2: Hitung dari Berkas Media Server */}
                  <div className="p-4 rounded-xl bg-neutral-900 border border-neutral-700/80 flex flex-col justify-between space-y-2">
                    <div className="flex items-center gap-2 text-cyan-400 font-semibold text-xs">
                      <RefreshCw className={`w-4 h-4 ${isHashingFile ? 'animate-spin' : ''}`} />
                      <span>Hitung dari Media Server Tersimpan</span>
                    </div>
                    <p className="text-[11px] text-neutral-400">
                      Mengunduh byte karya yang tersimpan di cloud Supabase dan menghitung SHA-256 byte aktualnya.
                    </p>
                    <button
                      type="button"
                      onClick={handleCalculateFromMediaUrl}
                      disabled={isHashingFile}
                      className="mt-1 px-3 py-1.5 rounded-lg bg-cyan-950 hover:bg-cyan-900 text-cyan-300 border border-cyan-800 text-xs font-semibold transition cursor-pointer self-start"
                    >
                      {isHashingFile ? 'Sedang Membaca Byte...' : 'Unduh & Hitung Hash'}
                    </button>
                  </div>

                </div>

                {hashingError && (
                  <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-800/60 text-rose-300 text-xs flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                    <span>{hashingError}</span>
                  </div>
                )}

                {/* Hasil Perhitungan Baru yang Siap Disimpan */}
                {calculatedSha256 && (
                  <div className="p-4 rounded-xl bg-cyan-950/20 border border-cyan-500/50 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-cyan-300">
                        Hasil SHA-256 Terhitung:
                      </span>
                      <span className="text-[10px] text-neutral-400 font-mono">
                        {computedFileMeta?.sizeFormatted} • {computedFileMeta?.fileFormat}
                      </span>
                    </div>

                    <div className="font-mono text-xs sm:text-sm text-cyan-200 bg-black/60 p-3 rounded-xl border border-cyan-900/60 break-all">
                      {calculatedSha256}
                    </div>

                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={handleSaveGenevoraFingerprint}
                        className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shadow"
                      >
                        <Check className="w-4 h-4" />
                        <span>Simpan Fingerprint Ini ke Sistem & Supabase</span>
                      </button>
                    </div>
                  </div>
                )}

              </div>

              {/* Pemeriksaan Ulang (Re-verification) */}
              {existingGenevora && (
                <div className="p-4 sm:p-5 rounded-2xl bg-neutral-950/70 border border-neutral-800 space-y-4">
                  <h5 className="text-xs font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
                    <RefreshCw className="w-4 h-4 text-cyan-400" />
                    <span>Pemeriksaan Ulang File (Re-verification):</span>
                  </h5>
                  <p className="text-xs text-neutral-400">
                    Uji apakah berkas yang Anda miliki atau berkas di server masih 100% identik byte-per-byte dengan fingerprint tersimpan.
                  </p>

                  <div className="flex flex-wrap gap-3">
                    <label className="px-3.5 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-xs font-medium text-white flex items-center gap-2 transition cursor-pointer">
                      <Upload className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Uji File dari Perangkat</span>
                      <input
                        type="file"
                        accept="image/*,.dng,.raw,.arw,.cr3"
                        onChange={handleReverifyUpload}
                        className="hidden"
                      />
                    </label>

                    <button
                      type="button"
                      onClick={handleReverifyCurrentMedia}
                      disabled={isReverifying}
                      className="px-3.5 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-xs font-medium text-white flex items-center gap-2 transition cursor-pointer"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 text-cyan-400 ${isReverifying ? 'animate-spin' : ''}`} />
                      <span>Uji Ulang File Media Server</span>
                    </button>
                  </div>

                  {recheckError && (
                    <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-800/60 text-rose-300 text-xs">
                      {recheckError}
                    </div>
                  )}

                  {/* Hasil Pemeriksaan Ulang */}
                  {recheckStatus && (
                    <div className={`p-4 rounded-xl border space-y-2 ${
                      recheckStatus === 'FILE IDENTIK BERDASARKAN SHA-256'
                        ? 'bg-emerald-950/30 border-emerald-500/60 text-emerald-200'
                        : 'bg-rose-950/30 border-rose-500/60 text-rose-200'
                    }`}>
                      <div className="flex items-center gap-2 font-bold text-xs sm:text-sm">
                        {recheckStatus === 'FILE IDENTIK BERDASARKAN SHA-256' ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        ) : (
                          <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                        )}
                        <span>{recheckStatus}</span>
                      </div>
                      <p className="text-[11px] opacity-90 leading-relaxed">
                        {recheckStatus === 'FILE IDENTIK BERDASARKAN SHA-256' 
                          ? 'Setiap byte berkas yang diuji cocok sempurna dengan fingerprint kriptografis tersimpan.'
                          : 'Hash SHA-256 berkas yang diuji tidak sama persis dengan hash tersimpan. Periksa apakah terdapat kompresi, resizing, atau penggantian berkas.'}
                      </p>
                    </div>
                  )}
                </div>
              )}

            </div>
          )}

          {/* --------------------------------------------------------------- */}
          {/* TAB 4: HUMANGUARD (TITIK INTEGRASI PENINJAUAN MANUSIA)           */}
          {/* --------------------------------------------------------------- */}
          {activeTab === 'humanguard' && (
            <div className="space-y-6">
              <div className="p-4 sm:p-5 rounded-2xl bg-neutral-950 border border-neutral-800 space-y-2">
                <div className="flex items-center gap-2 text-purple-400">
                  <UserCheck className="w-5 h-5" />
                  <h4 className="text-base font-bold text-white">
                    HUMANGUARD — Titik Integrasi Peninjauan Kurator Manusia
                  </h4>
                </div>
                <p className="text-xs text-neutral-400 leading-relaxed">
                  HUMANGUARD menjembatani hasil pemeriksaan awal VGUARD dengan dewan kurator dan pakar forensik manusia.
                  Sistem tidak berpura-pura bahwa peninjauan manusia sudah selesai sebelum evaluasi nyata dilakukan.
                </p>
              </div>

              <div className="p-4 sm:p-6 rounded-2xl bg-neutral-950/70 border border-neutral-800 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                    Status Antrean Peninjauan:
                  </span>
                  <span className={`px-2.5 py-1 rounded-xl text-xs font-mono font-bold border ${
                    pipelineState?.humanguard.isReady
                      ? 'bg-amber-950 text-amber-300 border-amber-800/60'
                      : 'bg-neutral-900 text-neutral-400 border-neutral-800'
                  }`}>
                    {pipelineState?.humanguard.status}
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-neutral-900 border border-neutral-800 space-y-2 text-xs">
                  <div className="text-neutral-400 font-semibold">Catatan Integrasi:</div>
                  <p className="text-neutral-300 leading-relaxed">
                    {pipelineState?.humanguard.notes}
                  </p>
                </div>

                {pipelineState?.vguard?.humanGuardHandOff?.isHandedOff && (
                  <div className="p-3.5 rounded-xl bg-purple-950/30 border border-purple-800/50 space-y-1.5 text-xs">
                    <div className="text-purple-300 font-bold flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      <span>Eskalasi Tercatat Pada:</span>
                    </div>
                    <div className="text-neutral-300">
                      {new Date(pipelineState.vguard.humanGuardHandOff.handedOffAt || '').toLocaleString('id-ID')}
                    </div>
                    <div className="text-[11px] text-neutral-400">
                      Peran Peninjau: <strong>{pipelineState.vguard.humanGuardHandOff.assignedReviewerRole}</strong>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* --------------------------------------------------------------- */}
          {/* TAB 5 & 6: HAPPY & BEAUTY (PARAMETER TETAP TERKUNCI)             */}
          {/* --------------------------------------------------------------- */}
          {(activeTab === 'happy' || activeTab === 'beauty') && (
            <div className="space-y-4">
              <div className="p-5 rounded-2xl bg-neutral-950 border border-neutral-800 space-y-3">
                <div className="flex items-center gap-2 text-amber-400">
                  <Lock className="w-5 h-5" />
                  <h4 className="text-base font-bold text-white">
                    Modul {activeTab.toUpperCase()} — Parameter Tetap Terkunci
                  </h4>
                </div>
                <p className="text-xs text-neutral-300 leading-relaxed">
                  Sesuai batasan arsitektur Veroia Enterprise yang telah ditetapkan:
                </p>
                <div className="p-3.5 rounded-xl bg-neutral-900 border border-neutral-800 text-xs text-neutral-400 space-y-1">
                  <div>• Rumus maupun parameter modul <strong>{activeTab.toUpperCase()}</strong> tidak diubah.</div>
                  <div>• Tidak ada kalkulasi ulang spekulatif pada modul ini selama fase integrasi VGUARD & GENEVORA.</div>
                  <div>• Nilai parameter tetap mengacu pada konstanta kalibrasi kuratorial resmi platform.</div>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* =================================================================== */}
        {/* MODAL FOOTER DENGAN NAVIGASI & CLOSE                                */}
        {/* =================================================================== */}
        <div className="px-4 sm:px-6 py-3 bg-neutral-950 border-t border-neutral-800 flex items-center justify-between gap-3 shrink-0">
          <div className="text-[11px] text-neutral-500 truncate">
            Veroia Enterprise Processor • Standar Integritas C2PA & SHA-256
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-semibold transition cursor-pointer"
          >
            Selesai / Tutup
          </button>
        </div>

        {/* Toast Notification Inside Modal */}
        {toastMessage && (
          <div className="absolute bottom-16 right-4 sm:right-6 z-50 px-4 py-2.5 rounded-xl bg-neutral-900 border border-cyan-500/80 shadow-2xl text-white text-xs font-sans flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{toastMessage}</span>
          </div>
        )}

      </div>
    </div>
  );
};
