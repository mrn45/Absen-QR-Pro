import { useState, useEffect } from 'react';
import { useAppContext } from '../AppContext';
import { Settings, Save } from 'lucide-react';
import { db } from '../firebase';
import { collection, doc, setDoc, getDocs } from 'firebase/firestore';

export function PengaturanView() {
  const { pengaturan, loadPengaturan, showToast, setLoading, role } = useAppContext();
  const [jamMasuk, setJamMasuk] = useState('07:00');
  const [jamPulang, setJamPulang] = useState('15:00');

  useEffect(() => {
    if (pengaturan) {
      setJamMasuk(pengaturan.jamMasuk);
      setJamPulang(pengaturan.jamPulang);
    }
  }, [pengaturan]);

  if (role !== 'Admin') {
    return <div className="p-8 text-center text-gray-500">Akses ditolak. Hanya Admin yang dapat melihat halaman ini.</div>;
  }

  const handleSave = async () => {
    if (!jamMasuk || !jamPulang) {
      showToast('Harap isi semua jam', 'error');
      return;
    }

    if (!db.app.options.apiKey) {
      showToast('Firebase belum dikonfigurasi', 'error');
      return;
    }

    setLoading(true);
    try {
      const snapshot = await getDocs(collection(db, 'pengaturan'));
      let docRef;
      if (snapshot.empty) {
        docRef = doc(collection(db, 'pengaturan'));
      } else {
        docRef = doc(db, 'pengaturan', snapshot.docs[0].id);
      }

      await setDoc(docRef, { jamMasuk, jamPulang }, { merge: true });
      showToast('Pengaturan berhasil disimpan');
      loadPengaturan();
    } catch (e) {
      showToast('Gagal menyimpan pengaturan', 'error');
    }
    setLoading(false);
  };

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-3xl shadow-soft p-6 md:p-8 border border-gray-100 relative overflow-hidden fade-in-up">
      <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-bl-full pointer-events-none -mr-10 -mt-10"></div>
      
      <h2 className="text-2xl font-black text-gray-900 tracking-tight mb-2 relative z-10 flex items-center gap-2">
        <Settings className="w-6 h-6 text-indigo-500" />
        Pengaturan Sistem
      </h2>
      <p className="text-gray-500 text-sm mb-6 relative z-10">Atur jam masuk dan pulang KBM. Siswa yang tidak absen pulang setelah jam pulang akan otomatis tercatat sebagai Alfa.</p>

      <div className="space-y-5 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Jam Masuk</label>
            <input type="time" value={jamMasuk} onChange={e => setJamMasuk(e.target.value)} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all font-medium" />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Jam Pulang</label>
            <input type="time" value={jamPulang} onChange={e => setJamPulang(e.target.value)} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all font-medium" />
          </div>
        </div>
        
        <button onClick={handleSave} className="w-full flex justify-center items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 px-4 rounded-xl shadow-lg transition-colors mt-4">
          <Save className="w-5 h-5" /> Simpan Pengaturan
        </button>
      </div>
    </div>
  );
}
