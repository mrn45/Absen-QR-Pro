import React, { useState, useRef } from 'react';
import { useAppContext } from '../AppContext';
import { Plus, Trash2, FileDown, Download } from 'lucide-react';
import { db } from '../firebase';
import { collection, addDoc, deleteDoc, doc, query, where, getDocs } from 'firebase/firestore';

export function KalenderView() {
  const { liburList, loadLibur, showToast, setLoading } = useAppContext();
  const [modalOpen, setModalOpen] = useState(false);
  const [tgl, setTgl] = useState('');
  const [ket, setKet] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSave = async () => {
    if (!tgl || !ket) {
      showToast('Lengkapi data', 'error');
      return;
    }
    

    setLoading(true);
    try {
      // Don't wait for the server roundtrip, let Firestore handle offline persistence
      addDoc(collection(db, 'libur'), { tgl, ket });
      showToast('Libur disimpan');
      setModalOpen(false);
      setTgl('');
      setKet('');
      
      // Update local state by re-fetching
      setTimeout(loadLibur, 500);
    } catch (e: any) {
      showToast(e.message || 'Gagal menyimpan libur', 'error');
    }
    setLoading(false);
  };

  const handleDelete = async (t: string) => {
    if (!confirm('Hapus hari libur ini?')) return;

    setLoading(true);
    try {
      const q = query(collection(db, 'libur'), where('tgl', '==', t));
      const snapshot = await getDocs(q);
      const promises = snapshot.docs.map(document => deleteDoc(doc(db, 'libur', document.id)));
      
      // We don't await the promises to avoid blocking the UI if offline
      
      showToast('Libur berhasil dihapus');
      setTimeout(loadLibur, 500);
    } catch (e: any) {
      showToast(e.message || 'Gagal menghapus libur', 'error');
    }
    setLoading(false);
  };

  const handleUploadCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setLoading(true);
    const reader = new FileReader();
    reader.onload = async (evt) => {
      const text = evt.target?.result as string;
      const lines = text.split('\n');
      let successCount = 0;
      
      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(',');
        if (cols.length >= 2 && cols[0].trim() !== '') {
          try {
            // Check if already exists in liburList (optional, but good for duplicate prevention locally)
            const tglVal = cols[0].trim();
            const ketVal = cols[1].trim();
            
            if (!liburList.find(x => x.tgl === tglVal)) {
               addDoc(collection(db, 'libur'), { tgl: tglVal, ket: ketVal });
               successCount++;
            }
          } catch (e) {
            console.error(e);
          }
        }
      }
      showToast(`${successCount} data libur berhasil diimport!`);
      if (fileInputRef.current) fileInputRef.current.value = '';
      setTimeout(loadLibur, 500);
      setLoading(false);
    };
    reader.readAsText(file);
  };

  const downloadTemplateCSV = () => {
    const csv = "Tanggal (YYYY-MM-DD),Keterangan\n2026-01-01,Tahun Baru Masehi 2026\n2026-12-25,Hari Raya Natal";
    const blob = new Blob([csv], {type: "text/csv;charset=utf-8;"});
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "Template_Hari_Libur.csv";
    link.click();
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4 fade-in-up">
        <div>
          <h2 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight">Kalender Libur</h2>
          <p className="text-sm text-gray-500 mt-1">Hari Minggu otomatis dihitung libur. Tambahkan libur nasional agar persentase akurat.</p>
        </div>
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          <button onClick={() => setModalOpen(true)} className="flex-1 sm:flex-none flex items-center justify-center gap-1 bg-indigo-600 text-white px-4 py-2.5 rounded-xl shadow-glow hover:bg-indigo-700 font-semibold text-sm transition-all">
            <Plus className="w-4 h-4" /> Tambah Manual
          </button>
          <button onClick={() => fileInputRef.current?.click()} className="flex-1 sm:flex-none flex items-center justify-center gap-1 bg-emerald-500 text-white px-4 py-2.5 rounded-xl shadow-md hover:bg-emerald-600 font-semibold text-sm transition-all">
            <FileDown className="w-4 h-4" /> Import CSV
          </button>
          <input type="file" ref={fileInputRef} accept=".csv" className="hidden" onChange={handleUploadCSV} />
          <button onClick={downloadTemplateCSV} className="flex-1 sm:flex-none flex items-center justify-center gap-1 bg-gray-200 text-gray-700 px-4 py-2.5 rounded-xl hover:bg-gray-300 font-semibold text-sm transition-all">
            <Download className="w-4 h-4" /> Template
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
