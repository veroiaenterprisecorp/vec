import React, { useState } from 'react';
import { 
  FLUTTER_PUBSPEC_YAML, 
  FLUTTER_NFC_SERVICE, 
  FLUTTER_CRYPTO_GEO_SERVICE, 
  FLUTTER_CAMERA_SCREEN, 
  FLUTTER_MAIN_DART 
} from '../data/flutterCode';
import { 
  Copy, 
  Check, 
  Download, 
  Smartphone, 
  Camera, 
  Radio, 
  MapPin, 
  FileCode, 
  ShieldAlert, 
  ShieldCheck, 
  Sparkles, 
  RefreshCw,
  Cpu,
  Layers,
  Lock
} from 'lucide-react';

type FlutterFileKey = 'pubspec' | 'nfc' | 'telemetry' | 'camera_ui' | 'main';

export const FlutterAppViewer: React.FC = () => {
  const [activeFile, setActiveFile] = useState<FlutterFileKey>('camera_ui');
  const [copied, setCopied] = useState<boolean>(false);

  // Mobile Device Simulator State
  const [isCapturing, setIsCapturing] = useState<boolean>(false);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [isNfcScanning, setIsNfcScanning] = useState<boolean>(false);
  const [simulatedManifest, setSimulatedManifest] = useState<any | null>(null);
  const [activeHudLog, setActiveHudLog] = useState<string>('Sensor optik terkunci. Mode Hardware-Only Aktif.');

  const filesMap: Record<FlutterFileKey, { label: string; path: string; code: string; desc: string }> = {
    camera_ui: {
      label: 'zero_trust_camera_screen.dart',
      path: 'lib/screens/zero_trust_camera_screen.dart',
      code: FLUTTER_CAMERA_SCREEN,
      desc: 'Modul Kamera Hardware-Bypass: Menolak keras impor dari galeri perangkat lunak untuk menjaga integritas.',
    },
    nfc: {
      label: 'nfc_service.dart',
      path: 'lib/services/nfc_service.dart',
      code: FLUTTER_NFC_SERVICE,
      desc: 'Modul Pembaca Chip Fisik NFC: Membaca UID NXP NTAG424 DNA dan mengekstrak SHA-256 hash untuk sertifikat seni.',
    },
    telemetry: {
      label: 'hardware_telemetry_service.dart',
      path: 'lib/services/hardware_telemetry_service.dart',
      code: FLUTTER_CRYPTO_GEO_SERVICE,
      desc: 'Modul GPS Fisik & Checksum RAW: Deteksi tegas anti-mock location dan kalkulasi SHA-256 streaming.',
    },
    pubspec: {
      label: 'pubspec.yaml',
      path: 'pubspec.yaml',
      code: FLUTTER_PUBSPEC_YAML,
      desc: 'Daftar dependensi Flutter resmi: camera, nfc_manager, geolocator, crypto, permission_handler.',
    },
    main: {
      label: 'main.dart',
      path: 'lib/main.dart',
      code: FLUTTER_MAIN_DART,
      desc: 'Entry point aplikasi Flutter: Menginisialisasi sensor kamera fisik dan meluncurkan ZeroTrustCameraScreen.',
    },
  };

  const currentFile = filesMap[activeFile];

  const handleCopy = () => {
    navigator.clipboard.writeText(currentFile.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const filename = currentFile.path.split('/').pop() || 'flutter_code.dart';
    const blob = new Blob([currentFile.code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Simulate hardware shutter capture
  const handleShutterClick = () => {
    if (isCapturing) return;
    setIsCapturing(true);
    setActiveHudLog('Mengunci eksposur sensor CMOS... Membaca koordinat satelit GNSS...');

    setTimeout(() => {
      setIsCapturing(false);
      setCapturedPhoto('https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=800&q=80');
      
      const checksum = Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
      setSimulatedManifest({
        type: 'PHOTO_CAPTURE',
        latitude: -6.175392,
        longitude: 106.827153,
        accuracy: '2.1m (GNSS L1/L5 Dual Band)',
        isMocked: false,
        rawSha256: checksum,
        fileSize: '42.8 MB (Uncompressed DNG RAW stream)',
        timestamp: new Date().toISOString(),
      });
      setActiveHudLog(`Jepretan Terverifikasi! RAW SHA-256: ${checksum.substring(0, 16)}...`);
    }, 700);
  };

  // Simulate NFC scan
  const handleNfcClick = () => {
    setIsNfcScanning(true);
    setActiveHudLog('Mendengarkan frekuensi NFC 13.56 MHz... Dekatkan chip seni...');

    setTimeout(() => {
      setIsNfcScanning(false);
      const chipUid = '04:A1:B2:C3:D4:E5:F6';
      const nfcHash = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';
      
      setSimulatedManifest({
        type: 'NFC_SCAN',
        chipUid,
        chipUidHash: nfcHash,
        tagType: 'NXP NTAG424 DNA Sun Crypto',
        certificateUrl: 'https://vec.network/verify/cert/e5555555-5555-4555-8555-555555555555',
        timestamp: new Date().toISOString(),
      });
      setActiveHudLog(`NFC Fisik Terbaca! Chip Hash: ${nfcHash.substring(0, 16)}...`);
    }, 800);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-mono text-cyan-400 font-bold uppercase tracking-wider bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800">
                Flutter 3.19+ Mobile Client
              </span>
              <span className="text-slate-500">•</span>
              <span className="text-xs text-slate-400 font-mono">Hardware-Bypass & Physical NFC</span>
            </div>
            <h2 className="text-lg font-bold text-white">
              Arsitektur Aplikasi Mobile VEC Zero-Trust
            </h2>
            <p className="text-xs text-slate-400 max-w-3xl mt-1 leading-relaxed">
              Klien mobile Flutter yang menolak sepenuhnya impor dari galeri (<code className="text-red-400 font-mono">image_picker disabled</code>). Mengakses langsung sensor kamera fisik, mendeteksi fake GPS melalui <code className="text-cyan-300 font-mono">position.isMocked</code>, membaca chip NFC NTAG424 DNA, dan menghitung SHA-256 streaming file RAW.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-medium border transition ${
                copied
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/60'
                  : 'bg-cyan-600 hover:bg-cyan-500 text-white border-cyan-500 shadow'
              }`}
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Tersalin!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Salin File Ini</span>
                </>
              )}
            </button>

            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
              title="Unduh file saat ini"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Unduh</span>
            </button>
          </div>
        </div>

        {/* File Tabs */}
        <div className="flex items-center gap-1.5 mt-4 overflow-x-auto text-xs font-mono border-t border-slate-800/80 pt-3">
          {(Object.keys(filesMap) as FlutterFileKey[]).map((key) => {
            const item = filesMap[key];
            const isActive = activeFile === key;
            return (
              <button
                key={key}
                onClick={() => setActiveFile(key)}
                className={`px-3 py-1.5 rounded-lg border transition whitespace-nowrap flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50 font-bold shadow-sm'
                    : 'bg-slate-950/60 text-slate-400 border-slate-800 hover:bg-slate-900 hover:text-slate-200'
                }`}
              >
                <FileCode className="w-3.5 h-3.5 text-cyan-400" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Grid: Code Inspector (Left) & Mobile Simulator (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Code Viewer */}
        <div className="lg:col-span-7 space-y-2">
          <div className="flex items-center justify-between text-xs font-mono text-slate-400 bg-slate-900 px-3.5 py-2 rounded-t-xl border border-b-0 border-slate-800">
            <span className="font-bold text-slate-200 flex items-center gap-1.5">
              <Smartphone className="w-3.5 h-3.5 text-cyan-400" />
              {currentFile.path}
            </span>
            <span className="text-[11px] text-slate-500">Flutter / Dart</span>
          </div>

          <div className="border border-slate-800 rounded-b-xl bg-slate-950 overflow-hidden shadow-2xl relative">
            <div className="p-3 bg-slate-900/60 border-b border-slate-800 text-xs text-slate-400 flex items-start gap-2">
              <Sparkles className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
              <span>{currentFile.desc}</span>
            </div>
            <pre className="p-4 font-mono text-xs text-slate-300 overflow-x-auto leading-relaxed max-h-[600px]">
              {currentFile.code}
            </pre>
          </div>
        </div>

        {/* Right: Interactive Smartphone Device Simulator */}
        <div className="lg:col-span-5 flex flex-col items-center">
          <div className="w-full max-w-[340px] bg-slate-950 rounded-[42px] border-4 border-slate-700/80 p-3 shadow-2xl shadow-cyan-950/40 relative">
            {/* Phone Screen Bezel */}
            <div className="w-full aspect-[9/19] bg-black rounded-[32px] overflow-hidden relative flex flex-col justify-between border border-slate-800">
              
              {/* Dynamic Island / Notch */}
              <div className="absolute top-2 left-1/2 -translate-x-1/2 w-24 h-5 bg-black rounded-full z-30 flex items-center justify-center gap-1.5 border border-slate-800/80">
                <div className="w-2.5 h-2.5 rounded-full bg-slate-900 border border-slate-700 flex items-center justify-center">
                  <div className="w-1 h-1 rounded-full bg-cyan-400 animate-pulse"></div>
                </div>
                <div className="w-2 h-2 rounded-full bg-slate-800"></div>
              </div>

              {/* Viewfinder Background (Simulated Hardware Camera) */}
              <div className="absolute inset-0 bg-slate-900 overflow-hidden">
                <img
                  src={capturedPhoto || "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=800&q=80"}
                  alt="Camera Sensor Stream"
                  className="w-full h-full object-cover opacity-85 transition-opacity duration-300"
                />
                
                {/* 3x3 Composition Grid */}
                <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none opacity-25">
                  <div className="border-r border-b border-white"></div>
                  <div className="border-r border-b border-white"></div>
                  <div className="border-b border-white"></div>
                  <div className="border-r border-b border-white"></div>
                  <div className="border-r border-b border-white"></div>
                  <div className="border-b border-white"></div>
                  <div className="border-r border-white"></div>
                  <div className="border-r border-white"></div>
                  <div></div>
                </div>

                {/* Shutter Flash Animation */}
                {isCapturing && (
                  <div className="absolute inset-0 bg-white opacity-80 animate-ping"></div>
                )}
              </div>

              {/* Top HUD Overlay */}
              <div className="relative z-20 pt-9 px-3">
                <div className="bg-black/85 backdrop-blur-md rounded-xl p-2 border border-cyan-500/40 flex items-center justify-between text-[10px] font-mono">
                  <div className="flex items-center gap-1.5 text-cyan-300 font-bold">
                    <Camera className="w-3.5 h-3.5 text-cyan-400" />
                    <span>VEC ZERO-TRUST</span>
                  </div>
                  <div className="bg-red-950/90 text-red-400 border border-red-800/80 px-1.5 py-0.5 rounded text-[9px] font-bold flex items-center gap-1">
                    <Lock className="w-2.5 h-2.5" />
                    <span>GALLERY BLOCKED</span>
                  </div>
                </div>
              </div>

              {/* Center Status Banner */}
              <div className="relative z-20 px-3 text-center">
                <div className="bg-black/80 backdrop-blur-md p-1.5 rounded-lg border border-slate-700/80 text-[10px] font-mono text-cyan-300 shadow">
                  {activeHudLog}
                </div>
              </div>

              {/* Bottom Controls Bar */}
              <div className="relative z-20 pb-5 px-4 flex items-center justify-between">
                {/* NFC Button */}
                <button
                  onClick={handleNfcClick}
                  disabled={isNfcScanning}
                  className="w-10 h-10 rounded-full bg-slate-900/90 border border-cyan-500/50 flex items-center justify-center text-cyan-300 hover:bg-cyan-950 transition shadow"
                  title="Pindai Tag NFC Fisik Karya Seni"
                >
                  <Radio className={`w-4 h-4 ${isNfcScanning ? 'animate-spin text-cyan-400' : ''}`} />
                </button>

                {/* Hardware Shutter Button */}
                <button
                  onClick={handleShutterClick}
                  disabled={isCapturing}
                  className="w-16 h-16 rounded-full border-4 border-cyan-400 p-1 flex items-center justify-center bg-black/40 hover:scale-105 active:scale-95 transition"
                  title="Jepret Langsung dari Sensor CMOS Kamera"
                >
                  <div className="w-full h-full rounded-full bg-white flex items-center justify-center">
                    {isCapturing && (
                      <div className="w-4 h-4 border-2 border-slate-900 border-t-transparent rounded-full animate-spin"></div>
                    )}
                  </div>
                </button>

                {/* GPS Physical Button */}
                <button
                  onClick={() => {
                    setActiveHudLog('GPS Satelit Fisik: -6.175392, 106.827153 (Akurasi 2.1m GNSS)');
                  }}
                  className="w-10 h-10 rounded-full bg-slate-900/90 border border-emerald-500/50 flex items-center justify-center text-emerald-300 hover:bg-emerald-950 transition shadow"
                  title="Verifikasi Sensor GPS Fisik"
                >
                  <MapPin className="w-4 h-4 text-emerald-400" />
                </button>
              </div>
            </div>
          </div>

          {/* Verification Manifest Modal / Details */}
          {simulatedManifest && (
            <div className="mt-4 w-full bg-slate-900 border border-slate-800 rounded-xl p-3.5 font-mono text-xs space-y-2">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="font-bold text-white flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-cyan-400" />
                  {simulatedManifest.type === 'PHOTO_CAPTURE'
                    ? 'Bukti Tangkapan Sensor Hardware'
                    : 'Sertifikat Chip NFC Fisik'}
                </span>
                <span className="text-[10px] text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
                  VERIFIED
                </span>
              </div>

              {simulatedManifest.type === 'PHOTO_CAPTURE' ? (
                <div className="space-y-1 text-[11px] text-slate-300">
                  <div>GPS: <span className="text-cyan-300">{simulatedManifest.latitude}, {simulatedManifest.longitude}</span></div>
                  <div>Anti-Mock: <span className="text-emerald-400 font-bold">GNSS HARDWARE ASLI</span></div>
                  <div>SHA-256 RAW: <span className="text-purple-300 break-all">{simulatedManifest.rawSha256}</span></div>
                  <div>Ukuran Sensor: <span className="text-slate-400">{simulatedManifest.fileSize}</span></div>
                </div>
              ) : (
                <div className="space-y-1 text-[11px] text-slate-300">
                  <div>UID Chip NFC: <span className="text-cyan-300">{simulatedManifest.chipUid}</span></div>
                  <div>Tipe Tag: <span className="text-white">{simulatedManifest.tagType}</span></div>
                  <div>SHA-256 Hash UID: <span className="text-purple-300 break-all">{simulatedManifest.chipUidHash}</span></div>
                  <div className="text-slate-400 truncate">URL: {simulatedManifest.certificateUrl}</div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
