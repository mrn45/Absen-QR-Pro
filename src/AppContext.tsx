import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Siswa, Absen, Akun, Libur, Pengaturan } from './types';
import { collection, getDocs, addDoc, deleteDoc, doc, setDoc, query, where } from 'firebase/firestore';
import { db } from './firebase';

interface AppContextType {
  role: string | null;
  setRole: (role: string | null) => void;
  siswaList: Siswa[];
  absenList: Absen[];
  akunList: Akun[];
  liburList: Libur[];
  pengaturan: Pengaturan | null;
  loadSiswa: () => Promise<void>;
  loadAbsen: () => Promise<void>;
  loadAkun: () => Promise<void>;
  loadLibur: () => Promise<void>;
  loadPengaturan: () => Promise<void>;
  loading: boolean;
  setLoading: (loading: boolean) => void;
  toast: { message: string; type: 'success' | 'error' | 'info' } | null;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<string | null>(null);
  const [siswaList, setSiswaList] = useState<Siswa[]>([]);
  const [absenList, setAbsenList] = useState<Absen[]>([]);
  const [akunList, setAkunList] = useState<Akun[]>([]);
  const [liburList, setLiburList] = useState<Libur[]>([]);
  const [pengaturan, setPengaturan] = useState<Pengaturan | null>(null);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const loadSiswa = async () => {
    try {
      const q = query(collection(db, 'siswa'));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => doc.data() as Siswa);
      setSiswaList(data);
    } catch (error) {
      console.error(error);
      
    }
  };

  const loadAbsen = async () => {
    try {
      const q = query(collection(db, 'absen'));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => doc.data() as Absen);
      setAbsenList(data);
    } catch (error) {
      console.error(error);
      
    }
  };

  const loadAkun = async () => {
    try {
      const q = query(collection(db, 'akun'));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => doc.data() as Akun);
      setAkunList(data);
    } catch (error) {
      console.error(error);
      
    }
  };

  const loadLibur = async () => {
    try {
      const q = query(collection(db, 'libur'));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => doc.data() as Libur);
      setLiburList(data);
    } catch (error) {
      console.error(error);
      
    }
  };

  const loadPengaturan = async () => {
    try {
      const q = query(collection(db, 'pengaturan'));
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        setPengaturan(snapshot.docs[0].data() as Pengaturan);
      } else {
        setPengaturan({ jamMasuk: '07:00', jamPulang: '15:00' });
      }
    } catch (error) {
      console.error(error);
      
    }
  };

  useEffect(() => {
    if (role) {
      loadSiswa();
      loadAbsen();
      loadLibur();
      loadPengaturan();
      if (role === 'Admin') {
        loadAkun();
      }
    }
  }, [role]);

  return (
    <AppContext.Provider value={{
      role, setRole,
      siswaList, absenList, akunList, liburList, pengaturan,
      loadSiswa, loadAbsen, loadAkun, loadLibur, loadPengaturan,
      loading, setLoading,
      toast, showToast
    }}>
      {children}
      
      {/* Global Loader */}
      {loading && (
        <div className="fixed inset-0 flex items-center justify-center flex-col bg-white/80 backdrop-blur-sm z-[9999]">
          <div className="spinner mb-4"></div>
          <p className="text-gray-900 font-semibold animate-pulse">Memproses Data...</p>
        </div>
      )}
      
      {/* Global Toast */}
      {toast && (
        <div className={`fixed bottom-5 right-5 transform transition-all duration-300 text-white px-6 py-3 rounded-2xl shadow-2xl z-[70] flex items-center gap-3 font-medium ${toast.type === 'error' ? 'bg-red-500' : toast.type === 'info' ? 'bg-blue-500' : 'bg-gray-800'}`}>
          <span className="text-lg">
            {toast.type === 'error' ? '⚠️' : toast.type === 'info' ? 'ℹ️' : '✅'}
          </span>
          <span>{toast.message}</span>
        </div>
      )}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}
