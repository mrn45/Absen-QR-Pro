import { useState } from 'react';
import { AppProvider, useAppContext } from './AppContext';
import { LucideIcon, PieChart, Users, QrCode, PenSquare, FileText, Shield, CalendarDays, LogOut, Menu, Zap, Settings } from 'lucide-react';
import { LoginScreen } from './components/LoginScreen';
import { Dashboard } from './components/Dashboard';
import { SiswaView } from './components/SiswaView';
import { ScannerView } from './components/ScannerView';
import { ManualView } from './components/ManualView';
import { RekapView } from './components/RekapView';
import { AkunView } from './components/AkunView';
import { KalenderView } from './components/KalenderView';
import { PengaturanView } from './components/PengaturanView';

function AppContent() {
  const { role, setRole } = useAppContext();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (!role) {
    return <LoginScreen />;
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <Dashboard />;
      case 'siswa': return <SiswaView />;
      case 'scanner': return <ScannerView />;
      case 'manual': return <ManualView />;
      case 'rekap': return <RekapView />;
      case 'akun': return <AkunView />;
      case 'kalender': return <KalenderView />;
      case 'pengaturan': return <PengaturanView />;
      default: return <Dashboard />;
    }
  };

  const NavItem = ({ id, icon: Icon, label, adminOnly = false }: { id: string, icon: LucideIcon, label: string, adminOnly?: boolean }) => {
    if (adminOnly && role !== 'Admin') return null;
    const isActive = activeTab === id;
    
    return (
      <button 
        onClick={() => {
          setActiveTab(id);
          setSidebarOpen(false);
        }}
        className={`w-full flex items-center gap-3 px-4 py-3 text-left rounded-xl transition-all font-medium ${isActive ? 'bg-gray-900 text-white shadow-md' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'}`}
      >
        <Icon className="w-5 h-5" /> {label}
      </button>
    );
  };

  return (
    <div className={`flex flex-col md:flex-row h-screen bg-gray-50 overflow-hidden ${role === 'Piket' ? 'role-piket' : ''}`}>
      {/* Mobile Header */}
      <div className="md:hidden bg-white h-16 border-b border-gray-200 flex justify-between items-center px-4 z-30 shadow-sm relative">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gray-900 rounded-lg flex items-center justify-center text-white">
            <Zap className="w-4 h-4" />
          </div>
          <h1 className="font-bold text-gray-800 text-lg">Absensi<span className="text-gray-400 font-light">Pro</span></h1>
        </div>
        <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-gray-600 text-2xl focus:outline-none p-2">
          <Menu className="w-6 h-6" />
        </button>
      </div>

      {/* Mobile Backdrop */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar Navigation */}
      <div className={`w-72 bg-white h-full border-r border-gray-200 flex flex-col transition-transform duration-300 fixed md:relative z-50 shadow-2xl md:shadow-none ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        <div className="p-6 border-b border-gray-100 hidden md:flex items-center gap-3">
          <div className="w-10 h-10 bg-gray-900 rounded-xl flex items-center justify-center text-white shadow-lg">
            <Zap className="w-5 h-5" />
          </div>
          <h1 className="font-black text-gray-900 text-2xl tracking-tight">Absensi<span className="text-gray-400 font-light">Pro</span></h1>
        </div>
        
        <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          <NavItem id="dashboard" icon={PieChart} label="Dashboard" />
          <NavItem id="siswa" icon={Users} label="Data Siswa" />
          <NavItem id="scanner" icon={QrCode} label="Kiosk Scanner" />
          <NavItem id="manual" icon={PenSquare} label="Absen Manual" />
          <NavItem id="rekap" icon={FileText} label="Rekap Absen" />
          
          {role === 'Admin' && (
            <div className="pt-4 mt-4 border-t border-gray-100">
              <p className="px-4 text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Administrator</p>
              <NavItem id="akun" icon={Shield} label="Akun Piket" adminOnly />
              <NavItem id="kalender" icon={CalendarDays} label="Kalender Libur" adminOnly />
              <NavItem id="pengaturan" icon={Settings} label="Pengaturan" adminOnly />
            </div>
          )}
        </div>

        {/* Role Badge Footer */}
        <div className="p-4 border-t border-gray-100 bg-gray-50">
          <div className="flex items-center gap-3 mb-4 bg-white p-3 rounded-xl shadow-sm border border-gray-100">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${role === 'Admin' ? 'bg-gray-100 text-gray-900' : 'bg-yellow-100 text-yellow-600'}`}>
              <Shield className="w-5 h-5" />
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-bold text-gray-800 truncate">Sesi Aktif</p>
              <p className={`text-[10px] text-white px-2 py-0.5 rounded-full inline-block mt-0.5 shadow-sm font-bold tracking-wider ${role === 'Admin' ? 'bg-gray-900' : 'bg-gray-500'}`}>
                {role === 'Admin' ? 'FULL AKSES' : 'AKSES TERBATAS'}
              </p>
            </div>
          </div>
          <button onClick={() => setRole(null)} className="w-full flex items-center justify-center gap-2 bg-red-50 hover:bg-red-100 text-red-600 py-2.5 rounded-xl font-bold transition-colors text-sm">
            <LogOut className="w-4 h-4" /> Keluar
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto bg-gray-50 p-4 md:p-8 relative">
        <div className="max-w-6xl mx-auto pb-20 fade-in-up">
          {renderContent()}
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
