import React, { useState } from 'react';
import { 
  KeyRound, 
  Lock, 
  Unlock, 
  ShieldCheck, 
  AlertTriangle, 
  X, 
  Sparkles, 
  ArrowRight,
  PlusCircle,
  Clock
} from 'lucide-react';
import { 
  unlockVaultWithKey, 
  getCachedRegisteredVaults, 
  CreatorVault 
} from '../lib/vaultKeyAuth';

interface VaultKeyUnlockModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUnlockSuccess?: (vault: CreatorVault) => void;
  onRequestRegisterNew?: () => void;
  customTitle?: string;
  customDescription?: string;
}

export const VaultKeyUnlockModal: React.FC<VaultKeyUnlockModalProps> = ({
  isOpen,
  onClose,
  onUnlockSuccess,
  onRequestRegisterNew,
  customTitle,
  customDescription
}) => {
  const [keyInput, setKeyInput] = useState<string>('');
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleUnlock = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMsg(null);

    if (!keyInput.trim()) {
      setErrorMsg('Silakan masukkan Kunci Brankas Anda.');
      return;
    }

    setIsVerifying(true);
    try {
      const res = await unlockVaultWithKey(keyInput.trim());
      if (res.success && res.vault) {
        if (onUnlockSuccess) onUnlockSuccess(res.vault);
        onClose();
      } else {
        setErrorMsg(res.message || 'Kunci Brankas tidak valid.');
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Gagal memverifikasi kunci brankas.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handlePasteKey = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) setKeyInput(text.trim());
    } catch {
      // clipboard permission denied
    }
  };

  const registeredVaults = getCachedRegisteredVaults();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-md bg-gradient-to-b from-[#09111e] to-[#03060d] border border-cyan-500/30 rounded-2xl shadow-2xl shadow-cyan-950/50 overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Bar */}
        <div className="p-4 border-b border-neutral-800 bg-neutral-900/60 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <KeyRound className="w-4 h-4" />
            </div>
            <h3 className="text-sm sm:text-base font-bold text-white tracking-wide">
              {customTitle || 'Buka Kunci Brankas Karya'}
            </h3>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4 text-neutral-200">
          <p className="text-xs text-neutral-300 leading-relaxed">
            {customDescription || 'Masukkan Kunci Kriptografis Brankas Anda untuk mengakses karya pribadi atau menyimpan jepretan kamera langsung ke brankas.'}
          </p>

          {errorMsg && (
            <div className="p-3 rounded-xl bg-red-950/60 border border-red-500/40 text-red-200 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleUnlock} className="space-y-3">
            <div>
              <div className="flex items-center justify-between text-xs font-semibold text-neutral-300 mb-1.5">
                <span>Kunci Brankas (VEC-VK-...)</span>
                <button
                  type="button"
                  onClick={handlePasteKey}
                  className="text-cyan-400 hover:text-cyan-300 font-mono text-[11px]"
                >
                  Tempel dari Clipboard
                </button>
              </div>

              <div className="relative">
                <input
                  type="text"
                  required
                  placeholder="VEC-VK-XXXX-XXXX-XXXX-XXXX"
                  value={keyInput}
                  onChange={(e) => setKeyInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-black/90 border border-neutral-700 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 rounded-xl font-mono text-sm tracking-wider text-cyan-200 placeholder:text-neutral-600 focus:outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isVerifying}
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs tracking-wide shadow flex items-center justify-center gap-2 transition disabled:opacity-50 cursor-pointer"
            >
              {isVerifying ? (
                <>
                  <Sparkles className="w-3.5 h-3.5 animate-spin" />
                  <span>Memverifikasi Hash Kriptografis...</span>
                </>
              ) : (
                <>
                  <Unlock className="w-3.5 h-3.5" />
                  <span>Buka Kunci Brankas</span>
                </>
              )}
            </button>
          </form>

          {/* Quick Register Link */}
          <div className="pt-3 border-t border-neutral-800/80 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs">
            <span className="text-neutral-400">Belum memiliki Kunci Brankas?</span>
            <button
              type="button"
              onClick={() => {
                onClose();
                if (onRequestRegisterNew) onRequestRegisterNew();
              }}
              className="inline-flex items-center gap-1.5 text-cyan-400 hover:text-cyan-300 font-semibold cursor-pointer"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Daftar Brankas Baru</span>
            </button>
          </div>

          {/* Optional: Registered Vaults on device */}
          {registeredVaults.length > 0 && (
            <div className="pt-2 text-[11px] text-neutral-400">
              <span className="block font-semibold text-neutral-400 mb-1">Brankas Terdaftar di Perangkat Ini:</span>
              <div className="space-y-1 max-h-24 overflow-y-auto">
                {registeredVaults.map((v) => (
                  <div 
                    key={v.id} 
                    className="p-1.5 rounded bg-neutral-900/60 border border-neutral-800 flex items-center justify-between text-neutral-300"
                  >
                    <span className="truncate">{v.vault_name} ({v.creator_name})</span>
                    <span className="font-mono text-[10px] text-cyan-400 shrink-0 ml-2">{v.key_prefix}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
