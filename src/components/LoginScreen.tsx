import { useState } from 'react';
import { useAppContext } from '../AppContext';
import { Fingerprint, User, Lock, ArrowRight } from 'lucide-react';
import { db } from '../firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

export function LoginScreen() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const { setRole, showToast, setLoading } = useAppContext();

  const handleLogin = async () => {
    if (!username || !password) {
      showToast('Isi username dan password', 'error');
      return;
    }

    setLoading(true);
    
    // Check built-in admin
    if (username === 'admin' && password === '51001n') {
      setRole('Admin');
      setLoading(false);
      return;
    }
    
    if (username === 'piket' && password === 'piket01') {
      setRole('Piket');
      setLoading(false);
      return;
    }

    try {
      const q = query(collection(db, 'akun'), where('username', '==', username), where('password', '==', password));
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        const data = snapshot.docs[0].data();
        setRole(data.role || 'Piket');
      } else {
        showToast('Login Gagal', 'error');
      }
    } catch (error) {
      showToast('Error koneksi database', 'error');
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 z-50 flex items-center justify-center p-4">
      <div className="bg-white p-8 md:p-10 rounded-3xl shadow-2xl max-w-md w-full text-center relative overflow-hidden">
        <div className="absolute -top-16 -right-16 w-32 h-32 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-70"></div>
        <div className="absolute -bottom-16 -left-16 w-32 h-32 bg-pink-200 rounded-full mix-blend-multiply filter blur-xl opacity-70"></div>
        
        <div className="relative z-10">
          <div className="w-20 h-20 bg-indigo-100 rounded-2xl mx-auto flex items-center justify-center mb-6 shadow-inner text-indigo-600">
            <Fingerprint className="w-10 h-10" />
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Absensi<span className="text-indigo-600">Pro</span></h1>
          <p className="text-gray-500 text-sm mb-8">Masuk untuk mengelola sistem absensi</p>

          <div className="space-y-4">
            <div className="relative text-left">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wide ml-1">Username</label>
              <div className="relative mt-1">
                <User className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input 
                  type="text" 
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none" 
                  placeholder="Masukkan username" 
                />
              </div>
            </div>
            <div className="relative text-left">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wide ml-1">Password</label>
              <div className="relative mt-1">
                <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                  className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none" 
                  placeholder="Masukkan password" 
                />
              </div>
            </div>
            <button 
              onClick={handleLogin}
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold py-3.5 px-4 rounded-xl shadow-lg transform transition hover:-translate-y-0.5 mt-2 flex justify-center items-center gap-2"
            >
              Masuk Sistem <ArrowRight className="w-5 h-5" />
            </button>
          </div>
          

        </div>
      </div>
    </div>
  );
}
