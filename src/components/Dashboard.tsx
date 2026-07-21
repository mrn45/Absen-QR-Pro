import { useState, useMemo } from 'react';
import { useAppContext } from '../AppContext';
import { Users, UserCheck, Clock, X } from 'lucide-react';
import { Siswa } from '../types';

export function Dashboard() {
  const { siswaList, absenList, pengaturan } = useAppContext();
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'total' | 'hadir' | 'belum'>('total');
  
  const todayStr = useMemo(() => {
    const tz = new Date().getTimezoneOffset() * 60000;
    return new Date(Date.now() - tz).toISOString().split('T')[0];
  }, []);

  const hadirHariIniIds = useMemo(() => {
    const currentHM = new Date().toTimeString().substring(0, 5);
    const jamPulang = pengaturan?.jamPulang || '15:00';

    return absenList
      .filter(x => {
        if (x.timestamp.split('T')[0] !== todayStr) return false;
        if (x.status === 'Hadir' || x.status === 'Terlambat') {
          // If past jamPulang and no waktuKeluar, they become Alfa
          if (x.waktuKeluar === '' && currentHM >= jamPulang) {
            return false;
          }
          return true;
        }
        return false;
      })
      .map(x => x.nis);
  }, [absenList, todayStr, pengaturan]);

  const stats = {
    total: siswaList.length,
    hadir: hadirHariIniIds.length,
    belum: siswaList.length - hadirHariIniIds.length
  };

  const getModalContent = () => {
    let filtered: Siswa[] = [];
    let title = '';
    let desc = '';

    if (modalType === 'total') {
      title = 'Total Siswa';
      desc = 'Seluruh siswa terdaftar.';
      filtered = siswaList;
    } else if (modalType === 'hadir') {
      title = 'Hadir Hari Ini';
      desc = 'Siswa yang sudah scan QR Datang.';
      filtered = siswaList.filter(s => hadirHariIniIds.includes(s.nis));
    } else if (modalType === 'belum') {
      title = 'Belum Hadir';
      desc = 'Siswa yang belum ada keterangan kehadiran KBM.';
      filtered = siswaList.filter(s => !hadirHariIniIds.includes(s.nis));
    }

    return { title, desc, filtered };
  };

  const openModal = (type: 'total' | 'hadir' | 'belum') => {
    setModalType(type);
    setModalOpen(true);
  };

  const modalData = getModalContent();

  const StatCard = ({ type, title, value, icon: Icon, onClick, colors }: any) => (
    <div onClick={() => onClick(type)} className={`bg-white rounded-3xl p-6 shadow-soft border border-gray-100 flex items-center cursor-pointer group hover:shadow-lg transition-all hover:-translate-y-1 relative overflow-hidden`}>
      {type === 'belum' && <div className="absolute -right-4 -top-4 w-24 h-24 bg-red-50 rounded-full opacity-50 pointer-events-none group-hover:scale-150 transition-transform duration-500"></div>}
      <div className={`w-16 h-16 rounded-2xl ${colors.bg} ${colors.text} flex items-center justify-center text-2xl ${colors.hoverBg} ${colors.hoverText} transition-colors relative z-10`}>
        <Icon className="w-8 h-8" />
      </div>
      <div className="ml-5 relative z-10">
        <p className="text-sm font-bold text-gray-400 uppercase tracking-wide">{title}</p>
        <h3 className="text-4xl font-black text-gray-800 mt-1">{value}</h3>
      </div>
    </div>
  );

  const tglFormat = new Intl.DateTimeFormat('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(new Date());

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight">Dashboard Overview</h2>
        <p className="text-gray-500 text-sm md:text-base mt-1">Pantau statistik kehadiran <span className="font-semibold text-gray-900">{tglFormat}</span></p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard 
          type="total" title="Total Siswa" value={stats.total} icon={Users} onClick={openModal} 
          colors={{ bg: 'bg-blue-50', text: 'text-blue-500', hoverBg: 'group-hover:bg-blue-500', hoverText: 'group-hover:text-white' }}
        />
        <StatCard 
          type="hadir" title="Hadir Hari Ini" value={stats.hadir} icon={UserCheck} onClick={openModal} 
          colors={{ bg: 'bg-green-50', text: 'text-green-500', hoverBg: 'group-hover:bg-green-500', hoverText: 'group-hover:text-white' }}
        />
        <StatCard 
          type="belum" title="Belum Hadir" value={stats.belum} icon={Clock} onClick={openModal} 
          colors={{ bg: 'bg-red-50', text: 'text-red-500', hoverBg: 'group-hover:bg-red-500', hoverText: 'group-hover:text-white' }}
        />
      </div>

      {modalOpen && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-6 md:p-8 w-full max-w-lg shadow-2xl relative flex flex-col max-h-[85vh] fade-in-up">
            <button onClick={() => setModalOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-red-500 transition-colors w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
              <X className="w-5 h-5" />
            </button>
            <div className="mb-4">
              <h3 className="text-xl font-bold text-gray-900">{modalData.title}</h3>
              <p className="text-sm text-gray-500">{modalData.desc} ({modalData.filtered.length} Orang)</p>
            </div>
            <div className="flex-1 overflow-y-auto pr-2 border-t border-b border-gray-100 py-3">
              <ul className="space-y-2">
                {modalData.filtered.length > 0 ? modalData.filtered.map(s => (
                  <li key={s.nis} className="flex justify-between items-center bg-gray-50 p-3 rounded-xl border border-gray-100">
                    <div>
                      <p className="font-bold text-gray-800 text-sm">{s.nama}</p>
                      <p className="text-xs text-gray-500">{s.nis}</p>
                    </div>
                    <span className="text-xs font-bold px-2 py-1 bg-gray-200 text-gray-900 rounded-md">{s.kelas}</span>
                  </li>
                )) : (
                  <li className="text-center text-sm text-gray-500 py-4">Tidak ada data.</li>
                )}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
