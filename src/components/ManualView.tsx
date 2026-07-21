import { useState, useMemo } from 'react';
import { useAppContext } from '../AppContext';
import { Save } from 'lucide-react';
import { db } from '../firebase';
import { collection, addDoc, updateDoc, query, where, getDocs, doc } from 'firebase/firestore';

export function ManualView() {
  const { siswaList, absenList, showToast, loadAbsen, setLoading } = useAppContext();
  
  const todayStr = useMemo(() => {
    const tz = new Date().getTimezoneOffset() * 60000;
    return new Date(Date.now() - tz).toISOString().split('T')[0];
  }, []);

  const [tgl, setTgl] = useState(todayStr);
  const [kat, setKat] = useState('kbm');
  const [nis, setNis] = useState('');
  const [status, setStatus] = useState('Hadir');

  const availableSiswa = useMemo(() => {
    const absenDiTanggal = absenList.filter(a => a.timestamp.split('T')[0] === tgl);
    
    return siswaList.filter(s => {
      const rekamSiswa = absenDiTanggal.find(a => a.nis === s.nis);
      if (!rekamSiswa) return true;
      
      if (kat === 'kbm' && rekamSiswa.status === 'Hadir') return false; 
      if (kat === 'kbm' && ['Sakit','Izin','Alfa'].includes(rekamSiswa.status)) return false; 
      if (kat === 'sholat_dhuha' && rekamSiswa.waktuDhuha !== "") return false;
      if (kat === 'sholat_dzuhur' && rekamSiswa.waktuDzuhur !== "") return false;
      
      return true;
    });
  }, [siswaList, absenList, tgl, kat]);

  const handleSave = async () => {
    if (!nis) {
      showToast('Pilih siswa terlebih dahulu!', 'error');
      return;
    }

    const s = siswaList.find(x => x.nis === nis);
    if (!s) return;


    setLoading(true);
    try {
      const q = query(collection(db, 'absen'), where('nis', '==', nis));
      const snapshot = await getDocs(q);
      const record = snapshot.docs.find(d => d.data().timestamp.startsWith(tgl));

      const manualTime = `${tgl}T07:00:00.000Z`;

      if (!record) {
        let newRec: any = {
          timestamp: manualTime, nis: s.nis, nama: s.nama, kelas: s.kelas, jenjang: s.jenjang, 
          status: '', waktuKeluar: '', waktuDhuha: '', waktuDzuhur: ''
        };
        if (kat === 'kbm') {
          newRec.status = status;
          if (status === 'Hadir') newRec.waktuKeluar = `${tgl}T15:00:00.000Z`;
        }
        else if (kat === 'sholat_dhuha') newRec.waktuDhuha = (status === 'Hadir') ? `${tgl}T08:00:00.000Z` : status;
        else if (kat === 'sholat_dzuhur') newRec.waktuDzuhur = (status === 'Hadir') ? `${tgl}T12:00:00.000Z` : status;
        
        addDoc(collection(db, 'absen'), newRec);
      } else {
        const docRef = doc(db, 'absen', record.id);
        if (kat === 'kbm') {
          const updateData: any = { status };
          if (status === 'Hadir') updateData.waktuKeluar = `${tgl}T15:00:00.000Z`;
          updateDoc(docRef, updateData);
        }
        else if (kat === 'sholat_dhuha') updateDoc(docRef, { waktuDhuha: (status === 'Hadir') ? `${tgl}T08:00:00.000Z` : status });
        else if (kat === 'sholat_dzuhur') updateDoc(docRef, { waktuDzuhur: (status === 'Hadir') ? `${tgl}T12:00:00.000Z` : status });
      }

      showToast('Absen manual berhasil disimpan');
      setNis('');
      loadAbsen();
    } catch (error) {
      showToast('Gagal menyimpan absen manual', 'error');
    }
    setLoading(false);
  };

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-3xl shadow-soft p-6 md:p-8 border border-gray-100 relative overflow-hidden fade-in-up">
      <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-bl-full pointer-events-none -mr-10 -mt-10"></div>
      
      <h2 className="text-2xl font-black text-gray-900 tracking-tight mb-2 relative z-10">Input Absen Manual</h2>
      <p className="text-gray-500 text-sm mb-6 relative z-10">Gunakan form ini jika QR siswa rusak atau untuk mencatat ketidakhadiran (Sakit/Izin/Alfa). Siswa yang sudah diabsen hari ini tidak akan muncul di opsi.</p>

      <div className="space-y-5 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Pilih Tanggal</label>
            <input type="date" value={tgl} onChange={e => { setTgl(e.target.value); setNis(''); }} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all font-medium" />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Kategori Absen</label>
            <select value={kat} onChange={e => { setKat(e.target.value); setNis(''); }} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all font-medium appearance-none">
              <option value="kbm">Kegiatan Belajar (KBM)</option>
              <option value="sholat_dhuha">Sholat Dhuha</option>
              <option value="sholat_dzuhur">Sholat Dzuhur</option>
            </select>
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">Pilih Siswa (Belum Diabsen)</label>
          <select value={nis} onChange={e => setNis(e.target.value)} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all font-medium appearance-none">
            <option value="">-- Pilih Siswa --</option>
            {availableSiswa.map(s => (
              <option key={s.nis} value={s.nis}>{s.nis} - {s.nama} ({s.kelas})</option>
            ))}
            {availableSiswa.length === 0 && <option value="" disabled>Semua siswa sudah diabsen</option>}
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">Status Kehadiran</label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {['Hadir', 'Sakit', 'Izin', 'Alfa'].map(stat => (
              <label key={stat} className="cursor-pointer group">
                <input type="radio" name="manual_status" value={stat} checked={status === stat} onChange={() => setStatus(stat)} className="peer hidden" />
                <div className={`text-center py-3 border-2 rounded-xl font-bold text-sm transition-all
                  ${status === stat 
                    ? (stat === 'Hadir' ? 'border-green-500 bg-green-50 text-green-600' :
                       stat === 'Sakit' ? 'border-yellow-500 bg-yellow-50 text-yellow-600' :
                       stat === 'Izin' ? 'border-blue-500 bg-blue-50 text-blue-600' :
                       'border-red-500 bg-red-50 text-red-600')
                    : 'border-gray-200 text-gray-500 group-hover:border-gray-300'
                  }
                `}>{stat}</div>
              </label>
            ))}
          </div>
        </div>
        <button onClick={handleSave} className="w-full flex justify-center items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 px-4 rounded-xl shadow-lg transition-colors mt-4">
          <Save className="w-5 h-5" /> Simpan Data Manual
        </button>
      </div>
    </div>
  );
}
