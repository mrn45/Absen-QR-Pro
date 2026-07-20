import { useState } from 'react';
import { useAppContext } from '../AppContext';
import { UserPlus, Trash2 } from 'lucide-react';
import { db } from '../firebase';
import { collection, addDoc, deleteDoc, doc, query, where, getDocs } from 'firebase/firestore';

export function AkunView() {
  const { akunList, loadAkun, showToast, setLoading } = useAppContext();
  const [modalOpen, setModalOpen] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleSave = async () => {
    if (!username || password.length < 6) {
      showToast('Data tidak valid (Pass min 6 karakter)', 'error');
      return;
    }
    
    if (!db.app.options.apiKey) {
      showToast('Data gagal disimpan. Anda perlu memasukkan konfigurasi Firebase di Settings.', 'error');
      return;
    }

    setLoading(true);
    try {
      await addDoc(collection(db, 'akun'), { username, password, role: 'Piket' });
      showToast('Akun berhasil dibuat');
      setModalOpen(false);
      setUsername('');
      setPassword('');
      loadAkun();
    } catch (e) {
      showToast('Gagal membuat akun', 'error');
    }
    setLoading(false);
  };

  const handleDelete = async (u: string) => {
    if (!confirm(`Hapus akun ${u}?`)) return;
    if (!db.app.options.apiKey) return;

    setLoading(true);
    try {
      const q = query(collection(db, 'akun'), where('username', '==', u));
      const snapshot = await getDocs(q);
      snapshot.forEach(async (document) => {
        await deleteDoc(doc(db, 'akun', document.id));
      });
      showToast('Akun berhasil dihapus');
      loadAkun();
    } catch (e) {
      showToast('Gagal menghapus akun', 'error');
    }
    setLoading(false);
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4 fade-in-up">
        <div>
          <h2 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight">Manajemen Akun Piket</h2>
          <p className="text-sm text-gray-500">Buat akun dengan hak akses terbatas (Data Siswa Read-Only, Scanner, Manual, Rekap).</p>
        </div>
        <button onClick={() => setModalOpen(true)} className="flex items-center justify-center gap-1 bg-indigo-600 text-white px-4 py-2.5 rounded-xl shadow-glow hover:bg-indigo-700 font-semibold text-sm transition-all w-full sm:w-auto">
          <UserPlus className="w-4 h-4" /> Buat Akun
        </button>
      </div>

      <div className="bg-white rounded-3xl shadow-soft border border-gray-100 overflow-hidden table-responsive fade-in-up">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 text-gray-500 text-sm uppercase tracking-wider">
              <th className="p-4 font-bold border-b border-gray-100">Username</th>
              <th className="p-4 font-bold border-b border-gray-100">Password</th>
              <th className="p-4 font-bold border-b border-gray-100">Hak Akses</th>
              <th className="p-4 font-bold border-b border-gray-100 text-center">Aksi</th>
            </tr>
          </thead>
          <tbody className="text-sm divide-y divide-gray-50">
            {akunList.map(u => (
              <tr key={u.username} className="hover:bg-gray-50">
                <td className="p-4 font-bold text-gray-800">{u.username}</td>
                <td className="p-4 text-gray-400 font-mono">••••••••</td>
                <td className="p-4">
                  <span className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-xs font-bold border border-yellow-200">{u.role}</span>
                </td>
                <td className="p-4 text-center">
                  <button onClick={() => handleDelete(u.username)} className="flex items-center justify-center gap-1 mx-auto text-red-500 hover:bg-red-50 px-3 py-2 rounded-lg transition-colors">
                    <Trash2 className="w-4 h-4" /> Hapus
                  </button>
                </td>
              </tr>
            ))}
            {akunList.length === 0 && (
              <tr><td colSpan={4} className="p-8 text-center text-gray-500">Belum ada data akun piket.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Add */}
      {modalOpen && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-6 md:p-8 w-full max-w-md shadow-2xl fade-in-up">
            <h3 className="text-xl font-black text-gray-900 mb-6 flex items-center gap-2">
              <UserPlus className="text-indigo-500 w-6 h-6" /> Buat Akun Piket
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Username</label>
                <input type="text" value={username} onChange={e => setUsername(e.target.value)} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="Cth: piket_senin" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Password</label>
                <input type="text" value={password} onChange={e => setPassword(e.target.value)} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="Minimal 6 karakter" />
              </div>
            </div>
            <div className="mt-8 flex justify-end gap-3">
              <button onClick={() => setModalOpen(false)} className="px-5 py-2.5 text-gray-600 font-bold hover:bg-gray-100 rounded-xl transition-colors">Batal</button>
              <button onClick={handleSave} className="px-5 py-2.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 shadow-md">Simpan Akun</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
