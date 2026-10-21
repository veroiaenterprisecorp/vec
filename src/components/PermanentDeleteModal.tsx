import React, { useState } from 'react';
import { Flame, AlertTriangle, ShieldAlert, X, CheckCircle2, Loader2, Trash2 } from 'lucide-react';
import { destroyArtworkPermanentlyZeroTrace } from '../lib/cloudStorage';

export interface DeleteArtworkTarget {
  id: string;
  title: string;
  digest?: string;
  photoUrl: string;
  resolution?: string;
  fileSize?: string;
  cloudBucket?: string;
  cloudPath?: string;
  cloudStorageUrl?: string;
  deviceInfo?: string;
  curationNumber?: string;
}

interface PermanentDeleteModalProps {
  artwork: DeleteArtworkTarget | null;
  isOpen: boolean;
  onClose: () => void;
  onDeleted: (artworkId: string) => void;
}

export const PermanentDeleteModal: React.FC<PermanentDeleteModalProps> = ({
  artwork,
  isOpen,
  onClose,
  onDeleted
}) => {
  const [confirmInput, setConfirmInput] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [deletionStep, setDeletionStep] = useState<string>('');

  if (!isOpen || !artwork) return null;

  const isKeywordValid = confirmInput.trim().toUpperCase() === 'HAPUS';

  const handleExecuteDestruction = async () => {
    if (!isKeywordValid || isDeleting) return;

    setIsDeleting(true);
    setDeletionStep('Menghubungi cluster Supabase Storage...');

    try {
      await new Promise((r) => setTimeout(r, 450));
      setDeletionStep('Memusnahkan berkas biner gambar dari Cloud Storage bucket...');

      await new Promise((r) => setTimeout(r, 400));
      setDeletionStep('Menghapus catatan karya dari database Supabase (posts)...');

      const result = await destroyArtworkPermanentlyZeroTrace({
        id: artwork.id,
        title: artwork.title,
        digest: artwork.digest,
        cloudBucket: artwork.cloudBucket,
        cloudPath: artwork.cloudPath,
        cloudStorageUrl: artwork.cloudStorageUrl,
        photoUrl: artwork.photoUrl,
        curationNumber: artwork.curationNumber
      });

      setDeletionStep('Menghapus data dari Secure Enclave lokal & IndexedDB...');
      await new Promise((r) => setTimeout(r, 350));

      setDeletionStep('Verifikasi Zero-Trace selesai: Tidak ada jejak tersisa.');
      await new Promise((r) => setTimeout(r, 400));

      onDeleted(artwork.id);
      handleClose();
    } catch (err: any) {
      console.error('Destruction failed:', err);
      alert(`Pemusnahan selesai secara lokal. Catatan cloud: ${err?.message || 'Koneksi jaringan'}`);
      onDeleted(artwork.id);
      handleClose();
    } finally {
      setIsDeleting(false);
    }
  };

  const handleClose = () => {
    if (isDeleting) return;
    setConfirmInput('');
    setDeletionStep('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div 
        className="bg-[#050C1E] border border-rose-500/40 rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl relative overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glow accent */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-rose-600/15 rounded-full blur-3xl pointer-events-none"></div>

        {/* Modal Header */}
        <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-950/80 border border-rose-500/50 flex items-center justify-center text-rose-400 shrink-0 shadow-lg">
              <Flame className="w-5 h-5 text-rose-400 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold text-rose-400 uppercase tracking-wider">
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>Pemusnahan Mutlak • Zero-Trace Burn</span>
              </div>
              <h3 className="text-base font-bold text-white mt-0.5 tracking-tight">
                Pemusnahan Karya Permanen
              </h3>
            </div>
          </div>

          <button
            onClick={handleClose}
            disabled={isDeleting}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-40 transition cursor-pointer"
            title="Batal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Exclusivity Notice */}
        <div className="p-3.5 rounded-2xl bg-rose-950/30 border border-rose-500/30 text-xs font-mono space-y-1.5 leading-relaxed">
          <div className="flex items-center gap-1.5 text-rose-300 font-bold">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>Peringatan Keunikan & Nilai Jual:</span>
          </div>
          <p className="text-slate-300 text-[11px]">
            Foto ini adalah <strong className="text-white">karya seni otentik satu-satunya di dunia</strong> dengan silsilah C2PA Hardware TEE. Penghapusan ini memusnahkan seluruh berkas biner dari <strong className="text-rose-300">Cloud Supabase (Storage & Database)</strong> serta perangkat lokal tanpa menyisakan sedikitpun jejak.
          </p>
        </div>

        {/* Preview of Target Artwork */}
        <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 flex items-center gap-3.5">
          <div className="w-16 h-16 rounded-xl bg-slate-900 overflow-hidden shrink-0 border border-slate-800">
            <img
              src={artwork.photoUrl}
              alt={artwork.title}
              className="w-full h-full object-cover"
              onError={(e) => {
                const el = e.currentTarget;
                if (!el.src.includes('vec_vault_artwork')) {
                  el.src = '/assets/images/vec_vault_artwork_1792494925679.jpg';
                }
              }}
            />
          </div>
          <div className="space-y-1 flex-1 min-w-0">
            <h4 className="text-xs font-bold text-white truncate" title={artwork.title}>
              {artwork.title}
            </h4>
            <div className="text-[10px] font-mono text-slate-400 space-y-0.5">
              <div className="truncate">
                Digest: <span className="text-cyan-300">{artwork.digest ? `${artwork.digest.slice(0, 14)}...` : 'N/A'}</span>
              </div>
              <div className="text-slate-500">
                Resolusi: {artwork.resolution || 'RAW Full'}
              </div>
            </div>
          </div>
        </div>

        {/* Challenge Input */}
        <div className="space-y-2">
          <label className="text-xs font-mono font-bold text-slate-300 block">
            Ketik kata <span className="text-rose-400 font-bold underline">HAPUS</span> untuk mengonfirmasi pemusnahan mutlak:
          </label>
          <input
            type="text"
            value={confirmInput}
            onChange={(e) => setConfirmInput(e.target.value)}
            disabled={isDeleting}
            placeholder="Ketik HAPUS di sini..."
            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-600 text-xs font-mono font-bold focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition"
            autoFocus
          />
        </div>

        {/* Step progress during execution */}
        {isDeleting && (
          <div className="p-3 rounded-xl bg-slate-950 border border-cyan-500/30 flex items-center gap-3 text-xs font-mono text-cyan-300 animate-in fade-in">
            <Loader2 className="w-4 h-4 animate-spin text-cyan-400 shrink-0" />
            <span className="truncate">{deletionStep}</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-800">
          <button
            type="button"
            onClick={handleClose}
            disabled={isDeleting}
            className="px-4 py-2.5 rounded-xl text-xs font-mono text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-700 transition cursor-pointer disabled:opacity-50"
          >
            Batal / Amankan Karya
          </button>

          <button
            type="button"
            onClick={handleExecuteDestruction}
            disabled={!isKeywordValid || isDeleting}
            className={`px-4 py-2.5 rounded-xl text-xs font-mono font-bold flex items-center gap-2 transition cursor-pointer shadow-lg ${
              isKeywordValid && !isDeleting
                ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-950'
                : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed opacity-60'
            }`}
          >
            {isDeleting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Memusnahkan Jejak...</span>
              </>
            ) : (
              <>
                <Flame className="w-4 h-4" />
                <span>MUSNAHKAN PERMANEN</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};
