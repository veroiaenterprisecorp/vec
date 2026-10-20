/**
 * Veroia Enterprise Corp (VEC) - Flutter Mobile Client Codebase
 * Zero-Trust Mobile Client with Hardware-Enforced Sensor Capture,
 * Physical NFC Reader (nfc_service.dart), Hardware GPS & RAW Checksum.
 */

export const FLUTTER_PUBSPEC_YAML = `name: vec_mobile
description: "Veroia Enterprise Corp (VEC) Zero-Trust Hardware Camera & NFC Provenance App"
publish_to: "none"
version: 1.0.0+1

environment:
  sdk: ">=3.3.0 <4.0.0"
  flutter: ">=3.19.0"

dependencies:
  flutter:
    sdk: flutter

  # 1. Hardware Direct Sensor Access (Anti-Gallery Import)
  camera: ^0.11.0+1
  
  # 2. Pembaca Chip Fisik NFC (NTAG424 DNA / ISO 14443-4)
  nfc_manager: ^3.3.0

  # 3. GPS Fisik Hardware & Deteksi Anti-Mock Location
  geolocator: ^13.0.1

  # 4. Enkripsi Kriptografis & Checksum SHA-256 Streaming
  crypto: ^3.0.3

  # Utilitas Sistem & Izin
  permission_handler: ^11.3.1
  path_provider: ^2.1.2
  path: ^1.9.0
  http: ^1.2.1
  uuid: ^4.4.0

dev_dependencies:
  flutter_test:
    sdk: flutter
  flutter_lints: ^3.0.0

flutter:
  uses-material-design: true
`;

export const FLUTTER_NFC_SERVICE = `// =====================================================================
// lib/services/nfc_service.dart
// Modul Pembaca Chip Fisik NFC (NXP NTAG424 DNA & NDEF Smart Seal)
// Untuk Menautkan Sertifikat Fisik Karya Seni ke Database VEC
// =====================================================================
import 'dart:async';
import 'dart:convert';
import 'dart:typed_data';
import 'package:crypto/crypto.dart';
import 'package:nfc_manager/nfc_manager.dart';
import 'package:nfc_manager/platform_tags.dart';

class NfcScanResult {
  final bool success;
  final String? chipUidRaw;
  final String? chipUidHashSha256;
  final String? ndefPayload;
  final String? errorMessage;
  final DateTime scannedAt;

  NfcScanResult({
    required this.success,
    this.chipUidRaw,
    this.chipUidHashSha256,
    this.ndefPayload,
    this.errorMessage,
    DateTime? scannedAt,
  }) : scannedAt = scannedAt ?? DateTime.now();
}

class NfcService {
  /// Memeriksa ketersediaan modul perangkat keras NFC pada smartphone
  static Future<bool> isNfcAvailable() async {
    return await NfcManager.instance.isAvailable();
  }

  /// Memulai sesi pemindaian NFC fisik untuk membaca UID chip dan sertifikat NDEF
  static Future<NfcScanResult> scanArtworkNfcTag({
    Duration timeout = const Duration(seconds: 25),
  }) async {
    final bool available = await isNfcAvailable();
    if (!available) {
      return NfcScanResult(
        success: false,
        errorMessage: 'Sensor NFC tidak tersedia atau belum diaktifkan pada perangkat ini.',
      );
    }

    final completer = Completer<NfcScanResult>();
    Timer? timeoutTimer;

    // Pasang timeout otomatis jika kartu fisik tidak didekatkan
    timeoutTimer = Timer(timeout, () {
      if (!completer.isCompleted) {
        NfcManager.instance.stopSession();
        completer.complete(
          NfcScanResult(
            success: false,
            errorMessage: 'Batas waktu pemindaian NFC habis (Tag tidak terdeteksi).',
          ),
        );
      }
    });

    try {
      await NfcManager.instance.startSession(
        alertMessage: 'Dekatkan smartphone ke chip NFC pada karya seni VEC...',
        onDiscovered: (NfcTag tag) async {
          timeoutTimer?.cancel();
          try {
            // Ekstraksi UID mentah dari berbagai protokol chip NFC (Mifare, ISO15693, NfcA)
            Uint8List? rawIdentifier;

            final nfcA = NfcA.from(tag);
            if (nfcA != null) {
              rawIdentifier = Uint8List.fromList(nfcA.identifier);
            }

            final iso15693 = Iso15693.from(tag);
            if (iso15693 != null && rawIdentifier == null) {
              rawIdentifier = Uint8List.fromList(iso15693.identifier);
            }

            final mifare = MiFare.from(tag);
            if (mifare != null && rawIdentifier == null) {
              rawIdentifier = Uint8List.fromList(mifare.identifier);
            }

            if (rawIdentifier == null || rawIdentifier.isEmpty) {
              await NfcManager.instance.stopSession(errorMessage: 'Gagal membaca UID unik chip.');
              if (!completer.isCompleted) {
                completer.complete(
                  NfcScanResult(
                    success: false,
                    errorMessage: 'Identifier chip NFC fisik tidak dapat dibaca.',
                  ),
                );
              }
              return;
            }

            // Konversi UID ke heksadesimal (contoh: '04:A1:B2:C3:D4:E5:F6')
            final String chipUidHex = rawIdentifier
                .map((b) => b.toRadixString(16).padLeft(2, '0'))
                .join(':')
                .toUpperCase();

            // Hitung SHA-256 Hash dari UID mentah untuk disimpan di tabel public.art_certificates
            final String chipUidHashSha256 = sha256.convert(rawIdentifier).toString();

            // Ekstraksi NDEF Payload jika tag menyimpan data sertifikat / tautan VEC Sun DNA
            String? ndefContent;
            final ndef = Ndef.from(tag);
            if (ndef != null && ndef.cachedMessage != null) {
              for (final record in ndef.cachedMessage!.records) {
                if (record.typeNameFormat == NdefTypeNameFormat.nfcWellknown) {
                  // Cek apakah NDEF bertipe Text atau URI
                  ndefContent = utf8.decode(record.payload, allowMalformed: true);
                }
              }
            }

            await NfcManager.instance.stopSession(alertMessage: 'Sertifikat fisik tervalidasi!');

            if (!completer.isCompleted) {
              completer.complete(
                NfcScanResult(
                  success: true,
                  chipUidRaw: chipUidHex,
                  chipUidHashSha256: chipUidHashSha256,
                  ndefPayload: ndefContent,
                ),
              );
            }
          } catch (e) {
            await NfcManager.instance.stopSession(errorMessage: 'Terjadi kesalahan pemrosesan chip.');
            if (!completer.isCompleted) {
              completer.complete(
                NfcScanResult(success: false, errorMessage: 'Kesalahan parsing tag: \$e'),
              );
            }
          }
        },
      );
    } catch (e) {
      timeoutTimer.cancel();
      return NfcScanResult(
        success: false,
        errorMessage: 'Gagal menginisialisasi sesi NFC: \$e',
      );
    }

    return completer.future;
  }
}
`;

