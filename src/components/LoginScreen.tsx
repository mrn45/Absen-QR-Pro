import { useState } from 'react';
import { useAppContext } from '../AppContext';
import { Fingerprint, User, Lock, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { db } from '../firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

export function LoginScreen() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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
    <div className="fixed inset-0 bg-[#F8FAFC] z-50 flex items-center justify-center p-4 overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-gray-100 blur-[100px] opacity-70"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-slate-100 blur-[120px] opacity-80"></div>
      </div>
      
      <div className="bg-white/80 backdrop-blur-xl p-8 md:p-12 rounded-[2.5rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.05)] border border-white max-w-[420px] w-full text-center relative z-10">
        <div className="w-16 h-16 bg-gray-900 rounded-2xl mx-auto flex items-center justify-center mb-8 shadow-md text-white">
          <Fingerprint className="w-8 h-8" strokeWidth={1.5} />
        </div>
        
        <h1 className="text-3xl font-extrabold text-gray-900 mb-2 tracking-tight">
          Absensi<span className="text-gray-400 font-light">Pro</span>
        </h1>
        <p className="text-gray-500 text-sm mb-10 font-medium">Authentication Portal</p>
        
        <div className="space-y-5">
          <div className="relative text-left">
            <div className="relative">
              <User className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" strokeWidth={1.5} />
              <input 
                type="text" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 bg-gray-50/50 border border-gray-200/80 rounded-2xl focus:bg-white focus:ring-4 focus:ring-gray-900/5 focus:border-gray-900 transition-all outline-none text-gray-800 font-medium placeholder-gray-400" 
                placeholder="Username" 
              />
            </div>
          </div>
          
          <div className="relative text-left">
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" strokeWidth={1.5} />
              <input 
                type={showPassword ? "text" : "password"} 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                className="w-full pl-12 pr-12 py-3.5 bg-gray-50/50 border border-gray-200/80 rounded-2xl focus:bg-white focus:ring-4 focus:ring-gray-900/5 focus:border-gray-900 transition-all outline-none text-gray-800 font-medium placeholder-gray-400" 
                placeholder="Password" 
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
              >
                {showPassword ? <EyeOff className="w-5 h-5" strokeWidth={1.5} /> : <Eye className="w-5 h-5" strokeWidth={1.5} />}
              </button>
            </div>
          </div>
          
          <button 
            onClick={handleLogin}
            className="w-full bg-gray-900 hover:bg-black text-white font-semibold py-4 px-4 rounded-2xl shadow-lg shadow-gray-900/20 transform transition-all active:scale-[0.98] mt-4 flex justify-center items-center gap-2"
          >
            Sign In <ArrowRight className="w-5 h-5" strokeWidth={2} />
          </button>
        </div>
      </div>
    </div>
  );
}
