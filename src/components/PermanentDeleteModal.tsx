import React, { useState } from 'react';
import { AlertTriangle, X, Loader2, Trash2, ShieldAlert } from 'lucide-react';
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
  const [deletionError, setDeletionError] = useState<string | null>(null);

  if (!isOpen || !artwork) return null;

  // Tombol hapus HANYA aktif jika pengguna mengetik kata 'HAPUS' dengan benar
  const isKeywordValid = confirmInput.trim() === 'HAPUS';

  const handleExecuteDestruction = async () => {
    if (!isKeywordValid || isDeleting) return;

    setIsDeleting(true);
    setDeletionError(null);
    setDeletionStep('Menghapus berkas gambar dari penyimpanan cloud...');

    try {
      await new Promise((r) => setTimeout(r, 350));
      setDeletionStep('Menghapus data karya dari basis data dan galeri publik...');

      await destroyArtworkPermanentlyZeroTrace({
        id: artwork.id,
        title: artwork.title,
        digest: artwork.digest,
        cloudBucket: artwork.cloudBucket,
        cloudPath: artwork.cloudPath,
        cloudStorageUrl: artwork.cloudStorageUrl,
        photoUrl: artwork.photoUrl,
        curationNumber: artwork.curationNumber
      });

      setDeletionStep('Menghapus seluruh salinan data dari perangkat dan brankas...');
      await new Promise((r) => setTimeout(r, 300));

      setDeletionStep('Penghapusan selesai bersih tanpa sisa jejak.');
      await new Promise((r) => setTimeout(r, 250));

      onDeleted(artwork.id);
      handleClose();
    } catch (err: any) {
      console.error('Destruction error:', err);
      setDeletionError(err?.message || 'Penghapusan gagal. Karya belum dipastikan hilang dari katalog cloud.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleClose = () => {
    if (isDeleting) return;
    setConfirmInput('');
    setDeletionStep('');
    setDeletionError(null);
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
              <Trash2 className="w-5 h-5 text-rose-400" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-rose-400 uppercase tracking-wider">
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>Konfirmasi Penghapusan Permanen</span>
              </div>
              <h3 className="text-base font-bold text-white mt-0.5 tracking-tight">
                Hapus Gambar Dari Seluruh Sistem
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

        {/* Kotak Peringatan Konfirmasi Wajib */}
        <div className="p-4 rounded-2xl bg-rose-950/40 border-2 border-rose-500/60 text-white space-y-2">
          <div className="flex items-center gap-2 text-rose-400 font-bold text-sm">
            <AlertTriangle className="w-5 h-5 shrink-0 text-rose-400" />
            <span>Peringatan Penting:</span>
          </div>
          <p className="text-sm leading-relaxed text-slate-100">
            Gambar ini akan dihapus secara permanen dan TIDAK BISA dikembalikan lagi. Untuk mengonfirmasi, ketik: <strong className="font-bold text-rose-400 underline tracking-wider">HAPUS</strong>
          </p>
        </div>

        {/* Preview of Target Artwork */}
        <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex items-center gap-3.5">
          <div className="w-16 h-16 rounded-xl bg-slate-900 overflow-hidden shrink-0 border border-slate-800">
            <img
              src={artwork.photoUrl}
              alt={artwork.title}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.style.opacity = '0.3';
              }}
            />
          </div>
          <div className="space-y-1 flex-1 min-w-0">
            <h4 className="text-sm font-bold text-white truncate" title={artwork.title}>
              {artwork.title}
            </h4>
            <div className="text-xs text-slate-400 space-y-0.5">
              <div className="text-slate-400 truncate">
                File berkas gambar asli & seluruh salinan
              </div>
              <div className="text-slate-500 text-[11px]">
                Status: Akan dihapus bersih tanpa jejak
              </div>
            </div>
          </div>
        </div>

        {/* Input Konfirmasi: pengguna harus mengetik HAPUS */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-300 block">
            Ketik kata <span className="text-rose-400 font-bold underline">HAPUS</span> untuk mengonfirmasi:
          </label>
          <input
            type="text"
            value={confirmInput}
            onChange={(e) => setConfirmInput(e.target.value)}
            disabled={isDeleting}
            placeholder="Ketik HAPUS di sini..."
            className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-600 text-sm font-bold focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition"
            autoFocus
          />
        </div>

        {/* Indikator proses penghapusan */}
        {isDeleting && (
          <div className="p-3 rounded-xl bg-slate-950 border border-cyan-500/30 flex items-center gap-3 text-xs text-cyan-300 animate-in fade-in">
            <Loader2 className="w-4 h-4 animate-spin text-cyan-400 shrink-0" />
            <span className="truncate">{deletionStep}</span>
          </div>
        )}
        {deletionError && (
          <div role="alert" className="p-3 rounded-xl bg-rose-950/50 border border-rose-500/40 text-xs text-rose-200">
            {deletionError}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5 pt-2 border-t border-slate-800">
          <button
            type="button"
            onClick={handleClose}
            disabled={isDeleting}
            className="px-4 py-2.5 rounded-xl text-xs font-medium text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-700 transition cursor-pointer disabled:opacity-50 text-center"
          >
            Batal
          </button>

          <button
            type="button"
            onClick={handleExecuteDestruction}
            disabled={!isKeywordValid || isDeleting}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition shadow-lg ${
              isKeywordValid && !isDeleting
                ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-950/80 cursor-pointer ring-2 ring-rose-500/50'
                : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed opacity-50'
            }`}
          >
            {isDeleting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Menghapus Bersih...</span>
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4" />
                <span>Hapus Gambar Permanen</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};
