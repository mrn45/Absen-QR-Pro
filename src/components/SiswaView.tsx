import React, { useState, useRef } from 'react';
import { useAppContext } from '../AppContext';
import { Plus, FileDown, Download, Printer, QrCode, Trash2, X, UserPlus } from 'lucide-react';
import { db } from '../firebase';
import { collection, addDoc, deleteDoc, query, where, getDocs, doc } from 'firebase/firestore';
import qrcode from 'qrcode-generator';

export function SiswaView() {
  const { role, siswaList, loadSiswa, showToast, setLoading } = useAppContext();
  const [modalAddOpen, setModalAddOpen] = useState(false);
  const [modalQrOpen, setModalQrOpen] = useState(false);
  const [qrData, setQrData] = useState<{ nis: string, nama: string, kelas: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form State
  const [nis, setNis] = useState('');
  const [nama, setNama] = useState('');
  const [jenjang, setJenjang] = useState('SMA');
  const [kelas, setKelas] = useState('');

  const isAdmin = role === 'Admin';

  const handleSaveSiswa = async () => {
    if (!nis || !nama || !kelas) {
      showToast('Lengkapi semua data', 'error');
      return;
    }
    
    setLoading(true);
    try {
      addDoc(collection(db, 'siswa'), { nis, nama, jenjang, kelas });
      showToast('Siswa berhasil ditambahkan');
      setModalAddOpen(false);
      setNis(''); setNama(''); setKelas('');
      loadSiswa();
    } catch (e) {
      showToast('Gagal menyimpan siswa', 'error');
    }
    setLoading(false);
  };

  const handleDeleteSiswa = async (nisToDelete: string) => {
    if (!confirm(`Hapus siswa NIS ${nisToDelete}?`)) return;

    setLoading(true);
    try {
      const q = query(collection(db, 'siswa'), where('nis', '==', nisToDelete));
      const snapshot = await getDocs(q);
      snapshot.forEach(async (document) => {
        deleteDoc(doc(db, 'siswa', document.id));
      });
      showToast('Siswa berhasil dihapus');
      loadSiswa();
    } catch (e) {
      showToast('Gagal menghapus siswa', 'error');
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
        if (cols.length >= 4 && cols[0].trim() !== '') {
          try {
            addDoc(collection(db, 'siswa'), {
              nis: cols[0].trim(),
              nama: cols[1].trim(),
              jenjang: cols[2].trim(),
              kelas: cols[3].trim()
            });
            successCount++;
          } catch (e) {
            console.error(e);
          }
        }
      }
      showToast(`${successCount} data berhasil diimport!`);
      if (fileInputRef.current) fileInputRef.current.value = '';
      loadSiswa();
      setLoading(false);
    };
    reader.readAsText(file);
  };

  const downloadTemplateCSV = () => {
    const csv = "NIS,Nama Lengkap,Jenjang,Kelas\n101,Budi Santoso,SMA,X IPA 1";
    const blob = new Blob([csv], {type: "text/csv;charset=utf-8;"});
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "Template_Data_Siswa.csv";
    link.click();
  };

  const generateQR = (s: { nis: string, nama: string, kelas: string }) => {
    setQrData(s);
    setModalQrOpen(true);
  };

  const renderQrImg = (dataNis: string) => {
    const qr = qrcode(4, 'M');
    qr.addData(dataNis.trim());
    qr.make();
    return <div dangerouslySetInnerHTML={{ __html: qr.createImgTag(6) }} />;
  };

  const printCard = () => {
    if (!qrData) return;
    const qr = qrcode(4, 'M');
    qr.addData(qrData.nis.trim());
    qr.make();
    
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html><head><title>Cetak Kartu QR</title></head>
        <body style="font-family: sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0;">
          <div style="text-align:center; padding: 20px; border: 2px dashed #ccc; width: 250px;">
            <h3 style="margin: 0 0 5px 0;">KARTU ABSENSI</h3>
            <p style="margin: 0 0 15px 0; font-size: 12px;">${qrData.nama}<br><b>${qrData.kelas}</b></p>
            ${qr.createImgTag(6)}
          </div>
        </body></html>
      `);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 500);
    } else {
      showToast('Izinkan pop-up untuk mencetak', 'error');
    }
  };

  const printAllQR = () => {
    let html = '<html><head><title>Cetak Semua QR Code</title></head><body style="font-family: sans-serif;"><div style="display:flex; flex-wrap:wrap; gap: 20px; justify-content: center;">';
    siswaList.forEach(s => {
      const qr = qrcode(4, 'M'); 
      qr.addData(String(s.nis).trim()); 
      qr.make();
      html += `<div style="text-align:center; padding: 15px; border: 1px solid #ccc; width: 200px; border-radius: 10px;">
        <h4 style="margin: 0 0 5px 0; font-size: 14px;">${s.nama}</h4><p style="margin: 0 0 10px 0; font-size: 11px;">${s.kelas}</p>${qr.createImgTag(5)}</div>`;
    });
    html += '</div></body></html>';

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(html);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 500);
    } else {
      showToast('Izinkan pop-up untuk mencetak', 'error');
    }
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h2 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight">Data Induk Siswa</h2>
        {isAdmin && (
          <div className="flex flex-wrap gap-2 w-full sm:w-auto">
            <button onClick={() => setModalAddOpen(true)} className="flex-1 sm:flex-none flex items-center justify-center gap-1 bg-gray-900 text-white px-4 py-2.5 rounded-xl shadow-glow hover:bg-black font-semibold text-sm transition-all">
              <Plus className="w-4 h-4" /> Tambah Siswa
            </button>
            <button onClick={() => fileInputRef.current?.click()} className="flex-1 sm:flex-none flex items-center justify-center gap-1 bg-white text-gray-800 border border-gray-200 px-4 py-2.5 rounded-xl shadow-md hover:bg-gray-50 font-semibold text-sm transition-all">
              <FileDown className="w-4 h-4" /> Import CSV
            </button>
            <input type="file" ref={fileInputRef} accept=".csv" className="hidden" onChange={handleUploadCSV} />
            <button onClick={downloadTemplateCSV} className="flex-1 sm:flex-none flex items-center justify-center gap-1 bg-gray-200 text-gray-700 px-4 py-2.5 rounded-xl hover:bg-gray-300 font-semibold text-sm transition-all">
              <Download className="w-4 h-4" /> Template
            </button>
            <button onClick={printAllQR} className="flex-1 sm:flex-none flex items-center justify-center gap-1 bg-gray-100 text-gray-800 px-4 py-2.5 rounded-xl shadow-md hover:bg-gray-200 font-semibold text-sm transition-all">
              <Printer className="w-4 h-4" /> Cetak Semua QR
            </button>
          </div>
        )}
      </div>

      <div className="bg-white rounded-3xl shadow-soft border border-gray-100 overflow-hidden table-responsive">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 text-gray-500 text-sm uppercase tracking-wider">
              <th className="p-4 font-bold border-b border-gray-100">NIS</th>
              <th className="p-4 font-bold border-b border-gray-100">Nama Lengkap</th>
              <th className="p-4 font-bold border-b border-gray-100">Jenjang</th>
              <th className="p-4 font-bold border-b border-gray-100">Kelas</th>
              {isAdmin && <th className="p-4 font-bold border-b border-gray-100 text-center">Aksi</th>}
            </tr>
          </thead>
          <tbody className="text-sm divide-y divide-gray-50">
            {siswaList.map(s => (
              <tr key={s.nis} className="hover:bg-gray-100/30 transition-colors group">
                <td className="p-4 font-semibold text-gray-700">{s.nis}</td>
                <td className="p-4 font-bold text-gray-900">{s.nama}</td>
                <td className="p-4"><span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-md text-xs font-bold border border-gray-200">{s.jenjang}</span></td>
                <td className="p-4 font-medium text-gray-600">{s.kelas}</td>
                {isAdmin && (
                  <td className="p-4 text-center">
                    <button onClick={() => generateQR(s)} className="text-gray-900 hover:bg-gray-200 p-2 rounded-lg transition-colors tooltip mr-1">
                      <QrCode className="w-5 h-5" />
                    </button>
                    <button onClick={() => handleDeleteSiswa(s.nis)} className="text-red-500 hover:bg-red-100 p-2 rounded-lg transition-colors tooltip">
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </td>
                )}
              </tr>
            ))}
            {siswaList.length === 0 && (
              <tr><td colSpan={isAdmin ? 5 : 4} className="p-8 text-center text-gray-500">Belum ada data siswa.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Add Siswa */}
      {modalAddOpen && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-6 md:p-8 w-full max-w-md shadow-2xl fade-in-up">
            <h3 className="text-xl font-black text-gray-900 mb-6 flex items-center gap-2">
              <UserPlus className="text-gray-900 w-6 h-6" /> Tambah Siswa Baru
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">NIS</label>
                <input type="number" value={nis} onChange={e => setNis(e.target.value)} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-900 outline-none" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Nama Lengkap</label>
                <input type="text" value={nama} onChange={e => setNama(e.target.value)} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-900 outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Jenjang</label>
                  <select value={jenjang} onChange={e => setJenjang(e.target.value)} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-900 outline-none appearance-none">
                    <option value="SMA">SMA</option>
                    <option value="SMK">SMK</option>
                    <option value="SMP">SMP</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Kelas</label>
                  <input type="text" value={kelas} onChange={e => setKelas(e.target.value)} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-900 outline-none" placeholder="Cth: X IPA 1" />
                </div>
              </div>
            </div>
            <div className="mt-8 flex justify-end gap-3">
              <button onClick={() => setModalAddOpen(false)} className="px-5 py-2.5 text-gray-600 font-bold hover:bg-gray-100 rounded-xl transition-colors">Batal</button>
              <button onClick={handleSaveSiswa} className="px-5 py-2.5 bg-gray-900 text-white font-bold rounded-xl hover:bg-black shadow-md transition-colors">Simpan Data</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal QR */}
      {modalQrOpen && qrData && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-8 w-full max-w-sm shadow-2xl text-center flex flex-col items-center">
            <h3 className="text-xl font-black text-gray-900 mb-1">{qrData.nama}</h3>
            <p className="text-sm font-bold text-gray-900 mb-6 bg-gray-100 px-3 py-1 rounded-full">{qrData.kelas}</p>
            <div className="bg-white p-4 rounded-2xl shadow-inner border-2 border-gray-100 mb-6 inline-block">
              {renderQrImg(qrData.nis)}
            </div>
            <div className="flex gap-3 w-full">
              <button onClick={() => setModalQrOpen(false)} className="flex-1 py-3 text-gray-600 font-bold bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors">Tutup</button>
              <button onClick={printCard} className="flex-1 flex items-center justify-center gap-2 py-3 bg-gray-900 text-white font-bold rounded-xl hover:bg-black shadow-md transition-colors">
                <Printer className="w-4 h-4" /> Cetak Kartu
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Print Area */}
      <div id="print-area" className="hidden"></div>
    </div>
  );
}
