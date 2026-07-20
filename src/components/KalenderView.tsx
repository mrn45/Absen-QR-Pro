import { useState } from 'react';
import { useAppContext } from '../AppContext';
import { Wand2, Plus, Trash2 } from 'lucide-react';
import { db } from '../firebase';
import { collection, addDoc, deleteDoc, doc, query, where, getDocs } from 'firebase/firestore';

export function KalenderView() {
  const { liburList, loadLibur, showToast, setLoading } = useAppContext();
  const [modalOpen, setModalOpen] = useState(false);
  const [tgl, setTgl] = useState('');
  const [ket, setKet] = useState('');

  const handleSave = async () => {
    if (!tgl || !ket) {
      showToast('Lengkapi data', 'error');
      return;
    }
    
    if (!db.app.options.apiKey) {
      showToast('Firebase belum dikonfigurasi', 'error');
      return;
    }

    setLoading(true);
    try {
      await addDoc(collection(db, 'libur'), { tgl, ket });
      showToast('Libur disimpan');
      setModalOpen(false);
      setTgl('');
      setKet('');
      loadLibur();
    } catch (e) {
      showToast('Gagal menyimpan libur', 'error');
    }
    setLoading(false);
  };

  const handleDelete = async (t: string) => {
    if (!confirm('Hapus hari libur ini?')) return;
    if (!db.app.options.apiKey) return;

    setLoading(true);
    try {
      const q = query(collection(db, 'libur'), where('tgl', '==', t));
      const snapshot = await getDocs(q);
      snapshot.forEach(async (document) => {
        await deleteDoc(doc(db, 'libur', document.id));
      });
      showToast('Libur berhasil dihapus');
      loadLibur();
    } catch (e) {
      showToast('Gagal menghapus libur', 'error');
    }
    setLoading(false);
  };

  const autoGenerateLibur = async () => {
    if (!confirm('Tambahkan Hari Libur Nasional 2026 ke kalender?')) return;
    if (!db.app.options.apiKey) {
      showToast('Firebase belum dikonfigurasi', 'error');
      return;
    }

    const holidays2026 = [
      { tgl: '2026-01-01', ket: 'Tahun Baru Masehi 2026' }, { tgl: '2026-02-17', ket: 'Tahun Baru Imlek 2577' },
      { tgl: '2026-02-18', ket: 'Isra Mikraj' }, { tgl: '2026-03-19', ket: 'Hari Raya Nyepi 1948' },
      { tgl: '2026-03-20', ket: 'Hari Raya Idul Fitri 1447 H' }, { tgl: '2026-03-21', ket: 'Cuti Bersama Idul Fitri' },
      { tgl: '2026-04-03', ket: 'Jumat Agung' }, { tgl: '2026-05-01', ket: 'Hari Buruh' },
      { tgl: '2026-05-14', ket: 'Kenaikan Yesus Kristus' }, { tgl: '2026-05-27', ket: 'Idul Adha 1447 H' },
      { tgl: '2026-06-01', ket: 'Hari Lahir Pancasila' }, { tgl: '2026-06-16', ket: 'Tahun Baru Islam 1448 H' },
      { tgl: '2026-08-17', ket: 'Hari Kemerdekaan RI' }, { tgl: '2026-08-25', ket: 'Maulid Nabi' },
      { tgl: '2026-12-25', ket: 'Hari Raya Natal' }
    ];

    setLoading(true);
    try {
      for (const h of holidays2026) {
        if (!liburList.find(x => x.tgl === h.tgl)) {
          await addDoc(collection(db, 'libur'), h);
        }
      }
      showToast('Libur otomatis berhasil ditambahkan!');
      loadLibur();
    } catch (e) {
      showToast('Gagal menambahkan libur', 'error');
    }
    setLoading(false);
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4 fade-in-up">
        <div>
          <h2 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight">Kalender Libur</h2>
          <p className="text-sm text-gray-500 mt-1">Hari Minggu otomatis dihitung libur. Tambahkan libur nasional agar persentase akurat.</p>
        </div>
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          <button onClick={autoGenerateLibur} className="flex-1 sm:flex-none flex items-center justify-center gap-1 bg-orange-500 text-white px-4 py-2.5 rounded-xl shadow-md hover:bg-orange-600 font-semibold text-sm transition-all">
            <Wand2 className="w-4 h-4" /> Generate Libur 2026
          </button>
          <button onClick={() => setModalOpen(true)} className="flex-1 sm:flex-none flex items-center justify-center gap-1 bg-indigo-600 text-white px-4 py-2.5 rounded-xl shadow-glow hover:bg-indigo-700 font-semibold text-sm transition-all">
            <Plus className="w-4 h-4" /> Tambah Manual
          </button>
        </div>
      </div>
      
      <div className="bg-white rounded-3xl shadow-soft border border-gray-100 overflow-hidden table-responsive fade-in-up">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 text-gray-500 text-sm uppercase tracking-wider">
              <th className="p-4 font-bold border-b border-gray-100">Tanggal</th>
              <th className="p-4 font-bold border-b border-gray-100">Keterangan Libur</th>
              <th className="p-4 font-bold border-b border-gray-100 text-center">Aksi</th>
            </tr>
          </thead>
          <tbody className="text-sm divide-y divide-gray-50">
            {liburList.map(l => (
              <tr key={l.tgl} className="hover:bg-gray-50">
                <td className="p-4 font-bold text-gray-800">{l.tgl}</td>
                <td className="p-4 text-gray-600">{l.ket}</td>
                <td className="p-4 text-center">
                  <button onClick={() => handleDelete(l.tgl)} className="flex items-center justify-center gap-1 mx-auto text-red-500 hover:bg-red-50 px-3 py-2 rounded-lg transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
            {liburList.length === 0 && (
              <tr><td colSpan={3} className="p-8 text-center text-gray-500">Belum ada data libur.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Add */}
      {modalOpen && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-6 md:p-8 w-full max-w-md shadow-2xl fade-in-up">
            <h3 className="text-xl font-black text-gray-900 mb-6">Tambah Hari Libur</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Tanggal</label>
                <input type="date" value={tgl} onChange={e => setTgl(e.target.value)} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Keterangan</label>
                <input type="text" value={ket} onChange={e => setKet(e.target.value)} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="Cth: Libur Semester" />
              </div>
            </div>
            <div className="mt-8 flex justify-end gap-3">
              <button onClick={() => setModalOpen(false)} className="px-5 py-2.5 text-gray-600 font-bold hover:bg-gray-100 rounded-xl transition-colors">Batal</button>
              <button onClick={handleSave} className="px-5 py-2.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 shadow-md">Simpan</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