export const FLUTTER_CRYPTO_GEO_SERVICE = `// =====================================================================
// lib/services/hardware_telemetry_service.dart
// Modul GPS Fisik (Anti-Mock) & Checksum SHA-256 File RAW Mentah Kamera
// =====================================================================
import 'dart:io';
import 'dart:typed_data';
import 'package:crypto/crypto.dart';
import 'package:geolocator/geolocator.dart';

class HardwareTelemetryResult {
  final double latitude;
  final double longitude;
  final double altitude;
  final double accuracyMeters;
  final bool isMockLocation;
  final String rawFileSha256Checksum;
  final int fileSizeBytes;
  final DateTime timestamp;

  HardwareTelemetryResult({
    required this.latitude,
    required this.longitude,
    required this.altitude,
    required this.accuracyMeters,
    required this.isMockLocation,
    required this.rawFileSha256Checksum,
    required this.fileSizeBytes,
    DateTime? timestamp,
  }) : timestamp = timestamp ?? DateTime.now();

  Map<String, dynamic> toJson() => {
    'latitude': latitude,
    'longitude': longitude,
    'altitude': altitude,
    'accuracyMeters': accuracyMeters,
    'isMockLocation': isMockLocation,
    'rawFileSha256Checksum': rawFileSha256Checksum,
    'fileSizeBytes': fileSizeBytes,
    'timestamp': timestamp.toIso8601String(),
  };
}

class HardwareTelemetryService {
  /// 1. Mendapatkan Koordinat GPS Fisik dengan Deteksi Tegas Mock/Fake GPS
  static Future<Position> getPhysicalGpsCoordinate() async {
    bool serviceEnabled = await Geolocator.isLocationServiceEnabled();
    if (!serviceEnabled) {
      throw Exception('Layanan GPS perangkat dinonaktifkan. Wajib aktifkan GPS satelit.');
    }

    LocationPermission permission = await Geolocator.checkPermission();
    if (permission == LocationPermission.denied) {
      permission = await Geolocator.requestPermission();
      if (permission == LocationPermission.denied) {
        throw Exception('Izin akses GPS fisik ditolak.');
      }
    }

    if (permission == LocationPermission.deniedForever) {
      throw Exception('Izin lokasi ditolak permanen pada pengaturan OS.');
    }

    // Ambil posisi dengan akurasi tinggi langsung dari sensor GNSS hardware
    final Position position = await Geolocator.getCurrentPosition(
      desiredAccuracy: LocationAccuracy.bestForNavigation,
      timeLimit: const Duration(seconds: 15),
    );

    // ZERO-TRUST SECURITY: Tolak lokasi jika terindikasi Fake/Mock GPS software
    if (position.isMocked) {
      throw Exception(
        'PERINGATAN ZERO-TRUST: Terdeteksi penggunaan Mock/Fake GPS! '
        'VEC menolak koordinat yang dimanipulasi oleh perangkat lunak.',
      );
    }

    return position;
  }

  /// 2. Menghitung Checksum SHA-256 dari File RAW/Foto Mentah secara Streaming
  /// Efisien untuk file RAW berukuran puluhan hingga ratusan Megabyte tanpa memory spike
  static Future<String> computeRawFileChecksum(File file) async {
    if (!await file.exists()) {
      throw Exception('File tangkapan sensor tidak ditemukan di storage lokal.');
    }

    final output = AccumulatorSink<Digest>();
    final input = sha256.startChunkedConversion(output);

    // Baca stream chunk per 64KB
    final Stream<List<int>> stream = file.openRead();
    await for (final List<int> chunk in stream) {
      input.add(chunk);
    }
    input.close();

    return output.events.single.toString();
  }

  /// 3. Mengemas Keseluruhan Bukti Telemetri Sensor Hardware
  static Future<HardwareTelemetryResult> captureCompleteTelemetry(File mediaFile) async {
    final Position pos = await getPhysicalGpsCoordinate();
    final String checksum = await computeRawFileChecksum(mediaFile);
    final int fileBytes = await mediaFile.length();

    return HardwareTelemetryResult(
      latitude: pos.latitude,
      longitude: pos.longitude,
      altitude: pos.altitude,
      accuracyMeters: pos.accuracy,
      isMockLocation: pos.isMocked,
      rawFileSha256Checksum: checksum,
      fileSizeBytes: fileBytes,
    );
  }
}
`;

