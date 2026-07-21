import React, { useState, useEffect, useRef } from 'react';
import { useAppContext } from '../AppContext';
import { School, Building2, LogIn, LogOut, Sun, CloudSun, Power, Check, X } from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';
import { db } from '../firebase';
import { collection, query, where, getDocs, addDoc, updateDoc, doc } from 'firebase/firestore';

export function ScannerView() {
  const { siswaList, showToast, loadAbsen } = useAppContext();
  const [menu, setMenu] = useState<'main' | 'kbm' | 'sholat' | 'scanner'>('main');
  const [scanMode, setScanMode] = useState('');
  const [cameras, setCameras] = useState<{ id: string, label: string }[]>([]);
  const [selectedCamera, setSelectedCamera] = useState('');
  const [scanOverlay, setScanOverlay] = useState<{show: boolean, name: string, status: string, isError: boolean}>({show: false, name: '', status: '', isError: false});
  
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const isScanningRef = useRef(false);

  useEffect(() => {
    return () => {
      stopScanner();
    };
  }, []);

  const openScanner = (mode: string) => {
    setScanMode(mode);
    setMenu('scanner');
    
    setTimeout(() => {
      Html5Qrcode.getCameras().then(devices => {
        if (devices && devices.length) {
          setCameras(devices);
          setSelectedCamera(devices[0].id);
          
          const html5QrCode = new Html5Qrcode("reader");
          html5QrCodeRef.current = html5QrCode;
          
          startScanner(html5QrCode, devices[0].id);
        } else {
          showToast('Kamera tidak ditemukan!', 'error');
        }
      }).catch(err => {
        showToast('Izin kamera ditolak!', 'error');
      });
    }, 100);
  };

  const startScanner = (html5QrCode: Html5Qrcode, camId: string) => {
    const qrboxFunction = (viewfinderWidth: number, viewfinderHeight: number) => {
      const minEdgePercentage = 0.8;
      const minEdgeSize = Math.min(viewfinderWidth, viewfinderHeight);
      const qrboxSize = Math.floor(minEdgeSize * minEdgePercentage);
      return { width: qrboxSize, height: qrboxSize };
    };
    
    html5QrCode.start(
      camId, 
      { fps: 15, qrbox: qrboxFunction, aspectRatio: 1.333334 },
      (decodedText) => onScanSuccess(decodedText),
      (errorMessage) => { /* ignore */ }
    ).catch(err => {
      console.error(err);
    });
  };

  const handleCameraChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newCamId = e.target.value;
    setSelectedCamera(newCamId);
    
    if (html5QrCodeRef.current) {
      html5QrCodeRef.current.stop().then(() => {
        startScanner(html5QrCodeRef.current!, newCamId);
      });
    }
  };

  const stopScanner = () => {
    if (html5QrCodeRef.current) {
      html5QrCodeRef.current.stop().then(() => {
        html5QrCodeRef.current?.clear();
        html5QrCodeRef.current = null;
      }).catch(err => console.log(err));
    }
    setMenu('main');
  };

  const triggerOverlay = (name: string, status: string, isError: boolean = false) => {
    setScanOverlay({ show: true, name, status, isError });
    
    // Attempt to play a simple beep sound using AudioContext
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      
      if (isError) {
        oscillator.type = 'sawtooth';
        oscillator.frequency.setValueAtTime(150, audioCtx.currentTime);
        gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime);
        oscillator.start();
        oscillator.stop(audioCtx.currentTime + 0.3);
      } else {
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(800, audioCtx.currentTime);
        gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
        oscillator.start();
        oscillator.frequency.setValueAtTime(1200, audioCtx.currentTime + 0.1);
        oscillator.stop(audioCtx.currentTime + 0.3);
      }
    } catch (e) {
      console.log('Audio not supported or blocked');
    }

    setTimeout(() => {
      setScanOverlay({ show: false, name: '', status: '', isError: false });
      isScanningRef.current = false;
    }, 2000);
  };

  const onScanSuccess = async (nis: string) => {
    if (isScanningRef.current) return;
    isScanningRef.current = true;
    
    nis = nis.trim();
    
    const siswa = siswaList.find(x => x.nis === nis);
    if (!siswa) {
      triggerOverlay('Tidak Diketahui', 'NIS Tidak Ditemukan', true);
      return;
    }


    try {
      const tz = new Date().getTimezoneOffset() * 60000;
      const todayStr = new Date(Date.now() - tz).toISOString().split('T')[0];
      
      const q = query(collection(db, 'absen'), where('nis', '==', nis));
      const snapshot = await getDocs(q);
      
      // manual filtering by date string to avoid complex index
      const todayRecord = snapshot.docs.find(d => d.data().timestamp.startsWith(todayStr));

      if (scanMode === 'kbm_masuk') {
        if (todayRecord) {
          triggerOverlay(siswa.nama, 'Sudah Absen Datang', true);
        } else {
          addDoc(collection(db, 'absen'), {
            timestamp: new Date().toISOString(),
            nis: siswa.nis, nama: siswa.nama, kelas: siswa.kelas, jenjang: siswa.jenjang,
            status: 'Hadir', waktuKeluar: '', waktuDhuha: '', waktuDzuhur: ''
          });
          triggerOverlay(siswa.nama, 'Berhasil Datang');
          loadAbsen();
        }
      } else if (scanMode === 'kbm_pulang') {
        if (!todayRecord) {
          triggerOverlay(siswa.nama, 'Belum Absen Datang!', true);
        } else if (todayRecord.data().waktuKeluar !== '') {
          triggerOverlay(siswa.nama, 'Sudah Absen Pulang', true);
        } else {
          updateDoc(doc(db, 'absen', todayRecord.id), { waktuKeluar: new Date().toISOString() });
          triggerOverlay(siswa.nama, 'Berhasil Pulang');
          loadAbsen();
        }
      } else if (scanMode === 'sholat_dhuha') {
        if (!todayRecord) {
          addDoc(collection(db, 'absen'), {
            timestamp: new Date().toISOString(),
            nis: siswa.nis, nama: siswa.nama, kelas: siswa.kelas, jenjang: siswa.jenjang,
            status: '', waktuKeluar: '', waktuDhuha: new Date().toISOString(), waktuDzuhur: ''
          });
          triggerOverlay(siswa.nama, 'Berhasil Dhuha');
          loadAbsen();
        } else {
          if (todayRecord.data().waktuDhuha !== '') {
            triggerOverlay(siswa.nama, 'Sudah Sholat Dhuha', true);
          } else {
            updateDoc(doc(db, 'absen', todayRecord.id), { waktuDhuha: new Date().toISOString() });
            triggerOverlay(siswa.nama, 'Berhasil Dhuha');
            loadAbsen();
          }
        }
      } else if (scanMode === 'sholat_dzuhur') {
        if (!todayRecord) {
          addDoc(collection(db, 'absen'), {
            timestamp: new Date().toISOString(),
            nis: siswa.nis, nama: siswa.nama, kelas: siswa.kelas, jenjang: siswa.jenjang,
            status: '', waktuKeluar: '', waktuDhuha: '', waktuDzuhur: new Date().toISOString()
          });
          triggerOverlay(siswa.nama, 'Berhasil Dzuhur');
          loadAbsen();
        } else {
          if (todayRecord.data().waktuDzuhur !== '') {
            triggerOverlay(siswa.nama, 'Sudah Sholat Dzuhur', true);
          } else {
            updateDoc(doc(db, 'absen', todayRecord.id), { waktuDzuhur: new Date().toISOString() });
            triggerOverlay(siswa.nama, 'Berhasil Dzuhur');
            loadAbsen();
          }
        }
      }

    } catch (e) {
      triggerOverlay('Sistem', 'Gagal Memproses Absen', true);
    }
  };

  const badgeConfig = {
    'kbm_masuk': { text: 'MODE: DATANG', bg: 'bg-gray-900' },
    'kbm_pulang': { text: 'MODE: PULANG', bg: 'bg-orange-600' },
    'sholat_dhuha': { text: 'MODE: DHUHA', bg: 'bg-teal-600' },
    'sholat_dzuhur': { text: 'MODE: DZUHUR', bg: 'bg-gray-700' }
  };

  return (
    <div className="text-center">
      <h2 className="text-3xl font-black text-gray-900 tracking-tight mb-2">Kiosk Scanner</h2>
      <p className="text-gray-500 mb-8 max-w-lg mx-auto">Arahkan QR Code Kartu Pelajar ke kamera untuk merekam kehadiran secara otomatis.</p>
      
      {menu === 'main' && (
        <div className="max-w-xl mx-auto grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          <button onClick={() => setMenu('kbm')} className="bg-white p-6 rounded-3xl shadow-soft border-2 border-gray-200 hover:border-gray-900 hover:shadow-lg transition-all group">
            <div className="w-16 h-16 bg-gray-100 rounded-2xl mx-auto flex items-center justify-center text-gray-900 text-3xl mb-4 group-hover:bg-gray-800 group-hover:text-white transition-colors">
              <School className="w-8 h-8" />
            </div>
            <h3 className="font-bold text-gray-800 text-lg">Absen KBM</h3>
            <p className="text-xs text-gray-400 mt-1">Kehadiran Harian (Datang/Pulang)</p>
          </button>
          <button onClick={() => setMenu('sholat')} className="bg-white p-6 rounded-3xl shadow-soft border-2 border-gray-200 hover:border-gray-900 hover:shadow-lg transition-all group">
            <div className="w-16 h-16 bg-gray-100 rounded-2xl mx-auto flex items-center justify-center text-gray-900 text-3xl mb-4 group-hover:bg-gray-900 group-hover:text-white transition-colors">
            <Building2 className="w-8 h-8" />
            </div>
            <h3 className="font-bold text-gray-800 text-lg">Absen Sholat</h3>
            <p className="text-xs text-gray-400 mt-1">Kegiatan Ibadah (Dhuha/Dzuhur)</p>
          </button>
        </div>
      )}

      {menu === 'kbm' && (
        <div className="max-w-md mx-auto bg-white p-6 rounded-3xl shadow-xl border border-gray-100 mb-8 fade-in-up">
          <h3 className="font-bold text-gray-800 text-lg mb-4">Pilih Mode Absen KBM:</h3>
          <div className="flex gap-3">
            <button onClick={() => openScanner('kbm_masuk')} className="flex-1 flex items-center justify-center gap-1 bg-gray-800 text-white py-3 rounded-xl font-bold shadow-md hover:bg-gray-900">
              <LogIn className="w-5 h-5" /> DATANG
            </button>
            <button onClick={() => openScanner('kbm_pulang')} className="flex-1 flex items-center justify-center gap-1 bg-gray-800 text-white py-3 rounded-xl font-bold shadow-md hover:bg-gray-700">
              <LogOut className="w-5 h-5" /> PULANG
            </button>
          </div>
          <button onClick={() => setMenu('main')} className="mt-4 text-sm text-gray-400 hover:text-gray-600 underline">Batal</button>
        </div>
      )}

      {menu === 'sholat' && (
        <div className="max-w-md mx-auto bg-white p-6 rounded-3xl shadow-xl border border-gray-100 mb-8 fade-in-up">
          <h3 className="font-bold text-gray-800 text-lg mb-4">Pilih Mode Absen Sholat:</h3>
          <div className="flex gap-3">
            <button onClick={() => openScanner('sholat_dhuha')} className="flex-1 flex items-center justify-center gap-1 bg-teal-500 text-white py-3 rounded-xl font-bold shadow-md hover:bg-teal-600">
              <Sun className="w-5 h-5" /> DHUHA
            </button>
            <button onClick={() => openScanner('sholat_dzuhur')} className="flex-1 flex items-center justify-center gap-1 bg-gray-600 text-white py-3 rounded-xl font-bold shadow-md hover:bg-gray-700">
              <CloudSun className="w-5 h-5" /> DZUHUR
            </button>
          </div>
          <button onClick={() => setMenu('main')} className="mt-4 text-sm text-gray-400 hover:text-gray-600 underline">Batal</button>
        </div>
      )}

      {menu === 'scanner' && (
        <div className="max-w-3xl mx-auto relative glass-panel p-4 rounded-3xl shadow-2xl border border-gray-200 fade-in-up">
          <div className={`absolute -top-4 left-1/2 transform -translate-x-1/2 ${badgeConfig[scanMode as keyof typeof badgeConfig]?.bg || 'bg-gray-900'} text-white px-6 py-2 rounded-full font-black tracking-widest shadow-lg z-20 text-sm border-2 border-white`}>
            {badgeConfig[scanMode as keyof typeof badgeConfig]?.text}
          </div>
          
          <div className="bg-black rounded-2xl overflow-hidden relative shadow-inner flex justify-center items-center h-[300px] md:h-[400px]">
            <div id="reader" style={{ width: '100%', border: 'none' }}></div>
            
            <div className="absolute inset-0 pointer-events-none z-10 flex items-center justify-center">
              <div className="w-64 h-64 border-4 border-gray-900/50 rounded-3xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-gray-900 rounded-tl-3xl"></div>
                <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-gray-900 rounded-tr-3xl"></div>
                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-gray-900 rounded-bl-3xl"></div>
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-gray-900 rounded-br-3xl"></div>
                <div className="absolute top-0 left-0 w-full h-1 bg-gray-800 shadow-[0_0_10px_2px_rgba(99,102,241,0.5)]" style={{ animation: 'scanLine 2s linear infinite' }}></div>
              </div>
            </div>

            {scanOverlay.show && (
              <div className={`absolute inset-0 z-30 flex flex-col items-center justify-center backdrop-blur-sm transition-all duration-300 ${scanOverlay.isError ? 'bg-red-900/80' : 'bg-emerald-900/80'}`}>
                <div className={`w-24 h-24 rounded-full flex items-center justify-center mb-4 shadow-2xl animate-bounce ${scanOverlay.isError ? 'bg-red-500' : 'bg-emerald-500'}`}>
                  {scanOverlay.isError ? <X className="w-12 h-12 text-white" /> : <Check className="w-12 h-12 text-white" />}
                </div>
                <h3 className="text-white text-2xl md:text-3xl font-black text-center px-4 drop-shadow-lg">{scanOverlay.status}</h3>
                <p className="text-white/90 text-lg md:text-xl font-bold mt-2 text-center px-4">{scanOverlay.name}</p>
              </div>
            )}
          </div>

          <div className="mt-6 flex flex-col sm:flex-row justify-center items-center gap-4">
            <select value={selectedCamera} onChange={handleCameraChange} className="bg-gray-50 border border-gray-200 text-gray-700 text-sm rounded-xl py-2.5 px-4 focus:outline-none focus:ring-2 focus:ring-gray-900 w-full sm:w-auto font-medium">
              {cameras.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
            </select>
            <button onClick={stopScanner} className="w-full sm:w-auto flex items-center justify-center gap-1 bg-red-50 text-red-600 px-6 py-2.5 rounded-xl hover:bg-red-100 font-bold transition-colors border border-red-100">
              <Power className="w-4 h-4" /> Tutup Scanner
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
