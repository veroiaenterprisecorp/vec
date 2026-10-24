import React, { useState } from 'react';
import { 
  ShieldCheck, 
  KeyRound, 
  Lock, 
  Copy, 
  Check, 
  Download, 
  Sparkles, 
  X, 
  AlertTriangle, 
  ShieldAlert,
  ArrowRight,
  User,
  Mail,
  Fingerprint,
  Send,
  ExternalLink,
  FileText,
  CheckCircle2
} from 'lucide-react';
import { 
  registerNewCreatorVault, 
  CreatorVault 
} from '../lib/vaultKeyAuth';

interface VaultRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRegisteredSuccess?: (vault: CreatorVault, rawKey: string) => void;
}

export const VaultRegistrationModal: React.FC<VaultRegistrationModalProps> = ({
  isOpen,
  onClose,
  onRegisteredSuccess
}) => {
  const [step, setStep] = useState<'form' | 'certificate'>('form');
  const [creatorName, setCreatorName] = useState<string>('');
  const [creatorHandle, setCreatorHandle] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [vaultName, setVaultName] = useState<string>('');
  const [securityLevel, setSecurityLevel] = useState<'HARDWARE_ENCLAVE_256' | 'MILITARY_C2PA' | 'QUANTUM_RESISTANT'>('HARDWARE_ENCLAVE_256');
  
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  // Certificate states
  const [generatedKey, setGeneratedKey] = useState<string>('');
  const [createdVault, setCreatedVault] = useState<CreatorVault | null>(null);
  const [copiedKey, setCopiedKey] = useState<boolean>(false);
  const [copiedEmailText, setCopiedEmailText] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!creatorName.trim()) {
      setErrorMsg('Nama Lengkap Kreator wajib diisi.');
      return;
    }
    if (!creatorHandle.trim()) {
      setErrorMsg('Username/Handle seniman wajib diisi.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setErrorMsg('Alamat email valid wajib diisi.');
      return;
    }
    if (!vaultName.trim()) {
      setErrorMsg('Nama Brankas Karya wajib diisi.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await registerNewCreatorVault({
        creatorName,
        creatorHandle,
        email,
        vaultName,
        securityLevel
      });

      setGeneratedKey(res.rawKey);
      setCreatedVault(res.vault);
      setStep('certificate');
    } catch (err: any) {
      setErrorMsg(err?.message || 'Gagal mendaftarkan brankas baru.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyKey = () => {
    if (!generatedKey) return;
    navigator.clipboard.writeText(generatedKey);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const getEmailContentText = () => {
    if (!createdVault || !generatedKey) return '';
    return `Yth. ${createdVault.creator_name} (@${createdVault.creator_handle}),

Selamat! Pendaftaran Brankas Karya Resmi Anda di Veroia Enterprise Corp (VEC) telah berhasil diproses.

DATA PENDAFTARAN RESMI:
- Nama Seniman / Kreator : ${createdVault.creator_name}
- Username / Handle     : @${createdVault.creator_handle}
- Alamat Email          : ${createdVault.email}
- Nama Brankas          : ${createdVault.vault_name}
- ID Brankas (UUID)     : ${createdVault.id}
- Tingkat Enklave       : ${createdVault.security_level}
- Ruang Kontrol Admin   : Terkoneksi & Aktif di Konsol Vecmaster
- Waktu Diterbitkan     : ${createdVault.created_at}

=====================================================================
KUNCI RAHASIA AKSES BRANKAS KARYA (ZERO-KNOWLEDGE VAULT KEY):
${generatedKey}
=====================================================================

PETUNJUK PENGGUNAAN & KEAMANAN:
1. Kunci di atas digunakan untuk membuka Brankas Koleksi Pribadi Anda di website resmi Veroia Enterprise Corp.
2. Setiap foto karya yang Anda ambil di Studio Foto dapat Anda simpan secara aman di brankas ini, atau Anda terbitkan ke Katalog Karya publik.
3. Kunci ini dilindungi dengan enkripsi SHA-256 + salt unik. Basis data VEC tidak pernah menyimpan kunci dalam teks biasa.
4. Demi keamanan hak cipta Anda, jaga kerahasiaan kunci ini. Jika hilang, brankas tidak dapat dipulihkan demi menjaga integritas karya.

Hormat kami,
Divisi Keamanan Kriptografi & Kurasi
Veroia Enterprise Corp (VEC)`;
  };

  const handleOpenEmailClient = () => {
    if (!createdVault || !generatedKey) return;
    const subject = `[VEC SECURITY] Sertifikat Kunci Brankas Resmi: ${createdVault.vault_name}`;
    const body = getEmailContentText();
    const mailtoUrl = `mailto:${encodeURIComponent(createdVault.email)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailtoUrl;
  };

  const handleCopyEmailText = () => {
    const text = getEmailContentText();
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedEmailText(true);
    setTimeout(() => setCopiedEmailText(false), 2000);
  };

  const handleDownloadEmailHtml = () => {
    if (!createdVault || !generatedKey) return;
    const htmlContent = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>Konfirmasi Pendaftaran Brankas - Veroia Enterprise Corp</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #020409; color: #e2e8f0; margin: 0; padding: 32px 16px; }
    .container { max-width: 640px; margin: 0 auto; background: #070d18; border: 1px solid #0891b2; border-radius: 16px; overflow: hidden; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.7); }
    .header { background: linear-gradient(180deg, #0f172a 0%, #070d18 100%); padding: 32px 24px; text-align: center; border-bottom: 1px solid #1e293b; }
    .badge { display: inline-block; padding: 4px 12px; border-radius: 9999px; background: rgba(6,182,212,0.15); color: #22d3ee; font-size: 11px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; border: 1px solid rgba(6,182,212,0.3); margin-bottom: 12px; }
    h1 { margin: 0 0 8px 0; font-size: 22px; color: #ffffff; }
    .subtitle { color: #94a3b8; font-size: 13px; margin: 0; }
    .content { padding: 32px 24px; line-height: 1.6; font-size: 14px; }
    .table-data { width: 100%; border-collapse: collapse; margin: 20px 0; background: #020617; border-radius: 8px; overflow: hidden; border: 1px solid #1e293b; }
    .table-data td { padding: 10px 14px; font-size: 13px; border-bottom: 1px solid #1e293b; }
    .table-data td.label { color: #94a3b8; width: 38%; font-weight: 600; }
    .table-data td.val { color: #f8fafc; font-family: monospace; }
    .key-box { background: #000000; border: 2px dashed #06b6d4; border-radius: 12px; padding: 20px; text-align: center; margin: 24px 0; }
    .key-label { font-size: 11px; font-family: monospace; color: #22d3ee; letter-spacing: 0.05em; margin-bottom: 8px; text-transform: uppercase; }
    .key-value { font-family: monospace; font-size: 20px; font-weight: 900; color: #67e8f9; letter-spacing: 0.1em; word-break: break-all; }
    .alert-box { background: rgba(245, 158, 11, 0.1); border: 1px solid rgba(245, 158, 11, 0.3); border-radius: 8px; padding: 14px; font-size: 12px; color: #fde68a; margin-top: 24px; }
    .footer { background: #020409; padding: 20px 24px; text-align: center; font-size: 11px; color: #64748b; border-top: 1px solid #1e293b; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="badge">KONFIRMASI RESMI PENDAFTARAN</div>
      <h1>Veroia Enterprise Corp</h1>
      <p class="subtitle">Sertifikat Hak Akses & Kunci Kriptografis Brankas Karya</p>
    </div>
    <div class="content">
      <p>Yth. <strong>${createdVault.creator_name}</strong>,</p>
      <p>Pendaftaran akun brankas karya Anda telah berhasil diproses dan terhubung ke Ruang Kontrol Admin serta sistem katalog terenkripsi kami.</p>
      
      <table class="table-data">
        <tr><td class="label">Pemilik</td><td class="val">${createdVault.creator_name} (@${createdVault.creator_handle})</td></tr>
        <tr><td class="label">Email Pendaftar</td><td class="val">${createdVault.email}</td></tr>
        <tr><td class="label">Nama Brankas</td><td class="val">${createdVault.vault_name}</td></tr>
        <tr><td class="label">ID Brankas (UUID)</td><td class="val">${createdVault.id}</td></tr>
        <tr><td class="label">Enklave Keamanan</td><td class="val">${createdVault.security_level}</td></tr>
        <tr><td class="label">Waktu Diterbitkan</td><td class="val">${createdVault.created_at}</td></tr>
        <tr><td class="label">Status Ruang Admin</td><td class="val" style="color: #34d399;">TERHUBUNG & AKTIF</td></tr>
      </table>

      <div class="key-box">
        <div class="key-label">KUNCI AKSES BRANKAS PRIBADI (ZERO-KNOWLEDGE):</div>
        <div class="key-value">${generatedKey}</div>
      </div>

      <div class="alert-box">
        <strong>PENTING:</strong> Kunci kriptografis ini tidak pernah disimpan dalam teks biasa di server VEC demi melindungi hak cipta dan privasi Anda. Simpan berkas ini dengan aman.
      </div>
    </div>
    <div class="footer">
      &copy; 2026 Veroia Enterprise Corp (VEC) · Sistem Keamanan Seni Terenkripsi
    </div>
  </div>
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Surat_Konfirmasi_Email_VEC_${createdVault.creator_handle.replace('@', '')}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadKeyFile = () => {
    if (!generatedKey || !createdVault) return;
    const content = `=====================================================================
VEROIA ENTERPRISE CORP (VEC) - SERTIFIKAT KUNCI BRANKAS KARYA
=====================================================================
Pemilik / Kreator : ${createdVault.creator_name} (${createdVault.creator_handle})
Alamat Email       : ${createdVault.email}
Nama Brankas       : ${createdVault.vault_name}
ID Brankas (UUID)  : ${createdVault.id}
Tingkat Keamanan   : ${createdVault.security_level}
Waktu Diterbitkan  : ${createdVault.created_at}

---------------------------------------------------------------------
KUNCI RAHASIA AKSES BRANKAS (PRIVATE CRYPTOGRAPHIC VAULT KEY):
${generatedKey}
---------------------------------------------------------------------

PERINGATAN KEAMANAN TINGGI (ZERO-KNOWLEDGE VAULT):
- Kunci ini di-hash dengan standar SHA-256 dan salt unik.
- Basis data VEC tidak pernah menyimpan kunci dalam teks biasa.
- Jaga kerahasiaan berkas ini. Jika kunci ini hilang, brankas Anda
  tidak dapat dipulihkan oleh pihak mana pun demi menjaga integritas karya.
=====================================================================`;

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `VEC_VAULT_KEY_${createdVault.creator_handle.replace('@', '')}.key`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleFinish = () => {
    if (createdVault && generatedKey && onRegisteredSuccess) {
      onRegisteredSuccess(createdVault, generatedKey);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-xl bg-gradient-to-b from-[#070d18] to-[#02050c] border border-cyan-500/30 rounded-2xl shadow-2xl shadow-cyan-950/50 overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Bar */}
        <div className="p-5 border-b border-neutral-800/80 bg-neutral-900/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white tracking-wide">
                {step === 'form' ? 'Pendaftaran Brankas & Kunci Karya Baru' : 'Sertifikat Kunci Brankas Diterbitkan'}
              </h3>
              <p className="text-xs text-neutral-400">
                {step === 'form' 
                  ? 'Sistem Brankas Terisolasi dengan Enkripsi Kunci Kriptografis Unik'
                  : 'Kunci Anda siap digunakan untuk membuka brankas & studio kamera'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-neutral-200 font-sans">
          
          {step === 'form' ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              {errorMsg && (
                <div className="p-3 rounded-xl bg-red-950/60 border border-red-500/40 text-red-200 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Informational Callout */}
              <div className="p-3.5 rounded-xl bg-cyan-950/30 border border-cyan-500/20 text-xs text-cyan-200/90 leading-relaxed space-y-1">
                <div className="font-semibold text-cyan-300 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-cyan-400" />
                  <span>Arsitektur Keamanan Multi-Tenant Zero-Trust</span>
                </div>
                <p className="text-neutral-300">
                  Setiap pendaftar mendapatkan brankas terisolasi sendiri di basis data. Kunci yang Anda dapatkan memiliki hash terenkripsi dan tidak dapat diakses atau diubah oleh pemegang kunci lain.
                </p>
              </div>

              {/* Form Input: Nama Lengkap */}
              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                  Nama Lengkap Kreator / Seniman
                </label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3 top-3 text-neutral-500" />
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Raden Saleh Kusuma"
                    value={creatorName}
                    onChange={(e) => setCreatorName(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-neutral-950/90 border border-neutral-800 rounded-xl text-sm text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/30"
                  />
                </div>
              </div>

              {/* Form Input: Username / Handle & Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                    Username / Handle
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-neutral-500 text-sm">@</span>
                    <input
                      type="text"
                      required
                      placeholder="raden_art"
                      value={creatorHandle.replace('@', '')}
                      onChange={(e) => setCreatorHandle(e.target.value)}
                      className="w-full pl-8 pr-3 py-2 bg-neutral-950/90 border border-neutral-800 rounded-xl text-sm text-white focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                    Alamat Email Terverifikasi
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3 top-3 text-neutral-500" />
                    <input
                      type="email"
                      required
                      placeholder="raden@seni.id"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-neutral-950/90 border border-neutral-800 rounded-xl text-sm text-white focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>
              </div>

              {/* Form Input: Nama Brankas Karya */}
              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                  Nama Brankas Karya Pribadi
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-3 text-neutral-500" />
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Brankas Mahakarya Maestro Raden"
                    value={vaultName}
                    onChange={(e) => setVaultName(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-neutral-950/90 border border-neutral-800 rounded-xl text-sm text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <span className="text-[11px] text-neutral-400 mt-1 block">
                  Nama ini akan menjadi label identitas resmi karya saat diterbitkan ke Katalog Karya.
                </span>
              </div>

              {/* Pilihan Tingkat Enklave Keamanan */}
              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                  Tingkat Enklave Keamanan Brankas
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {[
                    { id: 'HARDWARE_ENCLAVE_256', name: 'Hardware TEE 256', desc: 'Secure Enclave' },
                    { id: 'MILITARY_C2PA', name: 'Military C2PA', desc: 'Hardware Attested' },
                    { id: 'QUANTUM_RESISTANT', name: 'Quantum Safe', desc: 'Post-Quantum Hash' },
                  ].map((lvl) => (
                    <button
                      type="button"
                      key={lvl.id}
                      onClick={() => setSecurityLevel(lvl.id as any)}
                      className={`p-2.5 rounded-xl border text-left transition ${
                        securityLevel === lvl.id
                          ? 'bg-cyan-500/15 border-cyan-500 text-white shadow-sm'
                          : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:border-neutral-700'
                      }`}
                    >
                      <div className="text-xs font-bold">{lvl.name}</div>
                      <div className="text-[10px] text-neutral-400">{lvl.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-3">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-600 via-cyan-500 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-sm tracking-wide shadow-lg shadow-cyan-900/30 flex items-center justify-center gap-2 transition disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <Sparkles className="w-4 h-4 animate-spin" />
                      <span>Mengenkripsi & Menerbitkan Kunci Brankas...</span>
                    </>
                  ) : (
                    <>
                      <Fingerprint className="w-4 h-4" />
                      <span>Daftar & Terbitkan Kunci Brankas</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>
          ) : (
            /* STEP 2: CERTIFICATE & DISPLAY KEY */
            <div className="space-y-5 animate-in fade-in duration-300">
              
              {/* Gold/Cyan Certificate Header Box */}
              <div className="p-5 rounded-2xl bg-gradient-to-b from-cyan-950/60 to-neutral-950 border border-cyan-500/40 text-center space-y-2 relative overflow-hidden">
                <div className="inline-flex p-3 rounded-full bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 mb-1">
                  <ShieldCheck className="w-7 h-7" />
                </div>
                <div className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-widest">
                  KUNCI RESMI DITERBITKAN
                </div>
                <h4 className="text-lg font-bold text-white">
                  {createdVault?.vault_name}
                </h4>
                <p className="text-xs text-neutral-400">
                  Pemilik: <span className="text-neutral-200 font-semibold">{createdVault?.creator_name}</span> ({createdVault?.creator_handle})
                </p>

                {/* Big Key Display Box */}
                <div className="mt-4 p-4 rounded-xl bg-black/90 border border-cyan-500/50 shadow-inner flex flex-col items-center justify-center gap-2">
                  <span className="text-[11px] font-mono text-cyan-300/80">KUNCI AKSES BRANKAS ANDA (SIMPAN DENGAN AMAN):</span>
                  <div className="font-mono text-lg sm:text-2xl font-black tracking-wider text-cyan-300 selection:bg-cyan-500 selection:text-black select-all">
                    {generatedKey}
                  </div>
                </div>

                {/* Copy & Download Key Actions */}
                <div className="flex flex-wrap items-center justify-center gap-2 mt-3 pt-2">
                  <button
                    onClick={handleCopyKey}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 transition shadow"
                  >
                    {copiedKey ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-white" />
                        <span>Kunci Tersalin!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Salin Kunci</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={handleDownloadKeyFile}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-neutral-900 hover:bg-neutral-800 text-neutral-200 border border-neutral-700 transition shadow"
                  >
                    <Download className="w-3.5 h-3.5 text-neutral-400" />
                    <span>Unduh Cadangan (.key)</span>
                  </button>
                </div>
              </div>

              {/* Live Connectivity: Admin Control Room & Registrant Email */}
              <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-950/40 via-teal-950/30 to-slate-950 border border-emerald-500/40 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      <Mail className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white flex items-center gap-1.5">
                        <span>Konfirmasi Terhubung ke Email Pendaftar</span>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      </div>
                      <div className="text-[11px] text-emerald-300 font-mono">
                        {createdVault?.email}
                      </div>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-mono font-bold uppercase">
                    Terkoneksi
                  </span>
                </div>

                <p className="text-[11px] text-slate-300 leading-relaxed">
                  Pendaftaran ini telah resmi dicatat di <strong>Ruangan Kontrol Admin Vecmaster</strong> (Direktori Pengguna & Log Audit Keamanan). Anda dapat langsung membuka email client atau mengunduh salinan surat digital di bawah ini:
                </p>

                {/* Email Action Buttons */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleOpenEmailClient}
                    className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 text-white shadow transition cursor-pointer"
                    title="Buka aplikasi email pendaftar dengan draft sertifikat resmi"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Kirim ke Email Saya</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleDownloadEmailHtml}
                    className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-cyan-200 border border-cyan-800/60 shadow transition cursor-pointer"
                    title="Unduh surat konfirmasi berformat HTML lengkap"
                  >
                    <FileText className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Unduh Surat (.html)</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleCopyEmailText}
                    className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 shadow transition cursor-pointer"
                    title="Salin seluruh draf isi email ke clipboard"
                  >
                    {copiedEmailText ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Teks Disalin!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Salin Isi Email</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* High Security Warning Notice */}
              <div className="p-3.5 rounded-xl bg-amber-950/30 border border-amber-500/40 text-xs text-amber-200/90 flex items-start gap-3">
                <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <div className="font-semibold text-amber-300">Pemberitahuan Keamanan Tingkat Tinggi</div>
                  <p className="text-neutral-300 leading-relaxed text-[11px]">
                    Kunci ini hanya ditampilkan satu kali ini saja. Basis data Supabase VEC hanya menyimpan hash kriptografis yang telah di-salt sehingga tidak dapat diretas. Jika kunci hilang, brankas tidak dapat dibuka kembali.
                  </p>
                </div>
              </div>

              {/* Finish Button */}
              <button
                onClick={handleFinish}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-sm tracking-wide shadow-lg shadow-emerald-950/40 flex items-center justify-center gap-2 transition cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>Masuk & Buka Brankas Sekarang</span>
              </button>

            </div>
          )}

        </div>
      </div>
    </div>
  );
};