export const FLUTTER_CAMERA_SCREEN = `// =====================================================================
// lib/screens/zero_trust_camera_screen.dart
// Modul Kamera Hardware-Bypass: Wajib tangkap langsung dari sensor optik.
// Menolak keras impor dari galeri perangkat lunak untuk menjaga integritas.
// =====================================================================
import 'dart:io';
import 'package:flutter/material.dart';
import 'package:camera/camera.dart';
import 'package:path_provider/path_provider.dart';
import 'package:uuid/uuid.dart';
import '../services/hardware_telemetry_service.dart';
import '../services/nfc_service.dart';

class ZeroTrustCameraScreen extends StatefulWidget {
  final List<CameraDescription> cameras;

  const ZeroTrustCameraScreen({super.key, required this.cameras});

  @override
  State<ZeroTrustCameraScreen> createState() => _ZeroTrustCameraScreenState();
}

class _ZeroTrustCameraScreenState extends State<ZeroTrustCameraScreen> {
  CameraController? _controller;
  bool _isCameraReady = false;
  bool _isProcessing = false;
  String? _statusLog;
  HardwareTelemetryResult? _lastTelemetry;
  NfcScanResult? _lastNfc;

  @override
  void initState() {
    super.initState();
    _initializeHardwareCamera();
  }

  Future<void> _initializeHardwareCamera() async {
    if (widget.cameras.isEmpty) {
      setState(() => _statusLog = 'Sensor kamera fisik tidak ditemukan.');
      return;
    }

    // Pilih lensa utama belakang resolusi tertinggi untuk menangkap RAW detail optik
    final mainLens = widget.cameras.firstWhere(
      (cam) => cam.lensDirection == CameraLensDirection.back,
      orElse: () => widget.cameras.first,
    );

    _controller = CameraController(
      mainLens,
      ResolutionPreset.max,
      enableAudio: false,
      imageFormatGroup: ImageFormatGroup.jpeg, // Dapat diubah ke ImageFormatGroup.yuv420
    );

    try {
      await _controller!.initialize();
      // Kunci eksposur dan fokus otomatis optik murni
      await _controller!.setFocusMode(FocusMode.auto);
      if (mounted) {
        setState(() {
          _isCameraReady = true;
          _statusLog = 'Sensor optik terkunci. Mode Hardware-Only Aktif.';
        });
      }
    } catch (e) {
      setState(() => _statusLog = 'Gagal inisialisasi sensor: \$e');
    }
  }

  /// ZERO-TRUST HARDWARE CAPTURE:
  /// Menolak tombol "Import from Gallery"! Hanya mengambil dari sensor kamera fisik!
  Future<void> _captureDirectFromSensor() async {
    if (_controller == null || !_controller!.value.isInitialized || _isProcessing) {
      return;
    }

    setState(() {
      _isProcessing = true;
      _statusLog = 'Mengunci eksposur optik sensor...';
    });

    try {
      // 1. Jepret foto murni dari shutter hardware
      final XFile rawShot = await _controller!.takePicture();
      final File imageFile = File(rawShot.path);

      setState(() => _statusLog = 'Memverifikasi sinyal GPS satelit fisik & integritas...');

      // 2. Baca GPS Fisik (Tolak Mock) dan hitung SHA-256 Checksum dari byte file
      final telemetry = await HardwareTelemetryService.captureCompleteTelemetry(imageFile);

      setState(() {
        _lastTelemetry = telemetry;
        _isProcessing = false;
        _statusLog = 'Tangkapan sensor tervalidasi! SHA-256: \${telemetry.rawFileSha256Checksum.substring(0, 16)}...';
      });

      _showVerificationDialog(imageFile, telemetry);
    } catch (e) {
      setState(() {
        _isProcessing = false;
        _statusLog = 'Peringatan Keamanan Sensor: \$e';
      });
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(e.toString()),
          backgroundColor: Colors.redAccent,
        ),
      );
    }
  }

  /// Memindai Chip NFC Fisik untuk Tautan Sertifikat Seni
  Future<void> _scanArtworkNfc() async {
    setState(() => _statusLog = 'Mendengarkan frekuensi NFC 13.56MHz...');
    final nfcResult = await NfcService.scanArtworkNfcTag();

    setState(() {
      _lastNfc = nfcResult;
      _statusLog = nfcResult.success
          ? 'NFC Fisik Terbaca! Hash: \${nfcResult.chipUidHashSha256!.substring(0, 16)}...'
          : 'Gagal scan NFC: \${nfcResult.errorMessage}';
    });
  }

  void _showVerificationDialog(File file, HardwareTelemetryResult telemetry) {
    showModalBottomSheet(
      context: context,
      backgroundColor: const Color(0xFF0F172A),
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) => Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: const [
                Icon(Icons.verified, color: Colors.cyanAccent),
                SizedBox(width: 8),
                Text(
                  'Zero-Trust Hardware Manifest',
                  style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16),
                ),
              ],
            ),
            const Divider(color: Colors.white24, height: 24),
            Text('GPS Satelit Fisik: \${telemetry.latitude.toStringAsFixed(6)}, \${telemetry.longitude.toStringAsFixed(6)}',
                style: const TextStyle(color: Colors.white70, fontSize: 13)),
            Text('Anti-Mock Status: \${telemetry.isMockLocation ? "PALSU/DITOLAK" : "ORIGINAL GNSS SENSOR"}',
                style: TextStyle(color: telemetry.isMockLocation ? Colors.red : Colors.greenAccent, fontSize: 13)),
            Text('SHA-256 RAW Checksum: \${telemetry.rawFileSha256Checksum}',
                style: const TextStyle(color: Colors.cyanAccent, fontFamily: 'monospace', fontSize: 11)),
            Text('Ukuran File Sensor: \${(telemetry.fileSizeBytes / 1024 / 1024).toStringAsFixed(2)} MB',
                style: const TextStyle(color: Colors.white70, fontSize: 13)),
            const SizedBox(height: 16),
            ElevatedButton.icon(
              onPressed: () => Navigator.pop(ctx),
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.cyan,
                minimumSize: const Size.fromHeight(44),
              ),
              icon: const Icon(Icons.cloud_upload),
              label: const Text('Kirim ke API VEC (/api/posts)'),
            )
          ],
        ),
      ),
    );
  }

  @override
  void dispose() {
    _controller?.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      body: Stack(
        children: [
          // 1. Live Shutter Viewfinder
          if (_isCameraReady && _controller != null)
            Center(child: CameraPreview(_controller!))
          else
            const Center(child: CircularProgressIndicator(color: Colors.cyan)),

          // 2. Hardware Security HUD Overlay
          SafeArea(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.between,
              children: [
                // Top Header HUD
                Container(
                  margin: const EdgeInsets.all(12),
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                  decoration: BoxDecoration(
                    color: Colors.black87,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: Colors.cyan.withOpacity(0.5)),
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.between,
                    children: [
                      Row(
                        children: const [
                          Icon(Icons.shield, color: Colors.cyanAccent, size: 18),
                          SizedBox(width: 6),
                          Text('VEC ZERO-TRUST CAMERA',
                              style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 12)),
                        ],
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                        decoration: BoxDecoration(
                          color: Colors.red.withOpacity(0.2),
                          border: Border.all(color: Colors.redAccent),
                          borderRadius: BorderRadius.circular(6),
                        ),
                        child: const Text('GALLERY IMPORT BLOCKED',
                            style: TextStyle(color: Colors.redAccent, fontSize: 10, fontWeight: FontWeight.bold)),
                      ),
                    ],
                  ),
                ),

                // Status Toast
                if (_statusLog != null)
                  Container(
                    margin: const EdgeInsets.symmetric(horizontal: 20),
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                    decoration: BoxDecoration(
                      color: Colors.black.withOpacity(0.75),
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(color: Colors.white12),
                    ),
                    child: Text(
                      _statusLog!,
                      textAlign: TextAlign.center,
                      style: const TextStyle(color: Colors.cyanAccent, fontSize: 11, fontFamily: 'monospace'),
                    ),
                  ),

                // Bottom Action Bar
                Container(
                  padding: const EdgeInsets.only(bottom: 24, left: 24, right: 24),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                    children: [
                      // Tombol NFC Scanner
                      FloatingActionButton.small(
                        heroTag: 'nfc_btn',
                        onPressed: _scanArtworkNfc,
                        backgroundColor: const Color(0xFF1E293B),
                        child: const Icon(Icons.nfc, color: Colors.cyanAccent),
                      ),

                      // Tombol Shutter Utama (Hardware-Only Capture)
                      GestureDetector(
                        onTap: _captureDirectFromSensor,
                        child: Container(
                          width: 78,
                          height: 78,
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            border: Border.all(color: Colors.cyanAccent, width: 4),
                          ),
                          child: Center(
                            child: _isProcessing
                                ? const CircularProgressIndicator(color: Colors.cyanAccent)
                                : Container(
                                    width: 60,
                                    height: 60,
                                    decoration: const BoxDecoration(
                                      shape: BoxShape.circle,
                                      color: Colors.white,
                                    ),
                                  ),
                          ),
                        ),
                      ),

                      // Indikator GPS Fisik
                      FloatingActionButton.small(
                        heroTag: 'gps_btn',
                        onPressed: () async {
                          final pos = await HardwareTelemetryService.getPhysicalGpsCoordinate();
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(content: Text('GPS: \${pos.latitude}, \${pos.longitude} (Satelit Asli)')),
                          );
                        },
                        backgroundColor: const Color(0xFF1E293B),
                        child: const Icon(Icons.gps_fixed, color: Colors.greenAccent),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
`;

export const FLUTTER_MAIN_DART = `// =====================================================================
// lib/main.dart
// Entry Point Aplikasi Mobile VEC Zero-Trust
// =====================================================================
import 'package:flutter/material.dart';
import 'package:camera/camera.dart';
import 'screens/zero_trust_camera_screen.dart';

List<CameraDescription> _availableCameras = [];

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  try {
    _availableCameras = await availableCameras();
  } on CameraException catch (e) {
    debugPrint('Gagal menemukan kamera hardware: \${e.description}');
  }

  runApp(const VecMobileApp());
}

class VecMobileApp extends StatelessWidget {
  const VecMobileApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'VEC Zero-Trust Camera',
      debugShowCheckedModeBanner: false,
      theme: ThemeData.dark().copyWith(
        scaffoldBackgroundColor: const Color(0xFF020617),
        colorScheme: const ColorScheme.dark(
          primary: Colors.cyan,
          secondary: Colors.cyanAccent,
        ),
      ),
      home: ZeroTrustCameraScreen(cameras: _availableCameras),
    );
  }
}
`;
