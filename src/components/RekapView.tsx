import { useState, useMemo } from 'react';
import { useAppContext } from '../AppContext';
import { Printer, Check, X } from 'lucide-react';

export function RekapView() {
  const { siswaList, absenList, liburList, role, pengaturan } = useAppContext();
  
  const tz = new Date().getTimezoneOffset() * 60000;
  const todayStr = new Date(Date.now() - tz).toISOString().split('T')[0];
  const currentHM = new Date().toTimeString().substring(0, 5);

  const [kat, setKat] = useState('kbm');
  const [rentang, setRentang] = useState('harian');
  const [valTgl, setValTgl] = useState(todayStr);
  const [valBln, setValBln] = useState(todayStr.substring(0, 7));
  const [valMgg, setValMgg] = useState('');
  const [fJenjang, setFJenjang] = useState('Semua');
  const [fKelas, setFKelas] = useState('Semua');

  const jenjangFilters = useMemo(() => Array.from(new Set(siswaList.map(s => s.jenjang))), [siswaList]);
  const kelasFilters = useMemo(() => Array.from(new Set(siswaList.map(s => s.kelas))), [siswaList]);

  const getWeekNumber = (d: Date) => {
    const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    date.setUTCDate(date.getUTCDate() + 4 - (date.getUTCDay() || 7));
    const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
    return Math.ceil((((date.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  };

  const processedData = useMemo(() => {
    let data = siswaList;
    if (fJenjang !== 'Semua') data = data.filter(x => x.jenjang === fJenjang);
    if (fKelas !== 'Semua') data = data.filter(x => x.kelas === fKelas);

    let relevantRecords = absenList;
    if (rentang === 'bulanan') {
      relevantRecords = absenList.filter(a => a.timestamp.split('T')[0].startsWith(valBln));
    } else if (rentang === 'mingguan' && valMgg) {
      relevantRecords = absenList.filter(a => {
        const dStr = a.timestamp.split('T')[0];
        const d = new Date(dStr);
        const w = `${d.getFullYear()}-W${String(getWeekNumber(d)).padStart(2, '0')}`;
        return w === valMgg;
      });
    }

    let totalDays = 0;
    if (rentang === 'bulanan') {
      const [y, m] = valBln.split('-');
      if (y && m) {
        const daysInMonth = new Date(parseInt(y), parseInt(m), 0).getDate();
        for (let i = 1; i <= daysInMonth; i++) {
          const d = new Date(parseInt(y), parseInt(m) - 1, i);
          const dStr = `${y}-${m}-${String(i).padStart(2, '0')}`;
          const isLibur = liburList.some(l => l.tgl === dStr);
          if (d.getDay() !== 0 && !isLibur) totalDays++;
        }
      }
    } else if (rentang === 'mingguan') {
      totalDays = 6;
    }

    return { data, relevantRecords, totalDays };
  }, [siswaList, absenList, liburList, fJenjang, fKelas, rentang, valTgl, valBln, valMgg]);

  const printTable = () => {
    const tableHTML = document.getElementById('table-rekap')?.outerHTML;
    if (tableHTML) {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <html><head><title>Cetak Laporan Absensi</title></head>
          <body style="font-family: sans-serif; padding: 20px;">
            <h2 style="text-align:center; margin-bottom: 20px;">Laporan Absensi</h2>
            <style> table { width: 100%; border-collapse: collapse; } th, td { border: 1px solid #ddd; padding: 8px; text-align: left; } th { background-color: #f2f2f2; } </style>
            ${tableHTML}
          </body></html>
        `);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
          printWindow.print();
          printWindow.close();
        }, 500);
      } else {
        alert('Izinkan pop-up untuk mencetak');
      }
    }
  };

  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-6 gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight">Rekapitulasi Absensi</h2>
          <p className="text-sm text-gray-500 mt-1">Laporan kehadiran siswa terintegrasi</p>
        </div>
        {role === 'Admin' && (
          <div className="flex gap-2 w-full md:w-auto">
            <button onClick={printTable} className="flex-1 md:flex-none flex items-center justify-center gap-1 bg-gray-800 text-white px-4 py-2.5 rounded-xl shadow-md hover:bg-gray-900 font-semibold text-sm transition-all">
              <Printer className="w-4 h-4" /> Cetak
            </button>
          </div>
        )}
      </div>

      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 mb-6 flex flex-wrap gap-3 items-end relative z-20">
        <div className="flex-1 min-w-[120px]">
          <label className="text-xs font-bold text-gray-500 uppercase tracking-wide ml-1">Kategori</label>
          <select value={kat} onChange={e => setKat(e.target.value)} className="w-full mt-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none appearance-none font-medium">
            <option value="kbm">Absen KBM</option>
            <option value="sholat">Absen Sholat</option>
          </select>
        </div>
        <div className="flex-1 min-w-[120px]">
          <label className="text-xs font-bold text-gray-500 uppercase tracking-wide ml-1">Mode</label>
          <select value={rentang} onChange={e => setRentang(e.target.value)} className="w-full mt-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none appearance-none font-medium">
            <option value="harian">Harian</option>
            <option value="mingguan">Mingguan</option>
            <option value="bulanan">Bulanan</option>
          </select>
        </div>
        
        {rentang === 'harian' && (
          <div className="flex-1 min-w-[140px]">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide ml-1">Pilih Tanggal</label>
            <input type="date" value={valTgl} onChange={e => setValTgl(e.target.value)} className="w-full mt-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none font-medium" />
          </div>
        )}
        {rentang === 'bulanan' && (
          <div className="flex-1 min-w-[140px]">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide ml-1">Pilih Bulan</label>
            <input type="month" value={valBln} onChange={e => setValBln(e.target.value)} className="w-full mt-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none font-medium" />
          </div>
        )}
        {rentang === 'mingguan' && (
          <div className="flex-1 min-w-[140px]">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide ml-1">Pilih Minggu</label>
            <input type="week" value={valMgg} onChange={e => setValMgg(e.target.value)} className="w-full mt-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none font-medium" />
          </div>
        )}

        <div className="flex-1 min-w-[120px]">
          <label className="text-xs font-bold text-gray-500 uppercase tracking-wide ml-1">Jenjang</label>
          <select value={fJenjang} onChange={e => setFJenjang(e.target.value)} className="w-full mt-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none appearance-none font-medium">
            <option value="Semua">Semua Jenjang</option>
            {jenjangFilters.map(j => <option key={j} value={j}>{j}</option>)}
          </select>
        </div>
        <div className="flex-1 min-w-[120px]">
          <label className="text-xs font-bold text-gray-500 uppercase tracking-wide ml-1">Kelas</label>
          <select value={fKelas} onChange={e => setFKelas(e.target.value)} className="w-full mt-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none appearance-none font-medium">
            <option value="Semua">Semua Kelas</option>
            {kelasFilters.map(k => <option key={k} value={k}>{k}</option>)}
          </select>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-soft border border-gray-100 overflow-hidden table-responsive fade-in-up">
        <table id="table-rekap" className="w-full text-left border-collapse">
          <thead className="bg-gray-50 text-gray-500 text-xs sm:text-sm uppercase tracking-wider">
            {rentang === 'harian' ? (
              kat === 'kbm' ? (
                <tr>
                  <th className="p-4 font-bold border-b border-gray-100">NIS</th>
                  <th className="p-4 font-bold border-b border-gray-100">Nama Siswa</th>
                  <th className="p-4 font-bold border-b border-gray-100">Waktu Datang</th>
                  <th className="p-4 font-bold border-b border-gray-100">Waktu Pulang</th>
                  <th className="p-4 font-bold border-b border-gray-100">Status</th>
                </tr>
              ) : (
                <tr>
                  <th className="p-4 font-bold border-b border-gray-100">NIS</th>
                  <th className="p-4 font-bold border-b border-gray-100">Nama Siswa</th>
                  <th className="p-4 font-bold border-b border-gray-100 text-center">Dhuha</th>
                  <th className="p-4 font-bold border-b border-gray-100 text-center">Dzuhur</th>
                </tr>
              )
            ) : (
              <tr>
                <th className="p-4 font-bold border-b border-gray-100">NIS</th>
                <th className="p-4 font-bold border-b border-gray-100">Nama Siswa</th>
                <th className="p-4 font-bold border-b border-gray-100 text-center">
                  {kat === 'kbm' ? 'Hadir | Sakit | Izin | Alfa' : 'Tot. Dhuha | Tot. Dzuhur'}
                </th>
                <th className="p-4 font-bold border-b border-gray-100 text-center">Persentase</th>
              </tr>
            )}
          </thead>
          <tbody className="text-sm divide-y divide-gray-50">
            {processedData.data.map(s => {
              if (rentang === 'harian') {
                const record = absenList.find(a => a.nis === s.nis && a.timestamp.split('T')[0] === valTgl);
                
                if (kat === 'kbm') {
                  let status = record ? record.status : 'Alfa';
                  let timeIn = record ? record.timestamp.split('T')[1].substring(0, 5) : '-';
                  if (timeIn === '00:00' || timeIn === '07:00') timeIn = 'Manual';
                  const timeOut = (record && record.waktuKeluar) ? record.waktuKeluar.split('T')[1].substring(0, 5) : '-';
                  
                  if (record && (record.status === 'Hadir' || record.status === 'Terlambat')) {
                    if (record.waktuKeluar === '') {
                      const recordDate = record.timestamp.split('T')[0];
                      const jamPulang = pengaturan?.jamPulang || '15:00';
                      if (recordDate < todayStr || (recordDate === todayStr && currentHM >= jamPulang)) {
                        status = 'Alfa';
                      }
                    }
                  }

                  const badgeClass = status === 'Hadir' ? 'bg-green-100 text-green-700' : 
                                     status === 'Sakit' ? 'bg-yellow-100 text-yellow-700' : 
                                     status === 'Izin' ? 'bg-blue-100 text-blue-700' : 
                                     'bg-red-100 text-red-700';

                  return (
                    <tr key={s.nis} className="hover:bg-gray-50">
                      <td className="p-4 border-b border-gray-50">{s.nis}</td>
                      <td className="p-4 border-b font-bold">{s.nama} <span className="text-xs font-normal text-gray-400 block">{s.kelas}</span></td>
                      <td className="p-4 border-b">{timeIn}</td>
                      <td className="p-4 border-b">{timeOut}</td>
                      <td className="p-4 border-b">
                        <span className={`px-2 py-1 text-xs font-bold rounded-md border border-white shadow-sm ${badgeClass}`}>{status}</span>
                      </td>
                    </tr>
                  );
                } else {
                  return (
                    <tr key={s.nis} className="hover:bg-gray-50">
                      <td className="p-4 border-b border-gray-50">{s.nis}</td>
                      <td className="p-4 border-b font-bold">{s.nama} <span className="text-xs font-normal text-gray-400 block">{s.kelas}</span></td>
                      <td className="p-4 border-b text-center">
                        {(record && record.waktuDhuha) ? <Check className="w-5 h-5 text-green-500 mx-auto" /> : <X className="w-5 h-5 text-red-300 mx-auto" />}
                      </td>
                      <td className="p-4 border-b text-center">
                        {(record && record.waktuDzuhur) ? <Check className="w-5 h-5 text-green-500 mx-auto" /> : <X className="w-5 h-5 text-red-300 mx-auto" />}
                      </td>
                    </tr>
                  );
                }
              } else {
                const sRec = processedData.relevantRecords.filter(a => a.nis === s.nis);
                
                if (kat === 'kbm') {
                  let h = 0, sk = 0, i = 0;
                  sRec.forEach(r => { 
                    let st = r.status;
                    if (st === 'Hadir' || st === 'Terlambat') {
                      if (r.waktuKeluar === '') {
                        const recordDate = r.timestamp.split('T')[0];
                        const jamPulang = pengaturan?.jamPulang || '15:00';
                        if (recordDate < todayStr || (recordDate === todayStr && currentHM >= jamPulang)) {
                          st = 'Alfa';
                        }
                      }
                    }
                    if (st === 'Hadir' || st === 'Terlambat') h++; 
                    if (st === 'Sakit') sk++; 
                    if (st === 'Izin') i++; 
                  });
                  let a = processedData.totalDays - (h + sk + i);
                  if (a < 0) a = 0;
                  const pct = processedData.totalDays > 0 ? ((h / processedData.totalDays) * 100).toFixed(0) : 0;
                  
                  return (
                    <tr key={s.nis} className="hover:bg-gray-50">
                      <td className="p-4 border-b border-gray-50">{s.nis}</td>
                      <td className="p-4 border-b font-bold">{s.nama} <span className="text-xs font-normal text-gray-400 block">{s.kelas}</span></td>
                      <td className="p-4 border-b text-center font-mono font-medium">
                        {h} | {sk} | {i} | <span className="text-red-500">{a}</span>
                      </td>
                      <td className={`p-4 border-b text-center font-black ${Number(pct) >= 80 ? 'text-green-500' : 'text-red-500'}`}>{pct}%</td>
                    </tr>
                  );
                } else {
                  const dhuha = sRec.filter(r => r.waktuDhuha).length;
                  const dzuhur = sRec.filter(r => r.waktuDzuhur).length;
                  const pct = processedData.totalDays > 0 ? (((dhuha + dzuhur) / (processedData.totalDays * 2)) * 100).toFixed(0) : 0;
                  
                  return (
                    <tr key={s.nis} className="hover:bg-gray-50">
                      <td className="p-4 border-b border-gray-50">{s.nis}</td>
                      <td className="p-4 border-b font-bold">{s.nama} <span className="text-xs font-normal text-gray-400 block">{s.kelas}</span></td>
                      <td className="p-4 border-b text-center font-mono">{dhuha} | {dzuhur}</td>
                      <td className="p-4 border-b text-center font-black text-indigo-500">{pct}%</td>
                    </tr>
                  );
                }
              }
            })}
            {processedData.data.length === 0 && (
              <tr><td colSpan={4} className="p-8 text-center text-gray-500">Tidak ada data.</td></tr>
            )}
          </tbody>
        </table>
      </div>
      <div id="print-area" className="hidden"></div>
    </div>
  );
}
